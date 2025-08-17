const express = require('express');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - public klasöründen serve et
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname)); // Root dizindeki dosyalar için

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

// Admin routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

app.get('/admin/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/login.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Website: http://localhost:${PORT}`);
});

module.exports = app;