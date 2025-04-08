/**
 * Streaming Service for Movo
 * Handles media streaming logic with fallback behavior
 * Includes adaptive streaming and bandwidth management
 *
 * @author zophlic
 */

import { fetchWithErrorHandling, ApiError } from '../utils/errorHandling';
import analyticsService, { EVENT_CATEGORIES } from './analyticsService';

// Constants
const STREAM_QUALITY_LEVELS = {
  AUTO: 'auto',
  LOW: 'low',     // 480p
  MEDIUM: 'medium', // 720p
  HIGH: 'high',    // 1080p
  ULTRA: 'ultra',   // 4K
};

// Bitrates in bits per second for each quality level
const QUALITY_BITRATES = {
  [STREAM_QUALITY_LEVELS.LOW]: 1500000,    // 1.5 Mbps
  [STREAM_QUALITY_LEVELS.MEDIUM]: 4000000, // 4 Mbps
  [STREAM_QUALITY_LEVELS.HIGH]: 8000000,   // 8 Mbps
  [STREAM_QUALITY_LEVELS.ULTRA]: 16000000, // 16 Mbps
};

const STREAM_TYPES = {
  CENTRALIZED: 'centralized',
  PEER: 'peer',
  LOCAL: 'local',
};

// Network condition thresholds
const NETWORK_CONDITIONS = {
  EXCELLENT: 'excellent', // > 10 Mbps
  GOOD: 'good',          // 5-10 Mbps
  FAIR: 'fair',          // 2-5 Mbps
  POOR: 'poor',          // < 2 Mbps
};

/**
 * Stream manager class
 */
class StreamingService {
  constructor() {
    this.activeStreams = new Map();
    this.streamListeners = new Map();
    this.currentQuality = STREAM_QUALITY_LEVELS.AUTO;
    this.preferredStreamType = STREAM_TYPES.CENTRALIZED;
    this.fallbackEnabled = true;
    this.analyticsEnabled = true;
    this.adaptiveStreamingEnabled = true;
    this.bandwidthSamples = [];
    this.currentNetworkCondition = NETWORK_CONDITIONS.GOOD;
    this.bandwidthCheckInterval = null;
    this.lastQualityChange = Date.now();
    this.qualityChangeThreshold = 10000; // 10 seconds between quality changes
    this.bufferingEvents = 0;

    // Bind methods
    this.startStream = this.startStream.bind(this);
    this.stopStream = this.stopStream.bind(this);
    this.setQuality = this.setQuality.bind(this);
    this.setPreferredStreamType = this.setPreferredStreamType.bind(this);
    this.enableFallback = this.enableFallback.bind(this);
    this.enableAdaptiveStreaming = this.enableAdaptiveStreaming.bind(this);
    this.checkBandwidth = this.checkBandwidth.bind(this);
    this.onStreamEvent = this.onStreamEvent.bind(this);
    this.offStreamEvent = this.offStreamEvent.bind(this);

    // Initialize bandwidth monitoring
    this._initializeBandwidthMonitoring();
  }

  /**
   * Start streaming a media item
   * @param {string} mediaId - ID of the media to stream
   * @param {Object} options - Streaming options
   * @returns {Promise<Object>} Stream information
   */
  async startStream(mediaId, options = {}) {
    // Check if already streaming
    if (this.activeStreams.has(mediaId)) {
      return this.activeStreams.get(mediaId);
    }

    // Default options
    const defaultOptions = {
      quality: this.currentQuality,
      streamType: this.preferredStreamType,
      autoPlay: true,
      startPosition: 0,
      metadata: {},
    };

    // Merge options
    const streamOptions = { ...defaultOptions, ...options };

    try {
      // Try preferred stream type first
      const streamInfo = await this._initializeStream(mediaId, streamOptions);

      // Store active stream
      this.activeStreams.set(mediaId, streamInfo);

      // Notify listeners
      this._notifyStreamListeners(mediaId, 'start', streamInfo);

      // Log analytics if enabled
      if (this.analyticsEnabled) {
        this._logStreamAnalytics('stream_start', {
          mediaId,
          streamType: streamInfo.streamType,
          quality: streamInfo.quality,
        });
      }

      return streamInfo;
    } catch (error) {
      // If fallback is enabled, try alternative stream types
      if (this.fallbackEnabled) {
        try {
          // Log fallback attempt
          console.warn(`Stream failed with ${streamOptions.streamType}, trying fallback`, error);

          // Try fallback stream types in order
          const fallbackTypes = Object.values(STREAM_TYPES).filter(
            type => type !== streamOptions.streamType
          );

          for (const fallbackType of fallbackTypes) {
            try {
              const fallbackOptions = { ...streamOptions, streamType: fallbackType };
              const fallbackInfo = await this._initializeStream(mediaId, fallbackOptions);

              // Store active stream
              this.activeStreams.set(mediaId, fallbackInfo);

              // Notify listeners
              this._notifyStreamListeners(mediaId, 'start', fallbackInfo);
              this._notifyStreamListeners(mediaId, 'fallback', {
                originalType: streamOptions.streamType,
                fallbackType,
                error: error.message,
              });

              // Log analytics if enabled
              if (this.analyticsEnabled) {
                this._logStreamAnalytics('stream_fallback', {
                  mediaId,
                  originalType: streamOptions.streamType,
                  fallbackType,
                  error: error.message,
                });
              }

              return fallbackInfo;
            } catch (fallbackError) {
              console.error(`Fallback to ${fallbackType} also failed`, fallbackError);
            }
          }
        } catch (fallbackError) {
          console.error('All fallback attempts failed', fallbackError);
        }
      }

      // If we get here, all attempts failed
      this._notifyStreamListeners(mediaId, 'error', {
        error: error.message,
        mediaId,
      });

      throw new ApiError(
        'Failed to start stream after all attempts',
        500,
        { mediaId, originalError: error }
      );
    }
  }

  /**
   * Stop streaming a media item
   * @param {string} mediaId - ID of the media to stop streaming
   * @returns {Promise<boolean>} Whether the stream was stopped
   */
  async stopStream(mediaId) {
    // Check if streaming
    if (!this.activeStreams.has(mediaId)) {
      return false;
    }

    const streamInfo = this.activeStreams.get(mediaId);

    try {
      // Clean up stream resources
      await this._cleanupStream(mediaId, streamInfo);

      // Remove from active streams
      this.activeStreams.delete(mediaId);

      // Notify listeners
      this._notifyStreamListeners(mediaId, 'stop', { mediaId });

      // Log analytics if enabled
      if (this.analyticsEnabled) {
        this._logStreamAnalytics('stream_stop', {
          mediaId,
          streamType: streamInfo.streamType,
          duration: Date.now() - streamInfo.startTime,
        });
      }

      return true;
    } catch (error) {
      console.error('Error stopping stream', error);

      // Force remove from active streams
      this.activeStreams.delete(mediaId);

      // Notify listeners
      this._notifyStreamListeners(mediaId, 'error', {
        error: error.message,
        mediaId,
      });

      return false;
    }
  }

  /**
   * Set streaming quality for all streams
   * @param {string} quality - Quality level
   * @param {boolean} userInitiated - Whether the quality change was initiated by the user
   */
  setQuality(quality, userInitiated = true) {
    if (!Object.values(STREAM_QUALITY_LEVELS).includes(quality)) {
      throw new Error(`Invalid quality level: ${quality}`);
    }

    // If user manually sets quality, disable adaptive streaming
    if (userInitiated && quality !== STREAM_QUALITY_LEVELS.AUTO) {
      this.enableAdaptiveStreaming(false);
    } else if (userInitiated && quality === STREAM_QUALITY_LEVELS.AUTO) {
      this.enableAdaptiveStreaming(true);
    }

    this.currentQuality = quality;
    this.lastQualityChange = Date.now();

    // Update quality for all active streams
    this.activeStreams.forEach((streamInfo, mediaId) => {
      this._updateStreamQuality(mediaId, quality, userInitiated);
    });

    // Log analytics
    if (this.analyticsEnabled && userInitiated) {
      analyticsService.trackEvent(
        EVENT_CATEGORIES.PLAYBACK,
        'quality_change',
        {
          quality,
          userInitiated,
          activeStreams: this.activeStreams.size
        }
      );
    }
  }

  /**
   * Set preferred stream type
   * @param {string} streamType - Stream type
   */
  setPreferredStreamType(streamType) {
    if (!Object.values(STREAM_TYPES).includes(streamType)) {
      throw new Error(`Invalid stream type: ${streamType}`);
    }

    this.preferredStreamType = streamType;
  }

  /**
   * Enable or disable fallback behavior
   * @param {boolean} enabled - Whether fallback is enabled
   */
  enableFallback(enabled) {
    this.fallbackEnabled = enabled;
  }

  /**
   * Add stream event listener
   * @param {string} mediaId - Media ID to listen for events
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  onStreamEvent(mediaId, event, listener) {
    if (!this.streamListeners.has(mediaId)) {
      this.streamListeners.set(mediaId, new Map());
    }

    const mediaListeners = this.streamListeners.get(mediaId);

    if (!mediaListeners.has(event)) {
      mediaListeners.set(event, new Set());
    }

    mediaListeners.get(event).add(listener);
  }

  /**
   * Remove stream event listener
   * @param {string} mediaId - Media ID
   * @param {string} event - Event name
   * @param {Function} listener - Event listener to remove
   */
  offStreamEvent(mediaId, event, listener) {
    if (!this.streamListeners.has(mediaId)) {
      return;
    }

    const mediaListeners = this.streamListeners.get(mediaId);

    if (!mediaListeners.has(event)) {
      return;
    }

    mediaListeners.get(event).delete(listener);

    // Clean up empty listener sets
    if (mediaListeners.get(event).size === 0) {
      mediaListeners.delete(event);
    }

    if (mediaListeners.size === 0) {
      this.streamListeners.delete(mediaId);
    }
  }

  /**
   * Initialize a stream
   * @private
   * @param {string} mediaId - Media ID
   * @param {Object} options - Stream options
   * @returns {Promise<Object>} Stream information
   */
  async _initializeStream(mediaId, options) {
    // In a real implementation, this would initialize the appropriate stream type
    // For now, we'll simulate different stream types

    // Simulate API call to get stream information
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create stream info based on type
    let streamInfo;

    switch (options.streamType) {
      case STREAM_TYPES.PEER:
        streamInfo = {
          mediaId,
          streamType: STREAM_TYPES.PEER,
          quality: options.quality,
          url: `p2p://${mediaId}?quality=${options.quality}`,
          peers: ['peer1', 'peer2', 'peer3'],
          startTime: Date.now(),
          metadata: options.metadata,
        };
        break;

      case STREAM_TYPES.LOCAL:
        streamInfo = {
          mediaId,
          streamType: STREAM_TYPES.LOCAL,
          quality: options.quality,
          url: `file://${mediaId}?quality=${options.quality}`,
          path: `/local/media/${mediaId}`,
          startTime: Date.now(),
          metadata: options.metadata,
        };
        break;

      case STREAM_TYPES.CENTRALIZED:
      default:
        streamInfo = {
          mediaId,
          streamType: STREAM_TYPES.CENTRALIZED,
          quality: options.quality,
          url: `https://stream.example.com/${mediaId}?quality=${options.quality}`,
          cdnProvider: 'ExampleCDN',
          startTime: Date.now(),
          metadata: options.metadata,
        };
        break;
    }

    return streamInfo;
  }

  /**
   * Clean up stream resources
   * @private
   * @param {string} mediaId - Media ID
   * @param {Object} streamInfo - Stream information
   * @returns {Promise<void>}
   */
  async _cleanupStream(mediaId, streamInfo) {
    // In a real implementation, this would clean up resources based on stream type
    // For now, we'll just simulate cleanup
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  /**
   * Update stream quality
   * @private
   * @param {string} mediaId - Media ID
   * @param {string} quality - New quality level
   * @param {boolean} userInitiated - Whether the quality change was initiated by the user
   */
  _updateStreamQuality(mediaId, quality, userInitiated = true) {
    const streamInfo = this.activeStreams.get(mediaId);

    if (!streamInfo) {
      return;
    }

    // If quality is AUTO, determine the best quality based on network conditions
    let actualQuality = quality;
    if (quality === STREAM_QUALITY_LEVELS.AUTO) {
      actualQuality = this._getBestQualityForNetwork();
    }

    // Don't change if it's the same quality
    if (streamInfo.actualQuality === actualQuality) {
      return;
    }

    // Update quality
    streamInfo.quality = quality; // Store the requested quality (might be AUTO)
    streamInfo.actualQuality = actualQuality; // Store the actual quality level
    streamInfo.lastQualityChange = Date.now();

    // Update URL with new quality
    const url = new URL(streamInfo.url);
    url.searchParams.set('quality', actualQuality);
    streamInfo.url = url.toString();

    // Notify listeners
    this._notifyStreamListeners(mediaId, 'quality_change', {
      mediaId,
      quality,
      actualQuality,
      userInitiated,
      bandwidth: this._getCurrentBandwidth()
    });

    // Log analytics if enabled
    if (this.analyticsEnabled) {
      this._logStreamAnalytics('stream_quality_change', {
        mediaId,
        streamType: streamInfo.streamType,
        quality,
        actualQuality,
        userInitiated,
        bandwidth: this._getCurrentBandwidth(),
        networkCondition: this.currentNetworkCondition
      });
    }
  }

  /**
   * Notify stream event listeners
   * @private
   * @param {string} mediaId - Media ID
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  _notifyStreamListeners(mediaId, event, data) {
    if (!this.streamListeners.has(mediaId)) {
      return;
    }

    const mediaListeners = this.streamListeners.get(mediaId);

    if (!mediaListeners.has(event)) {
      return;
    }

    // Add timestamp to event data
    const eventData = {
      ...data,
      timestamp: Date.now(),
    };

    // Notify listeners
    mediaListeners.get(event).forEach(listener => {
      try {
        listener(eventData);
      } catch (error) {
        console.error(`Error in stream event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Log streaming analytics
   * @private
   * @param {string} event - Analytics event name
   * @param {Object} data - Event data
   */
  _logStreamAnalytics(event, data) {
    // In a real implementation, this would send analytics to a server
    console.info(`[Analytics] ${event}:`, data);

    // Example implementation with navigator.sendBeacon
    if (navigator.sendBeacon) {
      try {
        const analyticsData = {
          event,
          data,
          timestamp: Date.now(),
          userId: 'zophlic', // In a real app, this would be the actual user ID
        };

        navigator.sendBeacon(
          '/api/analytics',
          JSON.stringify(analyticsData)
        );
      } catch (error) {
        console.error('Failed to send analytics', error);
      }
    }
  }

  /**
   * Enable or disable adaptive streaming
   * @param {boolean} enabled - Whether adaptive streaming is enabled
   */
  enableAdaptiveStreaming(enabled) {
    this.adaptiveStreamingEnabled = enabled;

    // If enabling, check bandwidth immediately
    if (enabled) {
      this.checkBandwidth();
    }

    // Log analytics
    if (this.analyticsEnabled) {
      analyticsService.trackEvent(
        EVENT_CATEGORIES.PLAYBACK,
        'adaptive_streaming_toggle',
        {
          enabled,
          activeStreams: this.activeStreams.size
        }
      );
    }
  }

  /**
   * Check bandwidth and adjust quality if needed
   */
  async checkBandwidth() {
    if (!this.adaptiveStreamingEnabled || this.activeStreams.size === 0) {
      return;
    }

    try {
      // Measure current bandwidth
      const bandwidth = await this._measureBandwidth();

      // Add to samples (keep last 5)
      this.bandwidthSamples.push(bandwidth);
      if (this.bandwidthSamples.length > 5) {
        this.bandwidthSamples.shift();
      }

      // Update network condition
      this._updateNetworkCondition();

      // Only adjust quality if AUTO is selected and enough time has passed since last change
      if (
        this.currentQuality === STREAM_QUALITY_LEVELS.AUTO &&
        Date.now() - this.lastQualityChange > this.qualityChangeThreshold
      ) {
        const bestQuality = this._getBestQualityForNetwork();

        // Check if any active stream needs quality adjustment
        this.activeStreams.forEach((streamInfo, mediaId) => {
          if (streamInfo.quality === STREAM_QUALITY_LEVELS.AUTO &&
              streamInfo.actualQuality !== bestQuality) {
            this._updateStreamQuality(mediaId, STREAM_QUALITY_LEVELS.AUTO, false);
          }
        });
      }
    } catch (error) {
      console.error('Error checking bandwidth:', error);
    }
  }

  /**
   * Initialize bandwidth monitoring
   * @private
   */
  _initializeBandwidthMonitoring() {
    // Check bandwidth periodically
    this.bandwidthCheckInterval = setInterval(() => {
      this.checkBandwidth();
    }, 30000); // Check every 30 seconds

    // Monitor network connection changes if available
    if (navigator.connection) {
      navigator.connection.addEventListener('change', () => {
        // Force bandwidth check on connection change
        this.checkBandwidth();
      });
    }

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      if (this.bandwidthCheckInterval) {
        clearInterval(this.bandwidthCheckInterval);
      }
    });
  }

  /**
   * Measure current bandwidth
   * @private
   * @returns {Promise<number>} Bandwidth in bits per second
   */
  async _measureBandwidth() {
    try {
      // Use navigator.connection if available
      if (navigator.connection && navigator.connection.downlink) {
        return navigator.connection.downlink * 1000000; // Convert Mbps to bps
      }

      // Otherwise, measure by downloading a test file
      const startTime = Date.now();
      const response = await fetch('/api/bandwidth-test', { method: 'GET', cache: 'no-store' });
      const data = await response.blob();
      const endTime = Date.now();

      const durationSeconds = (endTime - startTime) / 1000;
      const fileSizeBits = data.size * 8;

      return fileSizeBits / durationSeconds; // bits per second
    } catch (error) {
      console.error('Error measuring bandwidth:', error);

      // Return a conservative estimate if measurement fails
      return 2000000; // 2 Mbps
    }
  }

  /**
   * Update network condition based on bandwidth samples
   * @private
   */
  _updateNetworkCondition() {
    if (this.bandwidthSamples.length === 0) {
      return;
    }

    // Calculate average bandwidth
    const avgBandwidth = this.bandwidthSamples.reduce((sum, bw) => sum + bw, 0) / this.bandwidthSamples.length;

    // Determine network condition
    let networkCondition;
    if (avgBandwidth > 10000000) { // > 10 Mbps
      networkCondition = NETWORK_CONDITIONS.EXCELLENT;
    } else if (avgBandwidth > 5000000) { // > 5 Mbps
      networkCondition = NETWORK_CONDITIONS.GOOD;
    } else if (avgBandwidth > 2000000) { // > 2 Mbps
      networkCondition = NETWORK_CONDITIONS.FAIR;
    } else {
      networkCondition = NETWORK_CONDITIONS.POOR;
    }

    // Only log if condition changed
    if (networkCondition !== this.currentNetworkCondition) {
      console.log(`Network condition changed: ${this.currentNetworkCondition} -> ${networkCondition} (${Math.round(avgBandwidth / 1000000)} Mbps)`);

      // Log analytics
      if (this.analyticsEnabled) {
        analyticsService.trackEvent(
          EVENT_CATEGORIES.PERFORMANCE,
          'network_condition_change',
          {
            previousCondition: this.currentNetworkCondition,
            newCondition: networkCondition,
            bandwidth: avgBandwidth,
            bandwidthMbps: Math.round(avgBandwidth / 1000000 * 100) / 100
          }
        );
      }
    }

    this.currentNetworkCondition = networkCondition;
  }

  /**
   * Get current bandwidth
   * @private
   * @returns {number} Current bandwidth in bits per second
   */
  _getCurrentBandwidth() {
    if (this.bandwidthSamples.length === 0) {
      return 5000000; // Default to 5 Mbps if no samples
    }

    return this.bandwidthSamples.reduce((sum, bw) => sum + bw, 0) / this.bandwidthSamples.length;
  }

  /**
   * Get best quality for current network condition
   * @private
   * @returns {string} Best quality level
   */
  _getBestQualityForNetwork() {
    const bandwidth = this._getCurrentBandwidth();

    // Add 30% buffer to account for variations
    const adjustedBandwidth = bandwidth * 0.7;

    // Select quality based on available bandwidth
    if (adjustedBandwidth >= QUALITY_BITRATES[STREAM_QUALITY_LEVELS.ULTRA]) {
      return STREAM_QUALITY_LEVELS.ULTRA;
    } else if (adjustedBandwidth >= QUALITY_BITRATES[STREAM_QUALITY_LEVELS.HIGH]) {
      return STREAM_QUALITY_LEVELS.HIGH;
    } else if (adjustedBandwidth >= QUALITY_BITRATES[STREAM_QUALITY_LEVELS.MEDIUM]) {
      return STREAM_QUALITY_LEVELS.MEDIUM;
    } else {
      return STREAM_QUALITY_LEVELS.LOW;
    }
  }
}

// Create singleton instance
const streamingService = new StreamingService();

export default streamingService;
export { STREAM_QUALITY_LEVELS, STREAM_TYPES, NETWORK_CONDITIONS, QUALITY_BITRATES };
