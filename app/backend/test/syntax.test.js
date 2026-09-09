const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const { globSync } = require('glob');
const path = require('path');

test('Every backend JavaScript file compiles with zero syntax errors (node --check)', () => {
  const backendSrc = path.resolve(__dirname, '../src');
  const files = globSync('**/*.js', { cwd: backendSrc, absolute: true });

  assert.ok(files.length > 50, 'Must find backend source files');

  for (const file of files) {
    const result = spawnSync('node', ['--check', file]);
    assert.strictEqual(
      result.status,
      0,
      `Syntax error found in file ${path.relative(backendSrc, file)}:\n${result.stderr.toString()}`
    );
  }
});
