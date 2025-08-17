const express = require('express');
const User = require('../models/User');
const Reservation = require('../models/Reservation');
const MenuItem = require('../models/MenuItem');
const MenuCategory = require('../models/MenuCategory');
const Review = require('../models/Review');
const auth = require('../middleware/auth');

const router = express.Router();

// Dashboard istatistikleri
router.get('/dashboard', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const thisMonth = new Date(today);
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    // Rezervasyon istatistikleri
    const reservationStats = {
      bugün: await Reservation.countDocuments({
        date: { $gte: today, $lt: tomorrow }
      }),
      beklemede: await Reservation.countDocuments({
        status: 'beklemede'
      }),
      buHafta: await Reservation.countDocuments({
        date: { $gte: thisWeek }
      }),
      buAy: await Reservation.countDocuments({
        date: { $gte: thisMonth }
      }),
      toplam: await Reservation.countDocuments()
    };

    // Menü istatistikleri
    const menuStats = {
      toplamÜrün: await MenuItem.countDocuments(),
      aktifÜrün: await MenuItem.countDocuments({ isAvailable: true }),
      popülerÜrün: await MenuItem.countDocuments({ isPopular: true }),
      kategori: await MenuCategory.countDocuments({ isActive: true })
    };

    // Yorum istatistikleri
    const reviewStats = {
      toplam: await Review.countDocuments(),
      görünür: await Review.countDocuments({ isVisible: true }),
      ortalamaPuan: await Review.aggregate([
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]).then(result => Math.round((result[0]?.avgRating || 0) * 10) / 10)
    };

    // Son rezervasyonlar
    const recentReservations = await Reservation.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('customerName date time guests status');

    // Son yorumlar
    const recentReviews = await Review.find({ isVisible: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('authorName text rating createdAt');

    res.json({
      success: true,
      stats: {
        rezervasyonlar: reservationStats,
        menü: menuStats,
        yorumlar: reviewStats
      },
      recentReservations,
      recentReviews
    });

  } catch (error) {
    console.error('Dashboard istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Sistem ayarları getir
router.get('/settings', auth, async (req, res) => {
  try {
    // Burada sistem ayarlarını döndürebiliriz
    const settings = {
      restaurantInfo: {
        name: 'LunaBrew',
        address: 'Ankara, Çankaya, Tunalı Hilmi Caddesi, No: 12T.',
        phone: '(312) 454 8484',
        email: 'info@lunabrew.com'
      },
      workingHours: {
        pazartesi: { açılış: '09:00', kapanış: '23:00' },
        salı: { açılış: '09:00', kapanış: '23:00' },
        çarşamba: { açılış: '09:00', kapanış: '23:00' },
        perşembe: { açılış: '09:00', kapanış: '23:00' },
        cuma: { açılış: '10:00', kapanış: '22:00' },
        cumartesi: { açılış: '09:30', kapanış: '24:00' },
        pazar: { açılış: '09:30', kapanış: '24:00' }
      }
    };

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Ayarları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;