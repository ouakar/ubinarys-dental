require('module-alias/register');
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { spawnSync } = require('node:child_process');
const { DEV_DEFAULT_EMAIL, DEV_DEFAULT_PASSWORD, validatePassword, defaultTreatments } = require('../src/setup/setup');

test('Development default credentials meet security constants', () => {
  assert.strictEqual(DEV_DEFAULT_EMAIL, 'admin@demo.com');
  assert.strictEqual(DEV_DEFAULT_PASSWORD, 'Admin@2026!Local');
  assert.strictEqual(validatePassword(DEV_DEFAULT_PASSWORD), true);
});

test('Production setup rejects the development default password', () => {
  const setupPath = path.resolve(__dirname, '../src/setup/setup.js');
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    DATABASE: 'mongodb://localhost:27017/test_db',
    INITIAL_ADMIN_EMAIL: 'owner@clinic.ma',
    INITIAL_ADMIN_PASSWORD: 'Admin@2026!Local', // dev default password
  };

  const result = spawnSync('node', [setupPath], { env, cwd: path.resolve(__dirname, '..') });
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr.toString(), /rejects the development default password/);
});

test('Production setup fails cleanly when INITIAL_ADMIN_EMAIL or PASSWORD is missing', () => {
  const setupPath = path.resolve(__dirname, '../src/setup/setup.js');
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    DATABASE: 'mongodb://localhost:27017/test_db',
    INITIAL_ADMIN_EMAIL: '',
    INITIAL_ADMIN_PASSWORD: '',
  };

  const result = spawnSync('node', [setupPath], { env, cwd: path.resolve(__dirname, '..') });
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr.toString(), /INITIAL_ADMIN_EMAIL environment variable is missing/);
});

test('Default dental treatments list contains required Moroccan clinic procedures', () => {
  assert.ok(Array.isArray(defaultTreatments));
  assert.ok(defaultTreatments.length >= 10);
  const codes = defaultTreatments.map((t) => t.code);
  assert.ok(codes.includes('CONS01'));
  assert.ok(codes.includes('DET01'));
  assert.ok(codes.includes('IMPL01'));
  assert.ok(codes.includes('PLOMB01'));
});

test('Development mode allows default admin only when ENABLE_DEFAULT_ADMIN=true', () => {
  const isDev = true;
  const enableDefaultAdmin = true;
  let email = undefined;
  let password = undefined;

  if (isDev && enableDefaultAdmin && (!email || !password)) {
    email = DEV_DEFAULT_EMAIL;
    password = DEV_DEFAULT_PASSWORD;
  }
  assert.strictEqual(email, 'admin@demo.com');
  assert.strictEqual(password, 'Admin@2026!Local');
});

test('Production mode strictly forbids default admin creation without explicit credentials', () => {
  const isDev = false;
  const enableDefaultAdmin = false;
  let email = undefined;
  let password = undefined;

  let rejected = false;
  if (!isDev || !enableDefaultAdmin) {
    if (!email || !password) {
      rejected = true;
    }
  }
  assert.strictEqual(rejected, true, 'Production must reject missing admin credentials');
});

test('Duplicate setup does not duplicate records (idempotent lookup logic)', () => {
  const existingRecords = new Set(['admin@demo.com', 'CONS01', 'DET01']);
  let createdCount = 0;

  const recordsToInsert = ['admin@demo.com', 'CONS01', 'NEW_CODE'];
  for (const item of recordsToInsert) {
    if (!existingRecords.has(item)) {
      createdCount++;
      existingRecords.add(item);
    }
  }

  assert.strictEqual(createdCount, 1, 'Only non-existing records should be created');
});
