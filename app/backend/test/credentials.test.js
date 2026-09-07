require('module-alias/register');
const test = require('node:test');
const assert = require('node:assert');

const { validatePassword, validateEmail } = require('../src/setup/setup');

test('validateEmail rejects empty and invalid formats', () => {
  assert.strictEqual(validateEmail(''), false);
  assert.strictEqual(validateEmail(null), false);
  assert.strictEqual(validateEmail(undefined), false);
  assert.strictEqual(validateEmail('not-an-email'), false);
  assert.strictEqual(validateEmail('admin@'), false);
  assert.strictEqual(validateEmail('admin@demo'), false);
  assert.strictEqual(validateEmail('admin@demo.com'), true);
  assert.strictEqual(validateEmail('doctor.smith@clinic.ma'), true);
});

test('validatePassword rejects passwords under 12 characters', () => {
  assert.strictEqual(validatePassword('Short1!Aa'), false);
  assert.strictEqual(validatePassword('admin123'), false);
  assert.strictEqual(validatePassword(''), false);
  assert.strictEqual(validatePassword(null), false);
});

test('validatePassword rejects passwords missing character categories', () => {
  // Missing uppercase
  assert.strictEqual(validatePassword('alllowercase123!@#'), false);
  // Missing lowercase
  assert.strictEqual(validatePassword('ALLUPPERCASE123!@#'), false);
  // Missing numbers
  assert.strictEqual(validatePassword('NoNumbersHere!@#Abc'), false);
  // Missing special characters
  assert.strictEqual(validatePassword('NoSpecialChar123Abc'), false);
});

test('validatePassword accepts strong 12+ character complex passwords', () => {
  assert.strictEqual(validatePassword('Admin@2026Secure!'), true);
  assert.strictEqual(validatePassword('Very$tr0ngP@ssw0rd!'), true);
});
