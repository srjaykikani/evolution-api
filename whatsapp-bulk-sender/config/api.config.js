/**
 * Evolution API Configuration
 * Update these values to match your Evolution API setup
 */

module.exports = {
  // Evolution API Base URL
  API_URL: 'http://localhost:8080',

  // Global API Key from Evolution API .env file
  API_KEY: '429683C4C977415CAAFCCE10F7D57E11',

  // Request timeout in milliseconds
  REQUEST_TIMEOUT: 30000,

  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // milliseconds

  // Rate limiting
  MESSAGE_DELAY_MIN: 3000, // minimum 3 seconds between messages
  MESSAGE_DELAY_MAX: 5000, // maximum 5 seconds between messages

  // Daily limits per account
  DEFAULT_DAILY_LIMIT: 500,

  // Instance settings
  INSTANCE_NAME_PREFIX: 'wa_account_',
  TOTAL_INSTANCES: 15,

  // Webhook settings (optional - for receiving events)
  WEBHOOK_ENABLED: false,
  WEBHOOK_URL: '',

  // Logging
  LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
  LOG_TO_FILE: true,
  LOG_TO_CONSOLE: true,
};
