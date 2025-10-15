# WhatsApp Bulk Message Sender

A comprehensive Node.js application to manage **15 WhatsApp accounts** for bulk message sending using **Evolution API**.

## 🚀 Features

- ✅ Manage 15 WhatsApp accounts simultaneously
- ✅ Read contacts from Excel files (.xlsx, .xls)
- ✅ Personalized messages with {name} placeholder
- ✅ Rate limiting (3-5 seconds between messages)
- ✅ Daily message limits per account (configurable)
- ✅ Connection status monitoring
- ✅ Comprehensive logging system
- ✅ Color-coded console output
- ✅ QR code scanning for WhatsApp Web connection

---

## 📋 Prerequisites

1. **Evolution API** running (Docker): http://localhost:8080
2. **Node.js** 14+ installed
3. **npm** or **yarn** package manager

---

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd /Users/srjay/Downloads/GitHub/whatsapp-bulk-sender
npm install
```

### 2. Configure API Settings

Edit `config/api.config.js`:
- Update `API_URL` if Evolution API is not on localhost
- Verify `API_KEY` matches your Evolution API configuration
- Adjust rate limits and daily message limits as needed

---

## 📖 Usage Guide

### Step 1: Create WhatsApp Instances

Create all 15 instances in Evolution API:

```bash
npm run create-instances
```

Or create a specific instance (1-15):

```bash
node scripts/create-instances.js 1
```

**What this does:**
- Creates 15 WhatsApp instances named `wa_account_01` to `wa_account_15`
- Registers them with Evolution API
- Updates `config/instances.json`

---

### Step 2: Connect WhatsApp Accounts

Connect instances and scan QR codes:

```bash
npm run connect
```

Or connect a specific account:

```bash
node scripts/connect-accounts.js 1
```

**What this does:**
- Generates QR codes for each instance
- Displays QR codes in terminal (one by one)
- Waits for you to scan with WhatsApp mobile app
- Saves connection status

**Important:** Have your phones ready to scan QR codes!

---

### Step 3: Check Connection Status

View status of all instances:

```bash
npm run status
```

Watch mode (auto-refresh every 10 seconds):

```bash
npm run status:watch
```

Or check specific instance:

```bash
node scripts/check-status.js 1
```

**Output:**
```
 ID    | Name              | Phone             | Status        | Last Connected
---------------------------------------------------------------------------------
 ✓ 1   | wa_account_01     | +5511999999999    | ✓ open        | 2m ago
 ✗ 2   | wa_account_02     | -                 | ✗ close       | Never
```

---

### Step 4: Prepare Excel Files

Place Excel files in respective account folders:

```
data/
├── account_01/contacts.xlsx
├── account_02/contacts.xlsx
├── ...
└── account_15/contacts.xlsx
```

**Excel File Format:**

| Name       | Phone          | Message (optional)       |
|------------|----------------|--------------------------|
| John Doe   | +5511999999999 | Hi John, how are you?    |
| Jane Smith | +5511888888888 |                          |
| Bob Wilson | 5511777777777  | Hello {name}!            |

**Supported Columns:**
- **Name**: Contact name (used for {name} placeholder)
- **Phone**: Phone number with country code (e.g., +55 for Brazil)
- **Message**: Custom message per contact (optional)

**Phone Format:**
- With country code: `+5511999999999` or `5511999999999`
- Without spaces or special characters (cleaned automatically)

---

### Step 5: Send Messages

#### Test Single Message

Test before bulk sending:

```bash
npm run test 1 +5511999999999 "Hello, this is a test message!"
```

#### Send from One Instance

Send to all contacts in instance 1's Excel file:

```bash
node scripts/send-messages.js send 1
```

With custom message (overrides Excel message column):

```bash
node scripts/send-messages.js send 1 "Hi {name}, special offer for you!"
```

#### Send from All Instances

Send from all 15 accounts:

```bash
node scripts/send-messages.js send-all "Hello everyone!"
```

**Message Personalization:**

Use `{name}` in your message to insert contact name:

```
"Hello {name}, how are you today?"
```

Becomes:
```
"Hello John Doe, how are you today?"
```

---

## 📁 Project Structure

```
whatsapp-bulk-sender/
├── config/
│   ├── api.config.js         # API configuration
│   └── instances.json        # 15 account configs
├── data/
│   ├── account_01/           # Excel files for account 1
│   ├── account_02/
│   └── ...
├── logs/
│   ├── app.log              # All logs
│   ├── errors.log           # Error logs
│   ├── connections.log      # Connection events
│   └── sent_messages.log    # Sent message records
├── scripts/
│   ├── create-instances.js  # Create WhatsApp instances
│   ├── connect-accounts.js  # Connect & scan QR codes
│   ├── check-status.js      # Check connection status
│   └── send-messages.js     # Send bulk messages
└── utils/
    ├── excel-reader.js      # Read Excel files
    ├── rate-limiter.js      # Rate limiting & daily limits
    └── logger.js            # Logging system
```

---

## ⚙️ Configuration

### API Configuration (`config/api.config.js`)

```javascript
module.exports = {
  API_URL: 'http://localhost:8080',           // Evolution API URL
  API_KEY: '429683C4C977415CAAFCCE10F7D57E11', // Global API Key

  MESSAGE_DELAY_MIN: 3000,  // Min 3 seconds between messages
  MESSAGE_DELAY_MAX: 5000,  // Max 5 seconds between messages

  DEFAULT_DAILY_LIMIT: 500, // 500 messages per day per account
};
```

### Instance Configuration (`config/instances.json`)

Automatically managed, but you can edit:
- `dailyLimit`: Maximum messages per day
- `excelFile`: Path to Excel file for each account

---

## 📊 Rate Limiting

**Automatic Rate Limiting:**
- Random delay between 3-5 seconds per message
- Daily limit: 500 messages per account (configurable)
- Automatic reset at midnight

**Why Rate Limiting?**
- Prevents WhatsApp from flagging your accounts
- Mimics human behavior
- Reduces ban risk

---

## 📝 Logging

All activities are logged:

- **app.log**: All events
- **errors.log**: Errors only
- **connections.log**: Connection events
- **sent_messages.log**: Message sending records

**Log Format:**
```
[2025-01-15T10:30:00.000Z] [SUCCESS] [wa_account_01] Message to +5511999999999: sent
```

---

## 🔧 Troubleshooting

### Instance Not Connecting

```bash
# Check status
npm run status

# Reconnect specific instance
node scripts/connect-accounts.js 1
```

### Messages Not Sending

1. Check connection status: `npm run status`
2. Verify Excel file exists and has correct format
3. Check phone numbers have country codes
4. Review logs: `cat logs/errors.log`

### Daily Limit Reached

Limits reset at midnight automatically. To change limit:

Edit `config/instances.json`:
```json
{
  "id": 1,
  "dailyLimit": 1000  // Increase from 500 to 1000
}
```

---

## 🎯 Best Practices

1. **Test First**: Always send test messages before bulk sending
2. **Phone Numbers**: Always include country code (+55, +91, etc.)
3. **Personalization**: Use {name} to make messages feel personal
4. **Rate Limiting**: Don't modify delays - keep them natural
5. **Daily Limits**: Start with 500/day, increase gradually
6. **Backups**: Keep backup of Excel files
7. **Monitor Status**: Check connection status regularly

---

## 🚨 Important Notes

- **WhatsApp Terms**: Bulk sending may violate WhatsApp Terms of Service
- **Use Responsibly**: Only send to people who opted in
- **Don't Spam**: Respect privacy and anti-spam laws
- **Account Safety**: Use at your own risk - WhatsApp may ban accounts
- **Backup Numbers**: Have backup WhatsApp numbers ready

---

## 🤝 Support

For Evolution API documentation:
- https://doc.evolution-api.com

For issues with this project:
- Check logs in `logs/` directory
- Review connection status: `npm run status`
- Verify Excel file format

---

## 📄 License

MIT License

---

## 🎉 Quick Start Summary

```bash
# 1. Install
npm install

# 2. Create instances
npm run create-instances

# 3. Connect accounts (scan QR codes)
npm run connect

# 4. Check status
npm run status

# 5. Add Excel files to data/account_XX/contacts.xlsx

# 6. Test message
npm run test 1 +5511999999999 "Test message"

# 7. Send bulk messages
node scripts/send-messages.js send 1
```

---

**Built with ❤️ using Evolution API**
