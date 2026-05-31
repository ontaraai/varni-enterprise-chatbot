const Conversation = require('../models/conversation.model');
const logger = require('../utils/logger');

/**
 * Find an existing active/escalated conversation for this phone number,
 * or create a new one.
 */
async function getOrCreateConversation(phoneNumber, customerName) {
  try {
    // Look for an existing conversation that is NOT resolved
    let conversation = await Conversation.findOne({
      phoneNumber,
      status: { $ne: 'resolved' },
    });

    if (conversation) {
      // Update customer name if provided and different
      if (customerName && customerName !== conversation.customerName) {
        conversation.customerName = customerName;
        await conversation.save();
      }
      return conversation;
    }

    // Create a new conversation
    conversation = await Conversation.create({
      phoneNumber,
      customerName: customerName || 'Unknown',
    });

    logger.info('📋 New conversation created', { phoneNumber, customerName });
    return conversation;
  } catch (error) {
    logger.error('Error in getOrCreateConversation', { error: error.message });
    throw error;
  }
}

/**
 * Add a message to the conversation history.
 */
async function addMessage(conversationId, role, content) {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $push: {
          messages: { role, content, timestamp: new Date() },
        },
        $set: { lastMessageAt: new Date() },
      },
      { new: true }
    );
    return conversation;
  } catch (error) {
    logger.error('Error in addMessage', { error: error.message });
    throw error;
  }
}

/**
 * Get the last N messages from a conversation, formatted for OpenAI.
 * Returns: [{ role: 'user'|'assistant', content }]
 */
async function getRecentHistory(conversationId, limit = 10) {
  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return [];

    const recentMessages = conversation.messages.slice(-limit);
    return recentMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  } catch (error) {
    logger.error('Error in getRecentHistory', { error: error.message });
    return [];
  }
}

/**
 * Mark a conversation as escalated.
 */
async function setEscalated(conversationId, reason) {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          status: 'escalated',
          escalationReason: reason,
        },
      },
      { new: true }
    );
    logger.info('🚨 Conversation escalated', { conversationId, reason });
    return conversation;
  } catch (error) {
    logger.error('Error in setEscalated', { error: error.message });
    throw error;
  }
}

/**
 * Mark a conversation as resolved.
 */
async function resolveConversation(conversationId) {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $set: { status: 'resolved' } },
      { new: true }
    );
    logger.info('✅ Conversation resolved', { conversationId });
    return conversation;
  } catch (error) {
    logger.error('Error in resolveConversation', { error: error.message });
    throw error;
  }
}

module.exports = {
  getOrCreateConversation,
  addMessage,
  getRecentHistory,
  setEscalated,
  resolveConversation,
};
