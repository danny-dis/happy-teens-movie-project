/**
 * Performance Monitoring and Optimization
 * 
 * Provides tools for monitoring and optimizing application performance:
 * - Frame rate monitoring
 * - Automated quality adjustment
 * - Performance testing
 * - Resource usage tracking
 * 
 * @author zophlic
 */

/**
 * Performance monitor class
 */
export class PerformanceMonitor {
  constructor() {
    // Frame timing
    this.frameTimeHistory = new Array(60).fill(16.67); // Initialize with 60fps target
    this.frameTimeIndex = 0;
    this.frameCount = 0;
    this.lastFrameTime = 0;
    
    // FPS tracking
    this.fpsHistory = new Array(10).fill(60);
    this.fpsIndex = 0;
    this.lastFpsUpdateTime = 0;
    this.framesSinceLastFpsUpdate = 0;
    
    // Performance marks
    this.marks = new Map();
    this.measures = new Map();
    
    // Listeners
    this.listeners = new Set();
    
    // Performance budget
    this.targetFrameTime = 16.67; // 60fps
    this.criticalFrameTime = 33.33; // 30fps
    
    // Initialize
    this.isInitialized = false;
  }
  
  /**
   * Initialize performance monitoring
   * @param {Object} options - Initialization options
   * @returns {boolean} Whether initialization was successful
   */
  initialize(options = {}) {
    if (this.isInitialized) return true;
    
    try {
      // Default options
      const defaultOptions = {
        targetFps: 60,
        fpsUpdateInterval: 1000, // 1 second
        autoStartMonitoring: true
      };
      
      // Merge options
      const opts = { ...defaultOptions, ...options };
      
      // Set target frame time
      this.targetFrameTime = 1000 / opts.targetFps;
      this.criticalFrameTime = this.targetFrameTime * 2;
      
      // Start monitoring if requested
      if (opts.autoStartMonitoring) {
        this._startMonitoring();
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
      return false;
    }
  }
  
  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    this._startMonitoring();
  }
  
  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }
  
  /**
   * Add a listener for performance updates
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
  }
  
  /**
   * Remove a listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }
  
  /**
   * Record a frame time
   * @param {number} frameTime - Frame time in milliseconds
   */
  recordFrameTime(frameTime) {
    // Update frame time history
    this.frameTimeHistory[this.frameTimeIndex] = frameTime;
    this.frameTimeIndex = (this.frameTimeIndex + 1) % this.frameTimeHistory.length;
    
    // Update frame count
    this.frameCount++;
    this.framesSinceLastFpsUpdate++;
    
    // Update FPS if needed
    const now = performance.now();
    if (now - this.lastFpsUpdateTime >= 1000) {
      const fps = this.framesSinceLastFpsUpdate / ((now - this.lastFpsUpdateTime) / 1000);
      
      // Update FPS history
      this.fpsHistory[this.fpsIndex] = fps;
      this.fpsIndex = (this.fpsIndex + 1) % this.fpsHistory.length;
      
      // Reset counters
      this.lastFpsUpdateTime = now;
      this.framesSinceLastFpsUpdate = 0;
      
      // Notify listeners
      this._notifyListeners();
    }
  }
  
  /**
   * Mark a performance event
   * @param {string} name - Mark name
   */
  mark(name) {
    const time = performance.now();
    this.marks.set(name, time);
    
    // Also use the Performance API if available
    if (performance.mark) {
      performance.mark(name);
    }
    
    return time;
  }
  
  /**
   * Measure time between two marks
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   * @returns {number} Measured time in milliseconds
   */
  measure(name, startMark, endMark) {
    if (!this.marks.has(startMark) || !this.marks.has(endMark)) {
      console.warn(`Cannot measure ${name}: marks not found`);
      return 0;
    }
    
    const startTime = this.marks.get(startMark);
    const endTime = this.marks.get(endMark);
    const duration = endTime - startTime;
    
    this.measures.set(name, duration);
    
    // Also use the Performance API if available
    if (performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (e) {
        // Ignore errors in Performance API
      }
    }
    
    return duration;
  }
  
  /**
   * Get average frame time
   * @returns {number} Average frame time in milliseconds
   */
  getAverageFrameTime() {
    return this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / this.frameTimeHistory.length;
  }
  
  /**
   * Get average FPS
   * @returns {number} Average FPS
   */
  getAverageFps() {
    return this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
  }
  
  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    const avgFrameTime = this.getAverageFrameTime();
    const avgFps = this.getAverageFps();
    
    return {
      frameTime: {
        average: avgFrameTime,
        min: Math.min(...this.frameTimeHistory),
        max: Math.max(...this.frameTimeHistory),
        target: this.targetFrameTime,
        isBelowTarget: avgFrameTime <= this.targetFrameTime,
        isCritical: avgFrameTime >= this.criticalFrameTime
      },
      fps: {
        average: avgFps,
        min: Math.min(...this.fpsHistory),
        max: Math.max(...this.fpsHistory),
        target: 1000 / this.targetFrameTime,
        isBelowTarget: avgFps < (1000 / this.targetFrameTime) * 0.9
      },
      frameCount: this.frameCount,
      measures: Object.fromEntries(this.measures)
    };
  }
  
  /**
   * Get recommended quality level based on performance
   * @returns {string} Recommended quality level ('low', 'medium', or 'high')
   */
  getRecommendedQuality() {
    const avgFrameTime = this.getAverageFrameTime();
    
    // Critical performance - use low quality
    if (avgFrameTime >= this.criticalFrameTime) {
      return 'low';
    }
    
    // Below target - use medium quality
    if (avgFrameTime > this.targetFrameTime * 1.2) {
      return 'medium';
    }
    
    // Good performance - use high quality
    return 'high';
  }
  
  /**
   * Get recommended render scale based on performance
   * @returns {number} Recommended render scale (0.5-1.0)
   */
  getRecommendedRenderScale() {
    const avgFrameTime = this.getAverageFrameTime();
    
    // Critical performance - use lowest scale
    if (avgFrameTime >= this.criticalFrameTime * 1.5) {
      return 0.5;
    }
    
    // Very poor performance - use low scale
    if (avgFrameTime >= this.criticalFrameTime) {
      return 0.6;
    }
    
    // Poor performance - use medium-low scale
    if (avgFrameTime >= this.targetFrameTime * 1.5) {
      return 0.7;
    }
    
    // Below target - use medium scale
    if (avgFrameTime >= this.targetFrameTime * 1.2) {
      return 0.8;
    }
    
    // Slightly below target - use medium-high scale
    if (avgFrameTime >= this.targetFrameTime) {
      return 0.9;
    }
    
    // Good performance - use full scale
    return 1.0;
  }
  
  /**
   * Run a performance test
   * @param {Function} testFunction - Test function
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Test results
   */
  async runPerformanceTest(testFunction, options = {}) {
    // Default options
    const defaultOptions = {
      duration: 5000, // 5 seconds
      warmupDuration: 1000, // 1 second
      collectInterval: 100 // 100ms
    };
    
    // Merge options
    const opts = { ...defaultOptions, ...options };
    
    // Reset metrics
    this.frameTimeHistory.fill(16.67);
    this.fpsHistory.fill(60);
    this.frameCount = 0;
    
    // Start test
    console.log(`Starting performance test (${opts.duration}ms)...`);
    
    // Warmup phase
    if (opts.warmupDuration > 0) {
      console.log(`Warmup phase (${opts.warmupDuration}ms)...`);
      
      const warmupStartTime = performance.now();
      
      // Run test function during warmup
      await new Promise(resolve => {
        const warmupLoop = () => {
          const now = performance.now();
          
          if (now - warmupStartTime < opts.warmupDuration) {
            testFunction();
            requestAnimationFrame(warmupLoop);
          } else {
            resolve();
          }
        };
        
        requestAnimationFrame(warmupLoop);
      });
      
      // Reset metrics after warmup
      this.frameTimeHistory.fill(16.67);
      this.fpsHistory.fill(60);
      this.frameCount = 0;
      
      console.log('Warmup complete');
    }
    
    // Measurement phase
    console.log(`Measurement phase (${opts.duration}ms)...`);
    
    const results = {
      frameTimes: [],
      fps: [],
      memoryUsage: []
    };
    
    const startTime = performance.now();
    
    // Run test function and collect metrics
    await new Promise(resolve => {
      let lastCollectTime = startTime;
      
      const testLoop = () => {
        const now = performance.now();
        
        if (now - startTime < opts.duration) {
          // Run test function
          const frameStartTime = performance.now();
          testFunction();
          const frameTime = performance.now() - frameStartTime;
          
          // Record frame time
          this.recordFrameTime(frameTime);
          
          // Collect metrics at specified interval
          if (now - lastCollectTime >= opts.collectInterval) {
            results.frameTimes.push(this.getAverageFrameTime());
            results.fps.push(this.getAverageFps());
            
            // Collect memory usage if available
            if (performance.memory) {
              results.memoryUsage.push({
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
              });
            }
            
            lastCollectTime = now;
          }
          
          requestAnimationFrame(testLoop);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(testLoop);
    });
    
    // Calculate final metrics
    const metrics = this.getMetrics();
    
    // Combine results
    const finalResults = {
      ...metrics,
      duration: opts.duration,
      timeSeries: {
        frameTimes: results.frameTimes,
        fps: results.fps,
        memoryUsage: results.memoryUsage
      }
    };
    
    console.log('Performance test complete:', finalResults);
    
    return finalResults;
  }
  
  /**
   * Start monitoring
   * @private
   */
  _startMonitoring() {
    // Cancel any existing animation frame
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
    }
    
    // Start monitoring loop
    const monitorLoop = () => {
      const now = performance.now();
      
      // Calculate frame time
      if (this.lastFrameTime > 0) {
        const frameTime = now - this.lastFrameTime;
        this.recordFrameTime(frameTime);
      }
      
      this.lastFrameTime = now;
      
      // Schedule next frame
      this._animationFrameId = requestAnimationFrame(monitorLoop);
    };
    
    this._animationFrameId = requestAnimationFrame(monitorLoop);
  }
  
  /**
   * Notify listeners of performance update
   * @private
   */
  _notifyListeners() {
    const metrics = this.getMetrics();
    
    for (const listener of this.listeners) {
      try {
        listener(metrics);
      } catch (error) {
        console.error('Error in performance update listener:', error);
      }
    }
  }
}

/**
 * Quality optimizer class
 */
export class QualityOptimizer {
  constructor(performanceMonitor) {
    this.performanceMonitor = performanceMonitor || new PerformanceMonitor();
    this.listeners = new Set();
    this.isInitialized = false;
    this.isOptimizing = false;
    this.optimizationInterval = null;
    
    this.currentQuality = 'medium';
    this.currentRenderScale = 0.75;
    
    this.stabilityCounter = 0;
    this.lastQualityChange = 0;
    this.qualityChangeDelay = 5000; // 5 seconds between quality changes
  }
  
  /**
   * Initialize quality optimization
   * @param {Object} options - Initialization options
   * @returns {boolean} Whether initialization was successful
   */
  initialize(options = {}) {
    if (this.isInitialized) return true;
    
    try {
      // Default options
      const defaultOptions = {
        initialQuality: 'medium',
        initialRenderScale: 0.75,
        optimizationInterval: 2000, // 2 seconds
        qualityChangeDelay: 5000, // 5 seconds
        autoStartOptimization: true
      };
      
      // Merge options
      const opts = { ...defaultOptions, ...options };
      
      // Set initial quality
      this.currentQuality = opts.initialQuality;
      this.currentRenderScale = opts.initialRenderScale;
      this.qualityChangeDelay = opts.qualityChangeDelay;
      
      // Initialize performance monitor if needed
      if (!this.performanceMonitor.isInitialized) {
        this.performanceMonitor.initialize();
      }
      
      // Start optimization if requested
      if (opts.autoStartOptimization) {
        this.startOptimization(opts.optimizationInterval);
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize quality optimization:', error);
      return false;
    }
  }
  
  /**
   * Start quality optimization
   * @param {number} interval - Optimization interval in milliseconds
   */
  startOptimization(interval = 2000) {
    if (!this.isInitialized) {
      this.initialize({ optimizationInterval: interval });
      return;
    }
    
    if (this.isOptimizing) {
      return;
    }
    
    // Start optimization loop
    this.optimizationInterval = setInterval(() => this._optimizeQuality(), interval);
    this.isOptimizing = true;
    
    console.log('Quality optimization started');
  }
  
  /**
   * Stop quality optimization
   */
  stopOptimization() {
    if (!this.isOptimizing) {
      return;
    }
    
    // Stop optimization loop
    clearInterval(this.optimizationInterval);
    this.optimizationInterval = null;
    this.isOptimizing = false;
    
    console.log('Quality optimization stopped');
  }
  
  /**
   * Add a listener for quality changes
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
    
    // Notify the new listener of the current quality
    listener({
      quality: this.currentQuality,
      renderScale: this.currentRenderScale
    });
  }
  
  /**
   * Remove a listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }
  
  /**
   * Set quality manually
   * @param {string} quality - Quality level ('low', 'medium', or 'high')
   * @param {number} renderScale - Render scale (0.5-1.0)
   */
  setQuality(quality, renderScale) {
    // Validate quality
    if (!['low', 'medium', 'high'].includes(quality)) {
      console.warn(`Invalid quality level: ${quality}`);
      return;
    }
    
    // Validate render scale
    if (renderScale < 0.5 || renderScale > 1.0) {
      console.warn(`Invalid render scale: ${renderScale}`);
      return;
    }
    
    // Update quality
    this.currentQuality = quality;
    this.currentRenderScale = renderScale;
    
    // Reset stability counter
    this.stabilityCounter = 0;
    this.lastQualityChange = performance.now();
    
    // Notify listeners
    this._notifyListeners();
    
    console.log(`Quality set to ${quality} (scale: ${renderScale.toFixed(2)})`);
  }
  
  /**
   * Get current quality settings
   * @returns {Object} Quality settings
   */
  getQuality() {
    return {
      quality: this.currentQuality,
      renderScale: this.currentRenderScale
    };
  }
  
  /**
   * Run automatic quality detection
   * @param {Function} testFunction - Test function
   * @returns {Promise<Object>} Detected quality settings
   */
  async detectOptimalQuality(testFunction) {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    console.log('Detecting optimal quality settings...');
    
    // Test low quality
    this.setQuality('low', 0.5);
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for quality change to take effect
    
    const lowResults = await this.performanceMonitor.runPerformanceTest(testFunction, {
      duration: 2000,
      warmupDuration: 500
    });
    
    // Test medium quality
    this.setQuality('medium', 0.75);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mediumResults = await this.performanceMonitor.runPerformanceTest(testFunction, {
      duration: 2000,
      warmupDuration: 500
    });
    
    // Test high quality
    this.setQuality('high', 1.0);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const highResults = await this.performanceMonitor.runPerformanceTest(testFunction, {
      duration: 2000,
      warmupDuration: 500
    });
    
    // Analyze results
    const targetFrameTime = this.performanceMonitor.targetFrameTime;
    
    let optimalQuality = 'medium';
    let optimalRenderScale = 0.75;
    
    if (highResults.frameTime.average < targetFrameTime * 1.1) {
      // High quality is good
      optimalQuality = 'high';
      optimalRenderScale = 1.0;
    } else if (mediumResults.frameTime.average < targetFrameTime * 1.1) {
      // Medium quality is good
      optimalQuality = 'medium';
      optimalRenderScale = 0.75;
    } else {
      // Fall back to low quality
      optimalQuality = 'low';
      optimalRenderScale = 0.5;
    }
    
    // Set detected quality
    this.setQuality(optimalQuality, optimalRenderScale);
    
    console.log(`Optimal quality detected: ${optimalQuality} (scale: ${optimalRenderScale.toFixed(2)})`);
    
    return {
      quality: optimalQuality,
      renderScale: optimalRenderScale,
      testResults: {
        low: lowResults,
        medium: mediumResults,
        high: highResults
      }
    };
  }
  
  /**
   * Optimize quality based on performance
   * @private
   */
  _optimizeQuality() {
    if (!this.isInitialized || !this.isOptimizing) {
      return;
    }
    
    // Get performance metrics
    const metrics = this.performanceMonitor.getMetrics();
    
    // Check if we should change quality
    const now = performance.now();
    if (now - this.lastQualityChange < this.qualityChangeDelay) {
      return;
    }
    
    // Get recommended quality
    const recommendedQuality = this.performanceMonitor.getRecommendedQuality();
    const recommendedRenderScale = this.performanceMonitor.getRecommendedRenderScale();
    
    // Check if quality should be changed
    if (recommendedQuality !== this.currentQuality) {
      // Increment stability counter
      this.stabilityCounter++;
      
      // Only change quality if the recommendation is stable
      if (this.stabilityCounter >= 3) {
        console.log(`Changing quality from ${this.currentQuality} to ${recommendedQuality} based on performance`);
        
        // Update quality
        this.currentQuality = recommendedQuality;
        this.currentRenderScale = recommendedRenderScale;
        
        // Reset stability counter
        this.stabilityCounter = 0;
        this.lastQualityChange = now;
        
        // Notify listeners
        this._notifyListeners();
      }
    } else {
      // Reset stability counter if recommendation matches current quality
      this.stabilityCounter = 0;
      
      // Check if render scale should be adjusted
      if (Math.abs(recommendedRenderScale - this.currentRenderScale) >= 0.1) {
        console.log(`Adjusting render scale from ${this.currentRenderScale.toFixed(2)} to ${recommendedRenderScale.toFixed(2)}`);
        
        // Update render scale
        this.currentRenderScale = recommendedRenderScale;
        this.lastQualityChange = now;
        
        // Notify listeners
        this._notifyListeners();
      }
    }
  }
  
  /**
   * Notify listeners of quality change
   * @private
   */
  _notifyListeners() {
    const qualitySettings = this.getQuality();
    
    for (const listener of this.listeners) {
      try {
        listener(qualitySettings);
      } catch (error) {
        console.error('Error in quality change listener:', error);
      }
    }
  }
}

// Create singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const qualityOptimizer = new QualityOptimizer(performanceMonitor);
