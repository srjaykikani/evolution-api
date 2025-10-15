#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config/api.config');
const logger = require('../utils/logger');

/**
 * Create WhatsApp Instances Script
 * Creates all 15 WhatsApp instances in Evolution API
 */

class InstanceCreator {
  constructor() {
    this.configPath = path.resolve(__dirname, '../config/instances.json');
    this.instancesConfig = this.loadConfig();
  }

  loadConfig() {
    try {
      const data = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('InstanceCreator', 'Failed to load config', { error: error.message });
      process.exit(1);
    }
  }

  saveConfig() {
    try {
      this.instancesConfig.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.configPath, JSON.stringify(this.instancesConfig, null, 2), 'utf8');
      logger.success('InstanceCreator', 'Configuration saved');
    } catch (error) {
      logger.error('InstanceCreator', 'Failed to save config', { error: error.message });
    }
  }

  async createInstance(instanceName) {
    try {
      const url = `${config.API_URL}/instance/create`;

      const payload = {
        instanceName: instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          apikey: config.API_KEY,
        },
        timeout: config.REQUEST_TIMEOUT,
      });

      if (response.data && response.status === 201) {
        logger.success(instanceName, 'Instance created successfully', {
          status: response.data.instance?.status,
        });
        return { success: true, data: response.data };
      }

      return { success: false, error: 'Unexpected response' };
    } catch (error) {
      // Check if instance already exists
      if (error.response && error.response.status === 409) {
        logger.warn(instanceName, 'Instance already exists');
        return { success: true, exists: true };
      }

      logger.error(instanceName, 'Failed to create instance', {
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
      });

      return { success: false, error: error.message };
    }
  }

  async createAllInstances() {
    logger.header('Creating WhatsApp Instances');

    const results = {
      success: 0,
      failed: 0,
      existing: 0,
    };

    for (const instance of this.instancesConfig.instances) {
      logger.info('System', `Creating instance ${instance.id}/15: ${instance.name}`);

      const result = await this.createInstance(instance.name);

      if (result.success) {
        if (result.exists) {
          results.existing++;
        } else {
          results.success++;
        }
      } else {
        results.failed++;
      }

      // Small delay between creates
      await this.sleep(1000);
    }

    logger.separator();
    logger.info('System', 'Instance Creation Summary:', {
      created: results.success,
      existing: results.existing,
      failed: results.failed,
      total: this.instancesConfig.instances.length,
    });
    logger.separator();

    this.saveConfig();

    return results;
  }

  async createSingleInstance(instanceId) {
    const instance = this.instancesConfig.instances.find((i) => i.id === instanceId);

    if (!instance) {
      logger.error('System', `Instance ID ${instanceId} not found in configuration`);
      return false;
    }

    logger.header(`Creating Instance: ${instance.name}`);

    const result = await this.createInstance(instance.name);

    if (result.success) {
      logger.success('System', `Instance ${instance.name} is ready`);
      this.saveConfig();
      return true;
    }

    logger.error('System', `Failed to create instance ${instance.name}`);
    return false;
  }

  async checkInstanceExists(instanceName) {
    try {
      const url = `${config.API_URL}/instance/fetchInstances`;

      const response = await axios.get(url, {
        headers: {
          apikey: config.API_KEY,
        },
        timeout: config.REQUEST_TIMEOUT,
      });

      if (response.data && Array.isArray(response.data)) {
        return response.data.some((inst) => inst.instance?.instanceName === instanceName);
      }

      return false;
    } catch (error) {
      logger.error('System', 'Failed to check existing instances', { error: error.message });
      return false;
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// CLI Usage
async function main() {
  const creator = new InstanceCreator();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Create all instances
    await creator.createAllInstances();
  } else {
    // Create specific instance by ID
    const instanceId = parseInt(args[0]);

    if (isNaN(instanceId) || instanceId < 1 || instanceId > 15) {
      console.error('Usage: node create-instances.js [instance_id]');
      console.error('  instance_id: 1-15 (optional, creates all if not specified)');
      process.exit(1);
    }

    await creator.createSingleInstance(instanceId);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('System', 'Fatal error', { error: error.message });
    process.exit(1);
  });
}

module.exports = InstanceCreator;
