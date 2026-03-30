const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const Setting = require('./src/models/coreModels/Setting');

async function updateSettings() {
  await mongoose.connect(process.env.DATABASE);
  console.log('Connected.');
  await Setting.findOneAndUpdate({ settingKey: 'default_currency_code' }, { settingValue: 'MAD' });
  await Setting.findOneAndUpdate({ settingKey: 'currency_name' }, { settingValue: 'Moroccan Dirham' });
  await Setting.findOneAndUpdate({ settingKey: 'currency_symbol' }, { settingValue: 'MAD' });
  await Setting.findOneAndUpdate({ settingKey: 'currency_position' }, { settingValue: 'after' });
  console.log('Settings updated to MAD.');
  process.exit();
}

updateSettings();
