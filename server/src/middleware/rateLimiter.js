const logger = require('../utils/logger');

/**
 * Simple in-memory rate limiter middleware.
 * No external dependency needed — uses a Map with sliding window cleanup.
 *
 * @param {object} options
 * @param {number} options.windowMs   — Time window in milliseconds (default: 60000)
 * @param {number} options.max        — Max requests per window per IP (default: 100)
 * @param {string} options.label      — Label for logging (default: 'rate-limit')
 */
function rateLimiter({ windowMs = 60000, max = 100, label = 'rate-limit' } = {}) {
  /** @type {Map<string, { count: number, resetAt: number }>} */
  const clients = new Map();

  // Cleanup expired entries every 2 windows
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of clients) {
      if (now > data.resetAt) {
        clients.delete(ip);
      }
    }
  }, windowMs * 2);

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    let client = clients.get(ip);

    if (!client || now > client.resetAt) {
      client = { count: 0, resetAt: now + windowMs };
      clients.set(ip, client);
    }

    client.count++;

    // Set rate limit headers
    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(Math.max(0, max - client.count)));
    res.set('X-RateLimit-Reset', String(Math.ceil(client.resetAt / 1000)));

    if (client.count > max) {
      logger.warn(`⚠️ Rate limit exceeded [${label}]`, { ip, count: client.count });
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
      });
    }

    next();
  };
}

module.exports = { rateLimiter };
