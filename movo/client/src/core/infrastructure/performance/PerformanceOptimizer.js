/**
 * Performance Optimizer for Movo
 * Provides performance optimization utilities
 * 
 * @author zophlic
 */

import loggingService from '../logging/LoggingService';
import telemetryService from '../telemetry/TelemetryService';
import configService from '../config/ConfigService';

/**
 * Performance optimizer class
 */
class PerformanceOptimizer {
  constructor() {
    this.enabled = configService.get('performance.optimizationsEnabled', true);
    this.metrics = {
      fps: 0,
      memory: {
        jsHeapSizeLimit: 0,
        totalJSHeapSize: 0,
        usedJSHeapSize: 0
      },
      timing: {
        loadTime: 0,
        domContentLoaded: 0,
        firstPaint: 0,
        firstContentfulPaint: 0
      },
      resources: {
        count: 0,
        size: 0
      }
    };
    
    // Optimization flags
    this.optimizations = {
      lazyLoading: configService.get('performance.lazyLoading', true),
      imageOptimization: configService.get('performance.imageOptimization', true),
      codeMinification: configService.get('performance.codeMinification', true),
      caching: configService.get('performance.caching', true),
      prefetching: configService.get('performance.prefetching', true),
      compression: configService.get('performance.compression', true),
      mobileOptimizations: configService.get('performance.mobileOptimizations', true)
    };
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.collectMetrics = this.collectMetrics.bind(this);
    this.optimizeImages = this.optimizeImages.bind(this);
    this.optimizeForMobile = this.optimizeForMobile.bind(this);
    this.enablePrefetching = this.enablePrefetching.bind(this);
    this.monitorPerformance = this.monitorPerformance.bind(this);
    
    // Initialize if enabled
    if (this.enabled) {
      this.initialize();
    }
  }
  
  /**
   * Initialize performance optimizer
   */
  initialize() {
    loggingService.info('Initializing performance optimizer');
    
    try {
      // Collect initial metrics
      this.collectMetrics();
      
      // Apply optimizations
      if (this.optimizations.imageOptimization) {
        this.optimizeImages();
      }
      
      if (this.optimizations.mobileOptimizations) {
        this.optimizeForMobile();
      }
      
      if (this.optimizations.prefetching) {
        this.enablePrefetching();
      }
      
      // Start performance monitoring
      this.monitorPerformance();
      
      // Track event
      telemetryService.trackEvent('performance', 'initialize', {
        optimizations: this.optimizations
      });
      
      loggingService.info('Performance optimizer initialized');
    } catch (error) {
      loggingService.error('Failed to initialize performance optimizer', { error });
    }
  }
  
  /**
   * Collect performance metrics
   */
  collectMetrics() {
    try {
      // Collect timing metrics
      if (window.performance) {
        const timing = window.performance.timing;
        
        if (timing) {
          this.metrics.timing.loadTime = timing.loadEventEnd - timing.navigationStart;
          this.metrics.timing.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
        }
        
        // Collect paint metrics
        if (window.performance.getEntriesByType) {
          const paintMetrics = window.performance.getEntriesByType('paint');
          
          if (paintMetrics && paintMetrics.length) {
            const firstPaint = paintMetrics.find(entry => entry.name === 'first-paint');
            const firstContentfulPaint = paintMetrics.find(entry => entry.name === 'first-contentful-paint');
            
            if (firstPaint) {
              this.metrics.timing.firstPaint = firstPaint.startTime;
            }
            
            if (firstContentfulPaint) {
              this.metrics.timing.firstContentfulPaint = firstContentfulPaint.startTime;
            }
          }
        }
        
        // Collect resource metrics
        if (window.performance.getEntriesByType) {
          const resourceMetrics = window.performance.getEntriesByType('resource');
          
          if (resourceMetrics && resourceMetrics.length) {
            this.metrics.resources.count = resourceMetrics.length;
            this.metrics.resources.size = resourceMetrics.reduce((total, resource) => total + (resource.transferSize || 0), 0);
          }
        }
      }
      
      // Collect memory metrics
      if (window.performance && window.performance.memory) {
        this.metrics.memory = {
          jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit,
          totalJSHeapSize: window.performance.memory.totalJSHeapSize,
          usedJSHeapSize: window.performance.memory.usedJSHeapSize
        };
      }
      
      // Track metrics
      telemetryService.trackEvent('performance', 'metrics', {
        metrics: this.metrics
      });
      
      loggingService.debug('Performance metrics collected', { metrics: this.metrics });
    } catch (error) {
      loggingService.error('Failed to collect performance metrics', { error });
    }
  }
  
  /**
   * Optimize images
   */
  optimizeImages() {
    try {
      // Find all images
      const images = document.querySelectorAll('img:not([data-optimized])');
      
      // Apply optimizations
      images.forEach(img => {
        // Add loading="lazy" attribute
        if (this.optimizations.lazyLoading && !img.loading) {
          img.loading = 'lazy';
        }
        
        // Add decoding="async" attribute
        if (!img.decoding) {
          img.decoding = 'async';
        }
        
        // Mark as optimized
        img.setAttribute('data-optimized', 'true');
      });
      
      loggingService.info('Images optimized', { count: images.length });
    } catch (error) {
      loggingService.error('Failed to optimize images', { error });
    }
  }
  
  /**
   * Optimize for mobile devices
   */
  optimizeForMobile() {
    try {
      // Check if mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Reduce animation complexity
        document.documentElement.classList.add('mobile-optimized');
        
        // Reduce image quality
        const style = document.createElement('style');
        style.textContent = `
          .mobile-optimized img:not([data-high-quality]) {
            image-rendering: optimizeSpeed;
          }
          
          .mobile-optimized video:not([data-high-quality]) {
            max-resolution: 720p;
          }
          
          .mobile-optimized * {
            transition-duration: 0.1s !important;
          }
        `;
        document.head.appendChild(style);
        
        loggingService.info('Mobile optimizations applied');
      }
    } catch (error) {
      loggingService.error('Failed to apply mobile optimizations', { error });
    }
  }
  
  /**
   * Enable prefetching
   */
  enablePrefetching() {
    try {
      // Add prefetch for common resources
      const resources = [
        '/api/trending',
        '/api/recommendations',
        '/api/genres'
      ];
      
      resources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = resource;
        document.head.appendChild(link);
      });
      
      loggingService.info('Prefetching enabled', { resources });
    } catch (error) {
      loggingService.error('Failed to enable prefetching', { error });
    }
  }
  
  /**
   * Monitor performance
   */
  monitorPerformance() {
    try {
      // Monitor FPS
      let frameCount = 0;
      let lastTime = performance.now();
      
      const measureFPS = () => {
        const now = performance.now();
        frameCount++;
        
        if (now - lastTime >= 1000) {
          this.metrics.fps = frameCount;
          frameCount = 0;
          lastTime = now;
          
          // Collect other metrics
          this.collectMetrics();
        }
        
        requestAnimationFrame(measureFPS);
      };
      
      requestAnimationFrame(measureFPS);
      
      loggingService.info('Performance monitoring started');
    } catch (error) {
      loggingService.error('Failed to start performance monitoring', { error });
    }
  }
  
  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Get optimization status
   * @returns {Object} Optimization status
   */
  getOptimizationStatus() {
    return {
      enabled: this.enabled,
      optimizations: { ...this.optimizations }
    };
  }
}

// Create singleton instance
const performanceOptimizer = new PerformanceOptimizer();

export default performanceOptimizer;
