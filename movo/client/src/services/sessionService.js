/**
 * Session Management Service for Movo
 * Handles user sessions, watch progress, and preferences
 * 
 * @author zophlic
 */

import { fetchWithErrorHandling } from '../utils/errorHandling';
import analyticsService, { EVENT_CATEGORIES } from './analyticsService';
import cryptoUtils from '../utils/cryptoUtils';

// Constants
const SESSION_STORAGE_KEY = 'movo_session';
const WATCH_PROGRESS_KEY = 'movo_watch_progress';
const SESSION_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000; // 7 days
const PROGRESS_SYNC_INTERVAL = 60 * 1000; // 1 minute
const PROGRESS_THRESHOLD = 0.05; // 5% threshold to save progress

/**
 * Session service class
 */
class SessionService {
  constructor() {
    this.session = null;
    this.watchProgress = new Map();
    this.isInitialized = false;
    this.syncInterval = null;
    this.pendingSyncItems = new Set();
    this.lastSyncTime = 0;
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.getSession = this.getSession.bind(this);
    this.setSession = this.setSession.bind(this);
    this.clearSession = this.clearSession.bind(this);
    this.isSessionValid = this.isSessionValid.bind(this);
    this.refreshSession = this.refreshSession.bind(this);
    this.saveWatchProgress = this.saveWatchProgress.bind(this);
    this.getWatchProgress = this.getWatchProgress.bind(this);
    this.syncWatchProgress = this.syncWatchProgress.bind(this);
    this.clearWatchProgress = this.clearWatchProgress.bind(this);
  }
  
  /**
   * Initialize session service
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }
    
    try {
      // Load session from localStorage
      await this._loadSession();
      
      // Load watch progress from localStorage
      await this._loadWatchProgress();
      
      // Set up sync interval
      this._setupSyncInterval();
      
      // Set up beforeunload handler to save progress
      window.addEventListener('beforeunload', () => {
        this._saveWatchProgressToStorage();
        
        // Attempt a final sync if there are pending items
        if (this.pendingSyncItems.size > 0 && navigator.sendBeacon) {
          const syncData = {
            items: Array.from(this.pendingSyncItems).map(mediaId => ({
              mediaId,
              progress: this.watchProgress.get(mediaId)
            }))
          };
          
          navigator.sendBeacon('/api/sync/watch-progress', JSON.stringify(syncData));
        }
      });
      
      // Set up visibility change handler
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          // Save progress when tab becomes hidden
          this._saveWatchProgressToStorage();
        } else {
          // Check session validity when tab becomes visible
          this.isSessionValid();
        }
      });
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize session service', error);
      return false;
    }
  }
  
  /**
   * Get current session
   * @returns {Object|null} Session object or null if no session
   */
  getSession() {
    return this.session;
  }
  
  /**
   * Set session
   * @param {Object} sessionData - Session data
   * @returns {Promise<boolean>} Whether session was set successfully
   */
  async setSession(sessionData) {
    try {
      if (!sessionData || !sessionData.token) {
        throw new Error('Invalid session data');
      }
      
      // Add expiry time
      const expiresAt = Date.now() + SESSION_EXPIRY_TIME;
      
      this.session = {
        ...sessionData,
        expiresAt
      };
      
      // Save to localStorage
      await this._saveSessionToStorage();
      
      // Track session start
      analyticsService.trackEvent(
        EVENT_CATEGORIES.USER,
        'session_start',
        {
          userId: sessionData.userId,
          isNewUser: sessionData.isNewUser || false
        }
      );
      
      return true;
    } catch (error) {
      console.error('Failed to set session', error);
      return false;
    }
  }
  
  /**
   * Clear session
   * @returns {Promise<boolean>} Whether session was cleared successfully
   */
  async clearSession() {
    try {
      // Track session end if there is a session
      if (this.session) {
        analyticsService.trackEvent(
          EVENT_CATEGORIES.USER,
          'session_end',
          {
            userId: this.session.userId,
            sessionDuration: Date.now() - (this.session.startedAt || Date.now())
          }
        );
      }
      
      this.session = null;
      
      // Remove from localStorage
      localStorage.removeItem(SESSION_STORAGE_KEY);
      
      return true;
    } catch (error) {
      console.error('Failed to clear session', error);
      return false;
    }
  }
  
  /**
   * Check if session is valid
   * @returns {boolean} Whether session is valid
   */
  isSessionValid() {
    if (!this.session) {
      return false;
    }
    
    const now = Date.now();
    const isValid = this.session.expiresAt > now;
    
    // If session is about to expire, refresh it
    if (isValid && this.session.expiresAt - now < SESSION_EXPIRY_TIME / 2) {
      this.refreshSession();
    }
    
    return isValid;
  }
  
  /**
   * Refresh session
   * @returns {Promise<boolean>} Whether session was refreshed successfully
   */
  async refreshSession() {
    try {
      if (!this.session || !this.session.refreshToken) {
        return false;
      }
      
      // Call refresh API
      const response = await fetchWithErrorHandling('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
          refreshToken: this.session.refreshToken
        })
      });
      
      // Update session
      if (response && response.token) {
        this.session = {
          ...this.session,
          token: response.token,
          refreshToken: response.refreshToken || this.session.refreshToken,
          expiresAt: Date.now() + SESSION_EXPIRY_TIME
        };
        
        // Save to localStorage
        await this._saveSessionToStorage();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to refresh session', error);
      
      // If refresh fails, clear session
      await this.clearSession();
      
      return false;
    }
  }
  
  /**
   * Save watch progress
   * @param {string} mediaId - Media ID
   * @param {Object} progressData - Progress data
   * @returns {Promise<boolean>} Whether progress was saved successfully
   */
  async saveWatchProgress(mediaId, progressData) {
    try {
      if (!mediaId || !progressData) {
        return false;
      }
      
      // Get existing progress
      const existingProgress = this.watchProgress.get(mediaId) || {};
      
      // Only save if progress has changed significantly
      if (
        !existingProgress.position || 
        Math.abs(existingProgress.position - progressData.position) > PROGRESS_THRESHOLD
      ) {
        // Update progress
        const updatedProgress = {
          ...existingProgress,
          ...progressData,
          updatedAt: Date.now()
        };
        
        this.watchProgress.set(mediaId, updatedProgress);
        
        // Add to pending sync items
        this.pendingSyncItems.add(mediaId);
        
        // Save to localStorage
        await this._saveWatchProgressToStorage();
        
        // Sync if enough time has passed since last sync
        if (Date.now() - this.lastSyncTime > PROGRESS_SYNC_INTERVAL) {
          this.syncWatchProgress();
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Failed to save watch progress for ${mediaId}`, error);
      return false;
    }
  }
  
  /**
   * Get watch progress
   * @param {string} mediaId - Media ID
   * @returns {Object|null} Progress data or null if no progress
   */
  getWatchProgress(mediaId) {
    if (!mediaId) {
      return null;
    }
    
    return this.watchProgress.get(mediaId) || null;
  }
  
  /**
   * Sync watch progress with server
   * @returns {Promise<boolean>} Whether sync was successful
   */
  async syncWatchProgress() {
    try {
      // Skip if no pending items or no session
      if (this.pendingSyncItems.size === 0 || !this.isSessionValid()) {
        return false;
      }
      
      // Prepare sync data
      const syncData = {
        items: Array.from(this.pendingSyncItems).map(mediaId => ({
          mediaId,
          progress: this.watchProgress.get(mediaId)
        }))
      };
      
      // Call sync API
      const response = await fetchWithErrorHandling('/api/sync/watch-progress', {
        method: 'POST',
        body: JSON.stringify(syncData)
      });
      
      // Clear pending items
      this.pendingSyncItems.clear();
      
      // Update last sync time
      this.lastSyncTime = Date.now();
      
      return true;
    } catch (error) {
      console.error('Failed to sync watch progress', error);
      return false;
    }
  }
  
  /**
   * Clear watch progress
   * @param {string} mediaId - Media ID (optional, if not provided, clears all progress)
   * @returns {Promise<boolean>} Whether progress was cleared successfully
   */
  async clearWatchProgress(mediaId) {
    try {
      if (mediaId) {
        // Clear specific media progress
        this.watchProgress.delete(mediaId);
        this.pendingSyncItems.delete(mediaId);
      } else {
        // Clear all progress
        this.watchProgress.clear();
        this.pendingSyncItems.clear();
      }
      
      // Save to localStorage
      await this._saveWatchProgressToStorage();
      
      // Sync with server
      if (this.isSessionValid()) {
        await fetchWithErrorHandling('/api/sync/clear-progress', {
          method: 'POST',
          body: JSON.stringify({
            mediaId: mediaId || 'all'
          })
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to clear watch progress', error);
      return false;
    }
  }
  
  /**
   * Load session from localStorage
   * @private
   */
  async _loadSession() {
    try {
      const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
      
      if (sessionData) {
        // Decrypt session data
        const decryptedData = await cryptoUtils.decrypt(sessionData);
        this.session = JSON.parse(decryptedData);
        
        // Check if session is valid
        if (!this.isSessionValid()) {
          // Try to refresh session
          const refreshed = await this.refreshSession();
          
          if (!refreshed) {
            // Clear invalid session
            await this.clearSession();
          }
        }
      }
    } catch (error) {
      console.error('Failed to load session', error);
      
      // Clear corrupted session
      localStorage.removeItem(SESSION_STORAGE_KEY);
      this.session = null;
    }
  }
  
  /**
   * Save session to localStorage
   * @private
   */
  async _saveSessionToStorage() {
    try {
      if (this.session) {
        // Encrypt session data
        const encryptedData = await cryptoUtils.encrypt(JSON.stringify(this.session));
        localStorage.setItem(SESSION_STORAGE_KEY, encryptedData);
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save session', error);
    }
  }
  
  /**
   * Load watch progress from localStorage
   * @private
   */
  async _loadWatchProgress() {
    try {
      const progressData = localStorage.getItem(WATCH_PROGRESS_KEY);
      
      if (progressData) {
        // Decrypt progress data
        const decryptedData = await cryptoUtils.decrypt(progressData);
        const parsedData = JSON.parse(decryptedData);
        
        // Convert to Map
        this.watchProgress = new Map(Object.entries(parsedData));
      }
    } catch (error) {
      console.error('Failed to load watch progress', error);
      
      // Clear corrupted progress
      localStorage.removeItem(WATCH_PROGRESS_KEY);
      this.watchProgress = new Map();
    }
  }
  
  /**
   * Save watch progress to localStorage
   * @private
   */
  async _saveWatchProgressToStorage() {
    try {
      if (this.watchProgress.size > 0) {
        // Convert Map to object
        const progressObject = Object.fromEntries(this.watchProgress);
        
        // Encrypt progress data
        const encryptedData = await cryptoUtils.encrypt(JSON.stringify(progressObject));
        localStorage.setItem(WATCH_PROGRESS_KEY, encryptedData);
      } else {
        localStorage.removeItem(WATCH_PROGRESS_KEY);
      }
    } catch (error) {
      console.error('Failed to save watch progress', error);
    }
  }
  
  /**
   * Set up sync interval
   * @private
   */
  _setupSyncInterval() {
    // Clear existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Set up new interval
    this.syncInterval = setInterval(() => {
      if (this.pendingSyncItems.size > 0) {
        this.syncWatchProgress();
      }
    }, PROGRESS_SYNC_INTERVAL);
  }
}

// Create singleton instance
const sessionService = new SessionService();

// Initialize on import
sessionService.initialize();

export default sessionService;
