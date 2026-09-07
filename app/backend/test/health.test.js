require('module-alias/register');
const test = require('node:test');
const assert = require('node:assert');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_32_characters_long_minimum!';
process.env.DATABASE = 'mongodb://localhost:27017/test_db';

const app = require('../src/app');

test('GET /health/live returns 200 JSON ok', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/health/live`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.service, 'ubinarys-backend');
  } finally {
    server.close();
  }
});

test('GET /health/ready returns 503 when MongoDB is disconnected', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/health/ready`);
    assert.strictEqual(res.status, 503);
    const body = await res.json();
    assert.strictEqual(body.status, 'unavailable');
    assert.strictEqual(body.service, 'ubinarys-backend');
  } finally {
    server.close();
  }
});
