require('dotenv').config({ path: 'app/backend/.env' });
require('dotenv').config({ path: 'app/backend/.env.local' });
const mongoose = require('mongoose');
const { generatePdf } = require('./app/backend/src/controllers/pdfController');
const { listAllSettings } = require('./app/backend/src/middlewares/settings'); // wait maybe this needs db

mongoose.connect(process.env.DATABASE || 'mongodb://localhost:27017/ubinarys', { useNewUrlParser: true });

async function run() {
  const result = { number: 1, year: 2026, client: { name: 'Test' }, date: new Date(), expiredDate: new Date(), items: [] };
  const targetLocation = 'app/backend/src/public/download/invoice/test12345.pdf';
  try {
    await new Promise((resolve, reject) => {
      generatePdf('Invoice', { filename: 'invoice', format: 'A4', targetLocation }, result, (err) => {
        if(err) reject(err);
        resolve();
      }).catch(reject);
    });
    console.log("PDF OK");
  } catch (e) {
    console.error("PDF ERROR:", e);
  }
  process.exit(0);
}
run();
