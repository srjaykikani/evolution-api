const logger = require('./logger');

/**
 * Indian Phone Number Formatter
 * Handles formatting and validation of Indian phone numbers
 * Indian Format: +91XXXXXXXXXX (10 digits after country code)
 */

class PhoneFormatter {
  constructor() {
    this.countryCode = '91';
    this.phoneLength = 10; // Length of Indian phone number without country code
  }

  /**
   * Format Indian phone number to standard format
   * @param {string} phone - Raw phone number
   * @returns {Object} { formatted: string, isValid: boolean, error: string|null }
   */
  formatIndianNumber(phone) {
    if (!phone) {
      return { formatted: null, isValid: false, error: 'Phone number is empty' };
    }

    // Convert to string and remove all spaces, dashes, parentheses
    let cleaned = String(phone).replace(/[\s\-\(\)]/g, '');

    // Remove any non-digit characters except + at the beginning
    cleaned = cleaned.replace(/[^\d+]/g, '');

    // Handle different input formats
    if (cleaned.startsWith('+91')) {
      // Already has +91
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith('91')) {
      // Has 91 but missing +
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('+')) {
      // Has + but wrong country code
      return {
        formatted: null,
        isValid: false,
        error: `Invalid country code. Expected +91 for India, got ${cleaned.substring(0, 3)}`,
      };
    } else if (cleaned.startsWith('0')) {
      // Starts with 0 (old landline format or mistake)
      cleaned = cleaned.substring(1);
    }

    // Now cleaned should contain only 10 digits
    cleaned = cleaned.replace(/\D/g, ''); // Remove any remaining non-digits

    // Validate length
    if (cleaned.length !== this.phoneLength) {
      return {
        formatted: null,
        isValid: false,
        error: `Indian phone numbers must be ${this.phoneLength} digits (got ${cleaned.length}). Format: +919876543210`,
      };
    }

    // Validate Indian mobile number patterns
    // Indian mobile numbers start with 6, 7, 8, or 9
    const firstDigit = cleaned.charAt(0);
    if (!['6', '7', '8', '9'].includes(firstDigit)) {
      return {
        formatted: null,
        isValid: false,
        error: `Indian mobile numbers must start with 6, 7, 8, or 9 (got ${firstDigit})`,
      };
    }

    // Format to +91XXXXXXXXXX
    const formatted = `+${this.countryCode}${cleaned}`;

    return {
      formatted: formatted,
      isValid: true,
      error: null,
    };
  }

  /**
   * Format for WhatsApp API (without @ suffix)
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone for WhatsApp API
   */
  formatForWhatsApp(phone) {
    const result = this.formatIndianNumber(phone);

    if (!result.isValid) {
      logger.error('PhoneFormatter', `Invalid phone: ${result.error}`);
      return null;
    }

    // WhatsApp format: 919876543210@s.whatsapp.net
    // Remove + for WhatsApp API
    const phoneWithoutPlus = result.formatted.replace('+', '');
    return `${phoneWithoutPlus}@s.whatsapp.net`;
  }

  /**
   * Validate Indian phone number
   * @param {string} phone - Phone number to validate
   * @returns {boolean} Is valid
   */
  isValidIndianNumber(phone) {
    const result = this.formatIndianNumber(phone);
    return result.isValid;
  }

  /**
   * Get helpful error message for invalid number
   * @param {string} phone - Phone number
   * @returns {string} Error message
   */
  getErrorMessage(phone) {
    const result = this.formatIndianNumber(phone);
    return result.error || 'Valid Indian phone number';
  }

  /**
   * Format multiple phone numbers
   * @param {Array} phones - Array of phone numbers
   * @returns {Object} { valid: Array, invalid: Array }
   */
  formatBatch(phones) {
    const valid = [];
    const invalid = [];

    phones.forEach((phone) => {
      const result = this.formatIndianNumber(phone);

      if (result.isValid) {
        valid.push({
          original: phone,
          formatted: result.formatted,
        });
      } else {
        invalid.push({
          original: phone,
          error: result.error,
        });
      }
    });

    return { valid, invalid };
  }

  /**
   * Display format examples
   */
  showExamples() {
    console.log('\n📱 Indian Phone Number Format Examples:\n');
    console.log('✅ Valid formats:');
    console.log('  +919876543210    (Preferred)');
    console.log('  919876543210     (Auto-adds +)');
    console.log('  9876543210       (Auto-adds +91)');
    console.log('\n❌ Invalid formats:');
    console.log('  +9876543210      (Missing country code)');
    console.log('  5876543210       (Must start with 6/7/8/9)');
    console.log('  98765432         (Too short - need 10 digits)');
    console.log('  98765432109      (Too long - need 10 digits)');
    console.log('\n💡 Tips:');
    console.log('  • Indian mobile numbers are 10 digits');
    console.log('  • Must start with 6, 7, 8, or 9');
    console.log('  • Country code is +91\n');
  }

  /**
   * Test phone number formatting
   * @param {string} phone - Phone to test
   */
  test(phone) {
    console.log(`\n🧪 Testing: ${phone}`);
    const result = this.formatIndianNumber(phone);

    if (result.isValid) {
      console.log(`✅ Valid: ${result.formatted}`);
      console.log(`   WhatsApp: ${this.formatForWhatsApp(phone)}`);
    } else {
      console.log(`❌ Invalid: ${result.error}`);
    }
  }
}

// Export singleton instance
module.exports = new PhoneFormatter();

// CLI test if run directly
if (require.main === module) {
  const formatter = new PhoneFormatter();

  formatter.showExamples();

  console.log('Testing various formats:\n');

  const testNumbers = [
    '+919876543210',
    '919876543210',
    '9876543210',
    '09876543210',
    '+91 9876 543 210',
    '98765-43210',
    '5876543210', // Invalid - doesn't start with 6/7/8/9
    '987654321', // Invalid - too short
    '98765432109', // Invalid - too long
    '+5511999999999', // Invalid - wrong country code
  ];

  testNumbers.forEach((num) => formatter.test(num));
}
