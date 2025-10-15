# 🚀 Quick Start Guide

Follow these steps to get started with WhatsApp Bulk Sender in 10 minutes!

---

## ✅ Step 1: Verify Evolution API is Running

```bash
curl http://localhost:8080 -H "apikey: 429683C4C977415CAAFCCE10F7D57E11"
```

**Expected output:**
```json
{"status":200,"message":"Welcome to the Evolution API, it is working!"}
```

If not working, start Evolution API:
```bash
cd ../evolution-api
docker-compose up -d
```

---

## ✅ Step 2: Create WhatsApp Instances

```bash
npm run create-instances
```

This creates all 15 instances (wa_account_01 to wa_account_15) in Evolution API.

**Expected output:**
```
✓ SUCCESS - Instance created successfully
...
Instance Creation Summary: created: 15, existing: 0, failed: 0
```

---

## ✅ Step 3: Connect First Account

Let's connect just account 1 for testing:

```bash
node scripts/connect-accounts.js 1
```

**What happens:**
1. QR code appears in terminal
2. Open WhatsApp on your phone
3. Go to Settings → Linked Devices → Link a Device
4. Scan the QR code
5. Wait for "Connected successfully!" message

---

## ✅ Step 4: Check Connection Status

```bash
npm run status
```

**Expected output:**
```
 ID    | Name              | Phone             | Status        | Last Connected
---------------------------------------------------------------------------------
 ✓ 1   | wa_account_01     | +5511999999999    | ✓ open        | Just now
 ✗ 2   | wa_account_02     | -                 | ✗ close       | Never
 ...
```

---

## ✅ Step 5: Prepare Your Excel File

Copy the template:
```bash
cp data/account_01/contacts_template.xlsx data/account_01/contacts.xlsx
```

Open `data/account_01/contacts.xlsx` and add your contacts:

| Name       | Phone          | Message                  |
|------------|----------------|--------------------------|
| Your Name  | +YOURCOUNTRYCODE+YOURPHONE | Hi, testing! |

**Important:** Replace with your own phone number for testing!

---

## ✅ Step 6: Send Test Message

```bash
npm run test 1 +YOURCOUNTRYCODE+YOURPHONE "Hello! This is a test from WhatsApp Bulk Sender."
```

**Example (India):**
```bash
npm run test 1 +919876543210 "Hello! This is a test."
```

**Example (Brazil):**
```bash
npm run test 1 +5511999999999 "Olá! Este é um teste."
```

Check your phone - you should receive the message!

---

## ✅ Step 7: Send Bulk Messages

If test was successful, send to all contacts in Excel:

```bash
node scripts/send-messages.js send 1
```

Or with custom message:
```bash
node scripts/send-messages.js send 1 "Hi {name}, this is your personalized message!"
```

---

## 🎉 Success!

You've successfully:
- ✅ Set up Evolution API
- ✅ Created WhatsApp instances
- ✅ Connected your first account
- ✅ Sent test message
- ✅ Sent bulk messages

---

## 📚 Next Steps

### Connect More Accounts

Connect accounts 2-15:
```bash
# Connect one by one
node scripts/connect-accounts.js 2
node scripts/connect-accounts.js 3
# ... or connect all
npm run connect
```

### Add Excel Files for Other Accounts

```bash
# Copy template for each account
for i in {02..15}; do
  cp data/account_$i/contacts_template.xlsx data/account_$i/contacts.xlsx
done
```

Then open each Excel file and add contacts.

### Send from All Accounts

```bash
node scripts/send-messages.js send-all "Your message here"
```

---

## 🔍 Monitor Status

### Check Once
```bash
npm run status
```

### Watch Mode (Auto-refresh)
```bash
npm run status:watch
```

Press Ctrl+C to exit watch mode.

---

## 📊 View Logs

```bash
# All logs
cat logs/app.log

# Errors only
cat logs/errors.log

# Sent messages
cat logs/sent_messages.log

# Live tail
tail -f logs/app.log
```

---

## ⚠️ Troubleshooting

### "Instance not found"
Run: `npm run create-instances`

### "Excel file not found"
Check: `data/account_01/contacts.xlsx` exists

### "Connection closed"
Reconnect: `node scripts/connect-accounts.js 1`

### "Daily limit reached"
Wait until midnight or increase limit in `config/instances.json`

---

## 💡 Tips

1. **Always test first** before bulk sending
2. **Start with one account** to understand the flow
3. **Use {name}** in messages for personalization
4. **Monitor connection status** regularly
5. **Keep Excel files backed up**
6. **Respect rate limits** (don't modify delays)

---

## 🎯 Common Commands

```bash
# Status
npm run status                  # Check all
npm run status:watch           # Watch mode

# Connect
npm run connect                # Connect all
node scripts/connect-accounts.js 1  # Connect one

# Send
npm run test 1 +PHONE "msg"    # Test
node scripts/send-messages.js send 1        # Send from account 1
node scripts/send-messages.js send-all      # Send from all

# Excel
node scripts/create-excel-template.js       # Create templates
```

---

**Need help? Check README.md for detailed documentation!**
