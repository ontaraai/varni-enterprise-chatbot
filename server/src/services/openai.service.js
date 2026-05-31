const OpenAI = require('openai');
const config = require('../config/env');
const logger = require('../utils/logger');
const Product = require('../models/product.model');
const { buildSystemPrompt } = require('../prompts/system');

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Generate an AI response using OpenAI GPT-4o.
 *
 * @param {string} userMessage - The customer's message
 * @param {Array} conversationHistory - Recent messages [{role, content}]
 * @returns {Object} { reply, shouldEscalate, escalationReason }
 */
async function generateResponse(userMessage, conversationHistory = []) {
  try {
    // 1. Fetch all products from MongoDB
    const products = await Product.find({});
    logger.debug('📦 Fetched products for prompt', { count: products.length });

    // 2. Build system prompt with live product data
    const systemPrompt = buildSystemPrompt(products);

    // 3. Build messages array for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    // 4. Call OpenAI Chat Completions
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const rawResponse = completion.choices[0]?.message?.content;

    // 5. Log token usage for cost monitoring
    const usage = completion.usage;
    logger.info('🤖 OpenAI response received', {
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
    });

    // 6. Parse JSON response
    try {
      const parsed = JSON.parse(rawResponse);
      const result = {
        reply: parsed.reply || 'I apologize, I could not process your request.',
        shouldEscalate: parsed.shouldEscalate || false,
        escalationReason: parsed.escalationReason || null,
      };

      logger.info('🧠 AI decision', {
        shouldEscalate: result.shouldEscalate,
        escalationReason: result.escalationReason,
        replyPreview: result.reply.substring(0, 80),
      });

      return result;
    } catch (parseError) {
      // 7. Fallback if JSON parsing fails
      logger.error('❌ Failed to parse AI response as JSON', {
        rawResponse,
        error: parseError.message,
      });
      return {
        reply: "I'm sorry, I encountered an issue. Let me connect you with our team.",
        shouldEscalate: true,
        escalationReason: 'AI response parsing error',
      };
    }
  } catch (error) {
    logger.error('❌ OpenAI API error', {
      error: error.message,
      code: error.code,
    });

    // Return a safe fallback
    return {
      reply: "I'm sorry, I'm having trouble right now. Please try again in a moment, or I can connect you with our team.",
      shouldEscalate: false,
      escalationReason: null,
    };
  }
}

module.exports = { generateResponse };
