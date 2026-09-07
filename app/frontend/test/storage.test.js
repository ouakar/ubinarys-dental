import test from 'node:test';
import assert from 'node:assert';

test('corrupted JSON validation function returns false without throwing', () => {
  const isJsonString = (str) => {
    if (typeof str !== 'string') return false;
    try {
      const obj = JSON.parse(str);
      return typeof obj === 'object' && obj !== null;
    } catch (e) {
      return false;
    }
  };

  assert.strictEqual(isJsonString('{"valid": true}'), true);
  assert.strictEqual(isJsonString('corrupted_json_string'), false);
  assert.strictEqual(isJsonString(null), false);
  assert.strictEqual(isJsonString(undefined), false);
  assert.strictEqual(isJsonString('12345'), false);
});
