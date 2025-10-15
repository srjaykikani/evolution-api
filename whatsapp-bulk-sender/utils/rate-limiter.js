const config = require('../config/api.config');
const logger = require('./logger');

/**
 * Rate Limiter Utility
 * Controls message sending speed and enforces daily limits
 */

class RateLimiter {
  constructor() {
    this.instanceStats = new Map();
    this.resetDailyLimits();
  }

  // Initialize or get instance stats
  getInstanceStats(instanceName) {
    if (!this.instanceStats.has(instanceName)) {
      this.instanceStats.set(instanceName, {
        messagesSentToday: 0,
        lastMessageTime: 0,
        lastResetDate: new Date().toDateString(),
      });
    }
    return this.instanceStats.get(instanceName);
  }

  // Reset daily counters if it's a new day
  resetDailyLimits() {
    const today = new Date().toDateString();

    this.instanceStats.forEach((stats, instanceName) => {
      if (stats.lastResetDate !== today) {
        stats.messagesSentToday = 0;
        stats.lastResetDate = today;
        logger.info(instanceName, 'Daily message counter reset');
      }
    });

    // Schedule next reset at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow - now;

    setTimeout(() => this.resetDailyLimits(), timeUntilMidnight);
  }

  // Check if instance can send a message
  canSendMessage(instanceName, dailyLimit = config.DEFAULT_DAILY_LIMIT) {
    const stats = this.getInstanceStats(instanceName);

    // Check daily limit
    if (stats.messagesSentToday >= dailyLimit) {
      logger.warn(instanceName, `Daily limit reached: ${stats.messagesSentToday}/${dailyLimit}`);
      return {
        allowed: false,
        reason: 'daily_limit_reached',
        messagesSent: stats.messagesSentToday,
        limit: dailyLimit,
      };
    }

    return {
      allowed: true,
      messagesSent: stats.messagesSentToday,
      limit: dailyLimit,
      remaining: dailyLimit - stats.messagesSentToday,
    };
  }

  // Calculate delay before next message
  getDelay() {
    const min = config.MESSAGE_DELAY_MIN;
    const max = config.MESSAGE_DELAY_MAX;
    // Random delay between min and max
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Wait before sending next message
  async waitBeforeSend(instanceName) {
    const stats = this.getInstanceStats(instanceName);
    const now = Date.now();
    const timeSinceLastMessage = now - stats.lastMessageTime;
    const delay = this.getDelay();

    // If not enough time has passed, wait
    if (timeSinceLastMessage < delay) {
      const waitTime = delay - timeSinceLastMessage;
      logger.debug(instanceName, `Waiting ${waitTime}ms before sending next message`);
      await this.sleep(waitTime);
    }

    stats.lastMessageTime = Date.now();
  }

  // Record a sent message
  recordMessageSent(instanceName) {
    const stats = this.getInstanceStats(instanceName);
    stats.messagesSentToday += 1;
    stats.lastMessageTime = Date.now();

    logger.debug(
      instanceName,
      `Message recorded. Today: ${stats.messagesSentToday}`
    );

    return {
      messagesSentToday: stats.messagesSentToday,
      lastMessageTime: stats.lastMessageTime,
    };
  }

  // Get instance statistics
  getStats(instanceName) {
    const stats = this.getInstanceStats(instanceName);
    return {
      messagesSentToday: stats.messagesSentToday,
      lastMessageTime: stats.lastMessageTime,
      lastResetDate: stats.lastResetDate,
    };
  }

  // Get all instances statistics
  getAllStats() {
    const allStats = {};
    this.instanceStats.forEach((stats, instanceName) => {
      allStats[instanceName] = {
        messagesSentToday: stats.messagesSentToday,
        lastMessageTime: stats.lastMessageTime,
        lastResetDate: stats.lastResetDate,
      };
    });
    return allStats;
  }

  // Reset stats for an instance
  resetInstanceStats(instanceName) {
    this.instanceStats.delete(instanceName);
    logger.info(instanceName, 'Stats reset');
  }

  // Sleep utility
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Get human-readable time until midnight
  getTimeUntilReset() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow - now;

    const hours = Math.floor(msUntilMidnight / (1000 * 60 * 60));
    const minutes = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }
}

module.exports = new RateLimiter();
