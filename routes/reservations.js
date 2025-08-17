const express = require('express');
const { body, validationResult } = require('express-validator');
const Reservation = require('../models/Reservation');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Rezervasyon oluştur (herkese açık)
router.post('/', [
  body('customerName').notEmpty().trim().withMessage('Ad soyad gerekli'),
  body('customerEmail').isEmail().normalizeEmail().withMessage('Geçerli email adresi gerekli'),
  body('customerPhone').notEmpty().trim().withMessage('Telefon numarası gerekli'),
  body('date').isISO8601().withMessage('Geçerli tarih seçin'),
  body('time').notEmpty().withMessage('Saat seçin'),
  body('guests').notEmpty().withMessage('Kişi sayısı seçin')
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

    // Geçmiş tarih kontrolü
    const reservationDate = new Date(req.body.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (reservationDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Geçmiş tarih için rezervasyon yapılamaz'
      });
    }

    const reservation = new Reservation(req.body);
    await reservation.save();

    // Email gönder
    try {
      await emailService.sendReservationConfirmation(reservation);
    } catch (emailError) {
      console.error('Email gönderme hatası:', emailError);
      // Email hatası rezervasyonu iptal etmez
    }

    res.status(201).json({
      success: true,
      message: 'Rezervasyonunuz başarıyla alındı. En kısa sürede size dönüş yapacağız.',
      reservation: {
        id: reservation._id,
        customerName: reservation.customerName,
        date: reservation.date,
        time: reservation.time,
        guests: reservation.guests,
        status: reservation.status
      }
    });

  } catch (error) {
    console.error('Rezervasyon oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Rezervasyon oluşturulurken bir hata oluştu'
    });
  }
});

// Rezervasyon durumu sorgula (herkese açık)
router.get('/status/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .select('customerName date time guests status');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı'
      });
    }

    res.json({
      success: true,
      reservation
    });
  } catch (error) {
    console.error('Rezervasyon durumu sorgulama hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Admin rotaları

// Tüm rezervasyonları getir (admin)
router.get('/admin', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, date, search } = req.query;
    const query = {};

    if (status && status !== 'all') query.status = status;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    if (search) {
      query.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } }
      ];
    }

    const reservations = await Reservation.find(query)
      .sort({ date: -1, time: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Reservation.countDocuments(query);

    res.json({
      success: true,
      reservations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Admin rezervasyonları getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Rezervasyon durumu güncelle (admin)
router.patch('/admin/:id/status', auth, [
  body('status').isIn(['beklemede', 'onaylandi', 'iptal', 'tamamlandi']).withMessage('Geçerli durum seçin')
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

    const { status, adminNotes, tableNumber } = req.body;
    
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        adminNotes: adminNotes || '',
        tableNumber: tableNumber || ''
      },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı'
      });
    }

    // Durum değişikliği email'i gönder
    try {
      await emailService.sendReservationStatusUpdate(reservation);
    } catch (emailError) {
      console.error('Email gönderme hatası:', emailError);
    }

    res.json({
      success: true,
      message: 'Rezervasyon durumu güncellendi',
      reservation
    });
  } catch (error) {
    console.error('Rezervasyon durumu güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Rezervasyon sil (admin)
router.delete('/admin/:id', auth, async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Rezervasyon bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Rezervasyon başarıyla silindi'
    });
  } catch (error) {
    console.error('Rezervasyon silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Rezervasyon istatistikleri (admin)
router.get('/admin/stats', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - 7);

    const stats = {
      bugün: await Reservation.countDocuments({
        date: { $gte: today, $lt: tomorrow }
      }),
      beklemede: await Reservation.countDocuments({
        status: 'beklemede'
      }),
      onaylandi: await Reservation.countDocuments({
        status: 'onaylandi',
        date: { $gte: today }
      }),
      buHafta: await Reservation.countDocuments({
        date: { $gte: thisWeek }
      }),
      toplam: await Reservation.countDocuments()
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Rezervasyon istatistikleri hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;