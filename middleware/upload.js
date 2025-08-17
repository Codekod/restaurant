const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Upload klasörünü oluştur
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage konfigürasyonu
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Dosya adını benzersiz yap
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// Dosya filtresi
const fileFilter = (req, file, cb) => {
  // Sadece resim dosyalarına izin ver
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir'), false);
  }
};

// Multer konfigürasyonu
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Hata yakalama middleware'i
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Dosya boyutu çok büyük. Maksimum 5MB olmalıdır.'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Dosya yükleme hatası: ' + error.message
    });
  }
  
  if (error.message === 'Sadece resim dosyaları yüklenebilir') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

module.exports = upload;
module.exports.handleUploadError = handleUploadError;