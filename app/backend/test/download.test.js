require('module-alias/register');
const test = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_32_characters_long_minimum!';
process.env.DATABASE = 'mongodb://localhost:27017/test_db';

const app = require('../src/app');

test('Unauthenticated /download is rejected with 401', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/download/invoice/invoice-507f1f77bcf86cd799439011.pdf`);
    assert.strictEqual(res.status, 401);
  } finally {
    server.close();
  }
});

test('Authenticated /download with invalid directory is rejected with 400', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  const fakeUserId = new mongoose.Types.ObjectId();
  const token = jwt.sign({ id: fakeUserId.toString() }, process.env.JWT_SECRET, { expiresIn: '15m' });

  // Mock Admin & AdminPassword models for isValidAuthToken
  const Admin = mongoose.model('Admin');
  const AdminPassword = mongoose.model('AdminPassword');

  const origAdminFindOne = Admin.findOne;
  const origPasswordFindOne = AdminPassword.findOne;

  Admin.findOne = () => ({
    _id: fakeUserId,
    enabled: true,
    role: 'admin',
  });

  AdminPassword.findOne = () => ({
    user: fakeUserId,
    loggedSessions: [token],
  });

  try {
    const res = await fetch(
      `http://127.0.0.1:${port}/download/malicious_dir/malicious_dir-507f1f77bcf86cd799439011.pdf`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.message, 'Invalid directory parameter.');
  } finally {
    Admin.findOne = origAdminFindOne;
    AdminPassword.findOne = origPasswordFindOne;
    server.close();
  }
});

test('Authenticated /download with invalid ObjectId is rejected with 400', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  const fakeUserId = new mongoose.Types.ObjectId();
  const token = jwt.sign({ id: fakeUserId.toString() }, process.env.JWT_SECRET, { expiresIn: '15m' });

  const Admin = mongoose.model('Admin');
  const AdminPassword = mongoose.model('AdminPassword');

  const origAdminFindOne = Admin.findOne;
  const origPasswordFindOne = AdminPassword.findOne;

  Admin.findOne = () => ({
    _id: fakeUserId,
    enabled: true,
    role: 'admin',
  });

  AdminPassword.findOne = () => ({
    user: fakeUserId,
    loggedSessions: [token],
  });

  try {
    const res = await fetch(`http://127.0.0.1:${port}/download/invoice/invoice-invalid_not_an_id.pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.message, 'Invalid document ID parameter.');
  } finally {
    Admin.findOne = origAdminFindOne;
    AdminPassword.findOne = origPasswordFindOne;
    server.close();
  }
});

test('Authenticated /download with valid parameters reaches controller (returns 404 for nonexistent record)', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  const fakeUserId = new mongoose.Types.ObjectId();
  const token = jwt.sign({ id: fakeUserId.toString() }, process.env.JWT_SECRET, { expiresIn: '15m' });

  const Admin = mongoose.model('Admin');
  const AdminPassword = mongoose.model('AdminPassword');
  const Invoice = mongoose.model('Invoice');

  const origAdminFindOne = Admin.findOne;
  const origPasswordFindOne = AdminPassword.findOne;
  const origInvoiceFindOne = Invoice.findOne;

  Admin.findOne = () => ({
    _id: fakeUserId,
    enabled: true,
    role: 'admin',
  });

  AdminPassword.findOne = () => ({
    user: fakeUserId,
    loggedSessions: [token],
  });

  // Return null to simulate document not found
  Invoice.findOne = () => ({
    exec: async () => null,
  });

  try {
    const res = await fetch(`http://127.0.0.1:${port}/download/invoice/invoice-507f1f77bcf86cd799439011.pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.message, 'Document not found');
  } finally {
    Admin.findOne = origAdminFindOne;
    AdminPassword.findOne = origPasswordFindOne;
    Invoice.findOne = origInvoiceFindOne;
    server.close();
  }
});
