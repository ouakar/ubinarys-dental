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
  patient: {
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    autopopulate: true,
  },
  dentist: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
    autopopulate: true,
  },
  clinic: {
    type: String,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['booked', 'confirmed', 'in-chair', 'done', 'no-show'],
    default: 'booked',
  },
  reason: {
    type: String,
  },
  treatment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Treatment',
    autopopulate: { maxDepth: 1 },
  },
  chairRoom: {
    type: String,
  },
  notes: {
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

schema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Appointment', schema);
