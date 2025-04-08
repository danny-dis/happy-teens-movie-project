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
      console.log('Initializing Light Field Video service...');

      // Override default settings
      if (options.settings) {
        this.settings = {
          ...this.settings,
          ...options.settings
        };
      }

      // Check for WebGL support
      const hasWebGL = this._checkWebGLSupport();

      if (!hasWebGL && this.settings.useGPU) {
        console.warn('WebGL not supported, falling back to CPU rendering');
        this.settings.useGPU = false;
      }

      // Create canvas for rendering
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');

      // Initialize renderer
      await this._initializeRenderer();

      // Initialize worker for background processing
      await this._initializeWorker();

      this.initialized = true;
      console.log('Light Field Video service initialized');

      return true;
    } catch (error) {
      console.error('Failed to initialize Light Field Video service:', error);
      return false;
    }
  }

  /**
   * Load a light field video
   * @param {string} videoId - Video ID
   * @param {HTMLElement} container - Container element
   * @returns {Promise<boolean>} Success status
   */
  async loadVideo(videoId, container) {
    if (!this.initialized) await this.initialize();

    try {
      console.log(`Loading light field video ${videoId}...`);

      // Check if container is valid
      if (!container || !(container instanceof HTMLElement)) {
        throw new Error('Invalid container element');
      }

      // Clear previous video
      if (this.currentVideo) {
        await this.unloadVideo();
      }

      // Resize canvas to match container
      this.canvas.width = container.clientWidth * this.settings.renderScale;
      this.canvas.height = container.clientHeight * this.settings.renderScale;
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';

      // Add canvas to container
      container.appendChild(this.canvas);

      // Simulate loading video data
      const videoData = await this._simulateLoadVideoData(videoId);

      // Set current video
      this.currentVideo = {
        id: videoId,
        data: videoData,
        startTime: Date.now(),
        currentFrame: 0,
        totalFrames: videoData.totalFrames,
        framerate: videoData.framerate,
        duration: videoData.duration,
        dimensions: videoData.dimensions,
        viewpoints: videoData.viewpoints
      };

      // Reset viewpoint
      this.viewpoint = { x: 0, y: 0, z: 0 };

      // Load depth map
      this.depthMap = await this._loadDepthMap(videoId);

      // Trigger event
      this._triggerEvent('videoLoaded', {
        videoId,
        dimensions: videoData.dimensions,
        duration: videoData.duration,
        viewpoints: videoData.viewpoints.length
      });

      return true;
    } catch (error) {
      console.error(`Failed to load light field video ${videoId}:`, error);
      throw error;
    }
  }

  /**
   * Unload the current video
   * @returns {Promise<boolean>} Success status
   */
  async unloadVideo() {
    if (!this.currentVideo) return true;

    try {
      console.log(`Unloading light field video ${this.currentVideo.id}...`);

      // Stop playback
      if (this.isPlaying) {
        await this.stop();
      }

      // Remove canvas from parent
      if (this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }

      // Clear current video
      this.currentVideo = null;
      this.depthMap = null;

      // Trigger event
      this._triggerEvent('videoUnloaded', {});

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
   * Start render loop - optimized for performance
   * @private
   */
  _startRenderLoop() {
    if (!this.currentVideo || !this.isPlaying) return;

    // Track last frame time for more consistent frame rates
    let lastFrameTime = performance.now();
    let frameSkipCount = 0;

    const renderLoop = () => {
      // Exit early if video is no longer playing
      if (!this.currentVideo || !this.isPlaying) return;

      const now = performance.now();
      const elapsed = now - lastFrameTime;

      // Target 30fps (33.33ms per frame) - skip frames if we're falling behind
      const targetFrameTime = 33.33;

      // Calculate current frame based on time
      const currentTime = this._getCurrentTime();
      const targetFrame = Math.floor(currentTime * this.currentVideo.framerate);

      // Check if we need to update the frame
      if (targetFrame !== this.currentVideo.currentFrame) {
        // Update current frame
        this.currentVideo.currentFrame = targetFrame;

        // Check if we've reached the end
        if (targetFrame >= this.currentVideo.totalFrames) {
          // Stop playback
          this.stop(); // No need for await here

          // Trigger event
          this._triggerEvent('playbackEnded', {
            videoId: this.currentVideo.id
          });

          return;
        }

        // Determine if we should skip rendering this frame to maintain performance
        // Skip rendering if we're falling behind, but never skip more than 2 frames in a row
        const shouldRender = elapsed <= targetFrameTime * 1.5 || frameSkipCount >= 2;

        if (shouldRender) {
          // Reset frame skip counter
          frameSkipCount = 0;

          // Render the frame
          this._renderFrame(targetFrame);

          // Only prefetch frames when we have time
          if (elapsed < targetFrameTime) {
            this._prefetchFrames(targetFrame);
          }

          // Only trigger progress event every 5 frames to reduce overhead
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

      // Update last frame time
      lastFrameTime = now;

      // Schedule next frame
      requestAnimationFrame(renderLoop);
    };

    // Start the loop
    requestAnimationFrame(renderLoop);
  }

  /**
   * Render a specific frame - optimized for performance
   * @private
   * @param {number} frameIndex - Frame index
   */
  _renderFrame(frameIndex) {
    if (!this.currentVideo) return;

    // Skip rendering if canvas is not visible (e.g., tab is in background)
    // This check uses the Page Visibility API for better performance
    if (document.hidden) return;

    // Use minimal frame data structure
    const frameData = {
      index: frameIndex,
      timestamp: frameIndex / this.currentVideo.framerate
    };

    // Start timing
    const startTime = performance.now();

    // Render the frame - no need for await since we've optimized the renderer
    this.renderer.renderFrame(
      frameData,
      this.viewpoint,
      this.depthMap
    );

    // Calculate render time
    const renderTime = performance.now() - startTime;

    // Update stats with exponential moving average for more stable values
    this.stats.framesRendered++;
    this.stats.averageRenderTime = this.stats.averageRenderTime * 0.9 + renderTime * 0.1;

    // Only trigger event every few frames to reduce overhead
    if (frameIndex % 5 === 0) {
      this._triggerEvent('frameRendered', {
        frameIndex,
        renderTime
      });
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
   * Draw simulated content - optimized for performance
   * @private
   * @param {Object} frameData - Frame data
   */
  _drawSimulatedContent(frameData) {
    const { width, height } = this.canvas;
    const frameIndex = frameData.index;

    // Background - use fillRect directly without changing fillStyle if it's already set
    if (this._lastBgColor !== '#222') {
      this.ctx.fillStyle = '#222';
      this._lastBgColor = '#222';
    }
    this.ctx.fillRect(0, 0, width, height);

    // Use a more efficient time calculation
    const time = frameIndex / 30; // Assuming 30fps

    // Pre-calculate sin/cos values that are used multiple times
    const sinTime = Math.sin(time * 0.5);
    const cosTime = Math.cos(time * 0.5);

    // Draw fewer circles (3 instead of 5) for better performance
    for (let i = 0; i < 3; i++) {
      // Use pre-calculated trig values where possible
      const x = width * (0.3 + 0.4 * Math.sin(time * 0.5 + i));
      const y = height * (0.3 + 0.4 * Math.cos(time * 0.7 + i));
      const radius = 20 + 10 * sinTime; // Simplified calculation

      // Reduce color calculations - use a simpler color scheme
      const hue = (frameIndex * 2 + i * 60) % 360; // Simpler calculation

      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      this.ctx.fill();
    }

    // Draw fewer rectangles (2 instead of 3) for better performance
    for (let i = 0; i < 2; i++) {
      const x = width * (0.2 + 0.6 * (i === 0 ? sinTime : cosTime)); // Reuse calculated values
      const y = height * (0.2 + 0.6 * (i === 0 ? cosTime : sinTime));
      const size = 40 + 10 * sinTime; // Simplified calculation

      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.rotate(time * 0.2);
      this.ctx.fillStyle = `hsl(${i * 120}, 80%, 50%)`; // Simplified color
      this.ctx.fillRect(-size/2, -size/2, size, size);
      this.ctx.restore();
    }

    // Draw minimal frame info - only update every 10 frames to reduce text rendering
    if (frameIndex % 10 === 0 || !this._lastFrameInfo) {
      this._lastFrameInfo = {
        frame: frameIndex,
        time: (frameIndex / 30).toFixed(1),
        viewpoint: `(${this.viewpoint.x.toFixed(0)}, ${this.viewpoint.y.toFixed(0)}, ${this.viewpoint.z.toFixed(0)})`
      };
    }

    // Draw the cached frame info
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Frame: ${this._lastFrameInfo.frame}`, 20, 30);
    this.ctx.fillText(`Time: ${this._lastFrameInfo.time}s`, 20, 50);
    this.ctx.fillText(`View: ${this._lastFrameInfo.viewpoint}`, 20, 70);
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
   * Trigger an event
   * @private
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  _triggerEvent(event, data) {
    if (!this.eventListeners[event]) return;

    for (const callback of this.eventListeners[event]) {
      callback(data);
    }
  }
}

export default new LightFieldVideoService();
