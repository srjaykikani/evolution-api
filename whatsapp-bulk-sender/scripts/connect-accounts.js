#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const config = require('../config/api.config');
const logger = require('../utils/logger');

/**
 * Connect WhatsApp Accounts Script
 * Connects instances and displays QR codes for scanning
 */

class AccountConnector {
  constructor() {
    this.configPath = path.resolve(__dirname, '../config/instances.json');
    this.instancesConfig = this.loadConfig();
    this.qrCodeData = new Map();
  }

  loadConfig() {
    try {
      const data = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('AccountConnector', 'Failed to load config', { error: error.message });
      process.exit(1);
    }
  }

  saveConfig() {
    try {
      this.instancesConfig.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.configPath, JSON.stringify(this.instancesConfig, null, 2), 'utf8');
      logger.success('AccountConnector', 'Configuration saved');
    } catch (error) {
      logger.error('AccountConnector', 'Failed to save config', { error: error.message });
    }
  }

  async connectInstance(instanceName) {
    try {
      const url = `${config.API_URL}/instance/connect/${instanceName}`;

      const response = await axios.get(url, {
        headers: {
          apikey: config.API_KEY,
        },
        timeout: config.REQUEST_TIMEOUT,
      });

      if (response.data) {
        // Check if QR code is in response
        const qrData = response.data.qrcode?.qrcode || response.data.qrcode || response.data.code;

        if (qrData) {
          logger.success(instanceName, 'QR Code received');
          return { success: true, qrcode: qrData, data: response.data };
        } else if (response.data.state === 'open' || response.data.instance?.state === 'open') {
          logger.success(instanceName, 'Already connected!');
          return { success: true, alreadyConnected: true };
        }

        logger.warn(instanceName, 'Response received but no QR code', response.data);
        return { success: false, error: 'No QR code in response' };
      }

      return { success: false, error: 'Empty response' };
    } catch (error) {
      logger.error(instanceName, 'Failed to connect', {
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
      });

      return { success: false, error: error.message };
    }
  }

  async getConnectionState(instanceName) {
    try {
      const url = `${config.API_URL}/instance/connectionState/${instanceName}`;

      const response = await axios.get(url, {
        headers: {
          apikey: config.API_KEY,
        },
        timeout: config.REQUEST_TIMEOUT,
      });

      if (response.data) {
        const state = response.data.state || response.data.instance?.state || 'unknown';
        return { success: true, state: state, data: response.data };
      }

      return { success: false, state: 'unknown' };
    } catch (error) {
      logger.error(instanceName, 'Failed to get connection state', { error: error.message });
      return { success: false, state: 'unknown', error: error.message };
    }
  }

  displayQRCode(instanceName, qrData) {
    logger.separator('=', 100);
    logger.info(instanceName, 'SCAN THIS QR CODE WITH WHATSAPP');
    logger.separator('-', 100);

    // Display QR code in terminal
    qrcode.generate(qrData, { small: true }, (qr) => {
      console.log(qr);
    });

    logger.separator('-', 100);
    logger.info(instanceName, 'Waiting for connection... (This may take a few seconds)');
    logger.separator('=', 100);
  }

  async waitForConnection(instanceName, maxWaitTime = 60000) {
    const startTime = Date.now();
    const checkInterval = 3000; // Check every 3 seconds

    while (Date.now() - startTime < maxWaitTime) {
      await this.sleep(checkInterval);

      const stateResult = await this.getConnectionState(instanceName);

      if (stateResult.success) {
        if (stateResult.state === 'open') {
          // Extract phone number if available
          const phone =
            stateResult.data.instance?.phoneNumber ||
            stateResult.data.instance?.owner ||
            stateResult.data.phoneNumber ||
            '';

          logger.success(instanceName, `Connected successfully! Phone: ${phone}`);

          // Update config
          const instance = this.instancesConfig.instances.find((i) => i.name === instanceName);
          if (instance) {
            instance.status = 'connected';
            instance.phone = phone;
            instance.lastConnected = new Date().toISOString();
            this.saveConfig();
          }

          return { success: true, phone: phone };
        }
      }
    }

    logger.error(instanceName, 'Connection timeout - QR code may have expired');
    return { success: false, error: 'timeout' };
  }

  async connectSingleAccount(instanceId, waitForScan = true) {
    const instance = this.instancesConfig.instances.find((i) => i.id === instanceId);

    if (!instance) {
      logger.error('System', `Instance ID ${instanceId} not found in configuration`);
      return false;
    }

    logger.header(`Connecting Instance: ${instance.name}`);

    // First check if already connected
    const stateResult = await this.getConnectionState(instance.name);
    if (stateResult.success && stateResult.state === 'open') {
      logger.success(instance.name, 'Already connected!');
      return true;
    }

    // Request connection
    const result = await this.connectInstance(instance.name);

    if (!result.success) {
      logger.error('System', `Failed to connect ${instance.name}`);
      return false;
    }

    if (result.alreadyConnected) {
      return true;
    }

    // Display QR code
    if (result.qrcode) {
      this.displayQRCode(instance.name, result.qrcode);

      if (waitForScan) {
        const connectionResult = await this.waitForConnection(instance.name);
        return connectionResult.success;
      }

      return true;
    }

    return false;
  }

  async connectAllAccounts(sequential = true) {
    logger.header('Connecting All WhatsApp Accounts');

    const results = {
      success: 0,
      failed: 0,
      alreadyConnected: 0,
    };

    if (sequential) {
      // Connect one by one, waiting for each
      for (const instance of this.instancesConfig.instances) {
        logger.info('System', `Processing instance ${instance.id}/15: ${instance.name}`);

        const success = await this.connectSingleAccount(instance.id, true);

        if (success) {
          const stateResult = await this.getConnectionState(instance.name);
          if (stateResult.state === 'open') {
            results.success++;
          } else {
            results.alreadyConnected++;
          }
        } else {
          results.failed++;
        }

        logger.separator();
      }
    } else {
      // Display all QR codes at once (not recommended - harder to scan)
      logger.warn('System', 'Displaying all QR codes - scan them quickly!');

      for (const instance of this.instancesConfig.instances) {
        await this.connectSingleAccount(instance.id, false);
        await this.sleep(1000);
      }
    }

    logger.separator();
    logger.info('System', 'Connection Summary:', {
      connected: results.success,
      alreadyConnected: results.alreadyConnected,
      failed: results.failed,
      total: this.instancesConfig.instances.length,
    });
    logger.separator();

    return results;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// CLI Usage
async function main() {
  const connector = new AccountConnector();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Connect all accounts sequentially
    console.log('\nOptions:');
    console.log('  node connect-accounts.js          - Connect all accounts (one by one)');
    console.log('  node connect-accounts.js [id]     - Connect specific account (1-15)');
    console.log('  node connect-accounts.js all      - Connect all accounts\n');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Press Enter to connect all accounts, or Ctrl+C to cancel...', () => {
      rl.close();
      connector.connectAllAccounts(true);
    });
  } else if (args[0] === 'all') {
    await connector.connectAllAccounts(true);
  } else {
    const instanceId = parseInt(args[0]);

    if (isNaN(instanceId) || instanceId < 1 || instanceId > 15) {
      console.error('Usage: node connect-accounts.js [instance_id]');
      console.error('  instance_id: 1-15 or "all"');
      process.exit(1);
    }

    await connector.connectSingleAccount(instanceId, true);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('System', 'Fatal error', { error: error.message });
    process.exit(1);
  });
}

module.exports = AccountConnector;
