const logger = require('./logger');

/**
 * In-memory message deduplication with auto-cleanup.
 *
 * Meta may retry webhook deliveries if the response is slow.
 * This prevents processing the same message twice.
 */

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // clean every 60 seconds

/** @type {Map<string, number>} messageId → timestamp */
const processedMessages = new Map();

/**
 * Check if a message was already processed. If not, mark it.
 * @param {string} messageId — WhatsApp message ID (wamid)
 * @returns {boolean} true if duplicate (already processed)
 */
function isDuplicate(messageId) {
  if (!messageId) return false;

  if (processedMessages.has(messageId)) {
    logger.info('🔁 Duplicate message detected, skipping', { messageId });
    return true;
  }

  processedMessages.set(messageId, Date.now());
  return false;
}

/**
 * Remove entries older than TTL to prevent memory growth.
 */
function cleanup() {
  const now = Date.now();
  let cleaned = 0;

  for (const [id, timestamp] of processedMessages) {
    if (now - timestamp > TTL_MS) {
      processedMessages.delete(id);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug(`🧹 Dedup cleanup: removed ${cleaned} expired entries, ${processedMessages.size} remaining`);
  }
}

// Auto-cleanup on interval
setInterval(cleanup, CLEANUP_INTERVAL_MS);

module.exports = { isDuplicate };
