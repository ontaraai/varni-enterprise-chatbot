const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone is required'],
    },
    customerName: {
      type: String,
      default: 'Unknown',
    },
    reason: {
      type: String,
      required: [true, 'Escalation reason is required'],
    },
    lastCustomerMessage: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved'],
      default: 'pending',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    adminNotes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Escalation', escalationSchema);
