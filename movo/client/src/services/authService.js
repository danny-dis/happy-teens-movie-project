/**
 * Authentication Service for Movo
 * Handles user authentication, session management, and permissions
 * 
 * @author zophlic
 */

import { fetchWithErrorHandling, ApiError } from '../utils/errorHandling';

// Constants
const TOKEN_KEY = 'movo_auth_token';
const USER_KEY = 'movo_user';
const TOKEN_EXPIRY_KEY = 'movo_token_expiry';

// Auth events
const AUTH_EVENTS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  TOKEN_REFRESH: 'token_refresh',
  SESSION_EXPIRED: 'session_expired',
  PROFILE_UPDATE: 'profile_update',
};

/**
 * Authentication service class
 */
class AuthService {
  constructor() {
    this.currentUser = null;
    this.token = null;
    this.tokenExpiry = null;
    this.refreshPromise = null;
    this.eventListeners = new Map();
    this.isInitialized = false;
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.register = this.register.bind(this);
    this.refreshToken = this.refreshToken.bind(this);
    this.updateProfile = this.updateProfile.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.getToken = this.getToken.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.hasPermission = this.hasPermission.bind(this);
    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
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
      this.token = localStorage.getItem(TOKEN_KEY);
      this.tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      const userJson = localStorage.getItem(USER_KEY);
      
      if (userJson) {
        this.currentUser = JSON.parse(userJson);
      }
      
      // Check if token is expired
      if (this.token && this.tokenExpiry) {
        const expiryDate = new Date(this.tokenExpiry);
        const now = new Date();
        
        // If token is expired or about to expire (within 5 minutes), refresh it
        if (expiryDate <= new Date(now.getTime() + 5 * 60 * 1000)) {
          await this.refreshToken();
        }
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize auth service', error);
      
      // Clear potentially corrupted auth data
      this._clearAuthData();
      
      return false;
    }
  }
  
  /**
   * Log in a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User data
   */
  async login(email, password) {
    try {
      // In a real implementation, this would call an API
      // For now, we'll simulate a successful login
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Mock response
      const response = {
        user: {
          id: '123456',
          email,
          name: 'Test User',
          avatar: 'https://via.placeholder.com/150',
          role: 'user',
          permissions: ['view_content', 'stream_media'],
          createdAt: new Date().toISOString(),
        },
        token: 'mock_jwt_token',
        expiresIn: 3600, // 1 hour
      };
      
      // Store auth data
      this.currentUser = response.user;
      this.token = response.token;
      
      // Calculate token expiry
      const expiryDate = new Date(new Date().getTime() + response.expiresIn * 1000);
      this.tokenExpiry = expiryDate.toISOString();
      
      // Save to localStorage
      localStorage.setItem(TOKEN_KEY, this.token);
      localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
      localStorage.setItem(TOKEN_EXPIRY_KEY, this.tokenExpiry);
      
      // Notify listeners
      this._notifyListeners(AUTH_EVENTS.LOGIN, {
        user: this.currentUser,
      });
      
      return this.currentUser;
    } catch (error) {
      // Clear any partial auth data
      this._clearAuthData();
      
      throw error instanceof ApiError ? error : new ApiError(
        error.message || 'Login failed',
        401,
        { email }
      );
    }
  }
  
  /**
   * Log out the current user
   * @returns {Promise<boolean>} Whether logout was successful
   */
  async logout() {
    try {
      // In a real implementation, this would call an API to invalidate the token
      // For now, we'll just simulate a successful logout
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Store user before clearing for event notification
      const user = this.currentUser;
      
      // Clear auth data
      this._clearAuthData();
      
      // Notify listeners
      this._notifyListeners(AUTH_EVENTS.LOGOUT, { user });
      
      return true;
    } catch (error) {
      console.error('Logout failed', error);
      
      // Force clear auth data even if API call fails
      this._clearAuthData();
      
      return false;
    }
  }
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User data
   */
  async register(userData) {
    try {
      // In a real implementation, this would call an API
      // For now, we'll simulate a successful registration
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      const response = {
        user: {
          id: '123456',
          email: userData.email,
          name: userData.name,
          avatar: 'https://via.placeholder.com/150',
          role: 'user',
          permissions: ['view_content', 'stream_media'],
          createdAt: new Date().toISOString(),
        },
        token: 'mock_jwt_token',
        expiresIn: 3600, // 1 hour
      };
      
      // Store auth data
      this.currentUser = response.user;
      this.token = response.token;
      
      // Calculate token expiry
      const expiryDate = new Date(new Date().getTime() + response.expiresIn * 1000);
      this.tokenExpiry = expiryDate.toISOString();
      
      // Save to localStorage
      localStorage.setItem(TOKEN_KEY, this.token);
      localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
      localStorage.setItem(TOKEN_EXPIRY_KEY, this.tokenExpiry);
      
      // Notify listeners
      this._notifyListeners(AUTH_EVENTS.LOGIN, {
        user: this.currentUser,
      });
      
      return this.currentUser;
    } catch (error) {
      // Clear any partial auth data
      this._clearAuthData();
      
      throw error instanceof ApiError ? error : new ApiError(
        error.message || 'Registration failed',
        400,
        { email: userData.email }
      );
    }
  }
  
  /**
   * Refresh the authentication token
   * @returns {Promise<string>} New token
   */
  async refreshToken() {
    // If a refresh is already in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    
    // Create a new refresh promise
    this.refreshPromise = (async () => {
      try {
        // Check if we have a token to refresh
        if (!this.token) {
          throw new ApiError('No token to refresh', 401);
        }
        
        // In a real implementation, this would call an API
        // For now, we'll simulate a successful token refresh
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock response
        const response = {
          token: 'new_mock_jwt_token',
          expiresIn: 3600, // 1 hour
        };
        
        // Update token
        this.token = response.token;
        
        // Calculate token expiry
        const expiryDate = new Date(new Date().getTime() + response.expiresIn * 1000);
        this.tokenExpiry = expiryDate.toISOString();
        
        // Save to localStorage
        localStorage.setItem(TOKEN_KEY, this.token);
        localStorage.setItem(TOKEN_EXPIRY_KEY, this.tokenExpiry);
        
        // Notify listeners
        this._notifyListeners(AUTH_EVENTS.TOKEN_REFRESH, {
          user: this.currentUser,
          expiresAt: this.tokenExpiry,
        });
        
        return this.token;
      } catch (error) {
        // If refresh fails, log out the user
        console.error('Token refresh failed', error);
        
        // Clear auth data
        this._clearAuthData();
        
        // Notify listeners
        this._notifyListeners(AUTH_EVENTS.SESSION_EXPIRED, {
          error: error.message,
        });
        
        throw error instanceof ApiError ? error : new ApiError(
          error.message || 'Token refresh failed',
          401
        );
      } finally {
        // Clear the refresh promise
        this.refreshPromise = null;
      }
    })();
    
    return this.refreshPromise;
  }
  
  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated user data
   */
  async updateProfile(profileData) {
    try {
      // Check if user is authenticated
      if (!this.isAuthenticated()) {
        throw new ApiError('Not authenticated', 401);
      }
      
      // In a real implementation, this would call an API
      // For now, we'll simulate a successful profile update
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Update user data
      this.currentUser = {
        ...this.currentUser,
        ...profileData,
        updatedAt: new Date().toISOString(),
      };
      
      // Save to localStorage
      localStorage.setItem(USER_KEY, JSON.stringify(this.currentUser));
      
      // Notify listeners
      this._notifyListeners(AUTH_EVENTS.PROFILE_UPDATE, {
        user: this.currentUser,
      });
      
      return this.currentUser;
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError(
        error.message || 'Profile update failed',
        400
      );
    }
  }
  
  /**
   * Check if user is authenticated
   * @returns {boolean} Whether user is authenticated
   */
  isAuthenticated() {
    // Check if we have a token and it's not expired
    if (!this.token || !this.tokenExpiry) {
      return false;
    }
    
    const expiryDate = new Date(this.tokenExpiry);
    const now = new Date();
    
    return expiryDate > now;
  }
  
  /**
   * Get authentication token
   * @returns {string|null} Authentication token
   */
  getToken() {
    return this.token;
  }
  
  /**
   * Get current user
   * @returns {Object|null} Current user
   */
  getCurrentUser() {
    return this.currentUser;
  }
  
  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} Whether user has the permission
   */
  hasPermission(permission) {
    if (!this.isAuthenticated() || !this.currentUser) {
      return false;
    }
    
    // Admin role has all permissions
    if (this.currentUser.role === 'admin') {
      return true;
    }
    
    // Check specific permission
    return this.currentUser.permissions && 
           this.currentUser.permissions.includes(permission);
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
    
    // Clean up empty listener sets
    if (this.eventListeners.get(event).size === 0) {
      this.eventListeners.delete(event);
    }
  }
  
  /**
   * Clear authentication data
   * @private
   */
  _clearAuthData() {
    this.currentUser = null;
    this.token = null;
    this.tokenExpiry = null;
    
    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
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
    
    // Add timestamp to event data
    const eventData = {
      ...data,
      timestamp: Date.now(),
    };
    
    // Notify listeners
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
export { AUTH_EVENTS };
