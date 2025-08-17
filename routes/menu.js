const express = require('express');
const { body, validationResult } = require('express-validator');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Tüm kategorileri ürünlerle birlikte getir (herkese açık)
router.get('/categories', async (req, res) => {
  try {
    const categories = await MenuCategory.find({ isActive: true })
      .sort({ order: 1, name: 1 });

    const categoriesWithItems = await Promise.all(
      categories.map(async (category) => {
        const items = await MenuItem.find({
          category: category._id,
          isAvailable: true
        }).sort({ order: 1, name: 1 });

        return {
          ...category.toObject(),
          items
        };
      })
    );

    res.json({
      success: true,
      categories: categoriesWithItems
    });
  } catch (error) {
    console.error('Kategorileri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Popüler ürünleri getir (herkese açık)
router.get('/popular', async (req, res) => {
  try {
    const popularItems = await MenuItem.find({
      isPopular: true,
      isAvailable: true
    })
    .populate('category', 'name')
    .sort({ order: 1 })
    .limit(8);

    res.json({
      success: true,
      items: popularItems
    });
  } catch (error) {
    console.error('Popüler ürünleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Admin rotaları (korumalı)

// Tüm kategorileri getir (admin)
router.get('/admin/categories', auth, async (req, res) => {
  try {
    const categories = await MenuCategory.find().sort({ order: 1, name: 1 });
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Admin kategorileri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kategori oluştur (admin)
router.post('/admin/categories', auth, [
  body('name').notEmpty().trim().withMessage('Kategori adı gerekli'),
  body('description').optional().trim()
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

    const category = new MenuCategory(req.body);
    await category.save();

    res.status(201).json({
      success: true,
      message: 'Kategori başarıyla oluşturuldu',
      category
    });
  } catch (error) {
    console.error('Kategori oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kategori güncelle (admin)
router.put('/admin/categories/:id', auth, async (req, res) => {
  try {
    const category = await MenuCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Kategori başarıyla güncellendi',
      category
    });
  } catch (error) {
    console.error('Kategori güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Kategori sil (admin)
router.delete('/admin/categories/:id', auth, async (req, res) => {
  try {
    // Kategoride ürün var mı kontrol et
    const itemCount = await MenuItem.countDocuments({ category: req.params.id });
    if (itemCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'İçinde ürün bulunan kategori silinemez'
      });
    }

    const category = await MenuCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategori bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Kategori başarıyla silindi'
    });
  } catch (error) {
    console.error('Kategori silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Tüm menü ürünlerini getir (admin)
router.get('/admin/items', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const query = {};

    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await MenuItem.find(query)
      .populate('category', 'name')
      .sort({ order: 1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await MenuItem.countDocuments(query);

    res.json({
      success: true,
      items,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Admin ürünleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Menü ürünü oluştur (admin)
router.post('/admin/items', auth, upload.single('image'), [
  body('name').notEmpty().trim().withMessage('Ürün adı gerekli'),
  body('description').notEmpty().trim().withMessage('Ürün açıklaması gerekli'),
  body('category').isMongoId().withMessage('Geçerli kategori seçin')
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

    const itemData = {
      ...req.body,
      prices: JSON.parse(req.body.prices || '{}'),
      ingredients: JSON.parse(req.body.ingredients || '[]'),
      allergens: JSON.parse(req.body.allergens || '[]'),
      nutritionalInfo: JSON.parse(req.body.nutritionalInfo || '{}')
    };

    if (req.file) {
      itemData.image = `/uploads/${req.file.filename}`;
    }

    const item = new MenuItem(itemData);
    await item.save();
    await item.populate('category', 'name');

    res.status(201).json({
      success: true,
      message: 'Menü ürünü başarıyla oluşturuldu',
      item
    });
  } catch (error) {
    console.error('Menü ürünü oluşturma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Menü ürünü güncelle (admin)
router.put('/admin/items/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      prices: JSON.parse(req.body.prices || '{}'),
      ingredients: JSON.parse(req.body.ingredients || '[]'),
      allergens: JSON.parse(req.body.allergens || '[]'),
      nutritionalInfo: JSON.parse(req.body.nutritionalInfo || '{}')
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const item = await MenuItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menü ürünü bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Menü ürünü başarıyla güncellendi',
      item
    });
  } catch (error) {
    console.error('Menü ürünü güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Menü ürünü sil (admin)
router.delete('/admin/items/:id', auth, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menü ürünü bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Menü ürünü başarıyla silindi'
    });
  } catch (error) {
    console.error('Menü ürünü silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Ürün durumunu değiştir (admin)
router.patch('/admin/items/:id/toggle-availability', auth, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menü ürünü bulunamadı'
      });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({
      success: true,
      message: `Ürün ${item.isAvailable ? 'aktif' : 'pasif'} hale getirildi`,
      item
    });
  } catch (error) {
    console.error('Ürün durumu değiştirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Popüler ürün durumunu değiştir (admin)
router.patch('/admin/items/:id/toggle-popular', auth, async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menü ürünü bulunamadı'
      });
    }

    item.isPopular = !item.isPopular;
    await item.save();

    res.json({
      success: true,
      message: `Ürün ${item.isPopular ? 'popüler ürünlere eklendi' : 'popüler ürünlerden çıkarıldı'}`,
      item
    });
  } catch (error) {
    console.error('Popüler ürün durumu değiştirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router;