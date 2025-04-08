/**
 * Streaming Service for Movo
 * Handles media streaming logic with fallback behavior
 * 
 * @author zophlic
 */

import { fetchWithErrorHandling, ApiError } from '../utils/errorHandling';

// Constants
const STREAM_QUALITY_LEVELS = {
  AUTO: 'auto',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  ULTRA: 'ultra',
};

const STREAM_TYPES = {
  CENTRALIZED: 'centralized',
  PEER: 'peer',
  LOCAL: 'local',
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
    
    // Bind methods
    this.startStream = this.startStream.bind(this);
    this.stopStream = this.stopStream.bind(this);
    this.setQuality = this.setQuality.bind(this);
    this.setPreferredStreamType = this.setPreferredStreamType.bind(this);
    this.enableFallback = this.enableFallback.bind(this);
    this.onStreamEvent = this.onStreamEvent.bind(this);
    this.offStreamEvent = this.offStreamEvent.bind(this);
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
   */
  setQuality(quality) {
    if (!Object.values(STREAM_QUALITY_LEVELS).includes(quality)) {
      throw new Error(`Invalid quality level: ${quality}`);
    }
    
    this.currentQuality = quality;
    
    // Update quality for all active streams
    this.activeStreams.forEach((streamInfo, mediaId) => {
      this._updateStreamQuality(mediaId, quality);
    });
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
   */
  _updateStreamQuality(mediaId, quality) {
    const streamInfo = this.activeStreams.get(mediaId);
    
    if (!streamInfo) {
      return;
    }
    
    // Update quality
    streamInfo.quality = quality;
    
    // Update URL with new quality
    const url = new URL(streamInfo.url);
    url.searchParams.set('quality', quality);
    streamInfo.url = url.toString();
    
    // Notify listeners
    this._notifyStreamListeners(mediaId, 'quality_change', {
      mediaId,
      quality,
    });
    
    // Log analytics if enabled
    if (this.analyticsEnabled) {
      this._logStreamAnalytics('stream_quality_change', {
        mediaId,
        streamType: streamInfo.streamType,
        quality,
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
}

// Create singleton instance
const streamingService = new StreamingService();

export default streamingService;
export { STREAM_QUALITY_LEVELS, STREAM_TYPES };
