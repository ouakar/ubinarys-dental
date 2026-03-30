/**
 * Seed script: Moroccan Dental Treatments
 * Usage: node src/setup/seedTreatments.js
 */

require('module-alias/register');

const mongoose = require('mongoose');
require('@/models/appModels/Treatment');

const treatments = [
  { code: 'CONS01', name: 'Consultation', category: 'Consultation', price: 150, defaultPriceMAD: 150, duration: 30 },
  { code: 'DET01', name: 'Détartrage', category: 'Hygiène', price: 300, defaultPriceMAD: 300, duration: 45 },
  { code: 'EXTR01', name: 'Extraction simple', category: 'Chirurgie', price: 400, defaultPriceMAD: 400, duration: 30 },
  { code: 'EXTR02', name: 'Extraction complexe', category: 'Chirurgie', price: 700, defaultPriceMAD: 700, duration: 60 },
  { code: 'PLOMB01', name: 'Plombage (composite)', category: 'Soins', price: 350, defaultPriceMAD: 350, duration: 45 },
  { code: 'PLOMB02', name: 'Plombage (amalgame)', category: 'Soins', price: 250, defaultPriceMAD: 250, duration: 40 },
  { code: 'COUR01', name: 'Couronne céramique', category: 'Prothèse', price: 2500, defaultPriceMAD: 2500, duration: 90 },
  { code: 'COUR02', name: 'Couronne métallique', category: 'Prothèse', price: 1500, defaultPriceMAD: 1500, duration: 90 },
  { code: 'IMPL01', name: 'Implant dentaire', category: 'Implantologie', price: 8000, defaultPriceMAD: 8000, duration: 120 },
  { code: 'BLAN01', name: 'Blanchiment dentaire', category: 'Esthétique', price: 1200, defaultPriceMAD: 1200, duration: 60 },
  { code: 'ORTHO01', name: 'Bague orthodontique (pose)', category: 'Orthodontie', price: 5000, defaultPriceMAD: 5000, duration: 90 },
  { code: 'RADIO01', name: 'Radiographie panoramique', category: 'Radiologie', price: 200, defaultPriceMAD: 200, duration: 15 },
  { code: 'DETAP01', name: 'Dévitalisation (monoradiculée)', category: 'Endodontie', price: 600, defaultPriceMAD: 600, duration: 60 },
  { code: 'DETAP02', name: 'Dévitalisation (pluriradiculée)', category: 'Endodontie', price: 900, defaultPriceMAD: 900, duration: 90 },
];

async function seed() {
  const dbUri = process.env.DATABASE || 'mongodb+srv://wisslan2013_db_user:PYoAQI6wnSEEvSpJ@ubinarys.yf4wdly.mongodb.net/?appName=ubinarys';
  await mongoose.connect(dbUri);
  console.log('✅ Connected to MongoDB');

  const Treatment = mongoose.model('Treatment');

  let inserted = 0;
  let skipped = 0;

  for (const t of treatments) {
    const existing = await Treatment.findOne({ code: t.code });
    if (existing) {
      // Update price and duration if exists
      await Treatment.findByIdAndUpdate(existing._id, { price: t.price, defaultPriceMAD: t.defaultPriceMAD, duration: t.duration, category: t.category });
      skipped++;
      console.log(`⚠️  Updated existing: ${t.code} - ${t.name}`);
    } else {
      await Treatment.create({ ...t, removed: false, enabled: true, defaultVAT: 0 });
      inserted++;
      console.log(`✅ Inserted: ${t.code} - ${t.name}`);
    }
  }

  console.log(`\n📊 Seed complete: ${inserted} inserted, ${skipped} updated`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
