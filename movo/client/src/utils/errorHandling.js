/**
 * Standardized error handling utilities for API calls
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
 * Get user-friendly error message based on error type
 * @param {Error|ApiError|Object} error - Error object
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyErrorMessage = (error) => {
  // Network errors
  if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
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
