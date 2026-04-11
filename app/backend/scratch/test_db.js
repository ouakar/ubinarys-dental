const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function testConnection() {
  try {
    console.log('Connecting to:', process.env.DATABASE);
    await mongoose.connect(process.env.DATABASE);
    console.log('Connection successful!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
