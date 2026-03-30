const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  code: {
    type: String,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    default: 'Soins',
  },
  // Primary price field (used by seed & new UI)
  price: {
    type: Number,
    default: 0,
  },
  // Legacy field kept for backward compatibility
  defaultPriceMAD: {
    type: Number,
    default: 0,
  },
  defaultVAT: {
    type: Number,
    default: 0,
  },
  // Duration in minutes
  duration: {
    type: Number,
    default: 30,
  },
  description: {
    type: String,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Treatment', schema);
