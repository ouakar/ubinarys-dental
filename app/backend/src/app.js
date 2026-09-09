const express = require('express');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const path = require('path');
const { globSync } = require('glob');

// Register Mongoose models
const modelsFiles = globSync('./src/models/**/*.js');
for (const filePath of modelsFiles) {
  require(path.resolve(filePath));
}

const coreAuthRouter = require('./routes/coreRoutes/coreAuth');
const coreApiRouter = require('./routes/coreRoutes/coreApi');
const coreDownloadRouter = require('./routes/coreRoutes/coreDownloadRouter');
const corePublicRouter = require('./routes/coreRoutes/corePublicRouter');
const adminAuth = require('./controllers/coreControllers/adminAuth');

const errorHandlers = require('./handlers/errorHandlers');
const erpApiRouter = require('./routes/appRoutes/appApi');

const app = express();

// Parse and validate CORS allowed origins
const parseOrigins = () => {
  const origins = [];

  if (process.env.NODE_ENV !== 'production') {
    origins.push(
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    );
  }

  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL.trim());
  }

  if (process.env.ALLOWED_ORIGINS) {
    const split = process.env.ALLOWED_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    origins.push(...split);
  }

  const validOrigins = [];
  for (const origin of origins) {
    if (!origin) continue;
    try {
      const url = new URL(origin);
      validOrigins.push(url.origin);
    } catch (e) {
      console.error(`Fatal Error: Invalid origin in CORS configuration: "${origin}"`);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Invalid CORS origin: "${origin}"`);
      }
    }
  }

  return Array.from(new Set(validOrigins));
};

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = parseOrigins();
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Safe in-place NoSQL Mongo sanitization
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

// Health Check Endpoints (Unauthenticated)
app.get('/health/live', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    service: 'ubinarys-backend',
  });
});

app.get('/health/ready', (req, res) => {
  const isReady = mongoose.connection.readyState === 1;
  if (isReady) {
    return res.status(200).json({
      status: 'ready',
      service: 'ubinarys-backend',
    });
  }
  return res.status(503).json({
    status: 'unavailable',
    service: 'ubinarys-backend',
  });
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);
app.use(compression());

// API Routes
app.use('/api', coreAuthRouter);
app.use('/api', adminAuth.isValidAuthToken, coreApiRouter);
app.use('/api', adminAuth.isValidAuthToken, erpApiRouter);
app.use('/download', adminAuth.isValidAuthToken, coreDownloadRouter);
app.use('/api/download', adminAuth.isValidAuthToken, coreDownloadRouter);
app.use('/public', corePublicRouter);

// 404 Handler
app.use(errorHandlers.notFound);

// Error Handlers
if (process.env.NODE_ENV === 'development') {
  app.use(errorHandlers.developmentErrors);
} else {
  app.use(errorHandlers.productionErrors);
}

module.exports = app;
