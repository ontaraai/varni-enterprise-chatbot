const axios = require('axios');
const config = require('../config/env');
const logger = require('../utils/logger');

const API_BASE = `https://graph.facebook.com/v22.0/${config.whatsapp.phoneNumberId}/messages`;

const headers = {
  Authorization: `Bearer ${config.whatsapp.token}`,
  'Content-Type': 'application/json',
};

/**
 * Send a text message via WhatsApp Cloud API.
 *
 * @param {string} to - Recipient phone number (with country code, digits only)
 * @param {string} text - Message text
 * @param {string} [replyToMessageId] - Optional message ID to reply to
 * @returns {Object} API response data
 */
async function sendTextMessage(to, text, replyToMessageId = null) {
  try {
    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    };

    if (replyToMessageId) {
      body.context = { message_id: replyToMessageId };
    }

    const response = await axios.post(API_BASE, body, { headers });
    logger.info('📤 Message sent', { to, preview: text.substring(0, 50) });
    return response.data;
  } catch (error) {
    logger.error('❌ Failed to send text message', {
      to,
      error: error.response?.data || error.message,
    });
    throw error;
  }
}

/**
 * Send an interactive button message via WhatsApp Cloud API.
 * Max 3 buttons allowed by Meta.
 *
 * @param {string} to - Recipient phone number
 * @param {string} bodyText - Message body text
 * @param {Array<{id: string, title: string}>} buttons - Button options (max 3)
 * @returns {Object} API response data
 */
async function sendInteractiveButtons(to, bodyText, buttons) {
  try {
    const formattedButtons = buttons.slice(0, 3).map((btn) => ({
      type: 'reply',
      reply: {
        id: btn.id,
        title: btn.title.substring(0, 20), // Meta limits button title to 20 chars
      },
    }));

    const body = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: { buttons: formattedButtons },
      },
    };

    const response = await axios.post(API_BASE, body, { headers });
    logger.info('📤 Interactive buttons sent', { to, buttonCount: buttons.length });
    return response.data;
  } catch (error) {
    logger.error('❌ Failed to send interactive buttons', {
      to,
      error: error.response?.data || error.message,
    });
    throw error;
  }
}

/**
 * Mark a message as read (blue ticks).
 *
 * @param {string} messageId - The wamid of the message to mark as read
 * @returns {Object} API response data
 */
async function markAsRead(messageId) {
  try {
    const body = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    };

    const response = await axios.post(API_BASE, body, { headers });
    logger.debug('✅ Message marked as read', { messageId });
    return response.data;
  } catch (error) {
    logger.error('❌ Failed to mark message as read', {
      messageId,
      error: error.response?.data || error.message,
    });
    // Don't throw — marking as read is non-critical
  }
}

module.exports = {
  sendTextMessage,
  sendInteractiveButtons,
  markAsRead,
};
