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
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Privacy Policy - Ontara Connect</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:800px;margin:40px auto;padding:20px;color:#2d2d2d;line-height:1.8;background:#fafafa}
  h1{color:#111;border-bottom:2px solid #111;padding-bottom:10px}
  h2{color:#333;margin-top:30px}
  p,li{color:#444}
  ul{padding-left:20px}
  .updated{color:#666;font-size:0.9em}
  a{color:#0066cc}
</style></head>
<body>
<h1>Privacy Policy — Ontara Connect</h1>
<p class="updated"><strong>Last updated:</strong> June 2026</p>
<p>Ontara Connect ("we", "our", "us") is a business messaging platform operated by Ontara AI. This Privacy Policy explains how we collect, use, store, and protect information when businesses and their customers interact through our WhatsApp-based messaging services.</p>

<h2>1. Information We Collect</h2>
<p>We collect the following types of information:</p>
<ul>
<li><strong>Business Account Information:</strong> When a business signs up via our platform, we collect their WhatsApp Business Account details, phone number, business name, and authorized representative information through Meta's Embedded Signup flow.</li>
<li><strong>End-User Message Data:</strong> When customers message a business through WhatsApp, we process the sender's phone number, profile name, message content, and timestamps to facilitate automated responses and customer support.</li>
<li><strong>Usage Data:</strong> We collect analytics on message volumes, response times, and platform usage to improve our services.</li>
</ul>

<h2>2. How We Use Your Information</h2>
<ul>
<li>To provide AI-powered automated customer support on behalf of our business clients</li>
<li>To route customer inquiries to the appropriate business representative when escalation is needed</li>
<li>To manage and display conversation history in the business admin dashboard</li>
<li>To improve our platform's response quality and reliability</li>
</ul>

<h2>3. Data Storage and Security</h2>
<p>All data is stored securely in encrypted databases. We implement industry-standard security measures including HTTPS encryption, webhook signature verification, and access controls. Conversation data is retained only as long as necessary to provide our services or as required by law.</p>

<h2>4. Third-Party Services</h2>
<p>Our platform integrates with the following third-party services:</p>
<ul>
<li><strong>Meta WhatsApp Cloud API:</strong> For sending and receiving WhatsApp messages. Subject to <a href="https://www.whatsapp.com/legal/privacy-policy" target="_blank">WhatsApp's Privacy Policy</a>.</li>
<li><strong>OpenAI:</strong> For generating intelligent automated responses. Subject to <a href="https://openai.com/privacy" target="_blank">OpenAI's Privacy Policy</a>.</li>
<li><strong>MongoDB:</strong> For secure data storage.</li>
</ul>

<h2>5. Business Client Responsibilities</h2>
<p>Businesses using Ontara Connect are responsible for informing their own customers about the use of automated messaging services and ensuring compliance with applicable data protection regulations in their jurisdiction.</p>

<h2>6. Your Rights</h2>
<p>You may request access to, correction of, or deletion of your personal data by contacting us. Business clients can manage their data through the Ontara Connect admin dashboard.</p>

<h2>7. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated revision date.</p>

<h2>8. Contact Us</h2>
<p>For privacy concerns or data requests, contact Ontara AI:<br>
Email: <a href="mailto:ontaraai@gmail.com">ontaraai@gmail.com</a></p>
</body></html>`);
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
