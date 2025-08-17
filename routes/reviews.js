const express = require('express');
const Review = require('../models/Review');
const auth = require('../middleware/auth');
const googleService = require('../services/googleService');

const router = express.Router();

// Aktif yorumları getir (herkese açık)
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find({ 
      isVisible: true,
      rating: { $gte: 4 } // 4 yıldız ve üzeri
    })
    .sort({ createdAt: -1 })
    .limit(3);

    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Yorumları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Google yorumlarını senkronize et (admin)
router.post('/admin/sync-google', auth, async (req, res) => {
  try {
    const result = await googleService.syncReviews();
    
    if (result.success) {
      res.json({
        success: true,
        message: `${result.newReviews} yeni yorum senkronize edildi`,
        totalReviews: result.totalReviews
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Google yorumları senkronize edilemedi'
      });
    }
  } catch (error) {
    console.error('Google yorumları senkronizasyon hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Tüm yorumları getir (admin)
router.get('/admin', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, rating, source, search } = req.query;
    const query = {};

    if (rating) query.rating = parseInt(rating);
    if (source) query.source = source;
    if (search) {
      query.$or = [
        { authorName: { $regex: search, $options: 'i' } },
        { text: { $regex: search, $options: 'i' } }
      ];
    }

    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    // İstatistikler
    const stats = {
      toplam: await Review.countDocuments(),
      ortalamaPuan: await Review.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]).then(result => result[0]?.avgRating || 0),
      google: await Review.countDocuments({ source: 'google' }),
      manuel: await Review.countDocuments({ source: 'manuel' }),
      görünür: await Review.countDocuments({ isVisible: true })
    };

    res.json({
      success: true,
      reviews,
      stats,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Admin yorumları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Yorum görünürlüğünü değiştir (admin)
router.patch('/admin/:id/toggle-visibility', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Yorum bulunamadı'
      });
    }

    review.isVisible = !review.isVisible;
    await review.save();

    res.json({
      success: true,
      message: `Yorum ${review.isVisible ? 'görünür' : 'gizli'} hale getirildi`,
      review
    });
  } catch (error) {
    console.error('Yorum görünürlük değiştirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Manuel yorum ekle (admin)
router.post('/admin', auth, [
  body('authorName').notEmpty().trim().withMessage('Yazar adı gerekli'),
  body('text').notEmpty().trim().withMessage('Yorum metni gerekli'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('1-5 arası puan verin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Doğrulama hataları',
        errors: errors.array()
      });
    }

    const review = new Review({
      ...req.body,
      source: 'manuel',
      isVisible: true
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: 'Yorum başarıyla eklendi',
      review
    });
  } catch (error) {
    console.error('Manuel yorum ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Yorum sil (admin)
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Yorum bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Yorum başarıyla silindi'
    });
  } catch (error) {
    console.error('Yorum silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;