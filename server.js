import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// ── Structured Cloud Logging ────────────────────────────────────
// Google Cloud Run / Cloud Logging automatically parses structured JSON
// written to stdout. This logger produces Cloud Logging-compatible output
// with severity levels, timestamps, and request metadata.
const cloudLogger = {
  /**
   * Logs a structured JSON entry to stdout for Cloud Logging ingestion.
   *
   * @param {'INFO'|'WARNING'|'ERROR'|'DEBUG'} severity - Cloud Logging severity level.
   * @param {string} message - Human-readable log message.
   * @param {object} [metadata={}] - Additional structured fields for filtering/alerting.
   */
  log(severity, message, metadata = {}) {
    const entry = {
      severity,
      message,
      timestamp: new Date().toISOString(),
      serviceContext: { service: 'crowdsense-ai-new', version: '1.0.0' },
      ...metadata,
    };
    console.log(JSON.stringify(entry));
  },

  info(message, meta)    { this.log('INFO', message, meta); },
  warn(message, meta)    { this.log('WARNING', message, meta); },
  error(message, meta)   { this.log('ERROR', message, meta); },
  debug(message, meta)   { this.log('DEBUG', message, meta); },
};

// Security middleware: Helmet sets various HTTP headers for protection
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://www.gstatic.com",
          "https://www.googletagmanager.com"
        ],

        connectSrc: [
          "'self'",
          "https://firestore.googleapis.com",
          "https://www.googleapis.com",
          "https://firebase.googleapis.com",
          "https://firebaseinstallations.googleapis.com",
          "https://www.google-analytics.com",
          "https://us-central1-aiplatform.googleapis.com"
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],

        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],

        imgSrc: ["'self'", "data:", "https://www.google-analytics.com"],
      },
    },
  })
);

// CORS configuration: Allow requests from your domain(s)
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting: Prevent abuse by limiting requests per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

app.use(limiter);

// ── Request logging middleware (Cloud Run compatible) ──────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    cloudLogger.info(`${req.method} ${req.originalUrl}`, {
      httpRequest: {
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        status: res.statusCode,
        userAgent: req.get('User-Agent') || '',
        latency: `${Date.now() - start}ms`,
        remoteIp: req.ip,
      },
    });
  });
  next();
});

// ── Health check endpoint (required for Cloud Run / GKE) ──────
// Cloud Run uses this to determine if the container is healthy.
// Returns system status and uptime for monitoring dashboards.
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'crowdsense-ai',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    checks: {
      server: 'OK',
      memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
    },
  });
});

// Serve static assets from the dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Specific routes for multi-page support
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'admin.html'));
});

// Fallback for SPA-like behavior: serve index.html for all other routes.
// In Express 5, the wildcard '*' requires a name or specific regex syntax.
app.get('/*path', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    cloudLogger.info(`CrowdSense AI New server started`, {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      googleCloud: {
        projectId: process.env.GOOGLE_CLOUD_PROJECT || 'crowdsense-ai-7d584',
        region: process.env.GOOGLE_CLOUD_REGION || 'us-central1',
      },
    });
    console.log(`Server running on port ${PORT}`);
    console.log(`Access index at http://localhost:${PORT}`);
    console.log(`Access admin at http://localhost:${PORT}/admin`);
    console.log(`Health check at http://localhost:${PORT}/healthz`);
});