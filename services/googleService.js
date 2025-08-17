const { google } = require('googleapis');
const Review = require('../models/Review');

class GoogleService {
  constructor() {
    this.oauth2Client = null;
    this.mybusiness = null;
    this.initializeClient();
  }

  initializeClient() {
    try {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.warn('Google API kimlik bilgileri bulunamadı');
        return;
      }

      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'urn:ietf:wg:oauth:2.0:oob'
      );

      if (process.env.GOOGLE_REFRESH_TOKEN) {
        this.oauth2Client.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        this.mybusiness = google.mybusiness({
          version: 'v4',
          auth: this.oauth2Client
        });
      }
    } catch (error) {
      console.error('Google servis başlatma hatası:', error);
    }
  }

  async syncReviews() {
    try {
      if (!this.mybusiness) {
        return {
          success: false,
          message: 'Google My Business API yapılandırılmamış'
        };
      }

      const accountId = process.env.GOOGLE_BUSINESS_ACCOUNT_ID;
      const locationId = process.env.GOOGLE_LOCATION_ID;

      if (!accountId || !locationId) {
        return {
          success: false,
          message: 'Google Business hesap bilgileri eksik'
        };
      }

      // Google yorumlarını çek
      const response = await this.mybusiness.accounts.locations.reviews.list({
        parent: `accounts/${accountId}/locations/${locationId}`
      });

      const googleReviews = response.data.reviews || [];
      let newReviews = 0;

      for (const googleReview of googleReviews) {
        // Mevcut yorumu kontrol et
        const existingReview = await Review.findOne({
          googleReviewId: googleReview.reviewId
        });

        if (!existingReview) {
          // Yeni yorum oluştur
          const review = new Review({
            googleReviewId: googleReview.reviewId,
            authorName: googleReview.reviewer?.displayName || 'Anonim',
            text: googleReview.comment || '',
            rating: this.convertGoogleRating(googleReview.starRating),
            source: 'google',
            isVisible: googleReview.starRating >= 4, // 4 yıldız ve üzeri otomatik görünür
            createdAt: new Date(googleReview.createTime)
          });

          await review.save();
          newReviews++;
        }
      }

      return {
        success: true,
        newReviews,
        totalReviews: googleReviews.length
      };

    } catch (error) {
      console.error('Google yorumları senkronizasyon hatası:', error);
      return {
        success: false,
        message: 'Google yorumları senkronize edilemedi: ' + error.message
      };
    }
  }

  convertGoogleRating(starRating) {
    // Google'ın yıldız sistemini 1-5 arası sayıya çevir
    switch (starRating) {
      case 'ONE': return 1;
      case 'TWO': return 2;
      case 'THREE': return 3;
      case 'FOUR': return 4;
      case 'FIVE': return 5;
      default: return 5;
    }
  }

  async getBusinessInfo() {
    try {
      if (!this.mybusiness) {
        throw new Error('Google My Business API yapılandırılmamış');
      }

      const accountId = process.env.GOOGLE_BUSINESS_ACCOUNT_ID;
      const locationId = process.env.GOOGLE_LOCATION_ID;

      const response = await this.mybusiness.accounts.locations.get({
        name: `accounts/${accountId}/locations/${locationId}`
      });

      return {
        success: true,
        businessInfo: response.data
      };
    } catch (error) {
      console.error('İşletme bilgileri alma hatası:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // OAuth URL oluştur (ilk kurulum için)
  getAuthUrl() {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client başlatılamadı');
    }

    const scopes = [
      'https://www.googleapis.com/auth/business.manage'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  // Authorization code ile token al
  async getTokenFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return {
        success: true,
        tokens
      };
    } catch (error) {
      console.error('Token alma hatası:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = new GoogleService();