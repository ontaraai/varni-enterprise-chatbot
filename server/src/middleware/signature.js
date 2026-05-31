const crypto = require('crypto');
const logger = require('../utils/logger');
const config = require('../config/env');

/**
 * Middleware to verify Meta's webhook signature (x-hub-signature-256).
 *
 * Meta signs every POST request with HMAC-SHA256 using your App Secret.
 * This ensures the request genuinely came from Meta.
 *
 * IMPORTANT: Requires raw body buffer. index.js must use:
 *   express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })
 */
function verifyWebhookSignature(req, res, next) {
  const signature = req.headers['x-hub-signature-256'];

  if (!signature) {
    logger.warn('⚠️ Webhook request missing x-hub-signature-256 header');
    return res.status(401).json({ error: 'Missing signature' });
  }

  if (!req.rawBody) {
    logger.error('❌ Raw body not available — check express.json verify config');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const expectedSignature =
    'sha256=' +
    crypto
      .createHmac('sha256', config.whatsapp.appSecret)
      .update(req.rawBody)
      .digest('hex');

  // Constant-time comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    logger.warn('❌ Webhook signature mismatch — rejecting request');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
}

module.exports = { verifyWebhookSignature };
