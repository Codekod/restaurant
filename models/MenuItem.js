const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuCategory',
    required: true
  },
  prices: {
    medium: {
      type: Number,
      min: 0
    },
    large: {
      type: Number,
      min: 0
    },
    single: {
      type: Number,
      min: 0
    }
  },
  image: {
    type: String,
    trim: true
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  allergens: [{
    type: String,
    trim: true
  }],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isVegan: {
    type: Boolean,
    default: false
  },
  isGlutenFree: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  preparationTime: {
    type: Number, // dakika cinsinden
    default: 15
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MenuItem', menuItemSchema);