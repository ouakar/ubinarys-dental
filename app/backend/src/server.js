require('module-alias/register');
const path = require('path');
const dotenv = require('dotenv');

// 1. Load dotenv before reading any environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

// 2. Validate Node.js runtime version (Node 24 LTS required)
const major = Number.parseInt(process.versions.node.split('.')[0], 10);
if (!Number.isInteger(major) || major < 24 || major >= 25) {
  console.error(
    `Unsupported Node.js version ${process.version}. ` +
      'Ubinarys Dental requires Node.js 24 LTS.'
  );
  process.exit(1);
}

// 3. Validate required environment variables
const missingVars = [];
if (!process.env.DATABASE) missingVars.push('DATABASE');
if (!process.env.JWT_SECRET) missingVars.push('JWT_SECRET');

if (missingVars.length > 0) {
  console.error(
    `Fatal Error: Missing required environment variable(s): ${missingVars.join(', ')}`
  );
  process.exit(1);
}

if (process.env.PORT && (Number.isNaN(Number(process.env.PORT)) || Number(process.env.PORT) <= 0)) {
  console.error(`Fatal Error: Invalid PORT environment variable: "${process.env.PORT}"`);
  process.exit(1);
}

const mongoose = require('mongoose');
const { globSync } = require('glob');

// Load Mongoose models
const modelsFiles = globSync('./src/models/**/*.js');
for (const filePath of modelsFiles) {
  require(path.resolve(filePath));
}

// 4. Configure Mongoose event handlers without leaking credentials
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully.');
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB connection disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB connection reconnected.');
});

mongoose.connection.on('error', (error) => {
  console.error(`🚫 MongoDB Connection Error: ${error.message}`);
});

let server;

async function startServer() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Database connection established.');

    const app = require('./app');
    const port = process.env.PORT || 8888;
    app.set('port', port);

    server = app.listen(port, '0.0.0.0', () => {
      console.log(`Express running → On PORT : ${server.address().port}`);
    });
  } catch (error) {
    console.error(`❌ Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
}

// Graceful shutdown helper
let isShuttingDown = false;

async function shutdown(signal, exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}. Initiating graceful shutdown...`);

  // Force exit safety timeout (10s)
  const forceExitTimeout = setTimeout(() => {
    console.error('Shutdown timed out after 10s. Forcing exit.');
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  if (server) {
    console.log('Closing HTTP server...');
    await new Promise((resolve) => server.close(resolve));
    console.log('HTTP server closed.');
  }

  if (mongoose.connection.readyState !== 0) {
    console.log('Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }

  process.exit(exitCode);
}

// Signals for graceful shutdown
process.on('SIGTERM', () => shutdown('SIGTERM', 0));
process.on('SIGINT', () => shutdown('SIGINT', 0));

// Process-level unhandled errors
process.on('uncaughtException', async (error) => {
  console.error(`💥 Uncaught Exception: ${error.message}\n${error.stack}`);
  await shutdown('uncaughtException', 1);
});

process.on('unhandledRejection', async (reason) => {
  const message = reason instanceof Error ? `${reason.message}\n${reason.stack}` : String(reason);
  console.error(`💥 Unhandled Rejection: ${message}`);
  await shutdown('unhandledRejection', 1);
});

startServer();
