const express = require('express');
const router = express.Router();
const config = require('../config/env');
const logger = require('../utils/logger');
const { parseWebhookPayload } = require('../utils/messageParser');
const { markdownToWhatsApp } = require('../utils/whatsappFormatter');
const { isDuplicate } = require('../utils/dedup');
const { verifyWebhookSignature } = require('../middleware/signature');
const { rateLimiter } = require('../middleware/rateLimiter');
const whatsappService = require('../services/whatsapp.service');
const conversationService = require('../services/conversation.service');
const openaiService = require('../services/openai.service');
const escalationService = require('../services/escalation.service');

// Rate limit for webhook POST (Meta sends many status updates)
const webhookLimiter = rateLimiter({ windowMs: 60000, max: 1000, label: 'webhook' });

/**
 * GET /webhook — Meta Webhook Verification
 *
 * When you configure the webhook in Meta Developer Portal, Meta sends a GET
 * request with hub.mode, hub.verify_token, and hub.challenge. We must return
 * the challenge value if the token matches.
 */
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info('🔐 Webhook verification attempt', { mode, tokenProvided: !!token });

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    logger.info('✅ Webhook verified successfully');
    return res.status(200).send(challenge);
  }

  logger.warn('❌ Webhook verification failed — token mismatch');
  return res.status(403).send('Forbidden');
});

/**
 * POST /webhook — Incoming WhatsApp Messages
 *
 * Meta sends all incoming messages, status updates, and events here.
 * We must return 200 OK within 5 seconds or Meta will retry.
 */
router.post('/', webhookLimiter, verifyWebhookSignature, async (req, res) => {
  // Always respond 200 immediately — Meta requires this within 5 seconds
  res.sendStatus(200);

  try {
    // Parse the incoming webhook payload
    const messageData = parseWebhookPayload(req.body);

    // If it's not a valid message (e.g., status update, delivery receipt), ignore
    if (!messageData) {
      return;
    }

    const { senderPhone, senderName, messageType, messageBody, messageId } = messageData;

    logger.info('📩 Incoming message', {
      from: senderPhone,
      name: senderName,
      type: messageType,
      body: messageBody.substring(0, 100),
      messageId,
    });

    // Skip messages from admin phone number (prevents infinite loops with escalation notifications)
    if (senderPhone === config.adminPhoneNumber) {
      logger.info('⏭️  Ignoring message from admin phone number');
      return;
    }

    // Deduplication — Meta may retry webhooks if our response is slow
    if (isDuplicate(messageId)) {
      return;
    }

    // Mark the message as read (blue ticks)
    await whatsappService.markAsRead(messageId);

    // Handle non-text messages
    if (messageType !== 'text' && messageType !== 'interactive') {
      await whatsappService.sendTextMessage(
        senderPhone,
        'I can only process text messages at the moment. Please send your query as text! 📝',
        messageId
      );
      return;
    }

    // Get or create the conversation
    const conversation = await conversationService.getOrCreateConversation(
      senderPhone,
      senderName
    );

    // If conversation is escalated, forward message to admin instead of AI
    if (conversation.status === 'escalated') {
      logger.info('⏸️  Message from escalated conversation — forwarding to admin', {
        phone: senderPhone,
        message: messageBody.substring(0, 80),
      });

      // Save the message to conversation history
      await conversationService.addMessage(conversation._id, 'user', messageBody);

      // Forward the message to the admin
      await escalationService.forwardToAdmin(senderPhone, senderName, messageBody);
      return;
    }

    // Save the user's message to conversation history
    await conversationService.addMessage(conversation._id, 'user', messageBody);

    // Get recent conversation history for AI context
    const history = await conversationService.getRecentHistory(conversation._id, 10);

    // Generate AI response
    logger.info('🤖 Generating AI response...', { phone: senderPhone });
    const aiResponse = await openaiService.generateResponse(messageBody, history);

    // Handle escalation
    if (aiResponse.shouldEscalate) {
      logger.info('🚨 Escalation triggered', {
        phone: senderPhone,
        reason: aiResponse.escalationReason,
      });

      // Save the AI's reply to conversation history before escalating
      await conversationService.addMessage(conversation._id, 'assistant', aiResponse.reply);

      // Create escalation: saves record, notifies admin, messages customer
      await escalationService.createEscalation(
        conversation._id,
        senderPhone,
        senderName,
        aiResponse.escalationReason,
        messageBody
      );
    } else {
      // Convert markdown to WhatsApp-native formatting before sending
      const formattedReply = markdownToWhatsApp(aiResponse.reply);

      // Send the formatted reply
      await whatsappService.sendTextMessage(senderPhone, formattedReply, messageId);

      // Save the original reply to conversation history (for dashboard readability)
      await conversationService.addMessage(conversation._id, 'assistant', aiResponse.reply);
    }

    logger.info('✅ Response sent successfully', {
      phone: senderPhone,
      escalated: aiResponse.shouldEscalate,
    });
  } catch (error) {
    logger.error('❌ Error processing webhook', {
      error: error.message,
      stack: error.stack,
    });

    // Try to send an apology message if we have the sender's phone
    try {
      const messageData = parseWebhookPayload(req.body);
      if (messageData?.senderPhone) {
        await whatsappService.sendTextMessage(
          messageData.senderPhone,
          "I'm sorry, I encountered an issue. Please try again or contact our team directly. 🙏"
        );
      }
    } catch (apologyError) {
      logger.error('Failed to send apology message', { error: apologyError.message });
    }
  }
});

module.exports = router;
