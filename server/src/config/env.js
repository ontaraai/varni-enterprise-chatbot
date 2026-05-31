const dotenv = require('dotenv');
const path = require('path');

// Load .env from server root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Environment configuration with validation.
 * Throws clear errors if any required variable is missing.
 */

const requiredVars = [
  'WHATSAPP_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_VERIFY_TOKEN',
  'WHATSAPP_APP_SECRET',
  'ADMIN_PHONE_NUMBER',
  'OPENAI_API_KEY',
  'MONGODB_URI',
];

// Validate all required environment variables are present
const missing = requiredVars.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(
    `❌ Missing required environment variables:\n` +
    missing.map((key) => `   - ${key}`).join('\n') +
    `\n\nPlease check your .env file in the server/ directory.`
  );
}

const config = {
  // Meta WhatsApp Cloud API
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    appSecret: process.env.WHATSAPP_APP_SECRET,
  },

  // Admin / Escalation
  adminPhoneNumber: process.env.ADMIN_PHONE_NUMBER,

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY,

  // MongoDB
  mongodbUri: process.env.MONGODB_URI,

  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Dashboard (for CORS)
  dashboardUrl: process.env.DASHBOARD_URL || '',

  // Derived
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  isProd: process.env.NODE_ENV === 'production',
};

module.exports = config;
