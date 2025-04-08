/**
 * Performance Monitoring Service for Movo
 * Tracks performance metrics and user experience data
 * 
 * @author zophlic
 */

import analyticsService, { EVENT_CATEGORIES } from './analyticsService';

// Constants
const METRICS = {
  FPS: 'fps',
  MEMORY: 'memory',
  NETWORK: 'network',
  LOAD_TIME: 'load_time',
  TTFB: 'ttfb',
  TTI: 'tti',
  FCP: 'fcp',
  LCP: 'lcp',
  CLS: 'cls',
  FID: 'fid',
  INP: 'inp'
};

const PERFORMANCE_THRESHOLDS = {
  [METRICS.FPS]: {
    good: 50,
    acceptable: 30,
    poor: 15
  },
  [METRICS.MEMORY]: {
    good: 0.5, // 50% of available memory
    acceptable: 0.7, // 70% of available memory
    poor: 0.9 // 90% of available memory
  },
  [METRICS.LOAD_TIME]: {
    good: 1000, // 1 second
    acceptable: 3000, // 3 seconds
    poor: 5000 // 5 seconds
  },
  [METRICS.TTFB]: {
    good: 200, // 200ms
    acceptable: 500, // 500ms
    poor: 1000 // 1 second
  },
  [METRICS.TTI]: {
    good: 2000, // 2 seconds
    acceptable: 5000, // 5 seconds
    poor: 10000 // 10 seconds
  },
  [METRICS.FCP]: {
    good: 1000, // 1 second
    acceptable: 2500, // 2.5 seconds
    poor: 4000 // 4 seconds
  },
  [METRICS.LCP]: {
    good: 2500, // 2.5 seconds
    acceptable: 4000, // 4 seconds
    poor: 6000 // 6 seconds
  },
  [METRICS.CLS]: {
    good: 0.1,
    acceptable: 0.25,
    poor: 0.5
  },
  [METRICS.FID]: {
    good: 100, // 100ms
    acceptable: 300, // 300ms
    poor: 600 // 600ms
  },
  [METRICS.INP]: {
    good: 200, // 200ms
    acceptable: 500, // 500ms
    poor: 1000 // 1000ms
  }
};

/**
 * Performance monitoring service class
 */
class PerformanceMonitoringService {
  constructor() {
    this.metrics = {
      [METRICS.FPS]: {
        current: 0,
        average: 0,
        min: 60,
        max: 0,
        samples: []
      },
      [METRICS.MEMORY]: {
        usage: 0,
        limit: 0,
        percent: 0
      },
      [METRICS.NETWORK]: {
        downlink: 0,
        rtt: 0,
        effectiveType: 'unknown',
        saveData: false
      },
      [METRICS.LOAD_TIME]: 0,
      [METRICS.TTFB]: 0,
      [METRICS.TTI]: 0,
      [METRICS.FCP]: 0,
      [METRICS.LCP]: 0,
      [METRICS.CLS]: 0,
      [METRICS.FID]: 0,
      [METRICS.INP]: 0
    };
    
    this.isMonitoring = false;
    this.fpsInterval = null;
    this.metricsInterval = null;
    this.lastFrameTime = 0;
    this.frameTimes = [];
    this.listeners = new Map();
    this.webVitalsReported = false;
    
    // Bind methods
    this.startMonitoring = this.startMonitoring.bind(this);
    this.stopMonitoring = this.stopMonitoring.bind(this);
    this.getMetrics = this.getMetrics.bind(this);
    this.onMetricsUpdate = this.onMetricsUpdate.bind(this);
    this.offMetricsUpdate = this.offMetricsUpdate.bind(this);
    this.trackLoadTime = this.trackLoadTime.bind(this);
    this.trackStreamingMetrics = this.trackStreamingMetrics.bind(this);
    this.trackWebVitals = this.trackWebVitals.bind(this);
  }
  
  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = true;
    
    // Start FPS monitoring
    this._startFpsMonitoring();
    
    // Start metrics monitoring
    this._startMetricsMonitoring();
    
    // Track web vitals
    this.trackWebVitals();
    
    // Track initial page load time
    this.trackLoadTime();
    
    console.log('[Performance] Monitoring started');
  }
  
  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }
    
    this.isMonitoring = false;
    
    // Stop FPS monitoring
    if (this.fpsInterval) {
      cancelAnimationFrame(this.fpsInterval);
      this.fpsInterval = null;
    }
    
    // Stop metrics monitoring
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    console.log('[Performance] Monitoring stopped');
  }
  
  /**
   * Get current metrics
   * @param {string} metricName - Metric name (optional)
   * @returns {Object} Metrics
   */
  getMetrics(metricName) {
    if (metricName && this.metrics[metricName]) {
      return this.metrics[metricName];
    }
    
    return this.metrics;
  }
  
  /**
   * Add metrics update listener
   * @param {string} id - Listener ID
   * @param {Function} callback - Callback function
   */
  onMetricsUpdate(id, callback) {
    if (typeof callback !== 'function') {
      return;
    }
    
    this.listeners.set(id, callback);
  }
  
  /**
   * Remove metrics update listener
   * @param {string} id - Listener ID
   */
  offMetricsUpdate(id) {
    this.listeners.delete(id);
  }
  
  /**
   * Track page load time
   */
  trackLoadTime() {
    // Use Performance API if available
    if (window.performance) {
      // Get navigation timing
      const timing = performance.timing || performance.getEntriesByType('navigation')[0];
      
      if (timing) {
        // Calculate load time
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        this.metrics[METRICS.LOAD_TIME] = loadTime;
        
        // Calculate Time to First Byte
        const ttfb = timing.responseStart - timing.navigationStart;
        this.metrics[METRICS.TTFB] = ttfb;
        
        // Track metrics
        analyticsService.trackEvent(
          EVENT_CATEGORIES.PERFORMANCE,
          'page_load',
          {
            loadTime,
            ttfb,
            url: window.location.pathname,
            referrer: document.referrer
          }
        );
        
        console.log(`[Performance] Page load time: ${loadTime}ms, TTFB: ${ttfb}ms`);
      }
    }
  }
  
  /**
   * Track streaming metrics
   * @param {Object} metrics - Streaming metrics
   */
  trackStreamingMetrics(metrics) {
    if (!metrics) {
      return;
    }
    
    // Track streaming metrics
    analyticsService.trackEvent(
      EVENT_CATEGORIES.PERFORMANCE,
      'streaming_metrics',
      {
        ...metrics,
        timestamp: Date.now()
      }
    );
  }
  
  /**
   * Track web vitals
   */
  trackWebVitals() {
    // Skip if already reported or if web-vitals is not available
    if (this.webVitalsReported || !window.webVitals) {
      return;
    }
    
    try {
      const { getCLS, getFID, getLCP, getFCP, getTTFB, getINP } = window.webVitals;
      
      // First Contentful Paint
      getFCP(metric => {
        this.metrics[METRICS.FCP] = metric.value;
        this._reportWebVital('FCP', metric);
      });
      
      // Largest Contentful Paint
      getLCP(metric => {
        this.metrics[METRICS.LCP] = metric.value;
        this._reportWebVital('LCP', metric);
      }, { reportAllChanges: false });
      
      // Cumulative Layout Shift
      getCLS(metric => {
        this.metrics[METRICS.CLS] = metric.value;
        this._reportWebVital('CLS', metric);
      }, { reportAllChanges: false });
      
      // First Input Delay
      getFID(metric => {
        this.metrics[METRICS.FID] = metric.value;
        this._reportWebVital('FID', metric);
      });
      
      // Time to First Byte
      getTTFB(metric => {
        this.metrics[METRICS.TTFB] = metric.value;
        this._reportWebVital('TTFB', metric);
      });
      
      // Interaction to Next Paint
      if (getINP) {
        getINP(metric => {
          this.metrics[METRICS.INP] = metric.value;
          this._reportWebVital('INP', metric);
        }, { reportAllChanges: false });
      }
      
      this.webVitalsReported = true;
    } catch (error) {
      console.error('[Performance] Failed to track web vitals', error);
    }
  }
  
  /**
   * Start FPS monitoring
   * @private
   */
  _startFpsMonitoring() {
    const updateFPS = (timestamp) => {
      if (this.lastFrameTime) {
        const frameTime = timestamp - this.lastFrameTime;
        const fps = 1000 / frameTime;
        
        // Update frame times (keep last 60 frames)
        this.frameTimes.push(fps);
        if (this.frameTimes.length > 60) {
          this.frameTimes.shift();
        }
        
        // Calculate FPS stats
        const avgFps = this.frameTimes.reduce((sum, fps) => sum + fps, 0) / this.frameTimes.length;
        const minFps = Math.min(...this.frameTimes);
        const maxFps = Math.max(...this.frameTimes);
        
        // Update metrics
        this.metrics[METRICS.FPS] = {
          current: Math.round(fps),
          average: Math.round(avgFps),
          min: Math.round(Math.min(minFps, this.metrics[METRICS.FPS].min)),
          max: Math.round(Math.max(maxFps, this.metrics[METRICS.FPS].max)),
          samples: this.frameTimes.slice()
        };
        
        // Notify listeners
        this._notifyListeners();
      }
      
      this.lastFrameTime = timestamp;
      this.fpsInterval = requestAnimationFrame(updateFPS);
    };
    
    this.fpsInterval = requestAnimationFrame(updateFPS);
  }
  
  /**
   * Start metrics monitoring
   * @private
   */
  _startMetricsMonitoring() {
    this.metricsInterval = setInterval(() => {
      // Monitor memory usage
      this._updateMemoryMetrics();
      
      // Monitor network conditions
      this._updateNetworkMetrics();
      
      // Notify listeners
      this._notifyListeners();
    }, 2000);
  }
  
  /**
   * Update memory metrics
   * @private
   */
  _updateMemoryMetrics() {
    if (performance.memory) {
      const usage = performance.memory.usedJSHeapSize;
      const limit = performance.memory.jsHeapSizeLimit;
      const percent = (usage / limit) * 100;
      
      this.metrics[METRICS.MEMORY] = {
        usage,
        limit,
        percent: Math.round(percent)
      };
    }
  }
  
  /**
   * Update network metrics
   * @private
   */
  _updateNetworkMetrics() {
    if (navigator.connection) {
      const { downlink, rtt, effectiveType, saveData } = navigator.connection;
      
      this.metrics[METRICS.NETWORK] = {
        downlink,
        rtt,
        effectiveType,
        saveData
      };
    }
  }
  
  /**
   * Notify listeners of metrics update
   * @private
   */
  _notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('[Performance] Listener error', error);
      }
    });
  }
  
  /**
   * Report web vital metric
   * @private
   * @param {string} name - Metric name
   * @param {Object} metric - Metric data
   */
  _reportWebVital(name, metric) {
    // Get rating based on thresholds
    const value = metric.value;
    let rating = 'good';
    
    const metricKey = name.toLowerCase();
    const thresholds = PERFORMANCE_THRESHOLDS[metricKey];
    
    if (thresholds) {
      if (value >= thresholds.poor) {
        rating = 'poor';
      } else if (value >= thresholds.acceptable) {
        rating = 'needs-improvement';
      }
    }
    
    // Track metric
    analyticsService.trackEvent(
      EVENT_CATEGORIES.PERFORMANCE,
      'web_vital',
      {
        name,
        value,
        rating,
        id: metric.id,
        navigationType: metric.navigationType
      }
    );
    
    console.log(`[Performance] ${name}: ${value} (${rating})`);
  }
}

// Create singleton instance
const performanceMonitoringService = new PerformanceMonitoringService();

// Start monitoring on import
performanceMonitoringService.startMonitoring();

export default performanceMonitoringService;
export { METRICS, PERFORMANCE_THRESHOLDS };
