const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config/env');
const logger = require('./utils/logger');
const { rateLimiter } = require('./middleware/rateLimiter');
const webhookRoutes = require('./routes/webhook.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// ---------------------
// CORS — allow dashboard origin
// ---------------------
const allowedOrigins = [
  'http://localhost:5173', // local Vite dev server
];

if (process.env.DASHBOARD_URL) {
  allowedOrigins.push(process.env.DASHBOARD_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile apps, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  })
);

// ---------------------
// Body parser — capture raw body for webhook signature verification
// ---------------------
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// ---------------------
// Rate Limiting
// ---------------------
const adminLimiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 100,
  label: 'admin-api',
});

// ---------------------
// Routes
// ---------------------

// Health check (no rate limit)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: Math.floor(process.uptime()) });
});

// Privacy Policy (required for Meta app publishing)
app.get('/privacy', (_req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Privacy Policy - Varni Packaging</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#333;line-height:1.6}h1{color:#1a1a2e}</style></head>
<body><h1>Privacy Policy — Varni Packaging WhatsApp Chatbot</h1>
<p><strong>Last updated:</strong> May 2026</p>
<h2>Information We Collect</h2><p>When you interact with our WhatsApp chatbot, we collect your WhatsApp phone number, profile name, and message content to provide product information and customer support.</p>
<h2>How We Use Your Information</h2><p>We use your information solely to respond to your product inquiries, provide pricing information, and connect you with our team when needed.</p>
<h2>Data Storage</h2><p>Conversation data is stored securely in our database and is used only for providing customer service.</p>
<h2>Third-Party Services</h2><p>We use Meta's WhatsApp Cloud API for messaging and OpenAI for generating responses. These services process your messages according to their respective privacy policies.</p>
<h2>Contact</h2><p>For privacy concerns, contact Varni Packaging at varnipackaging1@gmail.com.</p></body></html>`);
});

// Webhook routes (signature + rate limit applied inside the router for POST only)
app.use('/webhook', webhookRoutes);

// Admin dashboard API (rate limited)
app.use('/api/admin', adminLimiter, adminRoutes);

// ---------------------
// Global Error Handler
// ---------------------
app.use((err, _req, res, _next) => {
  logger.error('❌ Unhandled error', {
    error: err.message,
    stack: err.stack,
  });

  res.status(err.status || 500).json({
    error: config.isProd ? 'Internal server error' : err.message,
  });
});

// ---------------------
// Process-Level Error Handlers
// ---------------------
process.on('unhandledRejection', (reason) => {
  logger.error('❌ Unhandled Promise Rejection', {
    error: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('💀 Uncaught Exception — shutting down', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// ---------------------
// MongoDB Connection
// ---------------------
mongoose
  .connect(config.mongodbUri)
  .then(() => {
    logger.info('✅ Connected to MongoDB');
  })
  .catch((err) => {
    logger.error('❌ MongoDB connection error:', { error: err.message });
    process.exit(1);
  });

// ---------------------
// Start Server
// ---------------------
const server = app.listen(config.port, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${config.port}`);
  logger.info(`📡 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 Webhook URL: http://localhost:${config.port}/webhook`);
  logger.info(`❤️  Health check: http://localhost:${config.port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received — shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      process.exit(0);
    });
  });
});
