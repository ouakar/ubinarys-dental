import test from 'node:test';
import assert from 'node:assert';

test('URL normalization handles trailing slashes without duplication', () => {
  const ensureTrailingSlash = (url) => {
    if (!url) return '/';
    return url.endsWith('/') ? url : `${url}/`;
  };

  assert.strictEqual(ensureTrailingSlash('http://192.168.1.50:8888/'), 'http://192.168.1.50:8888/');
  assert.strictEqual(ensureTrailingSlash('http://192.168.1.50:8888'), 'http://192.168.1.50:8888/');
  assert.strictEqual(ensureTrailingSlash(''), '/');
});
