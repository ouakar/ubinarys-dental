const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Setting = require('./src/models/coreModels/Setting');
const fs = require('fs');

async function seedSettings() {
  await mongoose.connect(process.env.DATABASE);
  console.log('Connected.');
  
  const settingsData = JSON.parse(fs.readFileSync('./src/setup/defaultSettings/moneyFormatSettings.json', 'utf8'));

  for (const s of settingsData) {
    const existing = await Setting.findOne({ settingKey: s.settingKey });
    if (existing) {
      await Setting.findByIdAndUpdate(existing._id, { settingValue: s.settingValue });
      console.log(`Updated: ${s.settingKey} -> ${s.settingValue}`);
    } else {
      await Setting.create({ ...s, removed: false, enabled: true });
      console.log(`Created: ${s.settingKey} -> ${s.settingValue}`);
    }
  }

  // Also ensuring payment numbering exists
  const paymentCounter = await Setting.findOne({ settingKey: 'last_payment_number' });
  if (!paymentCounter) {
     await Setting.create({
       settingCategory: 'money_format_settings',
       settingKey: 'last_payment_number',
       settingValue: 0,
       valueType: 'number'
     });
     console.log('Created last_payment_number setting');
  }

  // Also ensuring today's dashboard is French
  await Setting.findOneAndUpdate({ settingKey: 'ubinarys_app_language' }, { settingValue: 'fr_fr' });
  console.log('Language set to fr_fr');

  process.exit();
}

seedSettings();
