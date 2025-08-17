const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  icon: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MenuCategory', menuCategorySchema);