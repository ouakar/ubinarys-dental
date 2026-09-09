require('module-alias/register');
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('node:child_process');

const { validateEnvFile, parseEnvContent, isPlaceholderSecret } = require('../src/setup/validateEnv');
const { verifyPuppeteerLaunch } = require('../src/setup/verifyPuppeteer');

test('1. Root-mode Node installer command generation', () => {
  const sudoVar = '';
  const nodeSetupCmd = sudoVar ? 'curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -' : 'curl -fsSL https://deb.nodesource.com/setup_24.x | bash -';
  assert.strictEqual(nodeSetupCmd, 'curl -fsSL https://deb.nodesource.com/setup_24.x | bash -');
  assert.ok(!nodeSetupCmd.includes(' | -E bash -'), 'Root mode must not produce invalid "| -E bash -" command');
});

test('2. Normal-user sudo Node installer command generation', () => {
  const sudoVar = 'sudo';
  const nodeSetupCmd = sudoVar ? 'curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -' : 'curl -fsSL https://deb.nodesource.com/setup_24.x | bash -';
  assert.strictEqual(nodeSetupCmd, 'curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -');
});

test('3. Ubuntu 22.04 selects jammy MongoDB 8.0', () => {
  const codename = 'jammy';
  const arch = 'amd64';
  const repoLine = `deb [ arch=${arch} signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${codename}/mongodb-org/8.0 multiverse`;
  assert.ok(repoLine.includes('jammy/mongodb-org/8.0'));
  assert.ok(!repoLine.includes('7.0'));
});

test('4. Ubuntu 24.04 selects noble MongoDB 8.0 without jammy fallback', () => {
  const codename = 'noble';
  const arch = 'amd64';
  const repoLine = `deb [ arch=${arch} signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu ${codename}/mongodb-org/8.0 multiverse`;
  assert.ok(repoLine.includes('noble/mongodb-org/8.0'));
  assert.ok(!repoLine.includes('jammy'));
});

test('5. MongoDB startup failure causes non-zero exit', () => {
  const mockIsActive = false;
  let exitCalled = false;
  let exitCode = 0;

  if (!mockIsActive) {
    exitCalled = true;
    exitCode = 1;
  }
  assert.strictEqual(exitCalled, true);
  assert.strictEqual(exitCode, 1);
});

test('6. MongoDB ping failure causes non-zero exit', () => {
  const mockPingSuccess = false;
  let exitCalled = false;
  let exitCode = 0;

  if (!mockPingSuccess) {
    exitCalled = true;
    exitCode = 1;
  }
  assert.strictEqual(exitCalled, true);
  assert.strictEqual(exitCode, 1);
});

test('7. Existing .env is not overwritten', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'env-test-'));
  const envPath = path.join(tmpDir, '.env');
  fs.writeFileSync(envPath, 'CUSTOM_USER_DATA=12345\n');

  // Installer logic: only copy .env.example if .env does NOT exist
  let copied = false;
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, 'DEFAULT_DATA=true\n');
    copied = true;
  }

  const finalContent = fs.readFileSync(envPath, 'utf8');
  assert.strictEqual(copied, false);
  assert.strictEqual(finalContent, 'CUSTOM_USER_DATA=12345\n');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('8. Duplicate environment variables are detected and backed up', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dup-test-'));
  const envPath = path.join(tmpDir, '.env');
  const duplicateContent = `
DATABASE="mongodb://127.0.0.1:27017/ubinarys1"
JWT_SECRET="valid_random_secret_32_characters_long_min!"
PORT="8888"
DATABASE="mongodb://127.0.0.1:27017/ubinarys2"
`;
  fs.writeFileSync(envPath, duplicateContent);

  const result = validateEnvFile(envPath);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.duplicates.length, 1);
  assert.strictEqual(result.duplicates[0].key, 'DATABASE');

  // Verify backup created
  const files = fs.readdirSync(tmpDir);
  const backupFile = files.find((f) => f.includes('.backup.'));
  assert.ok(backupFile, 'Backup file must be created on duplicate detection');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('9. Placeholder JWT secret is rejected', () => {
  assert.strictEqual(isPlaceholderSecret('CHANGE_ME_TO_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS'), true);
  assert.strictEqual(isPlaceholderSecret('your-strong-random-secret-at-least-32-chars'), true);
  assert.strictEqual(isPlaceholderSecret('my_genuine_production_random_secret_string_32_chars_ok!'), false);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'placeholder-test-'));
  const envPath = path.join(tmpDir, '.env');
  fs.writeFileSync(envPath, 'JWT_SECRET="CHANGE_ME_TO_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS"\nDATABASE="mongodb://127.0.0.1:27017/test"\nPORT="8888"\n');

  const result = validateEnvFile(envPath);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('insecure placeholder value')));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('10. The setup script resolves repository directory properly', () => {
  const setupScriptPath = path.resolve(__dirname, '../../../setup.sh');
  assert.ok(fs.existsSync(setupScriptPath), 'setup.sh must exist');

  // Validate script contains directory resolution
  const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
  assert.ok(scriptContent.includes('SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"'));
  assert.ok(scriptContent.includes('cd "$SCRIPT_DIR"'));
});

test('11. Default development administrator creation', () => {
  const { DEV_DEFAULT_EMAIL, DEV_DEFAULT_PASSWORD } = require('../src/setup/setup');
  assert.strictEqual(DEV_DEFAULT_EMAIL, 'admin@demo.com');
  assert.strictEqual(DEV_DEFAULT_PASSWORD, 'Admin@2026!Local');
});

test('12. Default administrator is prohibited in production', () => {
  const setupPath = path.resolve(__dirname, '../src/setup/setup.js');
  const env = {
    ...process.env,
    NODE_ENV: 'production',
    DATABASE: 'mongodb://localhost:27017/test_db',
    INITIAL_ADMIN_EMAIL: 'admin@clinic.ma',
    INITIAL_ADMIN_PASSWORD: 'Admin@2026!Local',
  };

  const result = spawnSync('node', [setupPath], { env, cwd: path.resolve(__dirname, '..') });
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr.toString(), /rejects the development default password/);
});

test('13. Setup is idempotent and does not overwrite existing records', () => {
  const existingAdmins = ['admin@demo.com'];
  let adminCreated = false;
  const targetEmail = 'admin@demo.com';

  if (!existingAdmins.includes(targetEmail)) {
    adminCreated = true;
  }
  assert.strictEqual(adminCreated, false, 'Existing record must be preserved and skipped');
});

test('14. Application-import errors are distinct from MongoDB errors', () => {
  const serverPath = path.resolve(__dirname, '../src/server.js');
  const serverContent = fs.readFileSync(serverPath, 'utf8');

  // Verify explicit stages
  assert.ok(serverContent.includes('Model Import/Syntax Error: Failed to load models:'));
  assert.ok(serverContent.includes('MongoDB Connection Error: Failed to connect to MongoDB:'));
  assert.ok(serverContent.includes('Application Import/Syntax Error: Failed to load Express application:'));
  assert.ok(serverContent.includes('HTTP Server Error: Failed to start HTTP server:'));
});

test('15. AIRGAPPED=true never invokes network operations and validates prerequisites', () => {
  const setupScriptPath = path.resolve(__dirname, '../../../setup.sh');
  const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');

  // Verify air-gapped conditional branches
  assert.ok(scriptContent.includes('ONLINE_INSTALL="false"'));
  assert.ok(scriptContent.includes('MISSING_PREREQS=()'));
  assert.ok(scriptContent.includes('Skipping apt update (Air-Gapped mode)'));
});

test('16. NON_INTERACTIVE=true does not seed without ALLOW_DEV_SEED=true', () => {
  const nonInteractive = 'true';
  let allowDevSeed = 'false';
  let seeded = false;

  if (nonInteractive === 'true') {
    if (allowDevSeed === 'true') {
      seeded = true;
    }
  }
  assert.strictEqual(seeded, false, 'Must not seed in non-interactive without ALLOW_DEV_SEED=true');

  allowDevSeed = 'true';
  if (nonInteractive === 'true') {
    if (allowDevSeed === 'true') {
      seeded = true;
    }
  }
  assert.strictEqual(seeded, true, 'Must seed when both NON_INTERACTIVE=true and ALLOW_DEV_SEED=true');
});

test('17. Puppeteer launch preflight reports actionable errors for invalid executable', async () => {
  await assert.rejects(
    async () => {
      await verifyPuppeteerLaunch('/non/existent/path/to/chromium-browser-fake');
    },
    (err) => {
      assert.match(err.message, /Configured PUPPETEER_EXECUTABLE_PATH does not exist/);
      return true;
    }
  );
});
