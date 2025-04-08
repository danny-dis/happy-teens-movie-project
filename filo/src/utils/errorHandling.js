/**
 * Standardized error handling utilities for P2P and API operations
 * @author zophlic
 */

/**
 * Custom API error class with additional metadata
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.timestamp = new Date();
  }
}

/**
 * Custom P2P error class for peer-to-peer communication errors
 */
export class P2PError extends Error {
  constructor(message, code, peerInfo = null) {
    super(message);
    this.name = 'P2PError';
    this.code = code;
    this.peerInfo = peerInfo;
    this.timestamp = new Date();
  }
}

/**
 * Error codes for P2P operations
 */
export const P2P_ERROR_CODES = {
  CONNECTION_FAILED: 'P2P_CONNECTION_FAILED',
  PEER_UNAVAILABLE: 'P2P_PEER_UNAVAILABLE',
  DATA_TRANSFER_FAILED: 'P2P_DATA_TRANSFER_FAILED',
  INVALID_DATA: 'P2P_INVALID_DATA',
  TIMEOUT: 'P2P_TIMEOUT',
  ENCRYPTION_ERROR: 'P2P_ENCRYPTION_ERROR',
  DECRYPTION_ERROR: 'P2P_DECRYPTION_ERROR',
  PERMISSION_DENIED: 'P2P_PERMISSION_DENIED',
  UNKNOWN: 'P2P_UNKNOWN_ERROR',
};

/**
 * Parse error response from fetch API
 * @param {Response} response - Fetch API response object
 * @returns {Promise<ApiError>} Standardized API error
 */
export const parseErrorResponse = async (response) => {
  let errorData = null;
  let errorMessage = `Request failed with status ${response.status}`;

  try {
    // Try to parse error response as JSON
    errorData = await response.json();
    if (errorData && errorData.message) {
      errorMessage = errorData.message;
    }
  } catch (e) {
    // If JSON parsing fails, try to get text
    try {
      const textError = await response.text();
      if (textError) {
        errorMessage = textError;
      }
    } catch (textError) {
      // If text parsing also fails, use default message
      console.error('Failed to parse error response:', textError);
    }
  }

  return new ApiError(errorMessage, response.status, errorData);
};

/**
 * Handle API errors in a standardized way
 * @param {Error} error - Error object
 * @param {Function} [onError] - Optional callback for custom error handling
 * @returns {Object} Standardized error object
 */
export const handleApiError = (error, onError = null) => {
  // Create standardized error object
  const errorObj = {
    message: error.message || 'An unknown error occurred',
    status: error instanceof ApiError ? error.status : 500,
    timestamp: error instanceof ApiError ? error.timestamp : new Date(),
    data: error instanceof ApiError ? error.data : null,
    originalError: error,
  };

  // Log error to console
  console.error('API Error:', errorObj);

  // Call custom error handler if provided
  if (onError && typeof onError === 'function') {
    onError(errorObj);
  }

  return errorObj;
};

/**
 * Handle P2P errors in a standardized way
 * @param {Error} error - Error object
 * @param {Function} [onError] - Optional callback for custom error handling
 * @returns {Object} Standardized error object
 */
export const handleP2PError = (error, onError = null) => {
  // Create standardized error object
  const errorObj = {
    message: error.message || 'An unknown P2P error occurred',
    code: error instanceof P2PError ? error.code : P2P_ERROR_CODES.UNKNOWN,
    timestamp: error instanceof P2PError ? error.timestamp : new Date(),
    peerInfo: error instanceof P2PError ? error.peerInfo : null,
    originalError: error,
  };

  // Log error to console
  console.error('P2P Error:', errorObj);

  // Call custom error handler if provided
  if (onError && typeof onError === 'function') {
    onError(errorObj);
  }

  return errorObj;
};

/**
 * Get user-friendly error message based on error type
 * @param {Error|ApiError|P2PError|Object} error - Error object
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyErrorMessage = (error) => {
  // P2P errors
  if (error instanceof P2PError) {
    switch (error.code) {
      case P2P_ERROR_CODES.CONNECTION_FAILED:
        return 'Failed to establish peer connection. Please try again.';
      case P2P_ERROR_CODES.PEER_UNAVAILABLE:
        return 'The peer you are trying to connect to is unavailable.';
      case P2P_ERROR_CODES.DATA_TRANSFER_FAILED:
        return 'Failed to transfer data between peers. Please try again.';
      case P2P_ERROR_CODES.TIMEOUT:
        return 'The connection timed out. Please try again.';
      case P2P_ERROR_CODES.ENCRYPTION_ERROR:
      case P2P_ERROR_CODES.DECRYPTION_ERROR:
        return 'There was an encryption error. Your data is secure, but the operation failed.';
      case P2P_ERROR_CODES.PERMISSION_DENIED:
        return 'Permission denied. You may need to adjust your browser settings.';
      default:
        return 'An unexpected peer-to-peer error occurred. Please try again.';
    }
  }

  // Network errors
  if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
    return 'Unable to connect to the network. Please check your internet connection and try again.';
  }

  // Authentication errors
  if (error.status === 401) {
    return 'Your session has expired. Please log in again.';
  }

  if (error.status === 403) {
    return 'You don\'t have permission to access this resource.';
  }

  // Not found errors
  if (error.status === 404) {
    return 'The requested resource was not found.';
  }

  // Validation errors
  if (error.status === 422 || error.status === 400) {
    return error.message || 'The submitted data is invalid. Please check your inputs and try again.';
  }

  // Server errors
  if (error.status >= 500) {
    return 'The server encountered an error. Please try again later.';
  }

  // Default message
  return error.message || 'An unexpected error occurred. Please try again.';
};

/**
 * Create a fetch wrapper with standardized error handling
 * @param {Function} fetchFn - Fetch function to wrap
 * @returns {Function} Wrapped fetch function with error handling
 */
export const withErrorHandling = (fetchFn) => {
  return async (...args) => {
    try {
      const response = await fetchFn(...args);
      
      if (!response.ok) {
        throw await parseErrorResponse(response);
      }
      
      return response;
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError(
        error.message || 'Network error',
        0,
        { originalError: error }
      );
    }
  };
};

// Export a pre-configured fetch with error handling
export const fetchWithErrorHandling = withErrorHandling(fetch);
