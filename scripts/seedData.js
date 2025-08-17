const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');

async function seedData() {
  try {
    // MongoDB'ye bağlan
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lunabrew';
    console.log('MongoDB bağlantısı deneniyor:', mongoUri);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 saniye timeout
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB bağlantısı başarılı');

    // Mevcut verileri temizle
    await User.deleteMany({});
    await MenuCategory.deleteMany({});
    await MenuItem.deleteMany({});
    console.log('Mevcut veriler temizlendi');

    // Admin kullanıcı oluştur
    const adminUser = new User({
      name: 'LunaBrew Admin',
      email: 'admin@lunabrew.com',
      password: 'admin123',
      role: 'admin'
    });
    await adminUser.save();
    console.log('Admin kullanıcı oluşturuldu');

    // Kategoriler oluştur
    const categories = [
      {
        name: 'Kahveler',
        description: 'Özenle hazırlanmış kahve çeşitlerimiz',
        order: 1,
        icon: 'fas fa-coffee'
      },
      {
        name: 'Kahve İçermeyen İçecekler',
        description: 'Çay, sıcak çikolata ve diğer içecekler',
        order: 2,
        icon: 'fas fa-mug-hot'
      },
      {
        name: 'Ana Yemekler',
        description: 'Doyurucu ana yemek seçeneklerimiz',
        order: 3,
        icon: 'fas fa-utensils'
      },
      {
        name: 'Atıştırmalıklar',
        description: 'Hafif atıştırmalık ve aperatifler',
        order: 4,
        icon: 'fas fa-cookie-bite'
      }
    ];

    const createdCategories = await MenuCategory.insertMany(categories);
    console.log('Kategoriler oluşturuldu');

    // Menü ürünleri oluştur
    const kahveKategori = createdCategories.find(c => c.name === 'Kahveler');
    const icecekKategori = createdCategories.find(c => c.name === 'Kahve İçermeyen İçecekler');
    const yemekKategori = createdCategories.find(c => c.name === 'Ana Yemekler');
    const atistirmalikKategori = createdCategories.find(c => c.name === 'Atıştırmalıklar');

    const menuItems = [
      // Kahveler
      {
        name: 'Espresso',
        description: 'Tutkunun mükemmellikle buluşması',
        category: kahveKategori._id,
        prices: { medium: 110, large: 150 },
        isPopular: true,
        preparationTime: 5,
        order: 1
      },
      {
        name: 'Cappuccino',
        description: 'Yoğun espresso ile köpüklü mükemmelliğin buluşması',
        category: kahveKategori._id,
        prices: { medium: 150, large: 180 },
        isPopular: true,
        preparationTime: 8,
        order: 2
      },
      {
        name: 'Latte',
        description: 'Pürüzsüz espresso ve süt köpüğünün eşsiz uyumu',
        category: kahveKategori._id,
        prices: { medium: 160, large: 200 },
        isPopular: true,
        preparationTime: 8,
        order: 3
      },
      {
        name: 'Americano',
        description: 'Saf kahve keyfinin özü',
        category: kahveKategori._id,
        prices: { medium: 100, large: 120 },
        preparationTime: 5,
        order: 4
      },
      {
        name: 'Mocha',
        description: 'Çikolata ve espressonun mükemmel dengesi',
        category: kahveKategori._id,
        prices: { medium: 160, large: 200 },
        preparationTime: 10,
        order: 5
      },
      {
        name: 'Caramel Latte',
        description: 'Pürüzsüz espresso ve altın karamelin eşsiz uyumu',
        category: kahveKategori._id,
        prices: { medium: 160, large: 200 },
        preparationTime: 10,
        order: 6
      },
      {
        name: 'Türk Kahvesi',
        description: 'Geleneksel Türk kahvesi, özel pişirme tekniğiyle',
        category: kahveKategori._id,
        prices: { single: 75 },
        preparationTime: 15,
        order: 7
      },

      // Kahve İçermeyen İçecekler
      {
        name: 'Elma Çayı',
        description: 'Kendi bahçemizden toplanmış organik elmaların eşsiz aroması',
        category: icecekKategori._id,
        prices: { medium: 120, large: 150 },
        isVegetarian: true,
        isVegan: true,
        preparationTime: 5,
        order: 1
      },
      {
        name: 'Sıcak Çikolata',
        description: 'En kaliteli kakao ve kremsi sütle hazırlanmış',
        category: icecekKategori._id,
        prices: { medium: 150, large: 170 },
        isVegetarian: true,
        preparationTime: 8,
        order: 2
      },
      {
        name: 'Limonata',
        description: 'Taze limonların canlı sitrus aromalarıyla dolu, ferahlatıcı içecek',
        category: icecekKategori._id,
        prices: { medium: 150, large: 170 },
        isVegetarian: true,
        isVegan: true,
        preparationTime: 5,
        order: 3
      },
      {
        name: 'Meyveli Smoothie',
        description: 'Olgun meyvelerin doğal tatlılığıyla patlayan, sağlıklı karışım',
        category: icecekKategori._id,
        prices: { medium: 170, large: 200 },
        isVegetarian: true,
        isVegan: true,
        preparationTime: 10,
        order: 4
      },

      // Ana Yemekler
      {
        name: 'Tavuklu Burger',
        description: 'Baharatla marine edilmiş ızgara tavuk eti, taze marul, domates ve özel sosla',
        category: yemekKategori._id,
        prices: { single: 350 },
        preparationTime: 20,
        order: 1
      },
      {
        name: 'Sebzeli Pizza',
        description: 'Taze biber, mantar, domates ve mozarella ile hazırlanmış',
        category: yemekKategori._id,
        prices: { single: 375 },
        isVegetarian: true,
        preparationTime: 25,
        order: 2
      },
      {
        name: 'Tavuklu Pizza',
        description: 'Baharatlı tavuk parçaları, eriyen kaşar peyniri ve mevsim sebzeleri',
        category: yemekKategori._id,
        prices: { single: 350 },
        preparationTime: 25,
        order: 3
      },
      {
        name: 'Tavuklu Sandwich',
        description: 'Izgara tavuk göğsü, çıtır ekmek, marul, domates ve kremsi mayonez',
        category: yemekKategori._id,
        prices: { single: 325 },
        preparationTime: 15,
        order: 4
      },
      {
        name: 'Vejeteryan Köfte Tabağı',
        description: 'Ev yapımı vejetaryen köfteler, yoğurt sosu ve taze otlarla',
        category: yemekKategori._id,
        prices: { single: 400 },
        isVegetarian: true,
        preparationTime: 20,
        order: 5
      },

      // Atıştırmalıklar
      {
        name: 'Peynirli Poğaça',
        description: 'Yumuşacık hamur içinde eriyen kaşar peyniri',
        category: atistirmalikKategori._id,
        prices: { single: 50 },
        isVegetarian: true,
        preparationTime: 5,
        order: 1
      },
      {
        name: 'Sigara Böreği',
        description: 'Peynir veya patates dolgulu, çıtır yufkada servis',
        category: atistirmalikKategori._id,
        prices: { single: 200 },
        isVegetarian: true,
        preparationTime: 15,
        order: 2
      },
      {
        name: 'Zeytinli Kısır',
        description: 'Bulgur, zeytin, maydanoz ve baharatlarla hazırlanmış sağlıklı seçenek',
        category: atistirmalikKategori._id,
        prices: { single: 275 },
        isVegetarian: true,
        isVegan: true,
        preparationTime: 10,
        order: 3
      },
      {
        name: 'Çikolatalı Kurabiye',
        description: 'Yumuşak ve çikolata dolu, kahvenin yanında mükemmel tatlı',
        category: atistirmalikKategori._id,
        prices: { single: 225 },
        isVegetarian: true,
        preparationTime: 5,
        order: 4
      }
    ];

    await MenuItem.insertMany(menuItems);
    console.log('Menü ürünleri oluşturuldu');

    console.log('\n✅ Seed veriler başarıyla oluşturuldu!');
    console.log('\n📋 Giriş Bilgileri:');
    console.log('Email: admin@lunabrew.com');
    console.log('Şifre: admin123');
    console.log('\n🌐 Admin Panel: http://localhost:3000/admin');

  } catch (error) {
    console.error('Seed veriler oluşturulurken hata:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedData();