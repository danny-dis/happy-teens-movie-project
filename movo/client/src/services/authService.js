/**
 * Improved Authentication Service for Movo
 * Connects to secure backend API with JWT tokens and automatic refresh
 * 
 * @author zophlic
 * @updated 2025
 */

import axios from 'axios';

// Constants
const ACCESS_TOKEN_KEY = 'movo_access_token';
const REFRESH_TOKEN_KEY = 'movo_refresh_token';
const USER_KEY = 'movo_user';
const TOKEN_EXPIRY_KEY = 'movo_token_expiry';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Auth events
const AUTH_EVENTS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  TOKEN_REFRESH: 'token_refresh',
  SESSION_EXPIRED: 'session_expired',
  PROFILE_UPDATE: 'profile_update',
  ERROR: 'error'
};

/**
 * API Error class for standardized error handling
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Authentication service class
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.refreshPromise = null;
    this.eventListeners = new Map();
    this.isInitialized = false;
    
    // Create axios instance
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Set up request interceptor to add auth header
    this.apiClient.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Set up response interceptor to handle token refresh
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 and we haven't tried to refresh token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Attempt to refresh token
            await this.refreshToken();
            
            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${this.getAccessToken()}`;
            return this.apiClient(originalRequest);
          } catch (refreshError) {
            // If refresh fails, logout and reject
            await this.logout();
            this._notifyListeners(AUTH_EVENTS.SESSION_EXPIRED, {
              error: 'Session expired. Please log in again.'
            });
            return Promise.reject(refreshError);
          }
        }
        
        // Transform error into standardized format
        const apiError = this._transformError(error);
        return Promise.reject(apiError);
      }
    );
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.register = this.register.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.changePassword = this.changePassword.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.getAccessToken = this.getAccessToken.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.getUserInfo = this.getUserInfo.bind(this);
    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
    this.api = this.apiClient;
  }
  
  /**
   * Transform API error into standardized format
   * @private
   * @param {Error} error - Axios error
   * @returns {ApiError} Standardized error
   */
  _transformError(error) {
    if (error.response) {
      // Server returned error response
      const { data, status } = error.response;
      
      if (data?.error) {
        // Backend returned structured error
        return new ApiError(
          data.error.message || 'An error occurred',
          status,
          data.error.code || 'UNKNOWN_ERROR',
          data.error.details || null
        );
      }
      
      return new ApiError(
        error.message,
        status,
        'API_ERROR'
      );
    } else if (error.request) {
      // Request made but no response received
      return new ApiError(
        'Network error. Please check your connection.',
        0,
        'NETWORK_ERROR'
      );
    }
    
    // Something else happened
    return new ApiError(
      error.message || 'An unexpected error occurred',
      500,
      'UNKNOWN_ERROR'
    );
  }
  
  /**
   * Initialize auth service
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }
    
    try {
      // Load auth data from localStorage
      this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      this.tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      const userJson = localStorage.getItem(USER_KEY);
      
      if (userJson) {
        this.currentUser = JSON.parse(userJson);
      }
      
      // Check if token is expired or about to expire (within 5 minutes)
      if (this.accessToken && this.tokenExpiry) {
        const expiryDate = new Date(this.tokenExpiry);
        const now = new Date();
        
        if (expiryDate <= new Date(now.getTime() + 5 * 60 * 1000)) {
          // Token expired or expiring soon, try to refresh
          if (this.refreshToken) {
            try {
              await this.refreshToken();
            } catch (error) {
              console.warn('Failed to refresh token during initialization:', error.message);
              // Clear auth data if refresh fails
              this._clearAuthData();
            }
          } else {
            // No refresh token, clear auth data
            this._clearAuthData();
          }
        }
      } else if (!this.accessToken && this.refreshToken) {
        // We have refresh token but no access token, try to refresh
        try {
          await this.refreshToken();
        } catch (error) {
          console.warn('Failed to refresh token:', error.message);
          this._clearAuthData();
        }
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      this._clearAuthData();
      return false;
    }
  }
  
  /**
   * Log in a user
   * @param {string} username - Username or email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data
   */
  async login(username, password) {
    try {
      const response = await this.apiClient.post('/login', {
        username,
        password
      });
      
      const { data } = response.data;
      
      if (!data || !data.accessToken || !data.user) {
        throw new ApiError('Invalid response from server', 500, 'INVALID_RESPONSE');
      }
      
      // Store auth data
      this.currentUser = data.user;
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      
      // Calculate token expiry (default 15 minutes if not provided)
      const expiresIn = data.expiresIn || '15m';
      const expiryMs = this._parseExpiryTime(expiresIn);
      const expiryDate = new Date(Date.now() + expiryMs);
      this.tokenExpiry = expiryDate.toISOString();
      
      // Save to localStorage
      this._saveAuthData();
      
      // Notify listeners
      this._notifyListeners(AUTH_EVENTS.LOGIN, {
        user: this.currentUser
      });
      
      return this.currentUser;
    } catch (error) {
      // Clear any partial auth data
      this._clearAuthData();
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw this._transformError(error);
    }
  }
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.username - Username
   * @param {string} userData.email - Email
   * @param {string} userData.password - Password
   * @param {string} userData.confirmPassword - Password confirmation
   * @returns {Promise<Object>} User data
   */
  async register(userData) {
    try {
      const response = await this.apiClient.post('/register', {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.confirmPassword
      });
      
      const { data } = response.data;
      
      if (!data || !data.accessToken || !data.user) {
        throw new ApiError('Invalid response from server', 500, 'INVALID_RESPONSE');
      }
      
      // Store auth data
      this.currentUser = data.user;
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      
      // Calculate token expiry
      const expiresIn = data.expiresIn || '15m';
      const expiryMs = this._parseExpiryTime(expiresIn);
      const expiryDate = new Date(Date.now() + expiryMs);
      this.tokenExpiry = expiryDate.toISOString();
      
      // Save to localStorage
      this._saveAuthData();
      
      // Notify listeners
      this._notifyListeners(AUTH_EVENTS.LOGIN, {
        user: this.currentUser
      });
      
      return this.currentUser;
    } catch (error) {
      this._clearAuthData();
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw this._transformError(error);
    }
  }
  
  /**
   * Refresh the authentication token
   * @returns {Promise<string>} New access token
   */
  async refreshToken() {
    // If a refresh is already in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    // Check if we have a refresh token
    if (!this.refreshToken) {
      throw new ApiError('No refresh token available', 401, 'NO_REFRESH_TOKEN');
    }
    
    // Create a new refresh promise
    this.refreshPromise = (async () => {
      try {
        const response = await this.apiClient.post('/refresh-token', {
          refreshToken: this.refreshToken
        });
        
        const { data } = response.data;
        
        if (!data || !data.accessToken) {
          throw new ApiError('Invalid refresh response', 500, 'INVALID_RESPONSE');
        }
        
        // Update tokens
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken || this.refreshToken;
        
        // Calculate new expiry
        const expiresIn = data.expiresIn || '15m';
        const expiryMs = this._parseExpiryTime(expiresIn);
        const expiryDate = new Date(Date.now() + expiryMs);
        this.tokenExpiry = expiryDate.toISOString();
        
        // Save to localStorage
        this._saveAuthData();
        
        // Notify listeners
        this._notifyListeners(AUTH_EVENTS.TOKEN_REFRESH, {
          user: this.currentUser,
          expiresAt: this.tokenExpiry
        });
        
        return this.accessToken;
      } catch (error) {
        console.error('Token refresh failed:', error);
        
        // Clear auth data on refresh failure
        this._clearAuthData();
        
        // Notify listeners
        this._notifyListeners(AUTH_EVENTS.SESSION_EXPIRED, {
          error: error.message || 'Session expired'
        });
        
        if (error instanceof ApiError) {
          throw error;
        }
        
        throw this._transformError(error);
      } finally {
        // Clear the refresh promise
        this.refreshPromise = null;
      }
    })();
    
    return this.refreshPromise;
  }
  
  /**
   * Log out the current user
   * @returns {Promise<boolean>} Whether logout was successful
   */
  async logout() {
    const user = this.currentUser;
    
    try {
      // Call logout endpoint to revoke refresh token on server
      if (this.refreshToken) {
        await this.apiClient.post('/logout', {
          refreshToken: this.refreshToken
        });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error.message);
      // Continue with local logout even if API fails
    } finally {
      // Clear auth data
      this._clearAuthData();
      
      // Notify listeners
      this._notifyListeners(AUTH_EVENTS.LOGOUT, { user });
    }
    
    return true;
  }
  
  /**
   * Get current user info from server
   * @returns {Promise<Object>} User data
   */
  async getUserInfo() {
    if (!this.isAuthenticated()) {
      throw new ApiError('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }
    
    try {
      const response = await this.apiClient.get('/me');
      const { data } = response.data;
      
      if (data?.user) {
        this.currentUser = data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
      }
      
      return this.currentUser;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw this._transformError(error);
    }
  }
  
  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Whether password change was successful
   */
  async changePassword(currentPassword, newPassword) {
    if (!this.isAuthenticated()) {
      throw new ApiError('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }
    
    try {
      await this.apiClient.post('/change-password', {
        currentPassword,
        newPassword
      });
      
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw this._transformError(error);
    }
  }
  
  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated user data
   */
  async updateProfile(profileData) {
    if (!this.isAuthenticated()) {
      throw new ApiError('Not authenticated', 401, 'NOT_AUTHENTICATED');
    }
    
    try {
      const response = await this.apiClient.patch('/me', profileData);
      const { data } = response.data;
      
      if (data?.user) {
        this.currentUser = {
          ...this.currentUser,
          ...data.user
        };
        localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
        
        // Notify listeners
        this._notifyListeners(AUTH_EVENTS.PROFILE_UPDATE, {
          user: this.currentUser
        });
      }
      
      return this.currentUser;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw this._transformError(error);
    }
  }
  
  /**
   * Check if user is authenticated
   * @returns {boolean} Whether user is authenticated
   */
  isAuthenticated() {
    return !!this.accessToken && !!this.currentUser;
  }
  
  /**
   * Check if token is expired
   * @returns {boolean} Whether token is expired
   */
  isTokenExpired() {
    if (!this.tokenExpiry) return true;
    
    const expiryDate = new Date(this.tokenExpiry);
    const now = new Date();
    
    return expiryDate <= now;
  }
  
  /**
   * Get access token
   * @returns {string|null} Access token
   */
  getAccessToken() {
    return this.accessToken;
  }
  
  /**
   * Get refresh token
   * @returns {string|null} Refresh token
   */
  getRefreshToken() {
    return this.refreshToken;
  }
  
  /**
   * Get current user
   * @returns {Object|null} Current user
   */
  getCurrentUser() {
    return this.currentUser;
  }
  
  /**
   * Get axios API client instance
   * @returns {AxiosInstance} Axios instance with auth headers
   */
  getApiClient() {
    return this.apiClient;
  }
  
  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  addEventListener(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event).add(listener);
  }
  
  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener to remove
   */
  removeEventListener(event, listener) {
    if (!this.eventListeners.has(event)) {
      return;
    }
    
    this.eventListeners.get(event).delete(listener);
    
    if (this.eventListeners.get(event).size === 0) {
      this.eventListeners.delete(event);
    }
  }
  
  /**
   * Parse expiry time string to milliseconds
   * @private
   * @param {string} expiry - Expiry time (e.g., '15m', '7d', '1h')
   * @returns {number} Milliseconds
   */
  _parseExpiryTime(expiry) {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 15 * 60 * 1000; // Default 15 minutes
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
      's': 1000,
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    };
    
    return value * (multipliers[unit] || 60000);
  }
  
  /**
   * Save auth data to localStorage
   * @private
   */
  _saveAuthData() {
    if (this.accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, this.accessToken);
    }
    if (this.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken);
    }
    if (this.tokenExpiry) {
      localStorage.setItem(TOKEN_EXPIRY_KEY, this.tokenExpiry);
    }
    if (this.currentUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
    }
  }
  
  /**
   * Clear authentication data
   * @private
   */
  _clearAuthData() {
    this.currentUser = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }
  
  /**
   * Notify event listeners
   * @private
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  _notifyListeners(event, data) {
    if (!this.eventListeners.has(event)) {
      return;
    }
    
    const eventData = {
      ...data,
      timestamp: Date.now()
    };
    
    this.eventListeners.get(event).forEach(listener => {
      try {
        listener(eventData);
      } catch (error) {
        console.error(`Error in auth event listener for ${event}:`, error);
      }
    });
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
export { AUTH_EVENTS, ApiError };
