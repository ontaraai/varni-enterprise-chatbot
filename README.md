# Varni Packaging — WhatsApp AI Chatbot

An intelligent WhatsApp chatbot for **Varni Packaging** that answers customer queries about thermal labels, provides pricing, and escalates complex requests to the business owner — powered by OpenAI GPT-4o.

## Architecture

```
Customer (WhatsApp)
    │
    ▼
Meta Cloud API ──────► Express Server (Node.js)
    │                     ├── Webhook handler
    │                     ├── OpenAI GPT-4o (AI engine)
    │                     ├── MongoDB (conversations, products, escalations)
    │                     ├── Escalation → Owner WhatsApp notification
    │                     └── Admin REST API
    │
    ▼
React Dashboard (Vite)
    ├── Conversation viewer + live reply
    ├── Escalation management
    └── Product catalog CRUD
```

### Key Features

- **Multilingual**: Responds in English, Hindi (Hinglish), or Gujarati (Gujarlish) — matches the customer's language
- **Smart Escalation**: Detects bulk orders, complaints, or custom requests and notifies the owner via WhatsApp
- **Admin Dashboard**: Real-time conversation viewer, escalation management, product catalog editor
- **Security**: Webhook signature verification, message deduplication, rate limiting
- **Mobile-Friendly Dashboard**: Full responsive design with hamburger menu, off-canvas sidebar

---

## Project Structure

```
varni-enterprise-chatbot/
├── server/                     # Node.js + Express backend
│   ├── src/
│   │   ├── config/env.js       # Environment config with validation
│   │   ├── middleware/
│   │   │   ├── signature.js    # Meta webhook signature verification
│   │   │   └── rateLimiter.js  # In-memory rate limiting
│   │   ├── models/             # Mongoose models
│   │   │   ├── conversation.model.js
│   │   │   ├── escalation.model.js
│   │   │   └── product.model.js
│   │   ├── prompts/system.js   # GPT-4o system prompt + product catalog
│   │   ├── routes/
│   │   │   ├── webhook.routes.js  # WhatsApp webhook (GET verify + POST messages)
│   │   │   └── admin.routes.js    # Dashboard API (stats, conversations, escalations, products)
│   │   ├── services/
│   │   │   ├── whatsapp.service.js  # Meta Cloud API wrapper
│   │   │   ├── openai.service.js    # GPT-4o integration
│   │   │   ├── conversation.service.js
│   │   │   └── escalation.service.js
│   │   ├── utils/
│   │   │   ├── logger.js            # Winston logger
│   │   │   ├── messageParser.js     # Webhook payload parser
│   │   │   ├── whatsappFormatter.js # Markdown → WhatsApp formatting
│   │   │   └── dedup.js             # Message deduplication
│   │   ├── seeds/productSeed.js     # Database seeder
│   │   └── index.js                 # Express app entry point
│   ├── .env.example
│   └── package.json
│
├── dashboard/                  # React + Vite admin frontend
│   ├── src/
│   │   ├── api/admin.js        # API client
│   │   ├── components/Sidebar.jsx
│   │   ├── context/SidebarContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Conversations.jsx
│   │   │   ├── Escalations.jsx
│   │   │   └── Products.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB (Atlas or local)
- Meta Developer account with WhatsApp Cloud API access
- OpenAI API key
- ngrok (for local webhook testing)

### 1. Clone & install

```bash
git clone <your-repo-url>
cd varni-enterprise-chatbot

# Install server dependencies
cd server
npm install

# Install dashboard dependencies
cd ../dashboard
npm install
```

### 2. Configure environment

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your actual API keys

# Dashboard (optional for local dev — Vite proxy handles it)
cp dashboard/.env.example dashboard/.env
```

### 3. Seed the database

```bash
cd server
npm run seed
```

### 4. Start development servers

```bash
# Terminal 1 — Backend (port 3000)
cd server
npm run dev

# Terminal 2 — Dashboard (port 5173)
cd dashboard
npm run dev

# Terminal 3 — ngrok tunnel (for Meta webhooks)
ngrok http 3000
```

### 5. Configure Meta webhook

1. Go to [Meta Developer Portal](https://developers.facebook.com) → your app → WhatsApp → Configuration
2. Set Callback URL to your ngrok URL + `/webhook` (e.g., `https://abc123.ngrok.io/webhook`)
3. Set Verify Token to match `WHATSAPP_VERIFY_TOKEN` in your `.env`
4. Subscribe to `messages` webhook field

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|:---------|:---------|:------------|
| `WHATSAPP_TOKEN` | ✅ | Meta Cloud API access token |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ | WhatsApp Business phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | ✅ | Custom string for webhook verification |
| `WHATSAPP_APP_SECRET` | ✅ | App secret for webhook signature verification |
| `ADMIN_PHONE_NUMBER` | ✅ | Owner's WhatsApp number (country code + digits) |
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `PORT` | ❌ | Server port (default: 3000) |
| `NODE_ENV` | ❌ | `development` or `production` |
| `DASHBOARD_URL` | ❌ | Dashboard URL for CORS (production only) |

### Dashboard (`dashboard/.env`)

| Variable | Required | Description |
|:---------|:---------|:------------|
| `VITE_API_URL` | ❌ (dev) / ✅ (prod) | Backend API URL (e.g., `https://varni-api.up.railway.app`) |

---

## Deployment (Railway)

### 1. Create Railway project

1. Sign in to [railway.com](https://railway.com) with GitHub
2. Create a new project from your GitHub repo
3. You'll deploy 2 services: **server** and **dashboard**

### 2. Deploy the backend

1. Add a new service → select your repo
2. Set root directory to `server/`
3. Railway auto-detects Node.js: runs `npm install` + `npm start`
4. Add all environment variables from `server/.env.example` in Railway's Variables tab
5. Set `NODE_ENV=production`
6. Set `DASHBOARD_URL` to your dashboard's Railway URL

### 3. Deploy the dashboard

1. Add another service → select your repo
2. Set root directory to `dashboard/`
3. Build command: `npm run build`
4. Start command: `npx serve dist -s -l $PORT`
5. Add variable: `VITE_API_URL=https://your-server.up.railway.app`

### 4. Update Meta webhook

1. Go to Meta Developer Portal → WhatsApp → Configuration → Webhook
2. Update Callback URL to: `https://your-server.up.railway.app/webhook`
3. Verify and save

### 5. Production WhatsApp token

1. Go to [business.facebook.com](https://business.facebook.com) → Business Settings → System Users
2. Create a System User (type: Admin)
3. Add Assets → select WhatsApp Business Account → full control
4. Generate Token with permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
5. Update `WHATSAPP_TOKEN` in Railway with the permanent token

---

## API Endpoints

### Webhook
| Method | Path | Description |
|:-------|:-----|:------------|
| `GET` | `/webhook` | Meta webhook verification |
| `POST` | `/webhook` | Incoming WhatsApp messages |

### Admin API
| Method | Path | Description |
|:-------|:-----|:------------|
| `GET` | `/api/admin/stats` | Dashboard statistics |
| `GET` | `/api/admin/conversations` | List conversations (filter: `?status=active`) |
| `GET` | `/api/admin/conversations/:id` | Conversation detail with messages |
| `POST` | `/api/admin/conversations/:id/reply` | Send reply to customer |
| `GET` | `/api/admin/escalations` | List escalations (filter: `?status=pending`) |
| `PATCH` | `/api/admin/escalations/:id/resolve` | Resolve an escalation |
| `GET` | `/api/admin/products` | List all products |
| `POST` | `/api/admin/products` | Create product |
| `PUT` | `/api/admin/products/:id` | Update product |
| `DELETE` | `/api/admin/products/:id` | Delete product |

### Utility
| Method | Path | Description |
|:-------|:-----|:------------|
| `GET` | `/health` | Health check |
| `GET` | `/privacy` | Privacy policy page |

---

## License

ISC — Varni Packaging
