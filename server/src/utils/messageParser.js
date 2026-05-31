const logger = require('./logger');

/**
 * Parse incoming WhatsApp webhook payload from Meta Cloud API.
 *
 * The payload structure is deeply nested:
 *   body.entry[0].changes[0].value.messages[0]
 *   body.entry[0].changes[0].value.contacts[0]
 *
 * @param {Object} body - The request body from Meta's webhook POST
 * @returns {Object|null} Parsed message data, or null if not a valid message
 */
function parseWebhookPayload(body) {
  try {
    // Only process WhatsApp Business Account events
    if (body.object !== 'whatsapp_business_account') {
      return null;
    }

    const entry = body.entry?.[0];
    if (!entry) return null;

    const changes = entry.changes?.[0];
    if (!changes) return null;

    const value = changes.value;
    if (!value) return null;

    // Check if this contains messages (not just status updates)
    const messages = value.messages;
    if (!messages || messages.length === 0) {
      return null;
    }

    const message = messages[0];
    const contacts = value.contacts;
    const contact = contacts?.[0];

    // Extract sender info
    const senderPhone = message.from;
    const senderName = contact?.profile?.name || 'Unknown';

    // Extract message ID and timestamp
    const messageId = message.id;
    const timestamp = message.timestamp
      ? new Date(parseInt(message.timestamp) * 1000)
      : new Date();

    // Determine message type and extract content
    let messageType = 'unknown';
    let messageBody = '';

    switch (message.type) {
      case 'text':
        messageType = 'text';
        messageBody = message.text?.body || '';
        break;

      case 'interactive':
        messageType = 'interactive';
        // Handle button replies
        if (message.interactive?.type === 'button_reply') {
          messageBody = message.interactive.button_reply.title || '';
        }
        // Handle list replies
        else if (message.interactive?.type === 'list_reply') {
          messageBody = message.interactive.list_reply.title || '';
        }
        break;

      case 'image':
        messageType = 'image';
        messageBody = message.image?.caption || '';
        break;

      case 'document':
        messageType = 'document';
        messageBody = message.document?.caption || '';
        break;

      case 'audio':
        messageType = 'audio';
        break;

      case 'video':
        messageType = 'video';
        messageBody = message.video?.caption || '';
        break;

      case 'sticker':
        messageType = 'sticker';
        break;

      case 'location':
        messageType = 'location';
        if (message.location) {
          messageBody = `Location: ${message.location.latitude}, ${message.location.longitude}`;
        }
        break;

      default:
        messageType = 'unknown';
        break;
    }

    return {
      senderPhone,
      senderName,
      messageType,
      messageBody,
      messageId,
      timestamp,
    };
  } catch (error) {
    logger.error('Error parsing webhook payload', { error: error.message });
    return null;
  }
}

module.exports = { parseWebhookPayload };
