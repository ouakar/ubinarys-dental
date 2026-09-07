require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { globSync } = require('glob');
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');

function validatePassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 12) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function setupApp() {
  try {
    const email = process.env.INITIAL_ADMIN_EMAIL;
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    const name = process.env.INITIAL_ADMIN_NAME || 'UBINARYS';
    const surname = process.env.INITIAL_ADMIN_SURNAME || 'Admin';

    if (!email) {
      console.error('❌ Error: INITIAL_ADMIN_EMAIL environment variable is missing.');
      process.exit(1);
    }
    if (!validateEmail(email)) {
      console.error('❌ Error: INITIAL_ADMIN_EMAIL is not a valid email address.');
      process.exit(1);
    }
    if (!password) {
      console.error('❌ Error: INITIAL_ADMIN_PASSWORD environment variable is missing.');
      process.exit(1);
    }
    if (!validatePassword(password)) {
      console.error(
        '❌ Error: INITIAL_ADMIN_PASSWORD must be at least 12 characters and contain uppercase, lowercase, number, and special character.'
      );
      process.exit(1);
    }

    if (!process.env.DATABASE) {
      console.error('❌ Error: DATABASE environment variable is missing.');
      process.exit(1);
    }

    await mongoose.connect(process.env.DATABASE);
    console.log('Connected to DB');

    const Admin = require('../models/coreModels/Admin');
    const AdminPassword = require('../models/coreModels/AdminPassword');

    // Refuse setup if an administrator already exists
    const existingAdmin = await Admin.findOne({ removed: false });
    if (existingAdmin) {
      console.log('⚠️ Setup aborted: An active administrator already exists.');
      process.exit(1);
    }

    const newAdminPassword = new AdminPassword();
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = newAdminPassword.generateHash(salt, password);

    const initialAdmin = {
      email: email.trim().toLowerCase(),
      name,
      surname,
      enabled: true,
      role: 'admin',
    };
    const result = await new Admin(initialAdmin).save();

    const adminPasswordData = {
      password: passwordHash,
      emailVerified: true,
      salt: salt,
      user: result._id,
    };
    await new AdminPassword(adminPasswordData).save();

    console.log(`👍 Admin created : Done! (Email: ${email.trim().toLowerCase()})`);

    // Idempotent settings creation
    const Setting = require('../models/coreModels/Setting');
    const settingFiles = [];
    const settingsFiles = globSync('./src/setup/defaultSettings/**/*.json');

    for (const filePath of settingsFiles) {
      const file = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      settingFiles.push(...file);
    }

    let createdSettings = 0;
    for (const settingData of settingFiles) {
      const exists = await Setting.findOne({ settingKey: settingData.settingKey });
      if (!exists) {
        await new Setting(settingData).save();
        createdSettings++;
      }
    }
    console.log(`👍 Settings processed (${createdSettings} created, ${settingFiles.length - createdSettings} already existing).`);

    // Idempotent taxes creation
    const Taxes = require('../models/appModels/Taxes');
    const existingTax = await Taxes.findOne({ isDefault: true });
    if (!existingTax) {
      await Taxes.create([{ taxName: 'Tax 0%', taxValue: '0', isDefault: true }]);
      console.log('👍 Taxes created : Done!');
    } else {
      console.log('✔ Default tax already exists : Skipped.');
    }

    // Idempotent payment mode creation
    const PaymentMode = require('../models/appModels/PaymentMode');
    const existingPaymentMode = await PaymentMode.findOne({ isDefault: true });
    if (!existingPaymentMode) {
      await PaymentMode.create([
        {
          name: 'Default Payment',
          description: 'Default Payment Mode (Cash , Wire Transfer)',
          isDefault: true,
        },
      ]);
      console.log('👍 PaymentMode created : Done!');
    } else {
      console.log('✔ Default payment mode already exists : Skipped.');
    }

    console.log('🥳 Setup completed : Success!');
    process.exit(0);
  } catch (e) {
    console.error('\n🚫 Error during setupApp:', e.message);
    process.exit(1);
  }
}

if (require.main === module) {
  setupApp();
}

module.exports = {
  validatePassword,
  validateEmail,
  setupApp,
};
