const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const phoneFormatter = require('./phone-formatter');

/**
 * CSV Reader Utility
 * Reads contact data from CSV files
 * Expected columns: Name, Phone, Message (optional)
 *
 * CSV Benefits:
 * - 10x faster than XLSX for large files
 * - Smaller file size
 * - Simple format, less prone to corruption
 * - Can be opened in Excel, Google Sheets, or any text editor
 */

class CSVReader {
  /**
   * Read contacts from a CSV file
   * @param {string} filePath - Path to CSV file
   * @returns {Array} Array of contact objects
   */
  readContacts(filePath) {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        logger.error('CSVReader', `File not found: ${filePath}`);
        return [];
      }

      // Read file content
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Parse CSV (simple but robust parser)
      const data = this.parseCSV(fileContent);

      if (!data || data.length === 0) {
        logger.warn('CSVReader', `No data found in file: ${filePath}`);
        return [];
      }

      // Process and validate contacts
      const contacts = this.processContacts(data, filePath);

      logger.info('CSVReader', `Loaded ${contacts.length} contacts from ${path.basename(filePath)}`);

      return contacts;
    } catch (error) {
      logger.error('CSVReader', `Error reading file: ${filePath}`, { error: error.message });
      return [];
    }
  }

  /**
   * Parse CSV content into array of objects
   * Handles quoted fields with commas (e.g., "Kumar, Rahul")
   * @param {string} content - CSV file content
   * @returns {Array} Parsed data
   */
  parseCSV(content) {
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) return [];

    // Parse header
    const headers = this.parseCSVLine(lines[0]);

    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);

      if (values.length === 0) continue;

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      data.push(row);
    }

    return data;
  }

  /**
   * Parse a single CSV line, handling quoted fields
   * @param {string} line - CSV line
   * @returns {Array} Parsed values
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  /**
   * Process and validate contact data
   * @param {Array} data - Raw data from CSV
   * @param {string} filePath - File path for logging
   * @returns {Array} Processed contacts
   */
  processContacts(data, filePath) {
    const contacts = [];
    const seenPhones = new Set();

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because CSV starts at 1 and has header row

      // Try different possible column names (case-insensitive)
      const name = this.getFieldValue(row, ['name', 'nome', 'Name', 'Nome', 'NAME']);
      const phone = this.getFieldValue(row, ['phone', 'telefone', 'Phone', 'Telefone', 'PHONE', 'number', 'Number']);
      const message = this.getFieldValue(row, ['message', 'mensagem', 'Message', 'Mensagem', 'MESSAGE', 'text', 'Text']);

      // Validate phone number
      if (!phone) {
        logger.warn('CSVReader', `Row ${rowNumber}: Missing phone number`, { row });
        return;
      }

      // Clean and validate phone number
      const cleanPhone = this.cleanPhoneNumber(phone);

      if (!this.isValidPhone(cleanPhone)) {
        logger.warn('CSVReader', `Row ${rowNumber}: Invalid phone number: ${phone}`);
        return;
      }

      // Check for duplicates
      if (seenPhones.has(cleanPhone)) {
        logger.warn('CSVReader', `Row ${rowNumber}: Duplicate phone number: ${cleanPhone}`);
        return;
      }

      seenPhones.add(cleanPhone);

      // Add to contacts
      contacts.push({
        name: name || 'Unknown',
        phone: cleanPhone,
        message: message || null,
        rowNumber: rowNumber,
        source: path.basename(filePath),
      });
    });

    return contacts;
  }

  /**
   * Get field value from row (case-insensitive)
   * @param {Object} row - Data row
   * @param {Array} possibleNames - Possible column names
   * @returns {string|null} Field value
   */
  getFieldValue(row, possibleNames) {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return String(row[name]).trim();
      }
    }
    return null;
  }

  /**
   * Clean and format Indian phone number
   * @param {string} phone - Raw phone number
   * @returns {string} Formatted Indian phone number (+919876543210)
   */
  cleanPhoneNumber(phone) {
    const result = phoneFormatter.formatIndianNumber(phone);

    if (!result.isValid) {
      logger.warn('CSVReader', `Invalid Indian phone number: ${phone} - ${result.error}`);
      return null;
    }

    return result.formatted;
  }

  /**
   * Validate Indian phone number format
   * @param {string} phone - Phone number to validate
   * @returns {boolean} Is valid Indian number
   */
  isValidPhone(phone) {
    if (!phone) return false;

    // Use Indian phone formatter for validation
    return phoneFormatter.isValidIndianNumber(phone);
  }

  /**
   * Format phone number for WhatsApp API
   * Evolution API expects format: 919876543210@s.whatsapp.net
   * @param {string} phone - Cleaned phone number
   * @returns {string} Formatted phone number for WhatsApp
   */
  formatForWhatsApp(phone) {
    return phoneFormatter.formatForWhatsApp(phone);
  }

  /**
   * Create a sample CSV file template with Indian phone numbers
   * @param {string} outputPath - Where to save the template
   */
  createTemplate(outputPath) {
    const sampleData = [
      { Name: 'Rahul Kumar', Phone: '+919876543210', Message: 'Hi Rahul, this is a test message!' },
      { Name: 'Priya Sharma', Phone: '+919988776655', Message: 'Hello Priya, hope you are doing well!' },
      { Name: 'Amit Patel', Phone: '+919123456789', Message: 'Dear Amit, important update for you!' },
    ];

    // Create CSV content
    const headers = ['Name', 'Phone', 'Message'];
    const rows = sampleData.map(row =>
      `${row.Name},${row.Phone},"${row.Message}"`
    );

    const csvContent = [headers.join(','), ...rows].join('\n');

    fs.writeFileSync(outputPath, csvContent, 'utf8');
    logger.success('CSVReader', `CSV template created: ${outputPath}`);
  }

  /**
   * Get statistics about contacts in a file
   * @param {string} filePath - Path to CSV file
   * @returns {Object} Statistics
   */
  getFileStats(filePath) {
    const contacts = this.readContacts(filePath);

    return {
      totalContacts: contacts.length,
      withCustomMessage: contacts.filter((c) => c.message).length,
      withoutCustomMessage: contacts.filter((c) => !c.message).length,
      fileName: path.basename(filePath),
    };
  }
}

module.exports = new CSVReader();
