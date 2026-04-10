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

  company: {
    type: mongoose.Schema.ObjectId,
    ref: 'Company',
  },

  type: {
    type: String,
    enum: ['company', 'people'],
    default: 'people',
  },

  name: {
    type: String,
  },
  
  email: {
    type: String,
    lowercase: true,
  },
  website: String,
  country: String,
  phone: {
    type: String,
  },
  mobile: String,
  address: String,
  state: String,
  city: String,
  zipCode: String,
  condition: String,
  note: String,
  
  // Dental / Patient specific extensions
  medicalHistory: String,
  allergies: String,
  ongoingConditions: String,
  clinicalNotes: String,
  draftClinicalNotes: { type: mongoose.Schema.Types.Mixed, default: {} },
  preferredLanguage: {
    type: String,
    enum: ['AR', 'FR'],
    default: 'FR',
  },

  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  assigned: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  
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

module.exports = mongoose.model('Client', schema);
