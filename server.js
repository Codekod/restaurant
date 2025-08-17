const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
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

// Static files
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lunabrew';
    console.log('MongoDB bağlantısı deneniyor:', mongoUri);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB bağlantısı başarılı');
  } catch (err) {
    console.error('MongoDB bağlantı hatası:', err.message);
    console.log('MongoDB sunucusunun çalıştığından emin olun veya .env dosyasında MONGODB_URI ayarlayın');
    // MongoDB bağlantısı olmadan da static dosyalar serve edilebilir
    console.log('MongoDB olmadan devam ediliyor...');
  }
};

connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));

// Admin panel route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

app.get('/admin/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

// Ana sayfa route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Diğer HTML sayfaları
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

// 404 handler - en sonda olmalı
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});