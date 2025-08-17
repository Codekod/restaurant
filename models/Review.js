const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  googleReviewId: {
    type: String,
    unique: true,
    required: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  reviewDate: {
    type: Date,
    required: true
  },
  profilePhotoUrl: {
    type: String,
    trim: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  source: {
    type: String,
    default: 'google'
  }
}, {
  timestamps: true
});

// Index for better performance
reviewSchema.index({ reviewDate: -1, isVisible: 1 });
reviewSchema.index({ googleReviewId: 1 });

module.exports = mongoose.model('Review', reviewSchema);