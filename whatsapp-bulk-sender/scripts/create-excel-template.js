#!/usr/bin/env node

const excelReader = require('../utils/excel-reader');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Create Excel Template
 * Creates sample Excel files with correct format
 */

function createTemplate(accountNumber = null) {
  logger.header('Excel Template Creator');

  if (accountNumber) {
    // Create template for specific account
    const accountId = String(accountNumber).padStart(2, '0');
    const outputPath = path.resolve(__dirname, `../data/account_${accountId}/contacts_template.xlsx`);

    excelReader.createTemplate(outputPath);
    logger.success('System', `Template created: data/account_${accountId}/contacts_template.xlsx`);
    logger.info('System', '1. Rename it to contacts.xlsx');
    logger.info('System', '2. Add your contacts');
    logger.info('System', '3. Save the file');
  } else {
    // Create templates for all accounts
    for (let i = 1; i <= 15; i++) {
      const accountId = String(i).padStart(2, '0');
      const outputPath = path.resolve(__dirname, `../data/account_${accountId}/contacts_template.xlsx`);

      excelReader.createTemplate(outputPath);
      logger.info('System', `Created: data/account_${accountId}/contacts_template.xlsx`);
    }

    logger.success('System', 'All templates created!');
    logger.info('System', 'Rename templates to contacts.xlsx and add your contacts');
  }

  logger.separator();
  logger.info('System', 'Excel Format (Indian Phone Numbers):');
  console.log('  Column A: Name       - Contact name');
  console.log('  Column B: Phone      - Indian phone with +91 (+919876543210)');
  console.log('  Column C: Message    - Custom message (optional)');
  console.log('\n  Valid formats: +919876543210, 919876543210, or 9876543210');
  logger.separator();
}

// CLI Usage
const args = process.argv.slice(2);

if (args.length > 0) {
  const accountNumber = parseInt(args[0]);

  if (isNaN(accountNumber) || accountNumber < 1 || accountNumber > 15) {
    console.error('Usage: node create-excel-template.js [account_number]');
    console.error('  account_number: 1-15 (optional, creates all if not specified)');
    process.exit(1);
  }

  createTemplate(accountNumber);
} else {
  createTemplate();
}
