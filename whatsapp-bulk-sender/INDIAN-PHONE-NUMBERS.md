# 🇮🇳 Indian Phone Number Configuration Guide

## ✅ System Updated for Indian Numbers

The WhatsApp Bulk Sender has been **fully configured for Indian phone numbers** (+91).

---

## 📱 Indian Phone Number Format

### Valid Formats (All Auto-Converted):

| Input Format | Output Format | Description |
|--------------|---------------|-------------|
| `+919876543210` | `+919876543210` | ✅ Preferred format |
| `919876543210` | `+919876543210` | ✅ Auto-adds + |
| `9876543210` | `+919876543210` | ✅ Auto-adds +91 |
| `09876543210` | `+919876543210` | ✅ Removes leading 0 |
| `+91 9876 543 210` | `+919876543210` | ✅ Removes spaces |
| `98765-43210` | `+919876543210` | ✅ Removes dashes |

### Validation Rules:

✅ **Must be exactly 10 digits** (after country code)
✅ **Must start with 6, 7, 8, or 9** (Indian mobile numbers)
✅ **Country code is +91** (India)
❌ Numbers starting with 0-5 are invalid
❌ Numbers with less or more than 10 digits are invalid

---

## 🔧 What Was Updated

### 1. **New Utility: `utils/phone-formatter.js`**

Handles all Indian phone number formatting and validation:

```javascript
const phoneFormatter = require('./utils/phone-formatter');

// Format any Indian number
const result = phoneFormatter.formatIndianNumber('9876543210');
// Returns: { formatted: '+919876543210', isValid: true, error: null }

// Format for WhatsApp API
const whatsappNumber = phoneFormatter.formatForWhatsApp('9876543210');
// Returns: '919876543210@s.whatsapp.net'

// Validate
const isValid = phoneFormatter.isValidIndianNumber('9876543210');
// Returns: true
```

**Test it:**
```bash
node utils/phone-formatter.js
```

### 2. **Updated: `utils/excel-reader.js`**

- Now uses Indian phone formatter
- Validates all numbers as Indian format
- Provides helpful error messages for invalid Indian numbers
- Auto-converts formats like 9876543210 → +919876543210

### 3. **Updated: Excel Templates**

All 15 account templates now have Indian examples:

| Name | Phone | Message |
|------|-------|---------|
| Rahul Kumar | +919876543210 | Hi Rahul, this is a test message! |
| Priya Sharma | +919988776655 | Hello Priya, hope you are doing well! |
| Amit Patel | +919123456789 | Dear Amit, important update for you! |

**Location:** `data/account_XX/contacts_template.xlsx`

### 4. **Updated: `config/instances.json`**

All 15 instances now include:
```json
{
  "countryCode": "+91",
  "country": "India"
}
```

---

## 📝 Excel File Format

### Your Excel file should look like this:

| Name | Phone | Message (optional) |
|------|-------|-------------------|
| Rahul Kumar | +919876543210 | Hi {name}! |
| Priya Sharma | 9988776655 | Hello! |
| Amit Patel | 919123456789 | Dear Amit |

### Column Details:

1. **Name (Column A):** Contact name (used for {name} placeholder)
2. **Phone (Column B):** Indian mobile number (10 digits)
   - Accepted formats: `+919876543210`, `919876543210`, `9876543210`
   - System auto-formats all variants
3. **Message (Column C):** Custom message per contact (optional)
   - Use `{name}` to personalize
   - Leave empty to use default message

---

## 🚀 Usage Examples

### Test Command (Updated):

```bash
# Indian format examples
npm run test 1 +919876543210 "Hello, testing!"
npm run test 1 919876543210 "Hello, testing!"
npm run test 1 9876543210 "Hello, testing!"

# All three work identically - system auto-formats!
```

### Send Messages:

```bash
# Single account
node scripts/send-messages.js send 1

# With custom message
node scripts/send-messages.js send 1 "Hello {name}, special offer!"

# All accounts
node scripts/send-messages.js send-all "Hi everyone!"
```

---

## ✅ Validation Examples

### ✓ Valid Indian Numbers:

```
+919876543210   ← Preferred
919876543210    ← Auto-adds +
9876543210      ← Auto-adds +91
09876543210     ← Removes 0, adds +91
+91 9876 543 210 ← Removes spaces
98765-43210     ← Removes dashes
```

### ✗ Invalid Numbers:

```
5876543210      ← Must start with 6/7/8/9
987654321       ← Too short (9 digits)
98765432109     ← Too long (11 digits)
+5511999999999  ← Wrong country code (Brazil)
```

---

## 🧪 Testing Phone Numbers

### Command Line Test:

```bash
node utils/phone-formatter.js
```

**Output:**
```
📱 Indian Phone Number Format Examples:

✅ Valid formats:
  +919876543210    (Preferred)
  919876543210     (Auto-adds +)
  9876543210       (Auto-adds +91)

Testing various formats:

🧪 Testing: +919876543210
✅ Valid: +919876543210
   WhatsApp: 919876543210@s.whatsapp.net

🧪 Testing: 5876543210
❌ Invalid: Indian mobile numbers must start with 6, 7, 8, or 9 (got 5)
```

### Programmatic Test:

```javascript
const phoneFormatter = require('./utils/phone-formatter');

// Test single number
phoneFormatter.test('9876543210');

// Test batch
const result = phoneFormatter.formatBatch([
  '+919876543210',
  '9988776655',
  '5876543210', // Invalid
]);

console.log('Valid:', result.valid.length);
console.log('Invalid:', result.invalid.length);
```

---

## 📋 Common Questions

### Q: What if I have numbers with spaces/dashes?
**A:** System automatically cleans them! `+91 9876 543 210` → `+919876543210`

### Q: Can I use numbers without +91?
**A:** Yes! `9876543210` is auto-converted to `+919876543210`

### Q: What about landline numbers?
**A:** System is configured for mobile numbers only (starting with 6/7/8/9)

### Q: Can I mix formats in Excel?
**A:** Yes! All formats are auto-detected and converted:
- `+919876543210` ✓
- `919876543210` ✓
- `9876543210` ✓

### Q: What if a number is invalid?
**A:** You'll see a clear error message:
```
⚠ Invalid Indian phone number: 5876543210
   Must start with 6, 7, 8, or 9
```

---

## 🔍 Error Messages Guide

| Error | Meaning | Solution |
|-------|---------|----------|
| "Must be 10 digits" | Wrong length | Check number has exactly 10 digits |
| "Must start with 6/7/8/9" | Invalid first digit | Indian mobiles start with 6, 7, 8, or 9 |
| "Invalid country code" | Wrong country | Use +91 for India |
| "Phone number is empty" | Missing number | Add phone number in Excel |

---

## 📊 System Configuration

### All Instances Configured:

```json
{
  "id": 1,
  "name": "wa_account_01",
  "countryCode": "+91",
  "country": "India",
  "phone": "",
  "status": "disconnected",
  ...
}
```

**View configuration:**
```bash
cat config/instances.json | grep -A2 "countryCode"
```

---

## 🎯 Quick Start with Indian Numbers

### 1. Create/Connect Instance:
```bash
npm run create-instances
node scripts/connect-accounts.js 1
```

### 2. Add Indian Contacts to Excel:

Open: `data/account_01/contacts_template.xlsx`

Rename to: `contacts.xlsx`

Add contacts (any format):
```
Raj Kumar    | 9876543210 | Hi Raj!
Neha Gupta   | +919988776655 | Hello Neha!
Vikram Singh | 919123456789 | Dear Vikram
```

### 3. Test with Your Number:
```bash
npm run test 1 YOUR_INDIAN_NUMBER "Testing WhatsApp sender!"
```

Example:
```bash
npm run test 1 9876543210 "Hello, this is a test!"
```

### 4. Send Bulk Messages:
```bash
node scripts/send-messages.js send 1
```

---

## 💡 Pro Tips

1. **Excel Format:** Just paste your numbers - system handles formatting
2. **Mixed Formats:** OK to have some with +91, some without
3. **Validation:** System validates before sending - no bad numbers sent
4. **Testing:** Always test with your own number first
5. **Error Logs:** Check `logs/errors.log` for validation issues

---

## 🔗 Related Files

- **Phone Formatter:** `utils/phone-formatter.js`
- **Excel Reader:** `utils/excel-reader.js`
- **Instance Config:** `config/instances.json`
- **Templates:** `data/account_XX/contacts_template.xlsx`
- **Test Script:** `npm run test 1 9876543210 "Test"`

---

## ✨ Summary

✅ System **fully configured** for Indian phone numbers
✅ **Auto-formats** all common Indian number formats
✅ **Validates** numbers before sending
✅ **Clear error messages** for invalid numbers
✅ All **15 accounts** configured for India (+91)
✅ Excel **templates updated** with Indian examples

**Start sending:** Just add your Indian contacts and run!

```bash
npm run test 1 9876543210 "Hello India!"
```

---

**Built specifically for Indian WhatsApp bulk messaging! 🇮🇳**
