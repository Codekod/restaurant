const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  guests: {
    type: String,
    required: true
  },
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['beklemede', 'onaylandi', 'iptal', 'tamamlandi'],
    default: 'beklemede'
  },
  adminNotes: {
    type: String,
    trim: true
  },
  tableNumber: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reservation', reservationSchema);