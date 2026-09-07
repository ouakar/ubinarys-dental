const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const path = require('path');

test('Missing DATABASE environment variable prevents startup', () => {
  const serverPath = path.resolve(__dirname, '../src/server.js');
  const env = { ...process.env, DATABASE: '', JWT_SECRET: 'some_jwt_secret_value_32_chars!' };

  const result = spawnSync('node', [serverPath], { env, cwd: path.resolve(__dirname, '..') });
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr.toString(), /Missing required environment variable/);
});

test('Missing JWT_SECRET environment variable prevents startup', () => {
  const serverPath = path.resolve(__dirname, '../src/server.js');
  const env = { ...process.env, DATABASE: 'mongodb://localhost:27017/test_db', JWT_SECRET: '' };

  const result = spawnSync('node', [serverPath], { env, cwd: path.resolve(__dirname, '..') });
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr.toString(), /Missing required environment variable/);
});

test('Reset command refuses to run in production', () => {
  const resetPath = path.resolve(__dirname, '../src/setup/reset.js');
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    CONFIRM_DATABASE_RESET: 'YES_DELETE_CONFIGURATION',
    DATABASE: 'mongodb://localhost:27017/test_db',
  };

  const result = spawnSync('node', [resetPath], { env, cwd: path.resolve(__dirname, '..') });
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr.toString(), /disabled in PRODUCTION/);
});
