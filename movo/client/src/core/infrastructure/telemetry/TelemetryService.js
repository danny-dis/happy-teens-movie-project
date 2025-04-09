/**
 * Telemetry Service for Movo
 * Provides centralized telemetry collection and reporting
 * 
 * @author zophlic
 */

import loggingService from '../logging/LoggingService';
import configService from '../config/ConfigService';

// Event categories
export const EVENT_CATEGORY = {
  USER: 'user',
  CONTENT: 'content',
  PLAYBACK: 'playback',
  NAVIGATION: 'navigation',
  PERFORMANCE: 'performance',
  ERROR: 'error',
  FEATURE: 'feature'
};

// Event actions
export const EVENT_ACTION = {
  // User events
  USER_SIGN_IN: 'user_sign_in',
  USER_SIGN_OUT: 'user_sign_out',
  USER_SIGN_UP: 'user_sign_up',
  USER_UPDATE_PROFILE: 'user_update_profile',
  USER_UPDATE_PREFERENCES: 'user_update_preferences',
  
  // Content events
  CONTENT_VIEW: 'content_view',
  CONTENT_SEARCH: 'content_search',
  CONTENT_FILTER: 'content_filter',
  CONTENT_RATE: 'content_rate',
  CONTENT_SHARE: 'content_share',
  CONTENT_ADD_TO_WATCHLIST: 'content_add_to_watchlist',
  CONTENT_REMOVE_FROM_WATCHLIST: 'content_remove_from_watchlist',
  
  // Playback events
  PLAYBACK_START: 'playback_start',
  PLAYBACK_PAUSE: 'playback_pause',
  PLAYBACK_RESUME: 'playback_resume',
  PLAYBACK_COMPLETE: 'playback_complete',
  PLAYBACK_SEEK: 'playback_seek',
  PLAYBACK_RATE_CHANGE: 'playback_rate_change',
  PLAYBACK_QUALITY_CHANGE: 'playback_quality_change',
  PLAYBACK_ERROR: 'playback_error',
  PLAYBACK_BUFFERING: 'playback_buffering',
  
  // Navigation events
  NAVIGATION_PAGE_VIEW: 'navigation_page_view',
  NAVIGATION_MENU_CLICK: 'navigation_menu_click',
  NAVIGATION_SEARCH: 'navigation_search',
  NAVIGATION_FILTER: 'navigation_filter',
  NAVIGATION_SORT: 'navigation_sort',
  
  // Performance events
  PERFORMANCE_TIMING: 'performance_timing',
  PERFORMANCE_MEMORY: 'performance_memory',
  PERFORMANCE_NETWORK: 'performance_network',
  PERFORMANCE_FPS: 'performance_fps',
  
  // Error events
  ERROR_API: 'error_api',
  ERROR_JAVASCRIPT: 'error_javascript',
  ERROR_NETWORK: 'error_network',
  ERROR_PLAYBACK: 'error_playback',
  
  // Feature events
  FEATURE_TOGGLE: 'feature_toggle',
  FEATURE_USE: 'feature_use'
};

/**
 * Telemetry service class
 */
export class TelemetryService {
  constructor() {
    this.enabled = configService.get('features.analytics', true);
    this.userId = null;
    this.sessionId = this._generateSessionId();
    this.eventQueue = [];
    this.flushInterval = null;
    this.flushIntervalTime = 30000; // 30 seconds
    this.maxQueueSize = 100;
    this.providers = [];
    
    // Bind methods
    this.trackEvent = this.trackEvent.bind(this);
    this.trackPageView = this.trackPageView.bind(this);
    this.trackError = this.trackError.bind(this);
    this.setUserId = this.setUserId.bind(this);
    this.enable = this.enable.bind(this);
    this.disable = this.disable.bind(this);
    this.flush = this.flush.bind(this);
    this.registerProvider = this.registerProvider.bind(this);
    
    // Initialize
    this._initialize();
  }
  
  /**
   * Track an event
   * @param {string} category - Event category
   * @param {string} action - Event action
   * @param {Object} properties - Event properties
   */
  trackEvent(category, action, properties = {}) {
    if (!this.enabled) {
      return;
    }
    
    const event = {
      type: 'event',
      category,
      action,
      properties,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this._queueEvent(event);
  }
  
  /**
   * Track a page view
   * @param {string} pageName - Page name
   * @param {Object} properties - Page properties
   */
  trackPageView(pageName, properties = {}) {
    if (!this.enabled) {
      return;
    }
    
    const event = {
      type: 'pageview',
      pageName,
      properties: {
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
        ...properties
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this._queueEvent(event);
  }
  
  /**
   * Track an error
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   */
  trackError(error, context = {}) {
    if (!this.enabled) {
      return;
    }
    
    const event = {
      type: 'error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId
    };
    
    this._queueEvent(event);
  }
  
  /**
   * Set user ID
   * @param {string} userId - User ID
   */
  setUserId(userId) {
    this.userId = userId;
  }
  
  /**
   * Enable telemetry
   */
  enable() {
    this.enabled = true;
    configService.set('features.analytics', true);
    
    // Start flush interval
    this._startFlushInterval();
  }
  
  /**
   * Disable telemetry
   */
  disable() {
    this.enabled = false;
    configService.set('features.analytics', false);
    
    // Stop flush interval
    this._stopFlushInterval();
    
    // Clear event queue
    this.eventQueue = [];
  }
  
  /**
   * Flush event queue
   * @returns {Promise<boolean>} Whether flush was successful
   */
  async flush() {
    if (this.eventQueue.length === 0) {
      return true;
    }
    
    try {
      // Get events to send
      const events = [...this.eventQueue];
      this.eventQueue = [];
      
      // Send events to providers
      const results = await Promise.all(
        this.providers.map(provider => provider.sendEvents(events))
      );
      
      // Check if all providers succeeded
      const success = results.every(result => result);
      
      if (!success) {
        // Put events back in queue
        this.eventQueue = [...events, ...this.eventQueue];
      }
      
      return success;
    } catch (error) {
      loggingService.error('Failed to flush telemetry events', { error });
      
      // Put events back in queue
      this.eventQueue = [...this.eventQueue];
      
      return false;
    }
  }
  
  /**
   * Register a telemetry provider
   * @param {Object} provider - Telemetry provider
   */
  registerProvider(provider) {
    if (typeof provider.sendEvents !== 'function') {
      throw new Error('Telemetry provider must have a sendEvents method');
    }
    
    this.providers.push(provider);
  }
  
  /**
   * Initialize telemetry service
   * @private
   */
  _initialize() {
    // Load user ID from localStorage
    try {
      const savedUserId = localStorage.getItem('movo_telemetry_user_id');
      
      if (savedUserId) {
        this.userId = savedUserId;
      }
    } catch (error) {
      loggingService.error('Failed to load telemetry user ID', { error });
    }
    
    // Start flush interval
    if (this.enabled) {
      this._startFlushInterval();
    }
    
    // Set up beforeunload handler
    window.addEventListener('beforeunload', () => {
      // Flush events on page unload
      if (this.eventQueue.length > 0 && navigator.sendBeacon) {
        // Use sendBeacon for best-effort delivery
        const events = [...this.eventQueue];
        
        for (const provider of this.providers) {
          if (provider.beaconUrl) {
            navigator.sendBeacon(
              provider.beaconUrl,
              JSON.stringify({
                events,
                sessionId: this.sessionId,
                userId: this.userId
              })
            );
          }
        }
      }
    });
    
    // Track initial page view
    this.trackPageView(window.location.pathname);
    
    // Set up navigation tracking
    this._setupNavigationTracking();
  }
  
  /**
   * Generate session ID
   * @private
   * @returns {string} Session ID
   */
  _generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * Queue an event
   * @private
   * @param {Object} event - Event to queue
   */
  _queueEvent(event) {
    this.eventQueue.push(event);
    
    // Flush if queue is full
    if (this.eventQueue.length >= this.maxQueueSize) {
      this.flush();
    }
  }
  
  /**
   * Start flush interval
   * @private
   */
  _startFlushInterval() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.flushIntervalTime);
  }
  
  /**
   * Stop flush interval
   * @private
   */
  _stopFlushInterval() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
  
  /**
   * Set up navigation tracking
   * @private
   */
  _setupNavigationTracking() {
    // Track history changes
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = (...args) => {
      originalPushState.apply(window.history, args);
      this._handleHistoryChange();
    };
    
    window.history.replaceState = (...args) => {
      originalReplaceState.apply(window.history, args);
      this._handleHistoryChange();
    };
    
    window.addEventListener('popstate', () => {
      this._handleHistoryChange();
    });
  }
  
  /**
   * Handle history change
   * @private
   */
  _handleHistoryChange() {
    this.trackPageView(window.location.pathname);
  }
}

// Create singleton instance
const telemetryService = new TelemetryService();

export default telemetryService;
