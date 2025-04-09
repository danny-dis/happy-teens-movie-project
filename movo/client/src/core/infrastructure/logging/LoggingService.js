/**
 * Logging Service for Movo
 * Provides centralized logging functionality
 * 
 * @author zophlic
 */

// Log levels
export const LOG_LEVEL = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

/**
 * Logging service class
 */
export class LoggingService {
  constructor(options = {}) {
    this.minLevel = options.minLevel || LOG_LEVEL.DEBUG;
    this.enableConsole = options.enableConsole !== false;
    this.enableRemote = options.enableRemote || false;
    this.remoteUrl = options.remoteUrl || null;
    this.batchSize = options.batchSize || 10;
    this.flushInterval = options.flushInterval || 30000; // 30 seconds
    
    this.logQueue = [];
    this.flushTimer = null;
    
    // Set up flush interval
    if (this.enableRemote && this.remoteUrl) {
      this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
    }
    
    // Bind methods
    this.debug = this.debug.bind(this);
    this.info = this.info.bind(this);
    this.warn = this.warn.bind(this);
    this.error = this.error.bind(this);
    this.log = this.log.bind(this);
    this.flush = this.flush.bind(this);
  }
  
  /**
   * Log a debug message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  debug(message, data = {}) {
    this.log(LOG_LEVEL.DEBUG, message, data);
  }
  
  /**
   * Log an info message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  info(message, data = {}) {
    this.log(LOG_LEVEL.INFO, message, data);
  }
  
  /**
   * Log a warning message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  warn(message, data = {}) {
    this.log(LOG_LEVEL.WARN, message, data);
  }
  
  /**
   * Log an error message
   * @param {string|Error} messageOrError - Log message or error object
   * @param {Object} data - Additional data
   */
  error(messageOrError, data = {}) {
    let message = messageOrError;
    let errorData = { ...data };
    
    // Handle Error objects
    if (messageOrError instanceof Error) {
      message = messageOrError.message;
      errorData = {
        ...errorData,
        stack: messageOrError.stack,
        name: messageOrError.name
      };
    }
    
    this.log(LOG_LEVEL.ERROR, message, errorData);
  }
  
  /**
   * Log a message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  log(level, message, data = {}) {
    // Check if level is enabled
    if (!this._isLevelEnabled(level)) {
      return;
    }
    
    // Create log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    };
    
    // Log to console
    if (this.enableConsole) {
      this._logToConsole(logEntry);
    }
    
    // Queue for remote logging
    if (this.enableRemote && this.remoteUrl) {
      this._queueForRemote(logEntry);
    }
  }
  
  /**
   * Flush log queue to remote server
   * @returns {Promise<boolean>} Whether flush was successful
   */
  async flush() {
    if (!this.enableRemote || !this.remoteUrl || this.logQueue.length === 0) {
      return true;
    }
    
    try {
      // Get logs to send
      const logsToSend = [...this.logQueue];
      this.logQueue = [];
      
      // Send logs to remote server
      const response = await fetch(this.remoteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logs: logsToSend,
          app: 'movo',
          version: process.env.REACT_APP_VERSION || 'unknown'
        }),
        keepalive: true // Allow request to complete even if page is unloading
      });
      
      if (!response.ok) {
        // Put logs back in queue
        this.logQueue = [...logsToSend, ...this.logQueue];
        return false;
      }
      
      return true;
    } catch (error) {
      // Put logs back in queue
      this.logQueue = [...this.logQueue];
      
      // Log error to console
      if (this.enableConsole) {
        console.error('[LoggingService] Failed to send logs to remote server:', error);
      }
      
      return false;
    }
  }
  
  /**
   * Check if level is enabled
   * @private
   * @param {string} level - Log level
   * @returns {boolean} Whether level is enabled
   */
  _isLevelEnabled(level) {
    const levels = Object.values(LOG_LEVEL);
    const minLevelIndex = levels.indexOf(this.minLevel);
    const levelIndex = levels.indexOf(level);
    
    return levelIndex >= minLevelIndex;
  }
  
  /**
   * Log to console
   * @private
   * @param {Object} logEntry - Log entry
   */
  _logToConsole(logEntry) {
    const { level, message, data } = logEntry;
    const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case LOG_LEVEL.DEBUG:
        console.debug(prefix, message, data);
        break;
      case LOG_LEVEL.INFO:
        console.info(prefix, message, data);
        break;
      case LOG_LEVEL.WARN:
        console.warn(prefix, message, data);
        break;
      case LOG_LEVEL.ERROR:
        console.error(prefix, message, data);
        break;
      default:
        console.log(prefix, message, data);
    }
  }
  
  /**
   * Queue log entry for remote logging
   * @private
   * @param {Object} logEntry - Log entry
   */
  _queueForRemote(logEntry) {
    this.logQueue.push(logEntry);
    
    // Flush if queue is full
    if (this.logQueue.length >= this.batchSize) {
      this.flush();
    }
  }
}

// Create singleton instance
const loggingService = new LoggingService({
  minLevel: process.env.NODE_ENV === 'production' ? LOG_LEVEL.INFO : LOG_LEVEL.DEBUG,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  remoteUrl: process.env.REACT_APP_LOGGING_URL
});

export default loggingService;
