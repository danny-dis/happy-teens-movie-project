/**
 * Performance Monitoring Provider for Movo
 * Provides performance monitoring and reporting
 * 
 * @author zophlic
 */

import loggingService from '../../logging/LoggingService';
import configService from '../../config/ConfigService';
import { fetchWithErrorHandling } from '../../errors/ErrorHandlingService';

// Performance metrics
export const PERFORMANCE_METRIC = {
  // Navigation timing
  TTFB: 'time_to_first_byte',
  FCP: 'first_contentful_paint',
  LCP: 'largest_contentful_paint',
  FID: 'first_input_delay',
  CLS: 'cumulative_layout_shift',
  TTI: 'time_to_interactive',
  
  // Resource timing
  RESOURCE_LOAD_TIME: 'resource_load_time',
  
  // Custom metrics
  FPS: 'frames_per_second',
  MEMORY_USAGE: 'memory_usage',
  NETWORK_INFO: 'network_info',
  
  // Media metrics
  PLAYBACK_QUALITY: 'playback_quality',
  BUFFERING_TIME: 'buffering_time',
  STARTUP_TIME: 'startup_time',
  SEEK_TIME: 'seek_time'
};

/**
 * Performance monitoring provider class
 */
export class PerformanceMonitoringProvider {
  /**
   * @param {Object} options - Provider options
   * @param {string} options.endpoint - Performance monitoring endpoint URL
   * @param {string} options.apiKey - API key
   * @param {boolean} options.enabled - Whether provider is enabled
   */
  constructor(options = {}) {
    this.endpoint = options.endpoint || configService.get('performance.endpoint');
    this.apiKey = options.apiKey || configService.get('performance.apiKey');
    this.enabled = options.enabled !== undefined ? options.enabled : configService.get('performance.enabled', true);
    this.sampleRate = options.sampleRate || configService.get('performance.sampleRate', 0.1); // 10% of users
    this.collectResourceTiming = options.collectResourceTiming !== undefined ? options.collectResourceTiming : configService.get('performance.collectResourceTiming', false);
    this.collectLongTasks = options.collectLongTasks !== undefined ? options.collectLongTasks : configService.get('performance.collectLongTasks', true);
    this.beaconUrl = this.endpoint;
    
    // Performance observer references
    this.observers = {
      paint: null,
      layout: null,
      longtask: null,
      resource: null
    };
    
    // Performance metrics
    this.metrics = {
      [PERFORMANCE_METRIC.TTFB]: null,
      [PERFORMANCE_METRIC.FCP]: null,
      [PERFORMANCE_METRIC.LCP]: null,
      [PERFORMANCE_METRIC.FID]: null,
      [PERFORMANCE_METRIC.CLS]: null,
      [PERFORMANCE_METRIC.TTI]: null,
      [PERFORMANCE_METRIC.FPS]: null,
      [PERFORMANCE_METRIC.MEMORY_USAGE]: null,
      [PERFORMANCE_METRIC.NETWORK_INFO]: null
    };
    
    // CLS calculation
    this.clsValue = 0;
    this.clsEntries = [];
    this.sessionWindows = [];
    this.sessionId = 0;
    
    // FPS calculation
    this.fpsValue = 0;
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.fpsUpdateInterval = null;
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.sendEvents = this.sendEvents.bind(this);
    this.collectNavigationTiming = this.collectNavigationTiming.bind(this);
    this.collectWebVitals = this.collectWebVitals.bind(this);
    this.enable = this.enable.bind(this);
    this.disable = this.disable.bind(this);
    
    // Initialize if enabled and sampled
    if (this.enabled && Math.random() < this.sampleRate) {
      this.initialize();
    }
  }
  
  /**
   * Initialize performance monitoring
   */
  initialize() {
    if (!window.PerformanceObserver) {
      loggingService.warn('PerformanceObserver not supported');
      return;
    }
    
    try {
      // Collect navigation timing
      this.collectNavigationTiming();
      
      // Collect web vitals
      this.collectWebVitals();
      
      // Collect FPS
      this._startFpsMonitoring();
      
      // Collect memory usage
      this._collectMemoryUsage();
      
      // Collect network info
      this._collectNetworkInfo();
      
      // Set up beforeunload handler
      window.addEventListener('beforeunload', () => {
        // Send final metrics
        if (navigator.sendBeacon && this.endpoint) {
          navigator.sendBeacon(
            this.endpoint,
            JSON.stringify({
              metrics: this.metrics,
              url: window.location.href,
              timestamp: new Date().toISOString(),
              app: configService.get('app.name', 'Movo'),
              version: configService.get('app.version', '1.0.0')
            })
          );
        }
      });
      
      loggingService.info('Performance monitoring initialized');
    } catch (error) {
      loggingService.error('Failed to initialize performance monitoring', { error });
    }
  }
  
  /**
   * Send events to performance monitoring endpoint
   * @param {Array<Object>} events - Events to send
   * @returns {Promise<boolean>} Whether sending was successful
   */
  async sendEvents(events) {
    if (!this.enabled || !this.endpoint) {
      return false;
    }
    
    try {
      // Filter performance events
      const performanceEvents = events.filter(
        event => event.type === 'event' && event.category === 'performance'
      );
      
      if (performanceEvents.length === 0) {
        return true;
      }
      
      // Prepare payload
      const payload = {
        events: performanceEvents,
        metrics: this.metrics,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        app: configService.get('app.name', 'Movo'),
        version: configService.get('app.version', '1.0.0')
      };
      
      // Send payload
      await fetchWithErrorHandling(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(payload)
      });
      
      return true;
    } catch (error) {
      loggingService.error('Failed to send performance events', { error });
      return false;
    }
  }
  
  /**
   * Collect navigation timing metrics
   */
  collectNavigationTiming() {
    if (!window.performance || !window.performance.timing) {
      return;
    }
    
    // Wait for load event
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = window.performance.timing;
        
        // Calculate TTFB
        const ttfb = timing.responseStart - timing.navigationStart;
        this.metrics[PERFORMANCE_METRIC.TTFB] = ttfb;
        
        // Calculate TTI (approximation)
        const tti = timing.domInteractive - timing.navigationStart;
        this.metrics[PERFORMANCE_METRIC.TTI] = tti;
        
        loggingService.debug('Navigation timing collected', {
          ttfb,
          tti
        });
      }, 0);
    });
  }
  
  /**
   * Collect web vitals metrics
   */
  collectWebVitals() {
    try {
      // First Contentful Paint
      this._observePaint('first-contentful-paint', entry => {
        this.metrics[PERFORMANCE_METRIC.FCP] = entry.startTime;
        loggingService.debug('FCP collected', { value: entry.startTime });
      });
      
      // Largest Contentful Paint
      this._observePaint('largest-contentful-paint', entry => {
        this.metrics[PERFORMANCE_METRIC.LCP] = entry.startTime;
        loggingService.debug('LCP collected', { value: entry.startTime });
      });
      
      // First Input Delay
      this._observeFirstInput(entry => {
        this.metrics[PERFORMANCE_METRIC.FID] = entry.processingStart - entry.startTime;
        loggingService.debug('FID collected', { value: entry.processingStart - entry.startTime });
      });
      
      // Cumulative Layout Shift
      this._observeLayoutShift(entry => {
        // Only count layout shifts without recent user input
        if (!entry.hadRecentInput) {
          const firstSessionEntry = this.clsEntries[0];
          const lastSessionEntry = this.clsEntries[this.clsEntries.length - 1];
          
          // If the entry occurred less than 1 second after the previous entry and
          // less than 5 seconds after the first entry in the session, include it
          // in the current session. Otherwise, start a new session.
          if (
            lastSessionEntry &&
            entry.startTime - lastSessionEntry.startTime < 1000 &&
            entry.startTime - firstSessionEntry.startTime < 5000
          ) {
            // Add to current session
            this.clsEntries.push(entry);
          } else {
            // Start a new session
            this.sessionWindows.push({
              id: this.sessionId++,
              value: this.clsValue,
              entries: this.clsEntries
            });
            
            this.clsEntries = [entry];
            this.clsValue = 0;
          }
          
          // Update CLS value
          this.clsValue += entry.value;
          
          // Update metric with highest session value
          const highestSession = [...this.sessionWindows, {
            id: this.sessionId,
            value: this.clsValue,
            entries: this.clsEntries
          }].reduce((a, b) => (a.value > b.value ? a : b));
          
          this.metrics[PERFORMANCE_METRIC.CLS] = highestSession.value;
          loggingService.debug('CLS updated', { value: highestSession.value });
        }
      });
      
      // Long tasks
      if (this.collectLongTasks) {
        this._observeLongTasks(entries => {
          loggingService.debug('Long tasks detected', { count: entries.length });
        });
      }
      
      // Resource timing
      if (this.collectResourceTiming) {
        this._observeResourceTiming(entries => {
          // Process resource timing entries
          const resources = entries.map(entry => ({
            name: entry.name,
            initiatorType: entry.initiatorType,
            duration: entry.duration,
            transferSize: entry.transferSize,
            decodedBodySize: entry.decodedBodySize
          }));
          
          loggingService.debug('Resource timing collected', { count: resources.length });
        });
      }
    } catch (error) {
      loggingService.error('Failed to collect web vitals', { error });
    }
  }
  
  /**
   * Enable provider
   */
  enable() {
    this.enabled = true;
    configService.set('performance.enabled', true);
    
    // Initialize if not already
    if (Math.random() < this.sampleRate) {
      this.initialize();
    }
  }
  
  /**
   * Disable provider
   */
  disable() {
    this.enabled = false;
    configService.set('performance.enabled', false);
    
    // Disconnect observers
    for (const key in this.observers) {
      if (this.observers[key]) {
        this.observers[key].disconnect();
        this.observers[key] = null;
      }
    }
    
    // Stop FPS monitoring
    if (this.fpsUpdateInterval) {
      cancelAnimationFrame(this.fpsUpdateInterval);
      this.fpsUpdateInterval = null;
    }
  }
  
  /**
   * Observe paint entries
   * @private
   * @param {string} type - Paint type
   * @param {Function} callback - Callback function
   */
  _observePaint(type, callback) {
    try {
      this.observers.paint = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.name === type) {
            callback(entry);
          }
        });
      });
      
      this.observers.paint.observe({ type: 'paint', buffered: true });
    } catch (error) {
      loggingService.error(`Failed to observe ${type}`, { error });
    }
  }
  
  /**
   * Observe first input
   * @private
   * @param {Function} callback - Callback function
   */
  _observeFirstInput(callback) {
    try {
      this.observers.firstInput = new PerformanceObserver(list => {
        list.getEntries().forEach(callback);
      });
      
      this.observers.firstInput.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      loggingService.error('Failed to observe first-input', { error });
    }
  }
  
  /**
   * Observe layout shifts
   * @private
   * @param {Function} callback - Callback function
   */
  _observeLayoutShift(callback) {
    try {
      this.observers.layout = new PerformanceObserver(list => {
        list.getEntries().forEach(callback);
      });
      
      this.observers.layout.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      loggingService.error('Failed to observe layout-shift', { error });
    }
  }
  
  /**
   * Observe long tasks
   * @private
   * @param {Function} callback - Callback function
   */
  _observeLongTasks(callback) {
    try {
      this.observers.longtask = new PerformanceObserver(list => {
        callback(list.getEntries());
      });
      
      this.observers.longtask.observe({ type: 'longtask', buffered: true });
    } catch (error) {
      loggingService.error('Failed to observe longtask', { error });
    }
  }
  
  /**
   * Observe resource timing
   * @private
   * @param {Function} callback - Callback function
   */
  _observeResourceTiming(callback) {
    try {
      this.observers.resource = new PerformanceObserver(list => {
        callback(list.getEntries());
      });
      
      this.observers.resource.observe({ type: 'resource', buffered: true });
    } catch (error) {
      loggingService.error('Failed to observe resource', { error });
    }
  }
  
  /**
   * Start FPS monitoring
   * @private
   */
  _startFpsMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const updateFps = () => {
      const now = performance.now();
      frameCount++;
      
      if (now - lastTime >= 1000) {
        this.fpsValue = Math.round((frameCount * 1000) / (now - lastTime));
        this.metrics[PERFORMANCE_METRIC.FPS] = this.fpsValue;
        
        frameCount = 0;
        lastTime = now;
      }
      
      this.fpsUpdateInterval = requestAnimationFrame(updateFps);
    };
    
    this.fpsUpdateInterval = requestAnimationFrame(updateFps);
  }
  
  /**
   * Collect memory usage
   * @private
   */
  _collectMemoryUsage() {
    if (!performance.memory) {
      return;
    }
    
    // Collect memory usage every 10 seconds
    setInterval(() => {
      this.metrics[PERFORMANCE_METRIC.MEMORY_USAGE] = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }, 10000);
  }
  
  /**
   * Collect network info
   * @private
   */
  _collectNetworkInfo() {
    if (!navigator.connection) {
      return;
    }
    
    const updateNetworkInfo = () => {
      this.metrics[PERFORMANCE_METRIC.NETWORK_INFO] = {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    };
    
    // Initial collection
    updateNetworkInfo();
    
    // Update on connection change
    navigator.connection.addEventListener('change', updateNetworkInfo);
  }
}

// Create singleton instance
const performanceMonitoringProvider = new PerformanceMonitoringProvider();

export default performanceMonitoringProvider;
