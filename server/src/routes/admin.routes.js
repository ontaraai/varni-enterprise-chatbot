const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const Conversation = require('../models/conversation.model');
const Escalation = require('../models/escalation.model');
const Product = require('../models/product.model');
const whatsappService = require('../services/whatsapp.service');
const conversationService = require('../services/conversation.service');
const escalationService = require('../services/escalation.service');

// ─────────────────────────────────────────────
// Dashboard Stats
// ─────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalConversations,
      activeConversations,
      escalatedConversations,
      totalProducts,
      todayConversations,
    ] = await Promise.all([
      Conversation.countDocuments(),
      Conversation.countDocuments({ status: 'active' }),
      Conversation.countDocuments({ status: 'escalated' }),
      Product.countDocuments(),
      Conversation.find({ lastMessageAt: { $gte: today } }),
    ]);

    // Count today's messages across all conversations active today
    const totalMessagesToday = todayConversations.reduce(
      (sum, conv) =>
        sum +
        conv.messages.filter((m) => m.timestamp >= today).length,
      0
    );

    res.json({
      totalConversations,
      activeConversations,
      escalatedConversations,
      totalMessages: totalMessagesToday,
      totalProducts,
    });
  } catch (error) {
    logger.error('Admin API — stats error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─────────────────────────────────────────────
// Conversations
// ─────────────────────────────────────────────
router.get('/conversations', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ['active', 'escalated', 'resolved'].includes(status)) {
      filter.status = status;
    }

    const conversations = await Conversation.find(filter)
      .sort({ lastMessageAt: -1 })
      .lean();

    const result = conversations.map((conv) => {
      const lastMsg = conv.messages[conv.messages.length - 1];
      return {
        _id: conv._id,
        phoneNumber: conv.phoneNumber,
        customerName: conv.customerName,
        status: conv.status,
        lastMessageAt: conv.lastMessageAt,
        messageCount: conv.messages.length,
        lastMessagePreview: lastMsg
          ? lastMsg.content.substring(0, 50) + (lastMsg.content.length > 50 ? '...' : '')
          : '',
        escalationReason: conv.escalationReason,
      };
    });

    res.json(result);
  } catch (error) {
    logger.error('Admin API — conversations list error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversations/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const conversation = await Conversation.findById(req.params.id).lean();
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(conversation);
  } catch (error) {
    logger.error('Admin API — conversation detail error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

router.post('/conversations/:id/reply', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid conversation ID' });
    }

    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Send WhatsApp message to the customer
    await whatsappService.sendTextMessage(conversation.phoneNumber, message.trim());

    // Save to conversation history
    const updated = await conversationService.addMessage(
      conversation._id,
      'assistant',
      message.trim()
    );

    // If there is a pending escalation, mark it as in_progress
    await Escalation.updateOne(
      { conversationId: conversation._id, status: 'pending' },
      { $set: { status: 'in_progress' } }
    );

    logger.info('📤 Admin reply sent', {
      conversationId: req.params.id,
      to: conversation.phoneNumber,
    });

    res.json(updated);
  } catch (error) {
    logger.error('Admin API — reply error', { error: error.message });
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

// ─────────────────────────────────────────────
// Escalations
// ─────────────────────────────────────────────
router.get('/escalations', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ['pending', 'in_progress', 'resolved'].includes(status)) {
      filter.status = status;
    }

    const escalations = await Escalation.find(filter)
      .sort({ createdAt: -1 })
      .populate('conversationId')
      .lean();

    res.json(escalations);
  } catch (error) {
    logger.error('Admin API — escalations list error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch escalations' });
  }
});

router.patch('/escalations/:id/resolve', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid escalation ID' });
    }

    const { adminNotes } = req.body;
    const escalation = await escalationService.resolveEscalation(
      req.params.id,
      adminNotes
    );

    if (!escalation) {
      return res.status(404).json({ error: 'Escalation not found' });
    }

    res.json(escalation);
  } catch (error) {
    logger.error('Admin API — resolve error', { error: error.message });
    res.status(500).json({ error: 'Failed to resolve escalation' });
  }
});

// ─────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({}).sort({ category: 1, name: 1 }).lean();
    res.json(products);
  } catch (error) {
    logger.error('Admin API — products list error', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { name, category, description, specifications, price, moq, inStock, applications } =
      req.body;

    if (!name || !category || !description || !price) {
      return res.status(400).json({ error: 'name, category, description, and price are required' });
    }

    const product = await Product.create({
      name,
      category,
      description,
      specifications: specifications || {},
      price,
      moq: moq || '',
      inStock: inStock !== undefined ? inStock : true,
      applications: applications || [],
    });

    logger.info('📦 Product created', { name: product.name });
    res.status(201).json(product);
  } catch (error) {
    logger.error('Admin API — product create error', { error: error.message });
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    logger.info('📦 Product updated', { name: product.name });
    res.json(product);
  } catch (error) {
    logger.error('Admin API — product update error', { error: error.message });
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    logger.info('🗑️  Product deleted', { name: product.name });
    res.json({ message: 'Product deleted', product });
  } catch (error) {
    logger.error('Admin API — product delete error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
