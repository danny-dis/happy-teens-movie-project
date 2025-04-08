/**
 * Analytics Service for Movo
 * Tracks user interactions and application events
 * 
 * @author zophlic
 */

// Constants
const ANALYTICS_ENDPOINT = '/api/analytics';
const ANALYTICS_STORAGE_KEY = 'movo_analytics_queue';
const ANALYTICS_CONSENT_KEY = 'movo_analytics_consent';
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds

// Event categories
const EVENT_CATEGORIES = {
  NAVIGATION: 'navigation',
  CONTENT: 'content',
  STREAMING: 'streaming',
  USER: 'user',
  ERROR: 'error',
  PERFORMANCE: 'performance',
  CHIMERA: 'chimera',
};

/**
 * Analytics service class
 */
class AnalyticsService {
  constructor() {
    this.queue = [];
    this.isInitialized = false;
    this.hasConsent = false;
    this.userId = null;
    this.sessionId = null;
    this.flushInterval = null;
    this.isOffline = false;
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.setConsent = this.setConsent.bind(this);
    this.setUserId = this.setUserId.bind(this);
    this.trackEvent = this.trackEvent.bind(this);
    this.trackPageView = this.trackPageView.bind(this);
    this.trackError = this.trackError.bind(this);
    this.trackPerformance = this.trackPerformance.bind(this);
    this.flush = this.flush.bind(this);
  }
  
  /**
   * Initialize analytics service
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }
    
    try {
      // Load consent status from localStorage
      const consentValue = localStorage.getItem(ANALYTICS_CONSENT_KEY);
      this.hasConsent = consentValue === 'true';
      
      // Generate session ID
      this.sessionId = this._generateSessionId();
      
      // Load queued events from localStorage
      const queuedEvents = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      
      if (queuedEvents) {
        try {
          this.queue = JSON.parse(queuedEvents);
        } catch (error) {
          console.error('Failed to parse queued analytics events', error);
          this.queue = [];
        }
      }
      
      // Set up offline detection
      window.addEventListener('online', () => {
        this.isOffline = false;
        this.flush();
      });
      
      window.addEventListener('offline', () => {
        this.isOffline = true;
      });
      
      this.isOffline = !navigator.onLine;
      
      // Set up flush interval
      this.flushInterval = setInterval(this.flush, FLUSH_INTERVAL);
      
      // Set up beforeunload handler to flush events
      window.addEventListener('beforeunload', () => {
        this._saveQueue();
        
        // Use sendBeacon for final flush if available
        if (navigator.sendBeacon && this.queue.length > 0 && this.hasConsent) {
          navigator.sendBeacon(
            ANALYTICS_ENDPOINT,
            JSON.stringify({
              events: this.queue,
              sessionId: this.sessionId,
              userId: this.userId,
            })
          );
          
          // Clear queue
          this.queue = [];
          this._saveQueue();
        }
      });
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize analytics service', error);
      return false;
    }
  }
  
  /**
   * Set analytics consent
   * @param {boolean} consent - Whether user consents to analytics
   */
  setConsent(consent) {
    this.hasConsent = consent;
    localStorage.setItem(ANALYTICS_CONSENT_KEY, consent.toString());
    
    // If consent is given, flush any queued events
    if (consent) {
      this.flush();
    }
  }
  
  /**
   * Set user ID for analytics
   * @param {string} userId - User ID
   */
  setUserId(userId) {
    this.userId = userId;
  }
  
  /**
   * Track an analytics event
   * @param {string} category - Event category
   * @param {string} action - Event action
   * @param {Object} [properties={}] - Event properties
   */
  trackEvent(category, action, properties = {}) {
    if (!this.isInitialized) {
      return;
    }
    
    // Create event object
    const event = {
      type: 'event',
      category,
      action,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };
    
    // Add to queue
    this.queue.push(event);
    
    // Save queue to localStorage
    this._saveQueue();
    
    // Flush if queue is large enough
    if (this.queue.length >= BATCH_SIZE) {
      this.flush();
    }
  }
  
  /**
   * Track page view
   * @param {string} path - Page path
   * @param {string} title - Page title
   * @param {Object} [properties={}] - Additional properties
   */
  trackPageView(path, title, properties = {}) {
    if (!this.isInitialized) {
      return;
    }
    
    // Create page view event
    const event = {
      type: 'pageview',
      path,
      title,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      referrer: document.referrer,
    };
    
    // Add to queue
    this.queue.push(event);
    
    // Save queue to localStorage
    this._saveQueue();
    
    // Flush immediately for page views
    this.flush();
  }
  
  /**
   * Track an error
   * @param {Error|string} error - Error object or message
   * @param {Object} [properties={}] - Additional properties
   */
  trackError(error, properties = {}) {
    if (!this.isInitialized) {
      return;
    }
    
    // Create error event
    const event = {
      type: 'error',
      category: EVENT_CATEGORIES.ERROR,
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : null,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
    };
    
    // Add to queue
    this.queue.push(event);
    
    // Save queue to localStorage
    this._saveQueue();
    
    // Flush immediately for errors
    this.flush();
  }
  
  /**
   * Track performance metrics
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   * @param {Object} [properties={}] - Additional properties
   */
  trackPerformance(name, value, properties = {}) {
    if (!this.isInitialized) {
      return;
    }
    
    // Create performance event
    const event = {
      type: 'performance',
      category: EVENT_CATEGORIES.PERFORMANCE,
      name,
      value,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };
    
    // Add to queue
    this.queue.push(event);
    
    // Save queue to localStorage
    this._saveQueue();
    
    // Don't flush immediately for performance metrics
    // They will be flushed on the regular interval
  }
  
  /**
   * Flush queued events to the server
   * @returns {Promise<boolean>} Whether flush was successful
   */
  async flush() {
    if (!this.isInitialized || this.queue.length === 0 || !this.hasConsent || this.isOffline) {
      return false;
    }
    
    try {
      // In a real implementation, this would send events to an analytics server
      // For now, we'll just simulate a successful flush
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Log events to console
      console.info(`[Analytics] Flushed ${this.queue.length} events`);
      
      // Clear queue
      this.queue = [];
      
      // Save empty queue to localStorage
      this._saveQueue();
      
      return true;
    } catch (error) {
      console.error('Failed to flush analytics events', error);
      return false;
    }
  }
  
  /**
   * Save queue to localStorage
   * @private
   */
  _saveQueue() {
    try {
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save analytics queue to localStorage', error);
    }
  }
  
  /**
   * Generate a unique session ID
   * @private
   * @returns {string} Session ID
   */
  _generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;
export { EVENT_CATEGORIES };
