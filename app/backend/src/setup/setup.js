require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { globSync } = require('glob');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const DEV_DEFAULT_EMAIL = 'admin@demo.com';
const DEV_DEFAULT_PASSWORD = 'Admin@2026!Local';

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

const defaultTreatments = [
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

async function setupApp(options = {}) {
  try {
    const isDev = (process.env.NODE_ENV || 'development') === 'development';
    const enableDefaultAdmin = process.env.ENABLE_DEFAULT_ADMIN === 'true';

    let email = process.env.INITIAL_ADMIN_EMAIL;
    let password = process.env.INITIAL_ADMIN_PASSWORD;
    const name = process.env.INITIAL_ADMIN_NAME || 'UBINARYS';
    const surname = process.env.INITIAL_ADMIN_SURNAME || 'Admin';

    // Development default administrator
    if (isDev && enableDefaultAdmin && (!email || !password)) {
      email = email || DEV_DEFAULT_EMAIL;
      password = password || DEV_DEFAULT_PASSWORD;
      console.log('ℹ️  Using development-only default administrator account.');
    }

    // Production checks
    if (!isDev || !enableDefaultAdmin) {
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
      if (password === DEV_DEFAULT_PASSWORD) {
        console.error('❌ Error: Production setup rejects the development default password.');
        process.exit(1);
      }
      if (!validatePassword(password)) {
        console.error(
          '❌ Error: INITIAL_ADMIN_PASSWORD must be at least 12 characters and contain uppercase, lowercase, number, and special character.'
        );
        process.exit(1);
      }
    }

    if (!process.env.DATABASE) {
      console.error('❌ Error: DATABASE environment variable is missing.');
      process.exit(1);
    }

    await mongoose.connect(process.env.DATABASE);
    console.log('✅ Connected to DB');

    const Admin = require('../models/coreModels/Admin');
    const AdminPassword = require('../models/coreModels/AdminPassword');

    // Idempotent admin creation
    const existingAdmin = await Admin.findOne({ email: email.trim().toLowerCase(), removed: false });
    if (existingAdmin) {
      console.log(`✔ Administrator (${email.trim().toLowerCase()}) already exists : Skipped.`);
    } else {
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = bcrypt.hashSync(salt + password, 10);

      const initialAdmin = {
        email: email.trim().toLowerCase(),
        name,
        surname,
        enabled: true,
        role: 'admin',
      };
      const createdUser = await new Admin(initialAdmin).save();

      const adminPasswordData = {
        password: passwordHash,
        emailVerified: true,
        salt: salt,
        user: createdUser._id,
      };
      await new AdminPassword(adminPasswordData).save();
      console.log(`👍 Admin created : Done! (Email: ${email.trim().toLowerCase()})`);
    }

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
    const existingTax = await Taxes.findOne({ isDefault: true, removed: false });
    if (!existingTax) {
      await Taxes.create([{ taxName: 'Tax 0%', taxValue: '0', isDefault: true }]);
      console.log('👍 Taxes created : Done!');
    } else {
      console.log('✔ Default tax already exists : Skipped.');
    }

    // Idempotent payment mode creation
    const PaymentMode = require('../models/appModels/PaymentMode');
    const existingPaymentMode = await PaymentMode.findOne({ isDefault: true, removed: false });
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

    // Idempotent dental treatments creation
    const Treatment = require('../models/appModels/Treatment');
    let createdTreatments = 0;
    for (const t of defaultTreatments) {
      const exists = await Treatment.findOne({ code: t.code, removed: false });
      if (!exists) {
        await Treatment.create({ ...t, removed: false, enabled: true, defaultVAT: 0 });
        createdTreatments++;
      }
    }
    console.log(`👍 Dental treatments processed (${createdTreatments} created, ${defaultTreatments.length - createdTreatments} already existing).`);

    console.log('🥳 Setup completed : Success!');
    if (!options.keepConnectionOpen) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (e) {
    console.error('\n🚫 Error during setupApp:', e.message);
    if (!options.keepConnectionOpen) {
      process.exit(1);
    }
    throw e;
  }
}

if (require.main === module) {
  setupApp();
}

module.exports = {
  validatePassword,
  validateEmail,
  setupApp,
  DEV_DEFAULT_EMAIL,
  DEV_DEFAULT_PASSWORD,
  defaultTreatments,
};
