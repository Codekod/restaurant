const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Erişim reddedildi. Token bulunamadı.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz token veya kullanıcı aktif değil'
      });
    }

    req.user = decoded;
    req.userDoc = user;
    next();
  } catch (error) {
    console.error('Auth middleware hatası:', error);
    res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
  }
};

module.exports = auth;