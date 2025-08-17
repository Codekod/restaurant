const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  googleReviewId: {
    type: String,
    unique: true,
    sparse: true // Google yorumları için
  },
  authorName: {
    type: String,
    required: true,
    trim: true
  },
  text: {
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
  source: {
    type: String,
    enum: ['google', 'manuel', 'facebook', 'tripadvisor'],
    default: 'manuel'
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  authorEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  authorPhone: {
    type: String,
    trim: true
  },
  response: {
    text: {
      type: String,
      trim: true
    },
    date: {
      type: Date
    },
    author: {
      type: String,
      trim: true
    }
  },
  metadata: {
    platform: String,
    deviceType: String,
    location: String
  }
}, {
  timestamps: true
});

// Index'ler
reviewSchema.index({ rating: -1 });
reviewSchema.index({ source: 1 });
reviewSchema.index({ isVisible: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ googleReviewId: 1 }, { sparse: true });

// Virtual field - yorum özeti
reviewSchema.virtual('summary').get(function() {
  return this.text.length > 100 ? this.text.substring(0, 100) + '...' : this.text;
});

// Static method - ortalama puan hesapla
reviewSchema.statics.getAverageRating = async function() {
  const result = await this.aggregate([
    { $match: { isVisible: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' } } }
  ]);
  return result[0]?.avgRating || 0;
};

// Static method - puan dağılımı
reviewSchema.statics.getRatingDistribution = async function() {
  const result = await this.aggregate([
    { $match: { isVisible: true } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: -1 } }
  ]);
  
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  result.forEach(item => {
    distribution[item._id] = item.count;
  });
  
  return distribution;
};

// Instance method - yorum yanıtla
reviewSchema.methods.addResponse = function(responseText, authorName) {
  this.response = {
    text: responseText,
    date: new Date(),
    author: authorName
  };
  return this.save();
};

module.exports = mongoose.model('Review', reviewSchema);