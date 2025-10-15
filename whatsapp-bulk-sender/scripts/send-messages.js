#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config/api.config');
const logger = require('../utils/logger');
const csvReader = require('../utils/csv-reader');
const rateLimiter = require('../utils/rate-limiter');

/**
 * Send Messages Script
 * Main script for bulk message sending via WhatsApp
 */

class MessageSender {
  constructor() {
    this.configPath = path.resolve(__dirname, '../config/instances.json');
    this.instancesConfig = this.loadConfig();
    this.stats = {
      totalSent: 0,
      totalFailed: 0,
      byInstance: {},
    };
  }

  loadConfig() {
    try {
      const data = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('MessageSender', 'Failed to load config', { error: error.message });
      process.exit(1);
    }
  }

  saveConfig() {
    try {
      this.instancesConfig.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.configPath, JSON.stringify(this.instancesConfig, null, 2), 'utf8');
    } catch (error) {
      logger.error('MessageSender', 'Failed to save config', { error: error.message });
    }
  }

  async sendTextMessage(instanceName, phone, text) {
    try {
      const url = `${config.API_URL}/message/sendText/${instanceName}`;

      // Format phone for WhatsApp API
      const formattedPhone = csvReader.formatForWhatsApp(phone);

      const payload = {
        number: formattedPhone,
        text: text,
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          apikey: config.API_KEY,
        },
        timeout: config.REQUEST_TIMEOUT,
      });

      if (response.data && (response.status === 200 || response.status === 201)) {
        return {
          success: true,
          messageId: response.data.key?.id || null,
          data: response.data,
        };
      }

      return { success: false, error: 'Unexpected response' };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      return {
        success: false,
        error: errorMsg,
        status: error.response?.status,
      };
    }
  }

  async sendMessagesToContacts(instanceName, contacts, defaultMessage = null) {
    const instance = this.instancesConfig.instances.find((i) => i.name === instanceName);

    if (!instance) {
      logger.error('System', `Instance ${instanceName} not found`);
      return { sent: 0, failed: 0 };
    }

    logger.header(`Sending Messages via ${instanceName}`);
    logger.info(instanceName, `Loaded ${contacts.length} contacts`);

    const results = { sent: 0, failed: 0, skipped: 0 };

    this.stats.byInstance[instanceName] = { sent: 0, failed: 0 };

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];

      // Check daily limit
      const limitCheck = rateLimiter.canSendMessage(instanceName, instance.dailyLimit);

      if (!limitCheck.allowed) {
        logger.warn(
          instanceName,
          `Daily limit reached (${limitCheck.messagesSent}/${limitCheck.limit}). Skipping remaining contacts.`
        );
        results.skipped = contacts.length - i;
        break;
      }

      // Wait before sending (rate limiting)
      await rateLimiter.waitBeforeSend(instanceName);

      // Determine message to send
      const messageText = contact.message || defaultMessage;

      if (!messageText) {
        logger.error(instanceName, `No message for ${contact.name} (${contact.phone})`);
        results.failed++;
        continue;
      }

      // Personalize message (replace {name} placeholder)
      const personalizedMessage = messageText.replace(/\{name\}/gi, contact.name);

      // Send message
      logger.info(
        instanceName,
        `Sending ${i + 1}/${contacts.length} to ${contact.name} (${contact.phone})`
      );

      const sendResult = await this.sendTextMessage(instanceName, contact.phone, personalizedMessage);

      if (sendResult.success) {
        results.sent++;
        this.stats.totalSent++;
        this.stats.byInstance[instanceName].sent++;

        // Record sent message
        rateLimiter.recordMessageSent(instanceName);

        // Update instance stats
        instance.totalMessagesSent = (instance.totalMessagesSent || 0) + 1;
        instance.lastMessageSent = new Date().toISOString();

        logger.logMessageSent(
          instanceName,
          contact.phone,
          'sent',
          personalizedMessage.substring(0, 50)
        );
      } else {
        results.failed++;
        this.stats.totalFailed++;
        this.stats.byInstance[instanceName].failed++;

        logger.logMessageSent(
          instanceName,
          contact.phone,
          `failed: ${sendResult.error}`,
          personalizedMessage.substring(0, 50)
        );

        // If too many consecutive failures, stop
        if (results.failed > 5 && results.sent === 0) {
          logger.error(instanceName, 'Too many failures. Check connection and stop sending.');
          break;
        }
      }
    }

    // Save updated stats
    this.saveConfig();

    logger.separator();
    logger.info(instanceName, 'Sending Complete', {
      sent: results.sent,
      failed: results.failed,
      skipped: results.skipped,
    });
    logger.separator();

    return results;
  }

  async sendFromSingleInstance(instanceId, csvFile = null, message = null) {
    const instance = this.instancesConfig.instances.find((i) => i.id === instanceId);

    if (!instance) {
      logger.error('System', `Instance ID ${instanceId} not found`);
      return false;
    }

    // Determine Excel file
    const excelPath = csvFile || path.resolve(__dirname, '..', instance.csvFile);

    // Check if file exists
    if (!fs.existsSync(excelPath)) {
      logger.error('System', `Excel file not found: ${excelPath}`);
      logger.info('System', `Place your contacts Excel file at: ${instance.csvFile}`);
      return false;
    }

    // Load contacts
    const contacts = csvReader.readContacts(excelPath);

    if (contacts.length === 0) {
      logger.error('System', 'No valid contacts found in Excel file');
      return false;
    }

    // Send messages
    const results = await this.sendMessagesToContacts(instance.name, contacts, message);

    return results.sent > 0;
  }

  async sendFromAllInstances(message = null) {
    logger.header('Sending Messages from All Instances');

    const overallResults = {
      instances: 0,
      totalSent: 0,
      totalFailed: 0,
      totalSkipped: 0,
    };

    for (const instance of this.instancesConfig.instances) {
      logger.info('System', `Processing ${instance.name}...`);

      const excelPath = path.resolve(__dirname, '..', instance.csvFile);

      if (!fs.existsSync(excelPath)) {
        logger.warn('System', `Excel file not found for ${instance.name}: ${excelPath}`);
        continue;
      }

      const contacts = csvReader.readContacts(excelPath);

      if (contacts.length === 0) {
        logger.warn('System', `No contacts for ${instance.name}`);
        continue;
      }

      const results = await this.sendMessagesToContacts(instance.name, contacts, message);

      overallResults.instances++;
      overallResults.totalSent += results.sent;
      overallResults.totalFailed += results.failed;
      overallResults.totalSkipped += results.skipped;

      // Delay between instances
      logger.info('System', 'Waiting 5 seconds before next instance...');
      await this.sleep(5000);
    }

    logger.separator('=');
    logger.header('Overall Summary');
    console.log(`Instances Processed: ${overallResults.instances}`);
    console.log(`✓ Total Sent:        ${overallResults.totalSent}`);
    console.log(`✗ Total Failed:      ${overallResults.totalFailed}`);
    console.log(`⊘ Total Skipped:     ${overallResults.totalSkipped}`);
    logger.separator('=');

    return overallResults;
  }

  async testSingleMessage(instanceId, testPhone, testMessage) {
    const instance = this.instancesConfig.instances.find((i) => i.id === instanceId);

    if (!instance) {
      logger.error('System', `Instance ID ${instanceId} not found`);
      return false;
    }

    logger.header(`Test Message - ${instance.name}`);

    const sendResult = await this.sendTextMessage(instance.name, testPhone, testMessage);

    if (sendResult.success) {
      logger.success(instance.name, `Test message sent to ${testPhone}!`);
      logger.info('System', 'Message ID: ' + sendResult.messageId);
      return true;
    } else {
      logger.error(instance.name, `Failed to send test message: ${sendResult.error}`);
      return false;
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// CLI Usage
async function main() {
  const sender = new MessageSender();
  const args = process.argv.slice(2);

  console.log('\nWhatsApp Bulk Message Sender\n');

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node send-messages.js <command> [options]\n');
    console.log('Commands:');
    console.log('  test <id> <phone> <message>  - Send test message');
    console.log('  send <id> [message]          - Send to one instance');
    console.log('  send-all [message]           - Send to all instances\n');
    console.log('Examples:');
    console.log('  node send-messages.js test 1 +5511999999999 "Hello, this is a test!"');
    console.log('  node send-messages.js send 1 "Hi {name}, how are you?"');
    console.log('  node send-messages.js send 1');
    console.log('  node send-messages.js send-all "Hello everyone!"\n');
    console.log('Note: Use {name} in message to personalize with contact name from Excel');
    process.exit(0);
  }

  const command = args[0];

  if (command === 'test') {
    if (args.length < 4) {
      console.error('Error: Test requires instance ID, phone, and message');
      console.error('Usage: node send-messages.js test <id> <phone> <message>');
      process.exit(1);
    }

    const instanceId = parseInt(args[1]);
    const testPhone = args[2];
    const testMessage = args.slice(3).join(' ');

    await sender.testSingleMessage(instanceId, testPhone, testMessage);
  } else if (command === 'send') {
    const instanceId = parseInt(args[1]);

    if (isNaN(instanceId) || instanceId < 1 || instanceId > 15) {
      console.error('Error: Invalid instance ID (must be 1-15)');
      process.exit(1);
    }

    const message = args.length > 2 ? args.slice(2).join(' ') : null;

    await sender.sendFromSingleInstance(instanceId, null, message);
  } else if (command === 'send-all') {
    const message = args.length > 1 ? args.slice(1).join(' ') : null;

    await sender.sendFromAllInstances(message);
  } else {
    console.error(`Unknown command: ${command}`);
    console.error('Run without arguments to see usage');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('System', 'Fatal error', { error: error.message });
    process.exit(1);
  });
}

module.exports = MessageSender;
