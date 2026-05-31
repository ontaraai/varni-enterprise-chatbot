# Varni Enterprise WhatsApp AI Chatbot — Phased Development Guide

This document breaks the entire project into **6 phases** (Phase 0–5). Each phase includes:

- A **self-contained prompt** you can give to an AI assistant to build that phase
- **Manual steps** you need to complete yourself (Meta setup, database, env vars, etc.)
- A **testing checklist** so you know when to move to the next phase

---

---

## Phase 0: Prerequisites & Project Scaffolding

> This phase sets up the project structure, installs dependencies, configures MongoDB Atlas, completes Meta WhatsApp Business setup, and creates the `.env` file. No application logic is written — just the foundation.

---

### 🧑‍💻 Steps YOU Must Complete Before Giving the Prompt

#### A. MongoDB Atlas Setup (Free Tier)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and sign in (or create a free account).
2. Click **"Build a Database"** → select **M0 Free Tier** → choose a cloud region close to you (e.g., `AWS Mumbai`).
3. Set a **database user**:
   - Username: `varni_admin` (or any name)
   - Password: Generate a strong password and **save it**.
4. Under **Network Access** → click **"Add IP Address"** → select **"Allow Access from Anywhere"** (`0.0.0.0/0`). This is needed for Railway deployment later.
5. Click **"Connect"** → **"Drivers"** → copy the **connection string**. It looks like:
   ```
   mongodb+srv://varni_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<password>` with your actual password. Add a database name before the `?`:
   ```
   mongodb+srv://varni_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/varni_chatbot?retryWrites=true&w=majority
   ```
6. **Save this connection string** — you'll need it for the `.env` file.

#### B. Meta WhatsApp Business Setup

You mentioned you already have an app created in the Meta Developer Portal. Complete these remaining steps:

1. **Go to your app** at [https://developers.facebook.com](https://developers.facebook.com).
2. In the left sidebar, click **"WhatsApp"** → **"API Setup"**.
3. Note down these values:
   - **Phone Number ID** — shown under "From" phone number (this is Meta's test number)
   - **WhatsApp Business Account ID**
   - **Temporary Access Token** — click "Generate" (valid for 24 hours, good for development)
4. **For production later**, you'll need a **System User Permanent Token**:
   - Go to [business.facebook.com](https://business.facebook.com) → **Business Settings** → **System Users**
   - Create a System User → Generate Token with `whatsapp_business_messaging` and `whatsapp_business_management` permissions
5. Under **"WhatsApp" → "Configuration"**:
   - You'll configure the webhook URL here in Phase 1 (after the server is running)
   - **Verify Token**: Decide on a custom secret string now (e.g., `varni_webhook_verify_2026`). Save it.
6. **App Secret**: Go to **"App Settings" → "Basic"** → copy the **App Secret**. Save it.

#### C. OpenAI API Key

1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys).
2. Create a new API key. **Save it securely.**
3. Ensure you have credits or a payment method attached (GPT-4o costs ~$2.50/1M input tokens).

#### D. Collect All Values

After completing A, B, and C, you should have these values ready:

| Variable                   | Where to Find                                                         |
| :------------------------- | :-------------------------------------------------------------------- |
| `WHATSAPP_TOKEN`           | Meta Developer Portal → WhatsApp → API Setup → Temporary Access Token |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta Developer Portal → WhatsApp → API Setup → Phone Number ID        |
| `WHATSAPP_VERIFY_TOKEN`    | Custom string you decided (e.g., `varni_webhook_verify_2026`)         |
| `WHATSAPP_APP_SECRET`      | Meta Developer Portal → App Settings → Basic → App Secret             |
| `ADMIN_PHONE_NUMBER`       | The owner's WhatsApp number with country code (e.g., `919876543210`)  |
| `OPENAI_API_KEY`           | OpenAI Platform → API Keys                                            |
| `MONGODB_URI`              | MongoDB Atlas → Connect → Connection String                           |

---

### 📋 Prompt for Phase 0

```
I'm building a WhatsApp AI chatbot for "Varni Enterprise", a company that sells thermal
packaging products. This is a Node.js + Express backend project.

Set up the project scaffolding in the workspace directory: c:\Users\meetv\Desktop\varni-enterprise-chatbot

Here's what I need:

1. **Initialize a Node.js project** inside a `server/` subdirectory:
   - Create `server/package.json` with these dependencies:
     - express
     - axios (for Meta API calls)
     - openai (official OpenAI Node.js SDK)
     - mongoose (MongoDB ODM)
     - winston (structured logging)
     - dotenv (environment variables)
     - cors
   - Add dev dependencies: nodemon
   - Add scripts: `"start": "node src/index.js"`, `"dev": "nodemon src/index.js"`

2. **Create the folder structure** inside `server/src/`:
```

server/src/
├── index.js (empty, just a placeholder comment)
├── config/
│ └── env.js (empty placeholder)
├── routes/
│ ├── webhook.routes.js (empty placeholder)
│ └── admin.routes.js (empty placeholder)
├── services/
│ ├── whatsapp.service.js (empty placeholder)
│ ├── openai.service.js (empty placeholder)
│ ├── conversation.service.js (empty placeholder)
│ └── escalation.service.js (empty placeholder)
├── models/
│ ├── conversation.model.js (empty placeholder)
│ ├── product.model.js (empty placeholder)
│ └── escalation.model.js (empty placeholder)
├── prompts/
│ └── system.js (empty placeholder)
├── middleware/
│ └── signature.js (empty placeholder)
└── utils/
├── logger.js (empty placeholder)
└── messageParser.js (empty placeholder)

```
Each placeholder file should have a comment like `// TODO: Implement in Phase X`.

3. **Create `server/.env.example`** with all required environment variables (with empty values and
descriptive comments):
- WHATSAPP_TOKEN
- WHATSAPP_PHONE_NUMBER_ID
- WHATSAPP_VERIFY_TOKEN
- WHATSAPP_APP_SECRET
- ADMIN_PHONE_NUMBER
- OPENAI_API_KEY
- MONGODB_URI
- PORT (default: 3000)
- NODE_ENV (default: development)

4. **Create `server/.gitignore`** that ignores: node_modules, .env, .DS_Store, logs/

5. **Create `server/src/config/env.js`**:
- Loads dotenv
- Exports a config object with all env vars
- Validates that required vars are present, throws clear errors if missing

6. **Create `server/src/utils/logger.js`**:
- Sets up winston with console transport
- Format: timestamp + level + message
- Export the logger instance

7. **Create a root `README.md`** in the workspace root with:
- Project name: "Varni Enterprise WhatsApp AI Chatbot"
- Brief description
- Tech stack list
- Setup instructions (how to install deps, create .env from .env.example, run dev server)

8. Run `npm install` inside the server directory to install all dependencies.

Do NOT implement any business logic yet — this is scaffolding only.
```

---

### ✅ Testing Checklist for Phase 0

- [ ] `server/` directory exists with all subdirectories and placeholder files
- [ ] `server/package.json` has all listed dependencies
- [ ] `server/node_modules/` exists (dependencies installed)
- [ ] `server/.env.example` has all 9 environment variables with comments
- [ ] `server/.gitignore` is present and correct
- [ ] `server/src/config/env.js` loads and validates env vars
- [ ] `server/src/utils/logger.js` exports a working winston logger
- [ ] `README.md` exists at the workspace root
- [ ] **You** have created `server/.env` from `.env.example` and filled in all values from Section D above

> **✋ Before moving to Phase 1**: Make sure your `.env` file is fully populated with real values.

---

---

## Phase 1: Core Backend — Webhook + WhatsApp Messaging

> This phase builds the Express server, the Meta webhook handler (so Meta can send us messages), and the WhatsApp message-sending service (so we can reply). By the end, you can receive a WhatsApp message and send a hardcoded reply.

---

### 🧑‍💻 Steps YOU Must Complete During This Phase

#### A. Install & Run ngrok

1. Download ngrok from [https://ngrok.com/download](https://ngrok.com/download) and install it.
2. Sign up for a free account and run `ngrok config add-authtoken YOUR_TOKEN`.
3. After the server is running (at the end of this phase), run:
   ```bash
   ngrok http 3000
   ```
4. Copy the `https://xxxxx.ngrok-free.app` URL.

#### B. Configure Webhook in Meta Developer Portal

1. Go to your app → **WhatsApp → Configuration**.
2. Under **Webhook**, click **Edit**:
   - **Callback URL**: `https://xxxxx.ngrok-free.app/webhook` (your ngrok URL + `/webhook`)
   - **Verify Token**: The same string in your `.env` file's `WHATSAPP_VERIFY_TOKEN`
3. Click **"Verify and Save"** — it should succeed if the server is running.
4. Under **Webhook Fields**, subscribe to: **`messages`** (check the box).

#### C. Send a Test Message

1. In Meta Developer Portal → **WhatsApp → API Setup**, there's a "To" field with your test number.
2. You need to **send a message first** from your personal WhatsApp to the test number shown (Meta's test number) to open a conversation window.
3. Then your bot can reply within the 24-hour window.

---

### 📋 Prompt for Phase 1

```
I'm building a WhatsApp AI chatbot backend using Node.js and Express. The project is already
scaffolded at: c:\Users\meetv\Desktop\varni-enterprise-chatbot\server

The project structure already exists with placeholder files. Dependencies are installed
(express, axios, mongoose, winston, dotenv, cors). Environment config (`src/config/env.js`)
and logger (`src/utils/logger.js`) are already implemented.

Now implement Phase 1 — the core Express server, Meta webhook handler, and WhatsApp
message-sending service. Here's what I need:

### 1. `src/index.js` — Express Server Entry Point
- Load environment config from `src/config/env.js`
- Initialize Express app with `express.json()` and `cors()` middleware
- Mount webhook routes at `/webhook`
- Mount admin routes at `/api/admin` (placeholder for now, just return 200)
- Add a `GET /health` endpoint that returns `{ status: "ok" }`
- Connect to MongoDB using mongoose (connection string from env config)
- Start the server on the configured PORT
- Log startup info using the winston logger
- Do NOT add the signature verification middleware yet (we'll add it later so we can test
  easily with ngrok first)

### 2. `src/routes/webhook.routes.js` — Meta Webhook Endpoints
- **GET `/`** (mounted at `/webhook`, so full path is GET `/webhook`):
  - Meta sends this to verify the webhook endpoint
  - Extract query params: `hub.mode`, `hub.verify_token`, `hub.challenge`
  - If mode is "subscribe" AND token matches `WHATSAPP_VERIFY_TOKEN` from env, return 200
    with the challenge value as plain text
  - Otherwise return 403
  - Log the verification attempt

- **POST `/`** (full path is POST `/webhook`):
  - Return 200 OK immediately (Meta requires response within 5 seconds)
  - Parse the incoming webhook payload to extract message data
  - Only process events where `body.object === 'whatsapp_business_account'`
  - Extract from the payload:
    - Sender phone number
    - Sender name (profile name)
    - Message type (text, interactive, image, etc.)
    - Message body (for text messages)
    - Message ID (wamid)
  - For now (temporary): If the message is a text message, call the WhatsApp service to send
    a hardcoded reply: "👋 Hello! I'm the Varni Enterprise assistant. I'm being set up and
    will be fully operational soon!"
  - For non-text messages, reply: "I can only process text messages at the moment."
  - Log every incoming message with sender info and content
  - Handle gracefully if the payload structure is unexpected (no crashes)

### 3. `src/utils/messageParser.js` — Parse Incoming WhatsApp Payloads
- Export a function `parseWebhookPayload(body)` that extracts:
  - `senderPhone`: the sender's phone number
  - `senderName`: the sender's profile name
  - `messageType`: 'text', 'interactive', 'image', 'document', 'audio', 'video', 'sticker',
     'location', 'unknown'
  - `messageBody`: the text content (for text messages) or button reply ID/title
     (for interactive button replies)
  - `messageId`: the wamid for the message
  - `timestamp`: message timestamp
- Return `null` if the payload doesn't contain a valid message (e.g., status updates)
- Handle the nested structure of Meta's webhook payload:
  `body.entry[0].changes[0].value.messages[0]` and
  `body.entry[0].changes[0].value.contacts[0]`

### 4. `src/services/whatsapp.service.js` — Send Messages via Meta Cloud API
Use axios to call the Meta WhatsApp Cloud API (v22.0). Base URL:
`https://graph.facebook.com/v22.0/{PHONE_NUMBER_ID}/messages`

Implement these functions:
- **`sendTextMessage(to, text, replyToMessageId?)`**:
  - POST to the messages endpoint
  - Body: `{ messaging_product: "whatsapp", to, type: "text", text: { body } }`
  - If `replyToMessageId` is provided, add `context: { message_id: replyToMessageId }`
  - Headers: `Authorization: Bearer {WHATSAPP_TOKEN}`, `Content-Type: application/json`

- **`sendInteractiveButtons(to, bodyText, buttons[])`**:
  - Send interactive message with quick reply buttons (max 3)
  - Each button: `{ type: "reply", reply: { id, title } }`
  - Body structure: `{ messaging_product: "whatsapp", to, type: "interactive",
    interactive: { type: "button", body: { text: bodyText },
    action: { buttons } } }`

- **`markAsRead(messageId)`**:
  - POST to same endpoint with: `{ messaging_product: "whatsapp",
    status: "read", message_id: messageId }`

- All functions should have try/catch with proper error logging using the winston logger.
- All functions should return the API response data on success.

### Important Notes
- Use the WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID from the env config
- The server should handle errors gracefully — never crash on a bad webhook payload
- Log all outgoing messages for debugging
```

---

### ✅ Testing Checklist for Phase 1

1. **Server starts cleanly:**

   ```bash
   cd server
   npm run dev
   ```

   - [ ] Server logs: "Server running on port 3000"
   - [ ] Server logs: "Connected to MongoDB"
   - [ ] No errors in the console

2. **Health check works:**
   - [ ] Open `http://localhost:3000/health` in browser → see `{"status":"ok"}`

3. **Webhook verification works:**
   - [ ] Start ngrok: `ngrok http 3000`
   - [ ] In Meta Developer Portal → WhatsApp → Configuration → Webhook → Edit
   - [ ] Enter ngrok URL + `/webhook` as Callback URL, enter your verify token
   - [ ] Click "Verify and Save" → ✅ should succeed
   - [ ] Subscribe to `messages` field

4. **Bot replies to WhatsApp messages:**
   - [ ] Send a WhatsApp message from your phone to the Meta test number
   - [ ] Bot replies with the hardcoded message: "👋 Hello! I'm the Varni Enterprise assistant..."
   - [ ] Server console logs the incoming message details (sender, content, type)

5. **Non-text messages handled:**
   - [ ] Send an image to the bot → replies with "I can only process text messages..."

6. **No crashes on weird payloads:**
   - [ ] Bot doesn't crash if Meta sends status updates or other non-message events

> **✋ Before moving to Phase 2**: You must have a working webhook that receives real WhatsApp messages and sends replies. If the webhook verification fails or messages don't arrive, debug before proceeding.

---

---

## Phase 2: AI Engine — OpenAI + Product Knowledge + Conversations

> This phase adds the intelligence. The bot uses OpenAI GPT-4o to understand customer queries and respond with accurate product information. Conversations are tracked in MongoDB so the AI has context across multiple messages.

---

### 📋 Prompt for Phase 2

```
I'm building a WhatsApp AI chatbot for "Varni Enterprise", a company that sells thermal
packaging products (thermal rolls, labels, ribbons, etc.). The project is at:
c:\Users\meetv\Desktop\varni-enterprise-chatbot\server

Phase 1 is complete: the Express server is running, Meta webhook is connected and receiving
WhatsApp messages, and the WhatsApp service can send text replies and interactive buttons.
Currently the bot sends a hardcoded reply to every message.

Now implement Phase 2 — the AI engine using OpenAI, product knowledge, and conversation
tracking. Replace the hardcoded reply with intelligent, product-aware AI responses.

### 1. `src/models/product.model.js` — Mongoose Product Schema
Define a Product model with:
- `name` (String, required) — e.g., "Standard Thermal Roll 79mm x 40m"
- `category` (String, required) — e.g., "Thermal Rolls", "Labels", "Ribbons"
- `description` (String, required) — product description
- `specifications` (Object / Map) — flexible key-value pairs for specs
  (width, length, core size, material, GSM, etc.)
- `price` (String, required) — e.g., "₹45 per roll" or "₹45-55 per roll (quantity based)"
- `moq` (String) — minimum order quantity, e.g., "100 rolls"
- `inStock` (Boolean, default: true)
- `applications` (Array of Strings) — e.g., ["POS billing", "ATM", "Retail"]
- Timestamps enabled (createdAt, updatedAt)

Also create a **seed script** at `src/seeds/productSeed.js` that:
- Connects to MongoDB
- Clears existing products
- Inserts 5-6 sample thermal packaging products with realistic data:
  1. Standard Thermal Roll 79mm x 40m
  2. Premium Thermal Roll 79mm x 60m
  3. Thermal Label Roll 100mm x 150mm (barcode labels)
  4. Thermal Paper Roll 57mm x 15m (small POS)
  5. Thermal Wax Ribbon 110mm x 300m
  6. Thermal Transfer Label 50mm x 25mm
- Use realistic Indian pricing (₹ values), specs, and descriptions
- Can be run standalone: `node src/seeds/productSeed.js`
- Add a script in package.json: `"seed": "node src/seeds/productSeed.js"`

### 2. `src/models/conversation.model.js` — Mongoose Conversation Schema
Define a Conversation model with:
- `phoneNumber` (String, required, indexed) — customer's WhatsApp number
- `customerName` (String) — from WhatsApp profile
- `messages` (Array of Objects):
  - `role`: 'user' | 'assistant' (String, required)
  - `content` (String, required)
  - `timestamp` (Date, default: Date.now)
- `status` (String, enum: ['active', 'escalated', 'resolved'], default: 'active')
- `escalationReason` (String)
- `lastMessageAt` (Date)
- Timestamps enabled

### 3. `src/services/conversation.service.js` — Conversation Management
Implement:
- `getOrCreateConversation(phoneNumber, customerName)`:
  - Find existing conversation with this phone number that is NOT 'resolved'
  - If found, update customerName if provided, return it
  - If not found, create a new one and return it
- `addMessage(conversationId, role, content)`:
  - Push a new message to the messages array
  - Update `lastMessageAt` to now
  - Return the updated conversation
- `getRecentHistory(conversationId, limit = 10)`:
  - Return the last N messages from the conversation
  - Format them as: `[{ role: 'user'|'assistant', content }]` (ready for OpenAI)
- `setEscalated(conversationId, reason)`:
  - Set status to 'escalated' and escalationReason
- `resolveConversation(conversationId)`:
  - Set status to 'resolved'

### 4. `src/prompts/system.js` — Dynamic System Prompt Builder
Export a function `buildSystemPrompt(products)` that takes an array of product objects
and returns the system prompt string.

The system prompt should instruct the AI:
```

You are Varni — a helpful and friendly sales assistant for Varni Enterprise, specialists in
thermal packaging products including thermal rolls, labels, and ribbons.

YOUR ROLE:

- Answer customer questions about products, prices, specifications, and availability
- Provide exact pricing as listed in the product catalog below
- Help customers find the right product for their needs
- Be professional yet warm — use simple, clear language

PRODUCT CATALOG:
{JSON.stringify the products array here, formatted readably}

RULES:

1. ONLY answer using information from the product catalog above. Never make up prices,
   specs, or products that aren't listed.
2. Share exact prices as listed. Do NOT negotiate, offer discounts, or promise special deals.
3. If a product is out of stock (inStock: false), inform the customer and suggest
   alternatives from the catalog.
4. If the customer asks about something NOT in the catalog or outside your knowledge,
   politely say you don't have that information and offer to connect them with the team.
5. Keep responses concise — this is WhatsApp. Aim for under 300 characters when possible.
   Use line breaks for readability. Use relevant emojis sparingly.
6. When listing multiple products, use a clean format with bullet points or numbered lists.
7. If the customer wants to place an order, wants custom/bulk pricing, has a complaint,
   or asks to speak to a human — you MUST escalate.

RESPONSE FORMAT:
You must ALWAYS respond in valid JSON with this exact structure:
{
"reply": "Your message to the customer goes here",
"shouldEscalate": false,
"escalationReason": null
}

Set shouldEscalate to true and provide escalationReason when:

- Customer explicitly asks to talk to a human/person/agent/someone
- Customer wants to place/confirm an order
- Customer wants bulk pricing or custom quotes
- Customer has a complaint or is frustrated/angry
- You've been unable to answer their question twice in a row
- The query is completely unrelated to thermal packaging products

```

### 5. `src/services/openai.service.js` — OpenAI Integration
Implement:
- `generateResponse(userMessage, conversationHistory)`:
  1. Fetch ALL products from MongoDB using the Product model
  2. Call `buildSystemPrompt(products)` to get the system prompt with live product data
  3. Build the messages array for OpenAI:
     - First message: `{ role: "system", content: systemPrompt }`
     - Then: spread the conversationHistory array (last 10 messages with role + content)
     - Last: `{ role: "user", content: userMessage }`
  4. Call OpenAI Chat Completions:
     - Model: "gpt-4o"
     - Temperature: 0.3 (we want factual, consistent responses)
     - max_tokens: 500
     - response_format: { type: "json_object" }
  5. Parse the JSON response to extract: `{ reply, shouldEscalate, escalationReason }`
  6. If JSON parsing fails, return a safe fallback:
     `{ reply: "I'm sorry, I encountered an issue. Let me connect you with our team.",
        shouldEscalate: true, escalationReason: "AI response parsing error" }`
  7. Log the token usage for cost monitoring
  8. Return the parsed response object

Use the official `openai` npm package. Import the API key from env config.

### 6. Update `src/routes/webhook.routes.js` — Wire Up the AI
Replace the hardcoded reply logic in the POST `/webhook` handler:
1. Parse the incoming message using messageParser
2. If it's not a valid message (status update, etc.), return early
3. Mark the message as read using whatsapp.service.markAsRead()
4. Get or create the conversation using conversation.service
5. Add the user's message to the conversation history
6. Get the recent conversation history (last 10 messages)
7. Call openai.service.generateResponse() with the message and history
8. If shouldEscalate is true:
   - For now, just send the reply text + a note "Our team will reach out shortly"
   - Set the conversation to escalated (we'll implement full escalation in Phase 3)
9. If shouldEscalate is false:
   - Send the AI's reply via whatsapp.service.sendTextMessage()
10. Add the assistant's reply to the conversation history
11. Wrap everything in try/catch — on error, send an apology message to the customer

### Important Notes
- When the conversation status is 'escalated', the bot should NOT auto-reply. Just log
  that a message was received from an escalated conversation.
- Use async/await throughout. Never block the event loop.
- Log all AI interactions: user message, AI response, token usage, escalation decisions.
```

---

### ✅ Testing Checklist for Phase 2

1. **Seed the database:**

   ```bash
   cd server
   npm run seed
   ```

   - [ ] Console logs: "Seeded X products successfully"
   - [ ] Check MongoDB Atlas (Collections tab) — `products` collection has 5-6 documents

2. **Basic product inquiry:**
   - [ ] Send: "What products do you have?" → Bot lists available products with names/prices
   - [ ] Send: "Tell me about the 79mm thermal roll" → Bot gives details + price + specs

3. **Pricing questions:**
   - [ ] Send: "What's the price of thermal labels?" → Bot gives exact price from catalog
   - [ ] Send: "Can I get a discount?" → Bot should escalate (or politely decline and escalate)

4. **Multi-turn conversation:**
   - [ ] Send: "Do you have thermal ribbons?" → Bot answers
   - [ ] Send: "What size are they?" → Bot remembers context, answers about the ribbons
   - [ ] Check MongoDB Atlas — `conversations` collection shows messages array with history

5. **Out-of-scope handling:**
   - [ ] Send: "What's the weather today?" → Bot politely declines, stays on-topic
   - [ ] Send: "Do you sell printers?" → Bot says it doesn't have that info

6. **Escalation detection:**
   - [ ] Send: "I want to talk to someone" → Bot acknowledges and marks conversation as escalated
   - [ ] Send: "I want to place an order for 500 rolls" → Bot escalates
   - [ ] Check MongoDB — conversation status is `escalated`

7. **Escalated conversation behavior:**
   - [ ] After escalation, send another message → Bot should NOT auto-reply (stays quiet)
   - [ ] Server logs should note the message from an escalated conversation

8. **Error resilience:**
   - [ ] Send a rapid burst of 5 messages → No crashes, all get responses
   - [ ] Send an image → Bot replies with "text only" message (Phase 1 behavior preserved)

> **✋ Before moving to Phase 3**: The bot should be having intelligent, product-aware conversations. It should know all products, give accurate prices, maintain conversation context, and detect when to escalate.

---

---

## Phase 3: Escalation System — Human Handoff & Owner Notifications

> This phase implements the full escalation flow: when the AI decides to escalate, the owner gets a WhatsApp notification with context, the bot stops replying, and the admin can resolve it later.

---

### 📋 Prompt for Phase 3

````
I'm building a WhatsApp AI chatbot for "Varni Enterprise" (thermal packaging products).
The project is at: c:\Users\meetv\Desktop\varni-enterprise-chatbot\server

Phase 2 is complete: the bot uses OpenAI GPT-4o to answer product questions, tracks
conversations in MongoDB, and detects when to escalate (returning shouldEscalate: true).
Currently, when escalation is detected, it sets the conversation to 'escalated' status and
sends a generic message, but doesn't notify anyone.

Now implement Phase 3 — the full escalation system with owner WhatsApp notifications.

### 1. `src/models/escalation.model.js` — Escalation Record Schema
Define an Escalation model:
- `conversationId` (ObjectId, ref: 'Conversation', required)
- `customerPhone` (String, required)
- `customerName` (String)
- `reason` (String, required) — why the AI escalated
- `lastCustomerMessage` (String) — the message that triggered escalation
- `status` (String, enum: ['pending', 'in_progress', 'resolved'], default: 'pending')
- `resolvedAt` (Date)
- `adminNotes` (String) — notes from admin when resolving
- Timestamps enabled

### 2. `src/services/escalation.service.js` — Escalation Logic
Implement:
- `createEscalation(conversationId, customerPhone, customerName, reason, lastMessage)`:
  1. Create an Escalation record in MongoDB
  2. Update the conversation status to 'escalated' with the reason
  3. Send a WhatsApp message to the ADMIN_PHONE_NUMBER (from env) with this format:

     ```
     🚨 *New Escalation Alert*

     👤 Customer: {customerName}
     📱 Phone: {customerPhone}
     📝 Reason: {reason}

     💬 Last message:
     "{lastCustomerMessage}"

     ⏰ Time: {formatted current time in IST}
     ```

  4. Send a message to the customer:
     "I'm connecting you with our team at Varni Enterprise. A representative will get back
     to you shortly. Thank you for your patience! 🙏"
  5. Return the escalation record

- `getEscalation(escalationId)` — get a single escalation with its conversation populated

- `getPendingEscalations()` — get all escalations with status 'pending' or 'in_progress',
  sorted by newest first, populated with conversation data

- `resolveEscalation(escalationId, adminNotes?)`:
  1. Update escalation status to 'resolved', set resolvedAt
  2. Update the linked conversation status to 'resolved'
  3. Optionally store admin notes
  4. Return the updated escalation

- `getEscalationByConversation(conversationId)` — find the active escalation for a
  conversation

### 3. Update `src/routes/webhook.routes.js` — Wire Escalation Into Message Flow
Update the POST webhook handler to use the escalation service:

When the AI returns `shouldEscalate: true`:
1. Call `escalation.service.createEscalation()` with all the context
2. This will handle: customer message, admin notification, conversation status update
3. Do NOT send the AI's reply text — the escalation service sends its own message

When a message comes from an already-escalated conversation:
1. Do NOT call the AI
2. Forward the message to the admin by sending another WhatsApp notification:
````

📩 _New message from escalated customer_

👤 {customerName} ({customerPhone}):
"{messageBody}"

```
3. Still save the message to the conversation history in MongoDB

### 4. Also handle the edge case:
- If a message arrives from the ADMIN_PHONE_NUMBER, ignore it (don't process it as a
customer message, don't trigger AI — this prevents infinite loops if the admin texts
the bot number)

### Important Notes:
- The ADMIN_PHONE_NUMBER is stored in env config. Use it to send escalation notifications.
- Messages to the admin use the same whatsapp.service.sendTextMessage() function — just
send to the admin's number instead of the customer's.
- All escalation events should be logged with winston (creation, resolution, forwarded
messages).
- Make sure the escalation notification is sent AFTER the customer message is saved to
the conversation history.
```

---

### ✅ Testing Checklist for Phase 3

1. **Escalation via explicit request:**
   - [ ] Send: "I want to speak to a human" → Bot replies with "connecting you with our team" message
   - [ ] Your admin phone receives the 🚨 escalation alert with customer name, phone, reason, and last message
   - [ ] Check MongoDB — `escalations` collection has a new record with status `pending`
   - [ ] Check MongoDB — `conversations` collection shows status `escalated`

2. **Escalation via order request:**
   - [ ] Start a new conversation (or use a different number)
   - [ ] Send: "I want to order 200 rolls of 79mm thermal paper"
   - [ ] Bot escalates → admin gets notification → customer gets "connecting you" message

3. **Post-escalation message forwarding:**
   - [ ] After escalation, send another message: "Hello? Are you there?"
   - [ ] Bot does NOT reply to the customer
   - [ ] Admin phone receives: "📩 New message from escalated customer: ..."
   - [ ] Message is saved to conversation history in MongoDB

4. **Admin phone exclusion:**
   - [ ] Send a message FROM the admin phone number TO the bot → Bot ignores it (no crash, no AI call, no reply)

5. **Multiple escalations:**
   - [ ] Trigger 2 escalations from different conversations
   - [ ] Check MongoDB — 2 separate escalation records exist
   - [ ] Admin received notifications for both

> **✋ Before moving to Phase 4**: Escalation should be fully working end-to-end — AI detects, customer gets notified, admin gets WhatsApp alert, bot goes silent for that conversation, and subsequent messages from that customer are forwarded to admin.

---

---

## Phase 4: Admin Dashboard — React Frontend

> This phase builds a web-based admin dashboard where Varni Enterprise can view conversations, handle escalations (reply + resolve), and manage the product catalog (add/edit/delete products).

---

### 📋 Prompt for Phase 4

```
I'm building a WhatsApp AI chatbot for "Varni Enterprise" (thermal packaging products).
The project is at: c:\Users\meetv\Desktop\varni-enterprise-chatbot

The backend (Node.js + Express) is complete at `server/`. It has:
- WhatsApp webhook integration (Meta Cloud API)
- OpenAI GPT-4o for intelligent responses
- MongoDB models: Product, Conversation, Escalation
- Escalation system with owner WhatsApp notifications

Now build Phase 4 — a React admin dashboard at `dashboard/` using Vite. This dashboard lets
the business owner:
1. See an overview of bot activity
2. View all customer conversations
3. Handle escalated conversations (reply to customer + resolve)
4. Manage the product catalog (CRUD)

---

### Part A: Backend — Admin API Routes

First, implement the admin API endpoints in `server/src/routes/admin.routes.js`:

**Dashboard Stats:**
- `GET /api/admin/stats` — Returns:
  - `totalConversations`: count of all conversations
  - `activeConversations`: count where status is 'active'
  - `escalatedConversations`: count where status is 'escalated'
  - `totalMessages`: sum of all messages across conversations (today)
  - `totalProducts`: count of products

**Conversations:**
- `GET /api/admin/conversations` — List all conversations, sorted by lastMessageAt desc
  - Support query params: `?status=active|escalated|resolved` for filtering
  - Return: phoneNumber, customerName, status, lastMessageAt, message count, last message
    preview (truncated to 50 chars)
- `GET /api/admin/conversations/:id` — Full conversation with all messages
- `POST /api/admin/conversations/:id/reply` — Send a manual reply to the customer
  - Body: `{ message: "reply text" }`
  - Sends the message via WhatsApp service to the customer's phone number
  - Saves the message to conversation history with role 'assistant'
  - Returns the updated conversation

**Escalations:**
- `GET /api/admin/escalations` — List all escalations, sorted by createdAt desc
  - Support query params: `?status=pending|in_progress|resolved`
  - Populate conversation data (customerName, phoneNumber, last messages)
- `PATCH /api/admin/escalations/:id/resolve` — Resolve an escalation
  - Body: `{ adminNotes?: "optional notes" }`
  - Updates escalation status to 'resolved'
  - Updates conversation status to 'resolved' (so a new conversation starts if customer
    texts again)

**Products:**
- `GET /api/admin/products` — List all products
- `POST /api/admin/products` — Create a product
  - Body: { name, category, description, specifications, price, moq, inStock, applications }
- `PUT /api/admin/products/:id` — Update a product
- `DELETE /api/admin/products/:id` — Delete a product

Add proper error handling to all routes. Return appropriate HTTP status codes (200, 201, 400,
404, 500).

---

### Part B: React Dashboard (Vite)

Initialize a React project using Vite in the `dashboard/` directory. Use vanilla CSS for
styling (no Tailwind).

**Design Requirements:**
- Dark theme with a professional, modern look
- Color palette: Dark backgrounds (#0f0f0f, #1a1a2e), accent color teal/cyan (#00d4aa),
  subtle borders (#2a2a3e)
- Use Inter font from Google Fonts
- Responsive sidebar navigation
- Smooth transitions and hover effects
- Clean card-based layouts

**Pages to build:**

#### 1. Sidebar / Navigation
- Fixed sidebar on the left with:
  - Logo/brand: "Varni Enterprise" with a small bot icon
  - Nav items: Dashboard, Conversations, Escalations, Products
  - Active page highlighted with accent color
  - Collapsible on mobile

#### 2. Dashboard Page (`/`)
- 4 stat cards in a grid:
  - Total Conversations (icon: 💬)
  - Active Conversations (icon: 🟢)
  - Pending Escalations (icon: 🚨) — highlighted if > 0
  - Total Products (icon: 📦)
- Fetch data from `GET /api/admin/stats`
- Auto-refresh every 30 seconds

#### 3. Conversations Page (`/conversations`)
- Table/list of all conversations:
  - Columns: Customer Name, Phone, Status (colored badge), Last Message (preview),
    Last Active, Messages Count
  - Click a row to open the conversation thread
  - Filter dropdown: All / Active / Escalated / Resolved
- **Conversation Detail View** (can be a slide-out panel or separate section):
  - Shows full message history in a chat-bubble style UI
  - User messages on the left (grey bubbles), bot messages on the right (teal bubbles)
  - Timestamps under each message
  - If conversation is escalated: show a reply input at the bottom
  - Reply input: text field + Send button → calls POST `/api/admin/conversations/:id/reply`

#### 4. Escalations Page (`/escalations`)
- List of escalated conversations:
  - Customer name, phone, reason, time since escalation, status badge
  - Click to expand → shows recent conversation history + reply form
  - "Resolve" button → calls PATCH `/api/admin/escalations/:id/resolve`
  - Resolved escalations shown in a separate "Resolved" tab

#### 5. Products Page (`/products`)
- Product cards/grid showing all products:
  - Product name, category, price, stock status (green/red badge), description preview
- "Add Product" button → opens a form modal:
  - Fields: name, category, description, specifications (dynamic key-value pairs),
    price, MOQ, in-stock toggle, applications (comma-separated tags)
  - Save → POST `/api/admin/products`
- Edit button on each card → opens same form pre-filled
- Delete button with confirmation dialog

**Technical Details:**
- Use React Router for navigation (react-router-dom)
- Use fetch() for API calls (no axios needed on frontend)
- API base URL: `http://localhost:3000/api/admin` (configure via env or constant)
- Add a Vite proxy to avoid CORS during development:
  In vite.config.js: proxy `/api` to `http://localhost:3000`
- Handle loading states (spinner/skeleton) and error states for all API calls

**Don't forget:** Update the server's CORS config to allow requests from the dashboard
origin (e.g., `http://localhost:5173`).
```

---

### ✅ Testing Checklist for Phase 4

1. **Backend API works:**
   - [ ] `GET http://localhost:3000/api/admin/stats` returns valid stats JSON
   - [ ] `GET http://localhost:3000/api/admin/conversations` returns conversation list
   - [ ] `GET http://localhost:3000/api/admin/products` returns seeded products
   - [ ] `POST http://localhost:3000/api/admin/products` with a JSON body creates a product

2. **Dashboard starts:**

   ```bash
   cd dashboard
   npm run dev
   ```

   - [ ] Dashboard opens at `http://localhost:5173`
   - [ ] Sidebar shows navigation items
   - [ ] Dashboard page shows 4 stat cards with correct numbers

3. **Conversations page:**
   - [ ] Shows all conversations from the database
   - [ ] Status filter works (All / Active / Escalated / Resolved)
   - [ ] Clicking a conversation shows the full message thread in chat-bubble style
   - [ ] Messages are in the correct order with timestamps

4. **Escalation handling:**
   - [ ] Escalations page shows pending escalations
   - [ ] Expanding an escalation shows conversation history
   - [ ] Typing a reply and clicking Send → message appears in the chat + customer receives it on WhatsApp
   - [ ] Clicking "Resolve" → escalation moves to resolved, conversation status updates

5. **Product management:**
   - [ ] Products page shows all products
   - [ ] "Add Product" opens form, filling it out and saving creates the product
   - [ ] Editing a product updates its details
   - [ ] Deleting a product removes it (with confirmation)
   - [ ] After updating a product, sending a WhatsApp message about that product → bot uses updated data

6. **Design quality:**
   - [ ] Dark theme looks polished and professional
   - [ ] Hover effects and transitions are smooth
   - [ ] Layout is responsive (looks good on both desktop and mobile browser)

> **✋ Before moving to Phase 5**: The admin dashboard should be fully functional — stats display correctly, conversations are viewable, escalations can be replied to and resolved, and products can be managed. After editing a product, the bot should use the updated data.

---

---

## Phase 5: Security, Polish & Railway Deployment

> This phase hardens the application (signature verification, rate limiting, deduplication), adds final polish, and deploys everything to Railway.

---

### 🧑‍💻 Steps YOU Must Complete During This Phase

#### A. Railway Setup

1. Go to [https://railway.com](https://railway.com) and sign in with GitHub.
2. Railway's **Hobby plan ($5/month)** has no cold starts — services run 24/7.
3. You'll deploy 2 services: the backend server and the dashboard.

#### B. Production WhatsApp Token

1. Go to [business.facebook.com](https://business.facebook.com) → Business Settings → System Users.
2. Create a System User (type: Admin).
3. Add Assets → select your WhatsApp Business Account → enable full control.
4. Generate Token → select your app → add permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Copy the **permanent token** — replace the temporary one in your `.env`.

#### C. Update Webhook URL

1. After deploying to Railway, you'll get a public URL like `https://your-app.up.railway.app`.
2. Go to Meta Developer Portal → WhatsApp → Configuration → Webhook → Edit.
3. Update the Callback URL to: `https://your-app.up.railway.app/webhook`.
4. Verify and save.

---

### 📋 Prompt for Phase 5

```
I'm building a WhatsApp AI chatbot for "Varni Enterprise". The project is at:
c:\Users\meetv\Desktop\varni-enterprise-chatbot

The entire application is functional:
- `server/` — Node.js + Express backend with WhatsApp webhook, OpenAI AI engine,
  conversation tracking, escalation system, and admin API routes
- `dashboard/` — React + Vite admin dashboard with conversations, escalations, and products

Now implement Phase 5 — security hardening, polish, and deployment preparation.

### 1. `src/middleware/signature.js` — Webhook Signature Verification
Implement Meta's webhook signature verification:
- Extract the `x-hub-signature-256` header from the request
- Compute HMAC-SHA256 of the raw request body using WHATSAPP_APP_SECRET as the key
- Compare with the signature from the header (use crypto.timingSafeEqual to prevent
  timing attacks)
- If valid, call next(). If invalid, return 401.
- IMPORTANT: This middleware needs the raw body. Update index.js to use
  `express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })` so we capture
  the raw buffer before JSON parsing.
- Apply this middleware ONLY to the POST /webhook route (not GET verification, not admin
  routes)

### 2. Message Deduplication
Meta may retry webhooks if the response is slow. Implement deduplication:
- In the webhook POST handler, maintain an in-memory Set (or simple Map with TTL) of
  processed message IDs (wamid)
- Before processing a message, check if its ID was already processed
- If yes, skip processing and just return 200
- Auto-clean entries older than 5 minutes to prevent memory growth
- Log when a duplicate is detected

### 3. Rate Limiting
Add basic rate limiting to the admin API:
- Use a simple in-memory rate limiter (or the `express-rate-limit` package)
- Limit admin API routes to 100 requests per minute per IP
- Limit webhook to 1000 requests per minute (Meta sends a lot of status updates)
- Return 429 Too Many Requests when exceeded

### 4. Error Handling
Add a global error handler middleware in index.js:
- Catches unhandled errors from any route
- Logs the full error with stack trace
- Returns a clean JSON error response: `{ error: "Internal server error" }`
- Never expose internal error details to the client

Also add unhandled rejection and uncaught exception handlers at the process level
to log and exit gracefully.

### 5. Deployment Configuration

#### Server (`server/`)
- Create a `Procfile` or update package.json start script for Railway
- Make sure the server binds to `0.0.0.0` (not just localhost) and uses `process.env.PORT`
- Create a `railway.json` or `nixpacks.toml` if needed to specify the build:
  - Build command: `npm install`
  - Start command: `npm start`
- Ensure CORS allows the dashboard's Railway URL (configure via env var: DASHBOARD_URL)

#### Dashboard (`dashboard/`)
- Add an environment variable for the API URL: `VITE_API_URL`
- Update all fetch calls to use `VITE_API_URL` instead of hardcoded localhost
- Add a build step: `npm run build` → outputs to `dist/`
- The dashboard can be deployed as a static site on Railway or use `serve` package:
  - Add `serve` as a dependency
  - Start command: `npx serve dist -s -l $PORT`

#### Root Level
- Create a `.gitignore` at the workspace root that covers both server and dashboard
- Update `README.md` with:
  - Full setup instructions
  - Environment variable reference
  - Local development instructions (both server + dashboard)
  - Deployment instructions (Railway)
  - Architecture overview

### 6. Environment Variable Documentation
Update `server/.env.example` to include:
- All existing variables
- `DASHBOARD_URL` — for CORS (e.g., https://varni-dashboard.up.railway.app)
- Add comments explaining which variables are required vs optional

Create `dashboard/.env.example` with:
- `VITE_API_URL=http://localhost:3000` (for dev)
  Comment: In production, set to your Railway backend URL

### Important Notes:
- Railway provides environment variables via their dashboard. No .env file is used in
  production — you set variables in Railway's UI.
- Railway auto-detects Node.js projects and runs `npm install` + `npm start`.
- For the dashboard, Railway can deploy static sites from the `dist/` folder after build.
- The Hobby plan ($5/month) keeps services running 24/7 with no cold starts.
```

---

### ✅ Testing Checklist for Phase 5

1. **Signature verification:**
   - [ ] Valid webhook requests from Meta are processed normally
   - [ ] Manually sending a POST to `/webhook` without a valid signature → returns 401
   - [ ] GET `/webhook` (verification) still works without signature check

2. **Deduplication:**
   - [ ] Send a message → processed once
   - [ ] Server logs show "Duplicate message detected, skipping" if Meta retries

3. **Rate limiting:**
   - [ ] Rapidly hitting admin API routes → eventually returns 429
   - [ ] Normal usage is unaffected

4. **Error handling:**
   - [ ] Force an error (e.g., disconnect MongoDB) → API returns clean error JSON, no crash
   - [ ] Server logs the full error stack trace

5. **Production build (local test):**
   - [ ] `cd server && npm start` works (production mode)
   - [ ] `cd dashboard && npm run build` succeeds → `dist/` folder created
   - [ ] Serving the dashboard build: `npx serve dist -s` → dashboard loads and connects to API

6. **Railway deployment:**
   - [ ] Push code to a GitHub repository
   - [ ] Create 2 Railway services: backend + dashboard
   - [ ] Set all environment variables in Railway's UI
   - [ ] Backend is live at `https://xxx.up.railway.app/health` → returns `{"status":"ok"}`
   - [ ] Dashboard is live and connects to the backend
   - [ ] Update Meta webhook URL to Railway URL → webhook verification succeeds
   - [ ] Send a WhatsApp message → bot responds correctly via Railway

7. **End-to-end production test:**
   - [ ] Customer sends product inquiry on WhatsApp → AI responds accurately
   - [ ] Customer asks to speak to a human → Escalation created, owner gets WhatsApp notification
   - [ ] Admin opens dashboard → sees the escalation, replies, resolves
   - [ ] After resolution, customer sends new message → bot responds again (new conversation)
   - [ ] Admin edits a product price → next customer inquiry reflects the updated price

> **🎉 Done!** If all checks pass, the Varni Enterprise WhatsApp AI Chatbot is fully deployed and operational!

---

---

## Quick Reference: Phase Summary

| Phase | What Gets Built                             | You Must Do                                                                  |
| :---- | :------------------------------------------ | :--------------------------------------------------------------------------- |
| **0** | Project scaffolding, env config, logger     | MongoDB Atlas setup, Meta app config, OpenAI key, create `.env`              |
| **1** | Express server, webhook, WhatsApp messaging | Install ngrok, configure webhook URL in Meta portal, test with real WhatsApp |
| **2** | OpenAI AI engine, product DB, conversations | Run seed script, test AI responses via WhatsApp                              |
| **3** | Escalation system, owner notifications      | Verify escalation notifications arrive on admin's WhatsApp                   |
| **4** | React admin dashboard (full CRUD)           | Test dashboard in browser, manage products/escalations                       |
| **5** | Security, polish, Railway deployment        | Railway account, GitHub repo, production WhatsApp token, update webhook URL  |
