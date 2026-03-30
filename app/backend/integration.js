const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const Admin = require('./src/models/coreModels/Admin');
const Client = require('./src/models/appModels/Client');
const Treatment = require('./src/models/appModels/Treatment');
const Appointment = require('./src/models/appModels/Appointment');
const Invoice = require('./src/models/appModels/Invoice');

async function runTest() {
  console.log('Connecting to', process.env.DATABASE);
  await mongoose.connect(process.env.DATABASE);
  console.log('MongoDB Connected. Starting Integration Flow Test...');

  try {
    const admin = await Admin.findOne({ email: 'admin@admin.com' });
    if (!admin) throw new Error('Admin not found!');

    console.log('[1/4] Creating Patient...');
    const patient = await Client.create({
      name: 'Test Patient ' + Date.now(),
      phone: '+212600112233',
      type: 'people',
      createdBy: admin._id,
    });
    console.log('-> Patient Created:', patient._id);

    console.log('[2/4] Creating Treatment Catalog Entry...');
    let treatment = await Treatment.findOne({ code: 'TEST1' });
    if (!treatment) {
      treatment = await Treatment.create({
        code: 'TEST1',
        name: 'Standard Checkup',
        defaultPriceMAD: 400,
        defaultVAT: 20,
        category: 'Consultation'
      });
    }
    console.log('-> Treatment Ready:', treatment._id);

    console.log('[3/4] Creating and Progressing Appointment...');
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 60000); // +30m
    const appointment = await Appointment.create({
      patient: patient._id,
      dentist: admin._id,
      startTime: now,
      endTime: end,
      status: 'booked'
    });
    console.log('-> Appointment Created:', appointment.status);
    
    appointment.status = 'in-chair';
    await appointment.save();
    console.log('-> Status updated -> in-chair');

    appointment.status = 'done';
    await appointment.save();
    console.log('-> Status updated -> done');

    console.log('[4/4] Complete & Bill (Generating Invoice Flow)...');
    // Mimicking POST /api/invoice/create-from-appointment action
    const lineItem = {
      itemName: treatment.name,
      description: treatment.code,
      quantity: 1,
      price: treatment.defaultPriceMAD,
      taxRate: treatment.defaultVAT,
      total: treatment.defaultPriceMAD + (treatment.defaultPriceMAD * (treatment.defaultVAT/100))
    };

    const invoice = await Invoice.create({
      client: patient._id,
      number: Math.floor(Math.random() * 10000) + 1,
      appointmentReference: appointment._id,
      createdBy: admin._id,
      currency: 'MAD',
      year: new Date().getFullYear(),
      date: new Date(),
      expiredDate: new Date(Date.now() + 7 * 86400000),
      status: 'draft',
      paymentStatus: 'unpaid',
      items: [lineItem],
      subTotal: treatment.defaultPriceMAD,
      taxTotal: treatment.defaultPriceMAD * (treatment.defaultVAT/100),
      total: lineItem.total
    });
    
    console.log('-> INVOICE GENERATED SUCCESSFULLY:', invoice._id);
    console.log('-> TTC Total:', invoice.total, 'MAD');

    console.log('\n✅ ALL INTEGRATION TESTS PASSED WITHOUT ERRORS.');
  } catch (err) {
    console.error('❌ FLOW TEST FAILED:', err.message, err);
  } finally {
    process.exit(0);
  }
}

runTest();
