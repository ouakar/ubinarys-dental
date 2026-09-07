require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function deleteData() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: Database reset command is strictly disabled in PRODUCTION environment.');
    process.exit(1);
  }

  if (process.env.CONFIRM_DATABASE_RESET !== 'YES_DELETE_CONFIGURATION') {
    console.error('❌ ERROR: Database reset requires explicit confirmation environment variable.');
    console.error('Set CONFIRM_DATABASE_RESET=YES_DELETE_CONFIGURATION to execute this operation.');
    process.exit(1);
  }

  if (!process.env.DATABASE) {
    console.error('❌ ERROR: DATABASE environment variable is missing.');
    process.exit(1);
  }

  console.warn('⚠️  WARNING: DANGEROUS DATABASE RESET INITIATED');
  console.warn('The following configuration collections will be cleared:');
  console.warn('  - Admin');
  console.warn('  - AdminPassword');
  console.warn('  - Setting');
  console.warn('  - PaymentMode');
  console.warn('  - Taxes');
  console.warn('\nNote: Patient, Appointment, Invoice, Quote, Treatment, and Payment records will NOT be deleted.');

  await mongoose.connect(process.env.DATABASE);

  const Admin = require('../models/coreModels/Admin');
  const AdminPassword = require('../models/coreModels/AdminPassword');
  const Setting = require('../models/coreModels/Setting');
  const PaymentMode = require('../models/appModels/PaymentMode');
  const Taxes = require('../models/appModels/Taxes');

  await Admin.deleteMany();
  await AdminPassword.deleteMany();
  await PaymentMode.deleteMany();
  await Taxes.deleteMany();
  await Setting.deleteMany();

  console.log('👍 Configuration data deleted successfully. Run "npm run setup" to re-initialize system settings.');
  await mongoose.disconnect();
  process.exit(0);
}

deleteData().catch((err) => {
  console.error('❌ Reset failed:', err.message);
  process.exit(1);
});
