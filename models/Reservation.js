const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  customerInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    }
  },
  reservationDetails: {
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
    specialRequests: {
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no-show'],
    default: 'pending'
  },
  confirmationCode: {
    type: String,
    unique: true
  },
  notes: {
    type: String,
    trim: true
  },
  adminNotes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    default: 'customer'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate confirmation code before saving
reservationSchema.pre('save', function(next) {
  if (this.isNew && !this.confirmationCode) {
    this.confirmationCode = 'LB' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

// Index for better performance
reservationSchema.index({ 'reservationDetails.date': 1, status: 1 });
reservationSchema.index({ confirmationCode: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);