const fs = require('fs');
const path = require('path');

/**
 * Logger Utility
 * Handles logging to console and files with color-coded output
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

class Logger {
  constructor(logDir = '../logs') {
    this.logDir = path.resolve(__dirname, logDir);
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, instance, message, data = null) {
    const timestamp = this.getTimestamp();
    const dataStr = data ? ` | Data: ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${instance}] ${message}${dataStr}`;
  }

  writeToFile(filename, message) {
    const logFile = path.join(this.logDir, filename);
    const logLine = `${message}\n`;

    try {
      fs.appendFileSync(logFile, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  log(level, instance, message, data = null) {
    const formattedMessage = this.formatMessage(level, instance, message, data);

    // Write to main log file
    this.writeToFile('app.log', formattedMessage);

    // Write to level-specific log file
    if (level === 'error') {
      this.writeToFile('errors.log', formattedMessage);
    }

    // Console output with colors
    this.consoleLog(level, instance, message, data);
  }

  consoleLog(level, instance, message, data = null) {
    let color = colors.reset;
    let emoji = '';

    switch (level) {
      case 'success':
        color = colors.green;
        emoji = '✓';
        break;
      case 'error':
        color = colors.red;
        emoji = '✗';
        break;
      case 'warn':
        color = colors.yellow;
        emoji = '⚠';
        break;
      case 'info':
        color = colors.blue;
        emoji = 'ℹ';
        break;
      case 'debug':
        color = colors.gray;
        emoji = '⚙';
        break;
      default:
        color = colors.reset;
        emoji = '•';
    }

    const timestamp = colors.gray + this.getTimestamp() + colors.reset;
    const levelStr = color + colors.bright + emoji + ' ' + level.toUpperCase() + colors.reset;
    const instanceStr = colors.cyan + `[${instance}]` + colors.reset;
    const dataStr = data ? colors.gray + ` ${JSON.stringify(data)}` + colors.reset : '';

    console.log(`${timestamp} ${levelStr} ${instanceStr} ${message}${dataStr}`);
  }

  success(instance, message, data = null) {
    this.log('success', instance, message, data);
  }

  error(instance, message, data = null) {
    this.log('error', instance, message, data);
  }

  warn(instance, message, data = null) {
    this.log('warn', instance, message, data);
  }

  info(instance, message, data = null) {
    this.log('info', instance, message, data);
  }

  debug(instance, message, data = null) {
    this.log('debug', instance, message, data);
  }

  // Log message sending status
  logMessageSent(instance, phone, status, messagePreview = '') {
    const message = `Message to ${phone}: ${status}`;
    const data = { phone, status, preview: messagePreview.substring(0, 50) };

    if (status === 'sent') {
      this.success(instance, message, data);
    } else {
      this.error(instance, message, data);
    }

    // Write to sent messages log
    this.writeToFile('sent_messages.log', this.formatMessage('message', instance, message, data));
  }

  // Log connection status
  logConnection(instance, status, phone = '') {
    const message = `Connection ${status}${phone ? ` - Phone: ${phone}` : ''}`;

    if (status === 'connected') {
      this.success(instance, message);
    } else if (status === 'disconnected') {
      this.error(instance, message);
    } else {
      this.info(instance, message);
    }

    this.writeToFile('connections.log', this.formatMessage('connection', instance, message));
  }

  // Create a separator line
  separator(char = '=', length = 80) {
    console.log(colors.gray + char.repeat(length) + colors.reset);
  }

  // Print header
  header(text) {
    this.separator();
    console.log(colors.bright + colors.cyan + text.toUpperCase() + colors.reset);
    this.separator();
  }
}

module.exports = new Logger();
