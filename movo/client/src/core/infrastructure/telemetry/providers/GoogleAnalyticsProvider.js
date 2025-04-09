/**
 * Google Analytics Provider for Movo
 * Provides Google Analytics integration for telemetry
 * 
 * @author zophlic
 */

import loggingService from '../../logging/LoggingService';
import configService from '../../config/ConfigService';

/**
 * Google Analytics provider class
 */
export class GoogleAnalyticsProvider {
  /**
   * @param {Object} options - Provider options
   * @param {string} options.measurementId - GA4 measurement ID
   * @param {boolean} options.debug - Whether to enable debug mode
   */
  constructor(options = {}) {
    this.measurementId = options.measurementId || configService.get('analytics.ga4.measurementId');
    this.debug = options.debug || configService.get('analytics.ga4.debug', false);
    this.initialized = false;
    this.beaconUrl = `https://www.google-analytics.com/g/collect?v=2&tid=${this.measurementId}`;
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.sendEvents = this.sendEvents.bind(this);
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize Google Analytics
   */
  initialize() {
    if (this.initialized) {
      return;
    }
    
    if (!this.measurementId) {
      loggingService.warn('Google Analytics measurement ID not provided');
      return;
    }
    
    try {
      // Load Google Analytics script
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      script.async = true;
      document.head.appendChild(script);
      
      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
      
      // Configure GA4
      window.gtag('js', new Date());
      window.gtag('config', this.measurementId, {
        send_page_view: false, // We'll handle page views manually
        debug_mode: this.debug
      });
      
      this.initialized = true;
      loggingService.info('Google Analytics initialized', { measurementId: this.measurementId });
    } catch (error) {
      loggingService.error('Failed to initialize Google Analytics', { error });
    }
  }
  
  /**
   * Send events to Google Analytics
   * @param {Array<Object>} events - Events to send
   * @returns {Promise<boolean>} Whether sending was successful
   */
  async sendEvents(events) {
    if (!this.initialized || !window.gtag) {
      return false;
    }
    
    try {
      for (const event of events) {
        switch (event.type) {
          case 'pageview':
            this._sendPageView(event);
            break;
          case 'event':
            this._sendEvent(event);
            break;
          case 'error':
            this._sendError(event);
            break;
          default:
            loggingService.warn('Unknown event type', { event });
        }
      }
      
      return true;
    } catch (error) {
      loggingService.error('Failed to send events to Google Analytics', { error });
      return false;
    }
  }
  
  /**
   * Send page view to Google Analytics
   * @private
   * @param {Object} event - Page view event
   */
  _sendPageView(event) {
    window.gtag('event', 'page_view', {
      page_title: event.properties.title,
      page_location: event.properties.url,
      page_path: new URL(event.properties.url).pathname,
      page_referrer: event.properties.referrer,
      user_id: event.userId
    });
  }
  
  /**
   * Send event to Google Analytics
   * @private
   * @param {Object} event - Event
   */
  _sendEvent(event) {
    // Convert event name to GA4 format
    const eventName = event.action.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    
    // Prepare event parameters
    const params = {
      event_category: event.category,
      ...event.properties,
      user_id: event.userId
    };
    
    // Send event
    window.gtag('event', eventName, params);
  }
  
  /**
   * Send error to Google Analytics
   * @private
   * @param {Object} event - Error event
   */
  _sendError(event) {
    window.gtag('event', 'exception', {
      description: `${event.error.name}: ${event.error.message}`,
      fatal: event.context.fatal || false,
      user_id: event.userId
    });
  }
}

// Create singleton instance
const googleAnalyticsProvider = new GoogleAnalyticsProvider();

export default googleAnalyticsProvider;
