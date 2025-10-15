# 📦 Monorepo Integration - Evolution API + WhatsApp Bulk Sender

## 🎯 Project Structure

This WhatsApp Bulk Sender is integrated into the Evolution API monorepo:

```
evolution-api/                          ← Main Evolution API project
├── docker-compose.yaml                 ← Evolution API Docker setup
├── .env                                ← Evolution API configuration
├── src/                                ← Evolution API source code
├── prisma/                             ← Evolution API database
│
└── whatsapp-bulk-sender/              ← **Bulk Sender (This Project)**
    ├── config/
    │   ├── api.config.js              ← Points to Evolution API
    │   └── instances.json             ← 15 WhatsApp accounts
    ├── data/
    │   ├── account_01/                ← Excel files per account
    │   ├── account_02/
    │   └── ...
    ├── scripts/
    │   ├── create-instances.js        ← Create WhatsApp instances
    │   ├── connect-accounts.js        ← Connect via QR codes
    │   ├── check-status.js            ← Monitor connections
    │   └── send-messages.js           ← Send bulk messages
    ├── utils/
    │   ├── phone-formatter.js         ← Indian number formatter
    │   ├── excel-reader.js            ← Read Excel files
    │   ├── rate-limiter.js            ← Rate limiting
    │   └── logger.js                  ← Logging system
    └── logs/                          ← All logs here
```

---

## 🔗 How They Work Together

### Evolution API (Parent Project)
- **Runs on:** `http://localhost:8080`
- **Purpose:** WhatsApp connection management via REST API
- **Docker:** PostgreSQL + Redis + Evolution API
- **Handles:** QR codes, connections, message sending

### WhatsApp Bulk Sender (This Project)
- **Purpose:** Manage 15 accounts + Excel-based bulk messaging
- **Connects to:** Evolution API at `http://localhost:8080`
- **API Key:** Configured in `config/api.config.js`
- **Handles:** Excel files, rate limiting, logging, status monitoring

---

## 🚀 Complete Setup Guide

### Step 1: Start Evolution API

```bash
# From evolution-api root
cd /Users/srjay/Downloads/GitHub/evolution-api

# Start Docker services
docker-compose up -d

# Verify Evolution API is running
curl http://localhost:8080 -H "apikey: 429683C4C977415CAAFCCE10F7D57E11"
```

**Expected output:**
```json
{"status":200,"message":"Welcome to the Evolution API, it is working!"}
```

### Step 2: Setup Bulk Sender

```bash
# Navigate to bulk sender directory
cd whatsapp-bulk-sender

# Install dependencies (if not already done)
npm install

# Verify configuration
cat config/api.config.js
```

**Ensure API_URL points to Evolution API:**
```javascript
API_URL: 'http://localhost:8080'
```

### Step 3: Create WhatsApp Instances

```bash
# From whatsapp-bulk-sender directory
npm run create-instances
```

This creates 15 instances (wa_account_01 to wa_account_15) in Evolution API.

### Step 4: Connect Accounts

```bash
# Connect first account
node scripts/connect-accounts.js 1

# Scan QR code with WhatsApp
# Wait for "Connected successfully!"
```

### Step 5: Add Contacts & Send

```bash
# Check status
npm run status

# Add contacts to data/account_01/contacts.xlsx

# Test message
npm run test 1 9876543210 "Hello India!"

# Send bulk
node scripts/send-messages.js send 1
```

---

## 📊 Monorepo Benefits

✅ **Single Docker Setup:** Evolution API runs once, serves all 15 accounts
✅ **Shared Database:** All WhatsApp instances use same PostgreSQL
✅ **Unified Management:** Start/stop everything with docker-compose
✅ **API Reuse:** Bulk sender uses Evolution API endpoints
✅ **Clean Separation:** Independent code but integrated functionality

---

## 🔧 Configuration

### Evolution API (.env in root)
```bash
# Main API configuration
SERVER_URL=http://localhost:8080
AUTHENTICATION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI='postgresql://...'
```

### Bulk Sender (config/api.config.js)
```javascript
module.exports = {
  // Points to Evolution API
  API_URL: 'http://localhost:8080',

  // Same API key as Evolution API
  API_KEY: '429683C4C977415CAAFCCE10F7D57E11',

  // Bulk sender specific settings
  MESSAGE_DELAY_MIN: 3000,
  MESSAGE_DELAY_MAX: 5000,
  DEFAULT_DAILY_LIMIT: 500,
};
```

---

## 🎯 Directory Navigation

### From Evolution API Root:
```bash
# Check Evolution API
docker-compose ps

# Navigate to bulk sender
cd whatsapp-bulk-sender

# Run commands
npm run status
node scripts/send-messages.js send 1
```

### From Bulk Sender:
```bash
# Go back to Evolution API root
cd ..

# Check Evolution API logs
docker-compose logs api

# Check Redis
docker-compose logs redis

# Return to bulk sender
cd whatsapp-bulk-sender
```

---

## 📝 Common Operations

### Start Everything:
```bash
# From evolution-api root
docker-compose up -d

# Then use bulk sender
cd whatsapp-bulk-sender
npm run status
```

### Stop Everything:
```bash
# From evolution-api root
docker-compose down

# Bulk sender scripts will show connection errors (expected)
```

### Restart Evolution API:
```bash
# From evolution-api root
docker-compose restart api

# Wait 10 seconds, then test
cd whatsapp-bulk-sender
npm run status
```

---

## 🔍 Troubleshooting

### "Connection refused" Error:
```bash
# Check Evolution API is running
cd /Users/srjay/Downloads/GitHub/evolution-api
docker-compose ps

# Restart if needed
docker-compose restart api
```

### "Instance not found" Error:
```bash
cd whatsapp-bulk-sender
npm run create-instances
```

### Cannot find module errors:
```bash
cd whatsapp-bulk-sender
npm install
```

---

## 📂 File Paths Reference

| Component | Path | Description |
|-----------|------|-------------|
| **Evolution API Root** | `/Users/srjay/Downloads/GitHub/evolution-api/` | Main project |
| **Docker Compose** | `evolution-api/docker-compose.yaml` | Start services |
| **API .env** | `evolution-api/.env` | Evolution API config |
| **Bulk Sender Root** | `evolution-api/whatsapp-bulk-sender/` | This project |
| **Bulk Config** | `whatsapp-bulk-sender/config/` | Bulk sender settings |
| **Excel Files** | `whatsapp-bulk-sender/data/account_XX/` | Contact lists |
| **Scripts** | `whatsapp-bulk-sender/scripts/` | Operational scripts |
| **Logs** | `whatsapp-bulk-sender/logs/` | All logs |

---

## 🎉 Integration Summary

```
┌─────────────────────────────────────┐
│      Evolution API (Docker)         │
│                                     │
│  ┌─────────┐  ┌──────────────┐    │
│  │PostgreSQL│  │ Evolution API │    │
│  │         │  │   :8080       │    │
│  └─────────┘  └──────────────┘    │
│       │              │             │
│  ┌─────────┐         │             │
│  │  Redis  │         │             │
│  └─────────┘         │             │
└──────────────────────┼─────────────┘
                       │
                       │ REST API
                       │
           ┌───────────▼──────────────┐
           │  WhatsApp Bulk Sender    │
           │                          │
           │  • 15 Accounts           │
           │  • Excel Files           │
           │  • Rate Limiting         │
           │  • Status Monitoring     │
           │  • Logging               │
           └──────────────────────────┘
```

**Benefits:**
- ✅ Single Docker setup for API
- ✅ Independent bulk sender logic
- ✅ Shared database and cache
- ✅ Unified authentication
- ✅ Easy to maintain and scale

---

## 🚀 Quick Commands Cheat Sheet

```bash
# From evolution-api root
docker-compose up -d              # Start Evolution API
docker-compose ps                 # Check status
docker-compose logs -f api        # View API logs

# From whatsapp-bulk-sender
npm run create-instances          # Create 15 instances
node scripts/connect-accounts.js 1  # Connect account
npm run status                    # Check all connections
npm run test 1 9876543210 "Test" # Send test message
node scripts/send-messages.js send 1  # Send bulk
```

---

**Monorepo setup complete! Evolution API + Bulk Sender working together! 🎉**
