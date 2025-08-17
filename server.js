const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Static dosyalar için gerekli
}));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files - root dizindeki tüm dosyaları serve et
app.use(express.static(__dirname));

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lunabrew';
    console.log('MongoDB bağlantısı deneniyor...');
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (err) {
    console.warn('⚠️ MongoDB bağlantı hatası:', err.message);
    console.warn('⚠️ MongoDB olmadan devam ediliyor - Static dosyalar serve edilecek');
  }
};

// MongoDB bağlantısını async olarak başlat
connectDB();

// API Routes - static dosyalardan önce tanımla
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/menu', require('./routes/menu'));
  app.use('/api/reservations', require('./routes/reservations'));
  app.use('/api/reviews', require('./routes/reviews'));
  app.use('/api/admin', require('./routes/admin'));
  console.log('✅ API routes yüklendi');
} catch (error) {
  console.warn('⚠️ API routes yüklenemedi (MongoDB gerekli):', error.message);
}

// HTML Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/menu.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'menu.html'));
});

app.get('/03_luxury-booking.html', (req, res) => {
  res.sendFile(path.join(__dirname, '03_luxury-booking.html'));
});

app.get('/03_luxury-about.html', (req, res) => {
  res.sendFile(path.join(__dirname, '03_luxury-about.html'));
});

app.get('/03_luxury-gallery.html', (req, res) => {
  res.sendFile(path.join(__dirname, '03_luxury-gallery.html'));
});

app.get('/03_luxury-blog.html', (req, res) => {
  res.sendFile(path.join(__dirname, '03_luxury-blog.html'));
});

app.get('/03_luxury-contact.html', (req, res) => {
  res.sendFile(path.join(__dirname, '03_luxury-contact.html'));
});

// Admin panel routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

app.get('/admin/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`🌐 Website: http://localhost:${PORT}`);
  console.log('✅ Static dosyalar serve ediliyor');
});