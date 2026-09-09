const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TRACKED_KEYS_FOR_DUPLICATES = [
  'DATABASE',
  'JWT_SECRET',
  'NODE_ENV',
  'PORT',
  'FRONTEND_URL',
  'ALLOWED_ORIGINS',
  'PUBLIC_SERVER_FILE',
  'ENABLE_DEFAULT_ADMIN',
  'INITIAL_ADMIN_EMAIL',
  'INITIAL_ADMIN_PASSWORD',
  'INITIAL_ADMIN_NAME',
  'INITIAL_ADMIN_SURNAME',
];

const PLACEHOLDER_SECRET_PATTERNS = [
  /^CHANGE_ME/i,
  /^your-strong-random/i,
  /^your_jwt_secret/i,
  /^secret$/i,
  /^test_secret_32_characters_long_minimum!$/i,
];

function isPlaceholderSecret(secret) {
  if (!secret) return true;
  return PLACEHOLDER_SECRET_PATTERNS.some((p) => p.test(secret.trim()));
}

function parseEnvContent(content) {
  const lines = content.split(/\r?\n/);
  const keyOccurrences = {};
  const parsed = {};
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNum = i + 1;

    // Check for invalid control characters (excluding newline)
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(rawLine)) {
      errors.push(`Line ${lineNum}: Contains invalid invisible control characters.`);
      continue;
    }

    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIdx = rawLine.indexOf('=');
    if (eqIdx === -1) {
      errors.push(`Line ${lineNum}: Malformed line (missing '=' delimiter).`);
      continue;
    }

    const key = rawLine.substring(0, eqIdx).trim();
    let val = rawLine.substring(eqIdx + 1).trim();

    if (!key || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      errors.push(`Line ${lineNum}: Invalid variable identifier "${key}".`);
      continue;
    }

    // Quote validation
    if ((val.startsWith('"') && !val.endsWith('"')) || (val.startsWith("'") && !val.endsWith("'"))) {
      errors.push(`Line ${lineNum}: Unmatched quotation mark for variable ${key}.`);
      continue;
    }
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      if (val.length < 2) {
        errors.push(`Line ${lineNum}: Malformed quoted string for variable ${key}.`);
        continue;
      }
      val = val.substring(1, val.length - 1);
    }

    if (!keyOccurrences[key]) {
      keyOccurrences[key] = [];
    }
    keyOccurrences[key].push(lineNum);
    parsed[key] = val;
  }

  // Duplicate detection
  const duplicates = [];
  for (const key of TRACKED_KEYS_FOR_DUPLICATES) {
    if (keyOccurrences[key] && keyOccurrences[key].length > 1) {
      duplicates.push({ key, lines: keyOccurrences[key] });
    }
  }

  return { parsed, duplicates, errors, keyOccurrences };
}

function validateEnvFile(envFilePath, options = {}) {
  if (!fs.existsSync(envFilePath)) {
    return { valid: false, errors: [`File does not exist: ${envFilePath}`] };
  }

  const content = fs.readFileSync(envFilePath, 'utf8');
  const { parsed, duplicates, errors } = parseEnvContent(content);

  // If duplicates exist, create a timestamped backup and report
  if (duplicates.length > 0) {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const backupPath = `${envFilePath}.backup.${timestamp}`;
    try {
      fs.copyFileSync(envFilePath, backupPath);
      console.log(`ℹ️  Created timestamped backup: ${path.basename(backupPath)}`);
    } catch (e) {
      console.warn(`⚠️  Failed to create backup: ${e.message}`);
    }

    const dupDetails = duplicates
      .map((d) => `  - Variable "${d.key}" defined multiple times on lines: ${d.lines.join(', ')}`)
      .join('\n');
    errors.push(`Duplicate environment variable definitions detected:\n${dupDetails}`);
  }

  // Validate JWT_SECRET
  if (parsed.JWT_SECRET !== undefined) {
    if (isPlaceholderSecret(parsed.JWT_SECRET)) {
      errors.push('Variable "JWT_SECRET" is using an insecure placeholder value.');
    } else if (parsed.JWT_SECRET.length < 32) {
      errors.push(`Variable "JWT_SECRET" must be at least 32 characters long (found ${parsed.JWT_SECRET.length} chars).`);
    }
  }

  // Validate PORT
  if (parsed.PORT !== undefined) {
    const portNum = Number(parsed.PORT);
    if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
      errors.push(`Variable "PORT" must be a valid integer between 1 and 65535.`);
    }
  }

  // Validate DATABASE URI without exposing credentials
  if (parsed.DATABASE !== undefined) {
    if (!/^(mongodb|mongodb\+srv):\/\//.test(parsed.DATABASE)) {
      errors.push('Variable "DATABASE" must be a valid MongoDB URI starting with mongodb:// or mongodb+srv://');
    }
  }

  // Enforce mode 600 permissions
  try {
    fs.chmodSync(envFilePath, 0o600);
  } catch (e) {
    // Non-fatal on filesystems that do not support POSIX chmod
  }

  return {
    valid: errors.length === 0,
    errors,
    duplicates,
    parsed,
  };
}

function generateRandomSecret(envFilePath) {
  if (!fs.existsSync(envFilePath)) {
    throw new Error(`File not found: ${envFilePath}`);
  }
  const content = fs.readFileSync(envFilePath, 'utf8');
  const newSecret = crypto.randomBytes(32).toString('hex');

  let updatedContent;
  if (/^JWT_SECRET=.*/m.test(content)) {
    updatedContent = content.replace(/^JWT_SECRET=.*/m, `JWT_SECRET="${newSecret}"`);
  } else {
    updatedContent = content + `\nJWT_SECRET="${newSecret}"\n`;
  }

  fs.writeFileSync(envFilePath, updatedContent, { mode: 0o600 });
  return true;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const targetFile = args[0] || 'app/backend/.env';

  if (args.includes('--generate-secret')) {
    try {
      generateRandomSecret(targetFile);
      console.log(`✅ Secure random JWT secret generated in ${targetFile}.`);
      process.exit(0);
    } catch (e) {
      console.error(`❌ Failed to generate secret: ${e.message}`);
      process.exit(1);
    }
  }

  const result = validateEnvFile(targetFile);
  if (!result.valid) {
    console.error(`❌ Environment file validation failed for ${targetFile}:`);
    for (const err of result.errors) {
      console.error(`   ${err}`);
    }
    process.exit(1);
  }

  console.log(`✔ Environment file ${targetFile} is valid and secured (mode 600).`);
  process.exit(0);
}

module.exports = {
  validateEnvFile,
  parseEnvContent,
  generateRandomSecret,
  isPlaceholderSecret,
  TRACKED_KEYS_FOR_DUPLICATES,
};
