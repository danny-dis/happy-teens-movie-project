/**
 * Error Handling Service for Movo
 * Provides centralized error handling functionality
 * 
 * @author zophlic
 */

import loggingService from '../logging/LoggingService';

/**
 * Base error class
 */
export class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @param {string} options.code - Error code
   * @param {Object} options.data - Additional error data
   * @param {Error} options.cause - Error cause
   */
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || 'UNKNOWN_ERROR';
    this.data = options.data || {};
    this.cause = options.cause;
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * API error class
 */
export class ApiError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @param {number} options.status - HTTP status code
   * @param {string} options.statusText - HTTP status text
   * @param {Object} options.response - API response
   */
  constructor(message, options = {}) {
    super(message, {
      code: options.code || `API_ERROR_${options.status || 'UNKNOWN'}`,
      data: {
        status: options.status,
        statusText: options.statusText,
        response: options.response
      },
      cause: options.cause
    });
    
    this.status = options.status;
    this.statusText = options.statusText;
    this.response = options.response;
  }
}

/**
 * Network error class
 */
export class NetworkError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Object} options - Error options
   */
  constructor(message, options = {}) {
    super(message, {
      code: options.code || 'NETWORK_ERROR',
      data: options.data,
      cause: options.cause
    });
  }
}

/**
 * Authentication error class
 */
export class AuthError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Object} options - Error options
   */
  constructor(message, options = {}) {
    super(message, {
      code: options.code || 'AUTH_ERROR',
      data: options.data,
      cause: options.cause
    });
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  /**
   * @param {string} message - Error message
   * @param {Object} options - Error options
   * @param {Object} options.validationErrors - Validation errors
   */
  constructor(message, options = {}) {
    super(message, {
      code: options.code || 'VALIDATION_ERROR',
      data: {
        ...options.data,
        validationErrors: options.validationErrors
      },
      cause: options.cause
    });
    
    this.validationErrors = options.validationErrors || {};
  }
}

/**
 * Error handling service class
 */
export class ErrorHandlingService {
  constructor() {
    this.handlers = new Map();
    
    // Bind methods
    this.handleError = this.handleError.bind(this);
    this.registerHandler = this.registerHandler.bind(this);
    this.unregisterHandler = this.unregisterHandler.bind(this);
    
    // Set up global error handlers
    this._setupGlobalHandlers();
  }
  
  /**
   * Handle an error
   * @param {Error} error - Error to handle
   * @param {Object} context - Error context
   * @returns {boolean} Whether error was handled
   */
  handleError(error, context = {}) {
    // Log error
    loggingService.error(error, context);
    
    // Get error type
    const errorType = error.constructor.name;
    
    // Find handler for error type
    const handler = this._findHandler(errorType);
    
    if (handler) {
      // Call handler
      handler(error, context);
      return true;
    }
    
    // No handler found
    return false;
  }
  
  /**
   * Register an error handler
   * @param {string} errorType - Error type
   * @param {Function} handler - Error handler
   */
  registerHandler(errorType, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be a function');
    }
    
    this.handlers.set(errorType, handler);
  }
  
  /**
   * Unregister an error handler
   * @param {string} errorType - Error type
   */
  unregisterHandler(errorType) {
    this.handlers.delete(errorType);
  }
  
  /**
   * Find handler for error type
   * @private
   * @param {string} errorType - Error type
   * @returns {Function|null} Error handler
   */
  _findHandler(errorType) {
    // Check for exact match
    if (this.handlers.has(errorType)) {
      return this.handlers.get(errorType);
    }
    
    // Check for parent class match
    for (const [type, handler] of this.handlers.entries()) {
      if (errorType.endsWith(type)) {
        return handler;
      }
    }
    
    // Check for default handler
    if (this.handlers.has('Error')) {
      return this.handlers.get('Error');
    }
    
    return null;
  }
  
  /**
   * Set up global error handlers
   * @private
   */
  _setupGlobalHandlers() {
    // Register default handler
    this.registerHandler('Error', (error, context) => {
      console.error('[ErrorHandlingService] Unhandled error:', error, context);
    });
    
    // Register API error handler
    this.registerHandler('ApiError', (error, context) => {
      console.error('[ErrorHandlingService] API error:', error, context);
      
      // Handle specific status codes
      switch (error.status) {
        case 401:
          // Unauthorized - redirect to login
          if (window.location.pathname !== '/login') {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          }
          break;
        case 403:
          // Forbidden - show permission denied
          console.error('Permission denied');
          break;
        case 404:
          // Not found - show not found
          console.error('Resource not found');
          break;
        case 500:
          // Server error - show error message
          console.error('Server error');
          break;
        default:
          // Other errors - show generic error
          console.error('An error occurred');
      }
    });
    
    // Register network error handler
    this.registerHandler('NetworkError', (error, context) => {
      console.error('[ErrorHandlingService] Network error:', error, context);
      
      // Show offline message
      if (!navigator.onLine) {
        console.error('You are offline');
      } else {
        console.error('Network error');
      }
    });
    
    // Register auth error handler
    this.registerHandler('AuthError', (error, context) => {
      console.error('[ErrorHandlingService] Auth error:', error, context);
      
      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    });
    
    // Register validation error handler
    this.registerHandler('ValidationError', (error, context) => {
      console.error('[ErrorHandlingService] Validation error:', error, context);
      
      // Show validation errors
      console.error('Validation errors:', error.validationErrors);
    });
    
    // Set up global error event listener
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        source: event.filename,
        line: event.lineno,
        column: event.colno
      });
    });
    
    // Set up unhandled promise rejection listener
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));
      
      this.handleError(error, {
        type: 'unhandledrejection'
      });
    });
  }
}

// Create singleton instance
const errorHandlingService = new ErrorHandlingService();

export default errorHandlingService;

/**
 * Wrap a function with error handling
 * @param {Function} fn - Function to wrap
 * @param {Object} context - Error context
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, context = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandlingService.handleError(error, {
        ...context,
        args
      });
      throw error;
    }
  };
}

/**
 * Fetch with error handling
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Fetch result
 */
export async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      let errorData = {};
      
      try {
        errorData = await response.json();
      } catch (e) {
        // Ignore JSON parsing errors
      }
      
      throw new ApiError(
        errorData.message || `API error: ${response.status} ${response.statusText}`,
        {
          status: response.status,
          statusText: response.statusText,
          response: errorData
        }
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    if (error.name === 'AbortError') {
      throw error;
    }
    
    if (!navigator.onLine || error.message.includes('network')) {
      throw new NetworkError('Network error', { cause: error });
    }
    
    throw new AppError('Fetch error', {
      code: 'FETCH_ERROR',
      cause: error
    });
  }
}
