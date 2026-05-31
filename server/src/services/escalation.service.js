const Escalation = require('../models/escalation.model');
const conversationService = require('./conversation.service');
const whatsappService = require('./whatsapp.service');
const config = require('../config/env');
const logger = require('../utils/logger');

/**
 * Format the current time in IST for display.
 */
function formatIST() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Create a new escalation: save record, update conversation,
 * notify admin, and message the customer.
 */
async function createEscalation(conversationId, customerPhone, customerName, reason, lastMessage) {
  try {
    // 1. Create the escalation record
    const escalation = await Escalation.create({
      conversationId,
      customerPhone,
      customerName: customerName || 'Unknown',
      reason,
      lastCustomerMessage: lastMessage || '',
    });

    logger.info('🚨 Escalation created', {
      escalationId: escalation._id,
      customerPhone,
      reason,
    });

    // 2. Update the conversation status to 'escalated'
    await conversationService.setEscalated(conversationId, reason);

    // 3. Send WhatsApp notification to the admin/owner
    const adminMessage =
      `🚨 *New Escalation Alert*\n\n` +
      `👤 Customer: ${customerName || 'Unknown'}\n` +
      `📱 Phone: ${customerPhone}\n` +
      `📝 Reason: ${reason}\n\n` +
      `💬 Last message:\n"${lastMessage || 'N/A'}"\n\n` +
      `⏰ Time: ${formatIST()}`;

    await whatsappService.sendTextMessage(config.adminPhoneNumber, adminMessage);
    logger.info('📤 Escalation alert sent to admin', { adminPhone: config.adminPhoneNumber });

    // 4. Send acknowledgment to the customer
    const customerMessage =
      "I'm connecting you with our team at Varni Enterprise. " +
      'A representative will get back to you shortly. ' +
      'Thank you for your patience! 🙏';

    await whatsappService.sendTextMessage(customerPhone, customerMessage);

    return escalation;
  } catch (error) {
    logger.error('❌ Error creating escalation', { error: error.message });
    throw error;
  }
}

/**
 * Forward a new message from an escalated customer to the admin.
 */
async function forwardToAdmin(customerPhone, customerName, messageBody) {
  try {
    const forwardMessage =
      `📩 _New message from escalated customer_\n\n` +
      `👤 ${customerName || 'Unknown'} (${customerPhone}):\n` +
      `"${messageBody}"`;

    await whatsappService.sendTextMessage(config.adminPhoneNumber, forwardMessage);

    logger.info('📤 Forwarded escalated message to admin', {
      customerPhone,
      messagePreview: messageBody.substring(0, 80),
    });
  } catch (error) {
    logger.error('❌ Error forwarding message to admin', { error: error.message });
    // Don't throw — forwarding failure shouldn't crash the flow
  }
}

/**
 * Get a single escalation by ID, with conversation populated.
 */
async function getEscalation(escalationId) {
  try {
    return await Escalation.findById(escalationId).populate('conversationId');
  } catch (error) {
    logger.error('Error in getEscalation', { error: error.message });
    throw error;
  }
}

/**
 * Get all pending/in-progress escalations, newest first.
 */
async function getPendingEscalations() {
  try {
    return await Escalation.find({
      status: { $in: ['pending', 'in_progress'] },
    })
      .sort({ createdAt: -1 })
      .populate('conversationId');
  } catch (error) {
    logger.error('Error in getPendingEscalations', { error: error.message });
    throw error;
  }
}

/**
 * Resolve an escalation: update status, set resolvedAt, resolve the conversation.
 */
async function resolveEscalation(escalationId, adminNotes) {
  try {
    const escalation = await Escalation.findByIdAndUpdate(
      escalationId,
      {
        $set: {
          status: 'resolved',
          resolvedAt: new Date(),
          adminNotes: adminNotes || null,
        },
      },
      { new: true }
    );

    if (!escalation) {
      throw new Error(`Escalation not found: ${escalationId}`);
    }

    // Also resolve the linked conversation
    await conversationService.resolveConversation(escalation.conversationId);

    logger.info('✅ Escalation resolved', {
      escalationId,
      adminNotes: adminNotes || 'none',
    });

    return escalation;
  } catch (error) {
    logger.error('Error in resolveEscalation', { error: error.message });
    throw error;
  }
}

/**
 * Find the active (non-resolved) escalation for a conversation.
 */
async function getEscalationByConversation(conversationId) {
  try {
    return await Escalation.findOne({
      conversationId,
      status: { $ne: 'resolved' },
    });
  } catch (error) {
    logger.error('Error in getEscalationByConversation', { error: error.message });
    return null;
  }
}

module.exports = {
  createEscalation,
  forwardToAdmin,
  getEscalation,
  getPendingEscalations,
  resolveEscalation,
  getEscalationByConversation,
};
