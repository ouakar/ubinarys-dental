require('module-alias/register');
const test = require('node:test');
const assert = require('node:assert');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_32_characters_long_minimum!';
process.env.DATABASE = 'mongodb://localhost:27017/test_db';
process.env.ALLOWED_ORIGINS = 'http://allowed-domain.com';

const app = require('../src/app');

test('CORS accepts allowed origin', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/health/live`, {
      headers: { Origin: 'http://allowed-domain.com' },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('access-control-allow-origin'), 'http://allowed-domain.com');
  } finally {
    server.close();
  }
});
