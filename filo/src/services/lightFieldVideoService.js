/**
 * Light Field Video Service
 *
 * Provides volumetric video capabilities:
 * - Rendering of light field video content
 * - Perspective manipulation during playback
 * - Depth-based effects and interactions
 * - Distributed streaming of light field data
 *
 * This experimental feature enables viewing content from multiple perspectives
 * after recording, creating truly immersive experiences without specialized hardware.
 *
 * @author zophlic
 */

class LightFieldVideoService {
  constructor() {
    this.initialized = false;
    this.renderer = null;
    this.currentVideo = null;
    this.viewpoint = { x: 0, y: 0, z: 0 };
    this.depthMap = null;
    this.canvas = null;
    this.ctx = null;
    this.worker = null;
    this.isPlaying = false;
    this.settings = {
      quality: 'medium', // 'low', 'medium', 'high'
      viewRange: 30, // Maximum view angle in degrees
      depthResolution: 'medium', // 'low', 'medium', 'high'
      useGPU: true, // Use GPU acceleration if available
      prefetchDistance: 2, // Prefetch frames within this distance
      renderScale: 1.0 // Scale factor for rendering resolution
    };
    this.stats = {
      framesRendered: 0,
      averageRenderTime: 0,
      viewpointChanges: 0,
      dataTransferred: 0
    };
    this.eventListeners = {};
  }

  /**
   * Initialize the Light Field Video service
   * @param {Object} options - Initialization options
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(options = {}) {
    if (this.initialized) return true;

    try {
      // Use performance mark for timing initialization
      performance.mark('lightfield-init-start');
      console.log('Initializing Light Field Video service...');

      // Use Object.assign for more efficient object merging
      if (options.settings) {
        Object.assign(this.settings, options.settings);
      }

      // Adjust settings based on device capabilities
      this._adjustSettingsForDevice();

      // Create canvas with optimized attributes
      this.canvas = document.createElement('canvas');

      // Use alpha: false for better performance when we don't need transparency
      this.ctx = this.canvas.getContext('2d', {
        alpha: false,
        desynchronized: true, // Reduce latency when available
        willReadFrequently: false // Optimize for drawing, not reading pixels
      });

      // Initialize components in parallel for faster startup
      await Promise.all([
        this._initializeRenderer(),
        this._initializeWorker()
      ]);

      // Pre-allocate reusable objects to reduce garbage collection
      this._frameDataPool = new Array(5).fill().map(() => ({
        index: 0,
        timestamp: 0
      }));
      this._nextFrameDataIndex = 0;

      // Add performance monitoring
      this._lastPerformanceCheck = performance.now();
      this._frameTimeHistory = new Array(60).fill(16.67); // Initialize with 60fps target
      this._frameTimeIndex = 0;

      this.initialized = true;

      // Measure initialization time
      performance.mark('lightfield-init-end');
      performance.measure('lightfield-initialization', 'lightfield-init-start', 'lightfield-init-end');
      const initTime = performance.getEntriesByName('lightfield-initialization')[0].duration;
      console.log(`Light Field Video service initialized in ${initTime.toFixed(2)}ms`);

      return true;
    } catch (error) {
      console.error('Failed to initialize Light Field Video service:', error);

      // Clean up any partially initialized resources
      this._cleanupResources();

      return false;
    }
  }

  /**
   * Adjust settings based on device capabilities
   * @private
   */
  _adjustSettingsForDevice() {
    // Check for WebGL support
    const hasWebGL = this._checkWebGLSupport();

    if (!hasWebGL && this.settings.useGPU) {
      console.warn('WebGL not supported, falling back to CPU rendering');
      this.settings.useGPU = false;
    }

    // Detect device performance level
    const isLowEndDevice = this._isLowEndDevice();

    if (isLowEndDevice) {
      console.log('Low-end device detected, optimizing settings for performance');
      this.settings.quality = 'low';
      this.settings.depthResolution = 'low';
      this.settings.renderScale = 0.75;
      this.settings.prefetchDistance = 1;
    }
  }

  /**
   * Detect if running on a low-end device
   * @private
   * @returns {boolean} Whether this is a low-end device
   */
  _isLowEndDevice() {
    // Check available memory (if supported)
    if (navigator.deviceMemory && navigator.deviceMemory < 4) {
      return true;
    }

    // Check CPU cores (if supported)
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
      return true;
    }

    // Check for mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    return isMobile;
  }

  /**
   * Clean up resources
   * @private
   */
  _cleanupResources() {
    // Clean up canvas
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }

    // Clean up worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Clean up cached canvases
    if (this._depthTempCanvas) {
      this._depthTempCanvas = null;
    }

    if (this._cachedDepthCanvas) {
      this._cachedDepthCanvas = null;
    }
  }

  /**
   * Load a light field video - optimized for performance
   * @param {string} videoId - Video ID
   * @param {HTMLElement} container - Container element
   * @returns {Promise<boolean>} Success status
   */
  async loadVideo(videoId, container) {
    if (!this.initialized) await this.initialize();

    try {
      // Use performance mark for timing
      performance.mark('video-load-start');
      console.log(`Loading light field video ${videoId}...`);

      // Check if container is valid
      if (!container || !(container instanceof HTMLElement)) {
        throw new Error('Invalid container element');
      }

      // Clear previous video
      if (this.currentVideo) {
        await this.unloadVideo();
      }

      // Create loading indicator
      this._showLoadingIndicator(container);

      // Load video data and depth map in parallel
      const [videoData, resizeObserver] = await Promise.all([
        this._simulateLoadVideoData(videoId),
        this._setupResizeHandling(container)
      ]);

      // Resize canvas to match container with the appropriate scale
      this._resizeCanvas(container);

      // Add canvas to container
      container.appendChild(this.canvas);

      // Set current video with optimized object structure
      this.currentVideo = {
        id: videoId,
        data: videoData,
        startTime: Date.now(),
        currentFrame: 0,
        totalFrames: videoData.totalFrames,
        framerate: videoData.framerate,
        duration: videoData.duration,
        dimensions: videoData.dimensions,
        viewpoints: videoData.viewpoints,
        resizeObserver
      };

      // Reset viewpoint
      this.viewpoint = { x: 0, y: 0, z: 0 };

      // Load depth map in background
      this._loadDepthMapInBackground(videoId);

      // Pre-render first frame to show something immediately
      this._renderFrame(0);

      // Hide loading indicator
      this._hideLoadingIndicator();

      // Measure loading time
      performance.mark('video-load-end');
      performance.measure('video-loading', 'video-load-start', 'video-load-end');
      const loadTime = performance.getEntriesByName('video-loading')[0].duration;
      console.log(`Light field video loaded in ${loadTime.toFixed(2)}ms`);

      // Trigger event
      this._triggerEvent('videoLoaded', {
        videoId,
        dimensions: videoData.dimensions,
        duration: videoData.duration,
        viewpoints: videoData.viewpoints.length,
        loadTime
      });

      return true;
    } catch (error) {
      console.error(`Failed to load light field video ${videoId}:`, error);
      this._hideLoadingIndicator();
      throw error;
    }
  }

  /**
   * Show loading indicator
   * @private
   * @param {HTMLElement} container - Container element
   */
  _showLoadingIndicator(container) {
    // Create loading indicator if it doesn't exist
    if (!this._loadingIndicator) {
      this._loadingIndicator = document.createElement('div');
      this._loadingIndicator.style.position = 'absolute';
      this._loadingIndicator.style.top = '50%';
      this._loadingIndicator.style.left = '50%';
      this._loadingIndicator.style.transform = 'translate(-50%, -50%)';
      this._loadingIndicator.style.color = '#fff';
      this._loadingIndicator.style.fontFamily = 'Arial, sans-serif';
      this._loadingIndicator.style.fontSize = '16px';
      this._loadingIndicator.style.textAlign = 'center';
      this._loadingIndicator.innerHTML = 'Loading Light Field Video<br><small>by zophlic</small>';
    }

    // Add to container
    container.appendChild(this._loadingIndicator);
  }

  /**
   * Hide loading indicator
   * @private
   */
  _hideLoadingIndicator() {
    if (this._loadingIndicator && this._loadingIndicator.parentNode) {
      this._loadingIndicator.parentNode.removeChild(this._loadingIndicator);
    }
  }

  /**
   * Setup resize handling
   * @private
   * @param {HTMLElement} container - Container element
   * @returns {Promise<ResizeObserver>} Resize observer
   */
  async _setupResizeHandling(container) {
    return new Promise((resolve) => {
      // Use ResizeObserver if available
      if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver((entries) => {
          // Only resize if we have a current video
          if (this.currentVideo) {
            this._resizeCanvas(container);
          }
        });

        // Start observing
        resizeObserver.observe(container);
        resolve(resizeObserver);
      } else {
        // Fallback to window resize event
        const handleResize = () => {
          if (this.currentVideo) {
            this._resizeCanvas(container);
          }
        };

        window.addEventListener('resize', handleResize);

        // Return a fake observer with a disconnect method
        resolve({
          disconnect: () => window.removeEventListener('resize', handleResize)
        });
      }
    });
  }

  /**
   * Resize canvas to match container
   * @private
   * @param {HTMLElement} container - Container element
   */
  _resizeCanvas(container) {
    // Get container dimensions
    const { clientWidth, clientHeight } = container;

    // Calculate new dimensions with render scale
    const newWidth = Math.floor(clientWidth * this.settings.renderScale);
    const newHeight = Math.floor(clientHeight * this.settings.renderScale);

    // Only resize if dimensions have changed
    if (this.canvas.width !== newWidth || this.canvas.height !== newHeight) {
      this.canvas.width = newWidth;
      this.canvas.height = newHeight;
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';

      // Update half-width and half-height cache
      this._halfWidth = newWidth / 2;
      this._halfHeight = newHeight / 2;

      // Re-render current frame if we have a video loaded
      if (this.currentVideo && !this.isPlaying) {
        this._renderFrame(this.currentVideo.currentFrame);
      }
    }
  }

  /**
   * Load depth map in background
   * @private
   * @param {string} videoId - Video ID
   */
  _loadDepthMapInBackground(videoId) {
    // Use a promise that we don't await
    this._loadDepthMap(videoId).then(depthMap => {
      this.depthMap = depthMap;

      // Re-render current frame if we have a video loaded and not playing
      if (this.currentVideo && !this.isPlaying) {
        this._renderFrame(this.currentVideo.currentFrame);
      }

      console.log('Depth map loaded');
    }).catch(error => {
      console.warn('Failed to load depth map:', error);
    });
  }

  /**
   * Unload the current video - optimized with proper resource cleanup
   * @returns {Promise<boolean>} Success status
   */
  async unloadVideo() {
    if (!this.currentVideo) return true;

    try {
      console.log(`Unloading light field video ${this.currentVideo.id}...`);

      // Stop playback and cancel any pending animation frames
      if (this.isPlaying) {
        await this.stop();
      }

      if (this._animationFrameId) {
        cancelAnimationFrame(this._animationFrameId);
        this._animationFrameId = null;
      }

      // Stop resize observer if it exists
      if (this.currentVideo.resizeObserver) {
        this.currentVideo.resizeObserver.disconnect();
      }

      // Remove canvas from parent
      if (this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }

      // Clear WebGL context if using WebGL
      if (this.settings.useGPU && this.ctx && this.ctx.getContextAttributes) {
        // This is a WebGL context, so we should properly dispose of it
        const loseContext = this.ctx.getExtension('WEBGL_lose_context');
        if (loseContext) {
          loseContext.loseContext();
        }
      }

      // Clear cached resources
      this._colorCache = null;
      this._lastFrameInfo = null;

      // Clear depth map and release its memory
      if (this.depthMap && this.depthMap.data) {
        // Set to null to allow garbage collection
        this.depthMap.data = null;
        this.depthMap = null;
      }

      // Clear current video and release its memory
      const videoId = this.currentVideo.id;
      this.currentVideo = null;

      // Force garbage collection if possible (only in some browsers)
      if (window.gc) {
        try {
          window.gc();
        } catch (e) {
          // Ignore errors
        }
      }

      // Trigger event
      this._triggerEvent('videoUnloaded', { videoId });

      return true;
    } catch (error) {
      console.error('Failed to unload video:', error);
      return false;
    }
  }

  /**
   * Play the current video
   * @returns {Promise<boolean>} Success status
   */
  async play() {
    if (!this.currentVideo) {
      throw new Error('No video loaded');
    }

    if (this.isPlaying) return true;

    try {
      console.log(`Playing light field video ${this.currentVideo.id}...`);

      this.isPlaying = true;

      // Start rendering loop
      this._startRenderLoop();

      // Trigger event
      this._triggerEvent('playbackStarted', {
        videoId: this.currentVideo.id,
        currentTime: 0
      });

      return true;
    } catch (error) {
      console.error('Failed to play video:', error);
      this.isPlaying = false;
      return false;
    }
  }

  /**
   * Pause the current video
   * @returns {Promise<boolean>} Success status
   */
  async pause() {
    if (!this.currentVideo || !this.isPlaying) return true;

    try {
      console.log(`Pausing light field video ${this.currentVideo.id}...`);

      this.isPlaying = false;

      // Trigger event
      this._triggerEvent('playbackPaused', {
        videoId: this.currentVideo.id,
        currentTime: this._getCurrentTime(),
        currentFrame: this.currentVideo.currentFrame
      });

      return true;
    } catch (error) {
      console.error('Failed to pause video:', error);
      return false;
    }
  }

  /**
   * Stop the current video
   * @returns {Promise<boolean>} Success status
   */
  async stop() {
    if (!this.currentVideo) return true;

    try {
      console.log(`Stopping light field video ${this.currentVideo.id}...`);

      this.isPlaying = false;

      // Reset current frame
      this.currentVideo.currentFrame = 0;
      this.currentVideo.startTime = Date.now();

      // Trigger event
      this._triggerEvent('playbackStopped', {
        videoId: this.currentVideo.id
      });

      return true;
    } catch (error) {
      console.error('Failed to stop video:', error);
      return false;
    }
  }

  /**
   * Seek to a specific time
   * @param {number} time - Time in seconds
   * @returns {Promise<boolean>} Success status
   */
  async seek(time) {
    if (!this.currentVideo) {
      throw new Error('No video loaded');
    }

    try {
      console.log(`Seeking to ${time} seconds...`);

      // Validate time
      if (time < 0 || time > this.currentVideo.duration) {
        throw new Error(`Invalid seek time: ${time}`);
      }

      // Calculate frame
      const frame = Math.floor(time * this.currentVideo.framerate);

      // Update current frame
      this.currentVideo.currentFrame = frame;

      // Update start time to maintain correct playback
      const currentTime = this._getCurrentTime();
      const timeDiff = time - currentTime;
      this.currentVideo.startTime = Date.now() - (time * 1000);

      // Render the current frame
      await this._renderFrame(frame);

      // Trigger event
      this._triggerEvent('playbackSeeked', {
        videoId: this.currentVideo.id,
        currentTime: time,
        currentFrame: frame
      });

      return true;
    } catch (error) {
      console.error(`Failed to seek to ${time} seconds:`, error);
      return false;
    }
  }

  /**
   * Change viewpoint
   * @param {Object} viewpoint - New viewpoint coordinates
   * @returns {Promise<boolean>} Success status
   */
  async changeViewpoint(viewpoint) {
    if (!this.currentVideo) {
      throw new Error('No video loaded');
    }

    try {
      // Validate viewpoint
      const maxRange = this.settings.viewRange / 2;

      const newViewpoint = {
        x: Math.max(-maxRange, Math.min(maxRange, viewpoint.x || 0)),
        y: Math.max(-maxRange, Math.min(maxRange, viewpoint.y || 0)),
        z: Math.max(-maxRange, Math.min(maxRange, viewpoint.z || 0))
      };

      // Update viewpoint
      this.viewpoint = newViewpoint;

      // Update stats
      this.stats.viewpointChanges++;

      // Trigger event
      this._triggerEvent('viewpointChanged', {
        videoId: this.currentVideo.id,
        viewpoint: { ...this.viewpoint }
      });

      // Re-render current frame with new viewpoint
      if (!this.isPlaying) {
        await this._renderFrame(this.currentVideo.currentFrame);
      }

      return true;
    } catch (error) {
      console.error('Failed to change viewpoint:', error);
      return false;
    }
  }

  /**
   * Get current playback status
   * @returns {Object} Playback status
   */
  getPlaybackStatus() {
    if (!this.currentVideo) {
      return {
        loaded: false,
        playing: false
      };
    }

    return {
      loaded: true,
      playing: this.isPlaying,
      videoId: this.currentVideo.id,
      currentTime: this._getCurrentTime(),
      duration: this.currentVideo.duration,
      currentFrame: this.currentVideo.currentFrame,
      totalFrames: this.currentVideo.totalFrames,
      viewpoint: { ...this.viewpoint },
      dimensions: { ...this.currentVideo.dimensions }
    };
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      settings: { ...this.settings }
    };
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  addEventListener(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }

    this.eventListeners[event].push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  removeEventListener(event, callback) {
    if (!this.eventListeners[event]) return;

    this.eventListeners[event] = this.eventListeners[event].filter(
      cb => cb !== callback
    );
  }

  /**
   * Check if WebGL is supported
   * @private
   * @returns {boolean} Whether WebGL is supported
   */
  _checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize renderer
   * @private
   * @returns {Promise<void>}
   */
  async _initializeRenderer() {
    console.log('Initializing light field renderer...');

    // In a real implementation, this would initialize a WebGL renderer
    // For now, we'll create a simple renderer optimized for performance

    // Pre-calculate half width and height for better performance
    const updateDimensions = () => {
      this._halfWidth = this.canvas.width / 2;
      this._halfHeight = this.canvas.height / 2;
    };

    // Initial dimensions
    updateDimensions();

    // Create a more efficient renderer
    this.renderer = {
      canvas: this.canvas,
      ctx: this.ctx,
      useGPU: this.settings.useGPU,
      quality: this.settings.quality,

      // Synchronous render function for better performance
      renderFrame: (frameData, viewpoint, depthMap) => {
        // Skip if canvas is not visible
        if (document.hidden) return 0;

        // Update dimensions if canvas size has changed
        if (this._lastCanvasWidth !== this.canvas.width || this._lastCanvasHeight !== this.canvas.height) {
          updateDimensions();
          this._lastCanvasWidth = this.canvas.width;
          this._lastCanvasHeight = this.canvas.height;
        }

        // Start timing
        const startTime = performance.now();

        // Use cached background color when possible
        if (this._lastBgColor !== '#000') {
          this.ctx.fillStyle = '#000';
          this._lastBgColor = '#000';
        }

        // Clear and fill in one step for better performance
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Calculate perspective shift - use integer values for better performance
        const shiftX = (viewpoint.x * 10) | 0;
        const shiftY = (viewpoint.y * 10) | 0;

        // Draw main content with minimal state changes
        this.ctx.save();

        // Use pre-calculated values for better performance
        this.ctx.translate(this._halfWidth + shiftX, this._halfHeight + shiftY);

        // Simplify scale calculation
        const scale = 1 + viewpoint.z * 0.05;
        this.ctx.scale(scale, scale);

        this.ctx.translate(-this._halfWidth, -this._halfHeight);

        // Draw simulated content
        this._drawSimulatedContent(frameData);

        this.ctx.restore();

        // Only draw depth visualization if enabled and available
        if (depthMap && this.settings.quality !== 'low') {
          this._drawDepthVisualization(depthMap);
        }

        // Calculate render time
        return performance.now() - startTime;
      }
    };
  }

  /**
   * Initialize worker - optimized for lower resource usage
   * @private
   * @returns {Promise<void>}
   */
  async _initializeWorker() {
    return new Promise((resolve, reject) => {
      try {
        // Create a minimal worker script with optimized code
        const workerScript = `
          // Light Field Video Worker - Optimized for performance

          // Use a message handler with minimal processing
          self.onmessage = function(event) {
            const { type, frameIndex, viewpoint } = event.data;

            if (type === 'prepareFrame') {
              // Skip setTimeout and respond immediately for better performance
              // This reduces latency and resource usage

              // Send prepared frame back with minimal data
              self.postMessage({
                type: 'framePrepared',
                frameIndex,
                frameData: {
                  index: frameIndex,
                  prepared: true,
                  timestamp: Date.now()
                }
              });
            }
          };
        `;

        // Create blob and worker
        const blob = new Blob([workerScript], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        this.worker = new Worker(workerUrl);

        // Use a simpler event listener
        this.worker.onmessage = (event) => {
          if (event.data.type === 'framePrepared') {
            this._triggerEvent('framePrepared', {
              frameIndex: event.data.frameIndex,
              frameData: event.data.frameData
            });
          }
        };

        // Clean up the URL object to prevent memory leaks
        URL.revokeObjectURL(workerUrl);

        resolve();
      } catch (error) {
        console.error('Failed to initialize worker:', error);
        // Provide a fallback mechanism when Web Workers aren't available
        this.worker = {
          postMessage: (data) => {
            // Simulate worker response synchronously
            setTimeout(() => {
              if (data.type === 'prepareFrame') {
                this._triggerEvent('framePrepared', {
                  frameIndex: data.frameIndex,
                  frameData: {
                    index: data.frameIndex,
                    prepared: true,
                    timestamp: Date.now()
                  }
                });
              }
            }, 0);
          }
        };
        resolve(); // Resolve anyway with the fallback
      }
    });
  }

  /**
   * Simulate loading video data - optimized for performance
   * @private
   * @param {string} videoId - Video ID
   * @returns {Promise<Object>} Video data
   */
  async _simulateLoadVideoData(videoId) {
    console.log(`Loading data for video ${videoId}...`);

    // Skip artificial delay for better performance

    // Use fixed values instead of random for better performance and predictability
    const framerate = 30;
    const duration = 60; // Fixed 1 minute duration
    const totalFrames = framerate * duration; // Exact calculation

    // Generate viewpoints with a more efficient approach
    // Use a smaller 2x2 grid instead of 3x3 for better performance
    const viewpoints = [
      { x: -10, y: -10, z: 0 },
      { x: 10, y: -10, z: 0 },
      { x: -10, y: 10, z: 0 },
      { x: 10, y: 10, z: 0 }
    ];

    // Create video data with smaller dimensions for better performance
    const videoData = {
      id: videoId,
      framerate,
      duration,
      totalFrames,
      dimensions: {
        width: 1280, // Reduced from 1920
        height: 720  // Reduced from 1080
      },
      viewpoints,
      format: 'lightfield-v1',
      compression: 'lz4',
      metadata: {
        title: `Light Field Video ${videoId}`,
        description: 'Sample light field video (optimized)',
        created: Date.now(),
        tags: ['lightfield', 'sample'],
        author: 'zophlic' // Subtle mention of zophlic
      }
    };

    // Simulate smaller data transfer
    this.stats.dataTransferred += 5 * 1024 * 1024; // 5MB (reduced from 10MB)

    return videoData;
  }

  /**
   * Load depth map - optimized for performance
   * @private
   * @param {string} videoId - Video ID
   * @returns {Promise<Object>} Depth map
   */
  async _loadDepthMap(videoId) {
    console.log(`Loading depth map for video ${videoId}...`);

    // Skip artificial delay for better performance

    // Generate a simple depth map with reduced resolution
    const { width, height } = this.currentVideo.dimensions;

    // Use a resolution lookup table for better performance
    const resolutionFactors = {
      'low': 10,     // Even lower resolution than before
      'medium': 6,   // Lower resolution than before
      'high': 4      // Lower resolution than before
    };

    // Get resolution factor with fallback to medium
    const factor = resolutionFactors[this.settings.depthResolution] || 6;

    // Calculate dimensions - use integer division for better performance
    const depthWidth = Math.floor(width / factor);
    const depthHeight = Math.floor(height / factor);

    // Create depth map with optimized size
    const depthMap = {
      width: depthWidth,
      height: depthHeight,
      data: new Float32Array(depthWidth * depthHeight)
    };

    // Pre-calculate constants for better performance
    const centerX = depthWidth / 2;
    const centerY = depthHeight / 2;
    const invCenterX = 1 / centerX;
    const invCenterY = 1 / centerY;

    // Process in rows for better cache locality
    for (let y = 0; y < depthHeight; y++) {
      const dy = (y - centerY) * invCenterY;
      const dy2 = dy * dy;
      const rowOffset = y * depthWidth;

      for (let x = 0; x < depthWidth; x++) {
        const dx = (x - centerX) * invCenterX;

        // Use a faster approximation of distance calculation
        // This avoids expensive sqrt operations
        // For better performance, we use a simpler formula
        const distance = Math.min(1, (dx * dx + dy2) * 0.75);

        // Store directly in the array
        depthMap.data[rowOffset + x] = distance;
      }
    }

    // Update stats with reduced data size
    this.stats.dataTransferred += depthWidth * depthHeight * 4; // 4 bytes per float

    return depthMap;
  }

  /**
   * Start render loop - optimized for performance with advanced timing
   * @private
   */
  _startRenderLoop() {
    if (!this.currentVideo || !this.isPlaying) return;

    // Cancel any existing animation frame
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId);
    }

    // Use high-resolution timing
    let lastFrameTime = performance.now();
    let frameSkipCount = 0;
    let lastRenderedFrame = -1;

    // Pre-calculate target frame time based on video framerate
    const videoFrameTime = 1000 / this.currentVideo.framerate;

    // Use a more efficient render loop with timing control
    const renderLoop = (timestamp) => {
      // Exit early if video is no longer playing
      if (!this.currentVideo || !this.isPlaying) return;

      // Calculate time since last frame
      const elapsed = timestamp - lastFrameTime;

      // Calculate current playback time and target frame
      const currentTime = this._getCurrentTime();
      const targetFrame = Math.floor(currentTime * this.currentVideo.framerate);

      // Only process if we need to render a new frame
      if (targetFrame !== lastRenderedFrame) {
        // Update current frame
        this.currentVideo.currentFrame = targetFrame;

        // Check if we've reached the end
        if (targetFrame >= this.currentVideo.totalFrames) {
          // Stop playback
          this.stop();

          // Trigger event
          this._triggerEvent('playbackEnded', {
            videoId: this.currentVideo.id
          });

          return;
        }

        // Implement adaptive frame skipping based on device performance
        const targetRenderTime = videoFrameTime * 0.8; // Target 80% of frame time for rendering
        const shouldRender =
          // Always render if we're more than 2 frames behind
          (targetFrame - lastRenderedFrame > 2) ||
          // Or if we have enough time to render
          (elapsed <= targetRenderTime) ||
          // Or if we've skipped too many frames already
          (frameSkipCount >= 2);

        if (shouldRender) {
          // Reset frame skip counter
          frameSkipCount = 0;
          lastRenderedFrame = targetFrame;

          // Use idle callback for rendering if available and we have time
          if (window.requestIdleCallback && elapsed < videoFrameTime * 0.5) {
            // We have plenty of time, use idle callback
            window.requestIdleCallback(() => {
              this._renderFrame(targetFrame);
            }, { timeout: videoFrameTime * 0.3 });
          } else {
            // Render immediately
            this._renderFrame(targetFrame);
          }

          // Only prefetch frames when we have time
          if (elapsed < videoFrameTime * 0.7) {
            // Use a short timeout to avoid blocking the main thread
            setTimeout(() => {
              if (this.isPlaying) { // Check if still playing
                this._prefetchFrames(targetFrame);
              }
            }, 0);
          }

          // Only trigger progress event periodically
          if (targetFrame % 5 === 0) {
            this._triggerEvent('playbackProgress', {
              videoId: this.currentVideo.id,
              currentTime,
              currentFrame: targetFrame,
              totalFrames: this.currentVideo.totalFrames
            });
          }
        } else {
          // Increment frame skip counter
          frameSkipCount++;
        }
      }

      // Update timing
      lastFrameTime = timestamp;

      // Schedule next frame with proper timing
      this._animationFrameId = requestAnimationFrame(renderLoop);
    };

    // Start the loop
    this._animationFrameId = requestAnimationFrame(renderLoop);
  }

  /**
   * Render a specific frame - optimized for performance
   * @private
   * @param {number} frameIndex - Frame index
   */
  _renderFrame(frameIndex) {
    if (!this.currentVideo) return;

    // Skip rendering if canvas is not visible or too small
    if (document.hidden || this.canvas.width < 50 || this.canvas.height < 50) return;

    // Use object pool to avoid garbage collection
    const frameData = this._getFrameDataFromPool(frameIndex);

    // Start timing
    const startTime = performance.now();

    // Render the frame
    this.renderer.renderFrame(
      frameData,
      this.viewpoint,
      this.depthMap
    );

    // Calculate render time
    const renderTime = performance.now() - startTime;

    // Update frame time history for adaptive quality
    this._updateFrameTimeHistory(renderTime);

    // Update stats with exponential moving average for more stable values
    this.stats.framesRendered++;
    this.stats.averageRenderTime = this.stats.averageRenderTime * 0.9 + renderTime * 0.1;

    // Only trigger event every few frames to reduce overhead
    if (frameIndex % 5 === 0) {
      this._triggerEvent('frameRendered', {
        frameIndex,
        renderTime
      });

      // Check if we need to adjust quality based on performance
      this._checkPerformance();
    }
  }

  /**
   * Get frame data object from pool
   * @private
   * @param {number} frameIndex - Frame index
   * @returns {Object} Frame data object
   */
  _getFrameDataFromPool(frameIndex) {
    // Get next object from pool
    const frameData = this._frameDataPool[this._nextFrameDataIndex];

    // Update object properties
    frameData.index = frameIndex;
    frameData.timestamp = frameIndex / this.currentVideo.framerate;

    // Update pool index
    this._nextFrameDataIndex = (this._nextFrameDataIndex + 1) % this._frameDataPool.length;

    return frameData;
  }

  /**
   * Update frame time history
   * @private
   * @param {number} frameTime - Frame render time
   */
  _updateFrameTimeHistory(frameTime) {
    // Add to circular buffer
    this._frameTimeHistory[this._frameTimeIndex] = frameTime;
    this._frameTimeIndex = (this._frameTimeIndex + 1) % this._frameTimeHistory.length;
  }

  /**
   * Check performance and adjust settings if needed
   * @private
   */
  _checkPerformance() {
    const now = performance.now();

    // Only check every second
    if (now - this._lastPerformanceCheck < 1000) return;
    this._lastPerformanceCheck = now;

    // Calculate average frame time
    const avgFrameTime = this._frameTimeHistory.reduce((sum, time) => sum + time, 0) /
                         this._frameTimeHistory.length;

    // Target is 16.67ms for 60fps
    const targetFrameTime = 16.67;

    // If we're consistently above target, reduce quality
    if (avgFrameTime > targetFrameTime * 1.5) {
      this._reduceQuality();
    }
    // If we're consistently below target, we could increase quality
    else if (avgFrameTime < targetFrameTime * 0.5 && this.settings.quality !== 'high') {
      this._increaseQuality();
    }
  }

  /**
   * Reduce rendering quality for better performance
   * @private
   */
  _reduceQuality() {
    // Already at lowest quality
    if (this.settings.quality === 'low' && this.settings.renderScale <= 0.5) return;

    console.log('Reducing quality for better performance');

    if (this.settings.quality === 'high') {
      this.settings.quality = 'medium';
    } else if (this.settings.quality === 'medium') {
      this.settings.quality = 'low';
    } else if (this.settings.renderScale > 0.5) {
      // Reduce render scale as a last resort
      this.settings.renderScale = Math.max(0.5, this.settings.renderScale - 0.1);

      // Update canvas size
      if (this.canvas.parentNode) {
        this.canvas.width = this.canvas.parentNode.clientWidth * this.settings.renderScale;
        this.canvas.height = this.canvas.parentNode.clientHeight * this.settings.renderScale;
      }
    }
  }

  /**
   * Increase rendering quality
   * @private
   */
  _increaseQuality() {
    // Already at highest quality
    if (this.settings.quality === 'high' && this.settings.renderScale >= 1.0) return;

    console.log('Increasing quality');

    if (this.settings.quality === 'low') {
      this.settings.quality = 'medium';
    } else if (this.settings.quality === 'medium') {
      this.settings.quality = 'high';
    } else if (this.settings.renderScale < 1.0) {
      // Increase render scale
      this.settings.renderScale = Math.min(1.0, this.settings.renderScale + 0.1);

      // Update canvas size
      if (this.canvas.parentNode) {
        this.canvas.width = this.canvas.parentNode.clientWidth * this.settings.renderScale;
        this.canvas.height = this.canvas.parentNode.clientHeight * this.settings.renderScale;
      }
    }
  }

  /**
   * Prefetch upcoming frames - optimized for performance
   * @private
   * @param {number} currentFrame - Current frame index
   */
  _prefetchFrames(currentFrame) {
    if (!this.currentVideo || !this.worker) return;

    // Skip prefetching if we're near the end of the video
    if (currentFrame >= this.currentVideo.totalFrames - 5) return;

    // Only prefetch every few frames to reduce overhead
    if (currentFrame % 3 !== 0) return;

    // Reduce prefetch distance for better performance
    const prefetchDistance = Math.min(this.settings.prefetchDistance, 1);

    // Only prefetch the next frame for better performance
    const nextFrame = currentFrame + 1;

    // Skip if already at the end
    if (nextFrame >= this.currentVideo.totalFrames) return;

    // Use a more efficient message structure
    this.worker.postMessage({
      type: 'prepareFrame',
      frameIndex: nextFrame,
      // Only send changed viewpoint values to reduce message size
      viewpoint: {
        x: this.viewpoint.x,
        y: this.viewpoint.y,
        z: this.viewpoint.z
      }
    });
  }

  /**
   * Get current playback time
   * @private
   * @returns {number} Current time in seconds
   */
  _getCurrentTime() {
    if (!this.currentVideo) return 0;

    if (!this.isPlaying) {
      return this.currentVideo.currentFrame / this.currentVideo.framerate;
    }

    const elapsed = (Date.now() - this.currentVideo.startTime) / 1000;
    return Math.min(elapsed, this.currentVideo.duration);
  }

  /**
   * Draw simulated content - highly optimized for performance
   * @private
   * @param {Object} frameData - Frame data
   */
  _drawSimulatedContent(frameData) {
    const { width, height } = this.canvas;
    const frameIndex = frameData.index;

    // Skip drawing if canvas is too small
    if (width < 50 || height < 50) return;

    // Use quality-based rendering
    const quality = this.settings.quality;

    // Background - use fillRect directly without changing fillStyle if it's already set
    if (this._lastBgColor !== '#222') {
      this.ctx.fillStyle = '#222';
      this._lastBgColor = '#222';
    }
    this.ctx.fillRect(0, 0, width, height);

    // Use a more efficient time calculation with integer division
    const time = (frameIndex / 30) | 0; // Integer division for better performance
    const fractionalTime = (frameIndex % 30) / 30; // Fractional part for smooth animation

    // Use lookup tables for sin/cos values to avoid expensive calculations
    // We'll use the fractionalTime (0-1) to interpolate between pre-calculated values
    if (!this._sinTable) {
      // Initialize lookup tables if they don't exist
      this._sinTable = new Float32Array(360);
      this._cosTable = new Float32Array(360);
      for (let i = 0; i < 360; i++) {
        const rad = (i * Math.PI) / 180;
        this._sinTable[i] = Math.sin(rad);
        this._cosTable[i] = Math.cos(rad);
      }
    }

    // Get sin/cos values from lookup tables
    const angle = ((time * 18) % 360) | 0; // 18 degrees per frame
    const sinTime = this._sinTable[angle];
    const cosTime = this._cosTable[angle];

    // Adjust number of shapes based on quality setting
    const circleCount = quality === 'low' ? 1 : (quality === 'medium' ? 2 : 3);
    const rectCount = quality === 'low' ? 1 : 2;

    // Use batch drawing for better performance
    // Draw all circles first, then all rectangles to minimize context changes

    // Draw circles
    for (let i = 0; i < circleCount; i++) {
      // Use integer arithmetic where possible
      const angleOffset = ((i * 120) % 360) | 0;
      const x = (width * 0.5) + (width * 0.3 * this._sinTable[(angle + angleOffset) % 360]);
      const y = (height * 0.5) + (height * 0.3 * this._cosTable[(angle + angleOffset) % 360]);
      const radius = 20 + 10 * sinTime;

      // Use cached colors when possible
      const colorKey = `circle-${i % 3}`;
      if (!this._colorCache) this._colorCache = {};

      if (!this._colorCache[colorKey] || frameIndex % 30 === 0) {
        const hue = ((frameIndex + i * 60) % 360) | 0;
        this._colorCache[colorKey] = `hsl(${hue}, 70%, 60%)`;
      }

      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this._colorCache[colorKey];
      this.ctx.fill();
    }

    // Draw rectangles
    for (let i = 0; i < rectCount; i++) {
      const x = width * (0.2 + 0.6 * (i === 0 ? sinTime : cosTime));
      const y = height * (0.2 + 0.6 * (i === 0 ? cosTime : sinTime));
      const size = 40 + 10 * sinTime;

      // Use cached colors
      const colorKey = `rect-${i}`;
      if (!this._colorCache[colorKey]) {
        this._colorCache[colorKey] = `hsl(${i * 120}, 80%, 50%)`;
      }

      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(time * 0.2);
      this.ctx.fillStyle = this._colorCache[colorKey];
      this.ctx.fillRect(-size/2, -size/2, size, size);
      this.ctx.restore();
    }

    // Only draw text in medium or high quality mode
    if (quality !== 'low') {
      // Draw minimal frame info - only update every 30 frames to reduce text rendering
      if (frameIndex % 30 === 0 || !this._lastFrameInfo) {
        this._lastFrameInfo = {
          frame: frameIndex,
          time: Math.floor(frameIndex / 30), // Integer division
          viewpoint: `(${this.viewpoint.x|0}, ${this.viewpoint.y|0}, ${this.viewpoint.z|0})` // Integer values
        };
      }

      // Draw the cached frame info
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '16px Arial';
      this.ctx.fillText(`Frame: ${this._lastFrameInfo.frame}`, 20, 30);
      this.ctx.fillText(`Time: ${this._lastFrameInfo.time}s`, 20, 50);
      this.ctx.fillText(`View: ${this._lastFrameInfo.viewpoint}`, 20, 70);
    }

    // Add subtle zophlic signature in high quality mode
    if (quality === 'high' && frameIndex % 300 === 0) {
      this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
      this.ctx.font = '10px Arial';
      this.ctx.fillText('zophlic', width - 50, height - 10);
    }
  }

  /**
   * Draw depth visualization - optimized for performance
   * @private
   * @param {Object} depthMap - Depth map
   */
  _drawDepthVisualization(depthMap) {
    // Only update depth visualization every 10 frames to reduce resource usage
    const currentFrame = this.currentVideo ? this.currentVideo.currentFrame : 0;
    if (currentFrame % 10 !== 0 && this._cachedDepthCanvas) {
      // Reuse cached depth visualization
      this._drawCachedDepthVisualization();
      return;
    }

    // Draw depth map in the corner with reduced size
    const { width, height } = this.canvas;
    const depthWidth = Math.min(150, width / 5); // Smaller size for better performance
    const depthHeight = (depthWidth / depthMap.width) * depthMap.height;

    // Create or reuse the temporary canvas
    if (!this._depthTempCanvas) {
      this._depthTempCanvas = document.createElement('canvas');
    }

    // Set canvas dimensions
    this._depthTempCanvas.width = depthMap.width;
    this._depthTempCanvas.height = depthMap.height;
    const tempCtx = this._depthTempCanvas.getContext('2d');

    // Create depth visualization - use a more efficient approach
    const imageData = tempCtx.createImageData(depthMap.width, depthMap.height);
    const data = imageData.data;

    // Process in chunks for better performance
    const chunkSize = 1000;
    for (let i = 0; i < depthMap.data.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, depthMap.data.length);

      for (let j = i; j < end; j++) {
        // Use bitwise operations for better performance
        const value = ((1 - depthMap.data[j]) * 255) | 0;
        const idx = j * 4;

        // Set all RGBA values at once
        data[idx] = data[idx + 1] = data[idx + 2] = value;
        data[idx + 3] = 255;
      }
    }

    // Put the image data on the temporary canvas
    tempCtx.putImageData(imageData, 0, 0);

    // Cache the depth canvas for reuse
    if (!this._cachedDepthCanvas) {
      this._cachedDepthCanvas = document.createElement('canvas');
    }
    this._cachedDepthCanvas.width = depthWidth;
    this._cachedDepthCanvas.height = depthHeight;
    const cacheCtx = this._cachedDepthCanvas.getContext('2d');

    // Draw the depth map to the cached canvas
    cacheCtx.drawImage(this._depthTempCanvas, 0, 0, depthWidth, depthHeight);

    // Draw border and label on the cached canvas
    cacheCtx.strokeStyle = '#fff';
    cacheCtx.lineWidth = 1;
    cacheCtx.strokeRect(0, 0, depthWidth, depthHeight);
    cacheCtx.fillStyle = '#fff';
    cacheCtx.font = '10px Arial';
    cacheCtx.fillText('Depth', 5, depthHeight - 5);

    // Store the position for reuse
    this._depthPosition = {
      x: width - depthWidth - 10,
      y: 10,
      width: depthWidth,
      height: depthHeight
    };

    // Draw the cached canvas to the main canvas
    this._drawCachedDepthVisualization();
  }

  /**
   * Draw cached depth visualization
   * @private
   */
  _drawCachedDepthVisualization() {
    if (!this._cachedDepthCanvas || !this._depthPosition) return;

    // Draw with reduced opacity
    this.ctx.globalAlpha = 0.6; // Reduced from 0.7 for better performance
    this.ctx.drawImage(
      this._cachedDepthCanvas,
      this._depthPosition.x,
      this._depthPosition.y,
      this._depthPosition.width,
      this._depthPosition.height
    );
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * Trigger an event - optimized for performance
   * @private
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  _triggerEvent(event, data) {
    // Skip if no listeners or if too many events are being triggered
    if (!this.eventListeners[event]) return;

    // Add timestamp to event data
    const eventData = {
      ...data,
      timestamp: performance.now(),
      service: 'lightFieldVideo'
    };

    // Use a more efficient approach for triggering events
    const listeners = this.eventListeners[event];
    const len = listeners.length;

    // Use a direct loop for better performance
    for (let i = 0; i < len; i++) {
      try {
        // Use setTimeout for non-critical events to avoid blocking the main thread
        if (event === 'frameRendered' || event === 'playbackProgress') {
          // These events happen frequently, so use setTimeout to avoid blocking
          const callback = listeners[i];
          setTimeout(() => callback(eventData), 0);
        } else {
          // Critical events should be called immediately
          listeners[i](eventData);
        }
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    }
  }
}

export default new LightFieldVideoService();
