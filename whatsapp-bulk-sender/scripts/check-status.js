#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config/api.config');
const logger = require('../utils/logger');

/**
 * Check Status Script
 * Checks connection status of all WhatsApp instances
 */

class StatusChecker {
  constructor() {
    this.configPath = path.resolve(__dirname, '../config/instances.json');
    this.instancesConfig = this.loadConfig();
  }

  loadConfig() {
    try {
      const data = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('StatusChecker', 'Failed to load config', { error: error.message });
      process.exit(1);
    }
  }

  saveConfig() {
    try {
      this.instancesConfig.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.configPath, JSON.stringify(this.instancesConfig, null, 2), 'utf8');
    } catch (error) {
      logger.error('StatusChecker', 'Failed to save config', { error: error.message });
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
        const phone =
          response.data.instance?.phoneNumber ||
          response.data.instance?.owner ||
          response.data.phoneNumber ||
          '';

        return {
          success: true,
          state: state,
          phone: phone,
          data: response.data,
        };
      }

      return { success: false, state: 'unknown' };
    } catch (error) {
      // Instance might not exist
      if (error.response && error.response.status === 404) {
        return { success: false, state: 'not_found', error: 'Instance not found' };
      }

      return { success: false, state: 'error', error: error.message };
    }
  }

  getStatusColor(state) {
    switch (state) {
      case 'open':
        return '\x1b[32m'; // Green
      case 'close':
      case 'connecting':
        return '\x1b[33m'; // Yellow
      case 'not_found':
      case 'error':
        return '\x1b[31m'; // Red
      default:
        return '\x1b[37m'; // White
    }
  }

  getStatusEmoji(state) {
    switch (state) {
      case 'open':
        return '✓';
      case 'close':
        return '✗';
      case 'connecting':
        return '⟳';
      case 'not_found':
        return '?';
      default:
        return '•';
    }
  }

  formatDate(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  async checkAllInstances(updateConfig = true) {
    logger.header('WhatsApp Instances Status');

    const results = {
      connected: 0,
      disconnected: 0,
      notFound: 0,
      errors: 0,
      total: this.instancesConfig.instances.length,
    };

    // Table header
    console.log(
      '\n' +
        ' ID '.padEnd(6) +
        '| Name'.padEnd(20) +
        '| Phone'.padEnd(20) +
        '| Status'.padEnd(15) +
        '| Last Connected'.padEnd(20)
    );
    console.log('-'.repeat(81));

    for (const instance of this.instancesConfig.instances) {
      const statusResult = await this.getConnectionState(instance.name);

      let status = 'unknown';
      let phone = instance.phone || '-';
      let color = '\x1b[37m';
      let emoji = '•';

      if (statusResult.success) {
        status = statusResult.state;
        phone = statusResult.phone || phone;
        color = this.getStatusColor(status);
        emoji = this.getStatusEmoji(status);

        // Update config
        if (updateConfig) {
          instance.status = status;
          if (statusResult.phone) {
            instance.phone = statusResult.phone;
          }
          if (status === 'open') {
            instance.lastConnected = new Date().toISOString();
            results.connected++;
          } else {
            results.disconnected++;
          }
        }
      } else {
        status = statusResult.state;
        color = this.getStatusColor(status);
        emoji = this.getStatusEmoji(status);

        if (status === 'not_found') {
          results.notFound++;
        } else {
          results.errors++;
        }
      }

      // Format row
      const id = ` ${instance.id}`.padEnd(6);
      const name = instance.name.padEnd(18);
      const phoneStr = phone.padEnd(18);
      const statusStr = `${emoji} ${status}`.padEnd(13);
      const lastConnected = this.formatDate(instance.lastConnected).padEnd(18);

      console.log(
        `${color}${id}| ${name}| ${phoneStr}| ${statusStr}| ${lastConnected}\x1b[0m`
      );

      // Small delay to avoid overwhelming the API
      await this.sleep(300);
    }

    console.log('-'.repeat(81));

    // Summary
    logger.separator();
    console.log(
      `\x1b[32m✓ Connected: ${results.connected}\x1b[0m | ` +
        `\x1b[31m✗ Disconnected: ${results.disconnected}\x1b[0m | ` +
        `\x1b[33m? Not Found: ${results.notFound}\x1b[0m | ` +
        `\x1b[31m! Errors: ${results.errors}\x1b[0m`
    );
    logger.separator();

    if (updateConfig) {
      this.saveConfig();
    }

    return results;
  }

  async checkSingleInstance(instanceId) {
    const instance = this.instancesConfig.instances.find((i) => i.id === instanceId);

    if (!instance) {
      logger.error('System', `Instance ID ${instanceId} not found in configuration`);
      return false;
    }

    logger.header(`Checking Instance: ${instance.name}`);

    const statusResult = await this.getConnectionState(instance.name);

    if (statusResult.success) {
      const color = this.getStatusColor(statusResult.state);
      const emoji = this.getStatusEmoji(statusResult.state);

      console.log(`\nInstance Name:    ${instance.name}`);
      console.log(`Status:           ${color}${emoji} ${statusResult.state}\x1b[0m`);
      console.log(`Phone Number:     ${statusResult.phone || 'Not available'}`);
      console.log(`Last Connected:   ${this.formatDate(instance.lastConnected)}`);
      console.log(`Messages Sent:    ${instance.totalMessagesSent || 0}`);
      console.log(`Daily Limit:      ${instance.dailyLimit}`);

      // Update config
      instance.status = statusResult.state;
      if (statusResult.phone) {
        instance.phone = statusResult.phone;
      }
      if (statusResult.state === 'open') {
        instance.lastConnected = new Date().toISOString();
      }

      this.saveConfig();
    } else {
      logger.error(instance.name, `Status check failed: ${statusResult.error}`);
    }

    logger.separator();
  }

  async watchMode(interval = 10000) {
    logger.header('Status Watch Mode (Press Ctrl+C to exit)');

    const checkStatus = async () => {
      console.clear();
      await this.checkAllInstances(true);
      console.log(`\nRefreshing every ${interval / 1000}s...`);
    };

    // Initial check
    await checkStatus();

    // Set up interval
    setInterval(checkStatus, interval);
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// CLI Usage
async function main() {
  const checker = new StatusChecker();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Check all instances
    await checker.checkAllInstances(true);
  } else if (args[0] === 'watch') {
    // Watch mode
    const interval = args[1] ? parseInt(args[1]) * 1000 : 10000;
    await checker.watchMode(interval);
  } else {
    // Check specific instance
    const instanceId = parseInt(args[0]);

    if (isNaN(instanceId) || instanceId < 1 || instanceId > 15) {
      console.error('Usage: node check-status.js [instance_id|watch] [interval_seconds]');
      console.error('  instance_id:     1-15 (optional)');
      console.error('  watch:           Enable watch mode with auto-refresh');
      console.error('  interval_seconds: Refresh interval for watch mode (default: 10)');
      console.error('\nExamples:');
      console.error('  node check-status.js          - Check all instances once');
      console.error('  node check-status.js 1        - Check instance 1');
      console.error('  node check-status.js watch    - Watch mode (10s refresh)');
      console.error('  node check-status.js watch 30 - Watch mode (30s refresh)');
      process.exit(1);
    }

    await checker.checkSingleInstance(instanceId);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('System', 'Fatal error', { error: error.message });
    process.exit(1);
  });
}

module.exports = StatusChecker;
