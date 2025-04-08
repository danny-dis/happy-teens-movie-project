/**
 * Prefetch Service for Movo
 * Intelligently prefetches content based on user behavior
 * 
 * @author zophlic
 */

import { fetchWithErrorHandling } from '../utils/errorHandling';
import analyticsService, { EVENT_CATEGORIES } from './analyticsService';

// Constants
const PREFETCH_PRIORITY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

const PREFETCH_TYPES = {
  METADATA: 'metadata',
  THUMBNAIL: 'thumbnail',
  POSTER: 'poster',
  TRAILER: 'trailer',
  SUBTITLES: 'subtitles',
  MEDIA_INFO: 'media_info'
};

/**
 * Prefetch service class
 */
class PrefetchService {
  constructor() {
    this.prefetchQueue = [];
    this.activePrefetches = new Map();
    this.prefetchedItems = new Set();
    this.maxConcurrentPrefetches = 3;
    this.isProcessing = false;
    this.isPaused = false;
    this.networkCondition = 'unknown';
    this.userBehaviorModel = {
      watchHistory: [],
      genres: {},
      actors: {},
      directors: {},
      timeOfDay: {},
      dayOfWeek: {}
    };
    
    // Bind methods
    this.prefetchItem = this.prefetchItem.bind(this);
    this.prefetchRelatedContent = this.prefetchRelatedContent.bind(this);
    this.prefetchUpNext = this.prefetchUpNext.bind(this);
    this.prefetchSearch = this.prefetchSearch.bind(this);
    this.processPrefetchQueue = this.processPrefetchQueue.bind(this);
    this.updateNetworkCondition = this.updateNetworkCondition.bind(this);
    this.pausePrefetching = this.pausePrefetching.bind(this);
    this.resumePrefetching = this.resumePrefetching.bind(this);
    this.clearPrefetchQueue = this.clearPrefetchQueue.bind(this);
    this.updateUserBehaviorModel = this.updateUserBehaviorModel.bind(this);
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize prefetch service
   */
  initialize() {
    // Set up network condition monitoring
    if (navigator.connection) {
      this.updateNetworkCondition();
      
      navigator.connection.addEventListener('change', this.updateNetworkCondition);
    }
    
    // Load user behavior model from localStorage
    try {
      const savedModel = localStorage.getItem('movo_user_behavior_model');
      
      if (savedModel) {
        this.userBehaviorModel = JSON.parse(savedModel);
      }
    } catch (error) {
      console.error('Failed to load user behavior model', error);
    }
    
    // Start processing queue
    this.processPrefetchQueue();
    
    // Set up visibility change listener
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.pausePrefetching();
        } else {
          this.resumePrefetching();
        }
      });
    }
  }
  
  /**
   * Update network condition
   */
  updateNetworkCondition() {
    if (!navigator.connection) {
      return;
    }
    
    const { effectiveType, downlink, rtt, saveData } = navigator.connection;
    
    this.networkCondition = effectiveType;
    
    // Adjust max concurrent prefetches based on network condition
    if (saveData) {
      // If data saver is enabled, minimize prefetching
      this.maxConcurrentPrefetches = 1;
    } else if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      this.maxConcurrentPrefetches = 1;
    } else if (effectiveType === '3g') {
      this.maxConcurrentPrefetches = 2;
    } else if (effectiveType === '4g') {
      this.maxConcurrentPrefetches = 3;
    } else {
      this.maxConcurrentPrefetches = 3;
    }
    
    // Log network condition change
    console.log(`[Prefetch] Network condition: ${effectiveType}, Downlink: ${downlink}Mbps, RTT: ${rtt}ms, Save Data: ${saveData}`);
  }
  
  /**
   * Prefetch a single item
   * @param {Object} item - Item to prefetch
   * @param {string} type - Type of prefetch
   * @param {string} priority - Priority of prefetch
   * @returns {Promise<boolean>} Whether prefetch was successful
   */
  async prefetchItem(item, type = PREFETCH_TYPES.METADATA, priority = PREFETCH_PRIORITY.MEDIUM) {
    // Generate prefetch ID
    const prefetchId = `${item.id}-${type}`;
    
    // Check if already prefetched or in queue
    if (
      this.prefetchedItems.has(prefetchId) || 
      this.prefetchQueue.some(queueItem => queueItem.prefetchId === prefetchId) ||
      this.activePrefetches.has(prefetchId)
    ) {
      return true;
    }
    
    // Add to queue
    this.prefetchQueue.push({
      prefetchId,
      item,
      type,
      priority,
      timestamp: Date.now()
    });
    
    // Sort queue by priority and timestamp
    this.prefetchQueue.sort((a, b) => {
      const priorityOrder = {
        [PREFETCH_PRIORITY.HIGH]: 0,
        [PREFETCH_PRIORITY.MEDIUM]: 1,
        [PREFETCH_PRIORITY.LOW]: 2
      };
      
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      return a.timestamp - b.timestamp;
    });
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processPrefetchQueue();
    }
    
    return true;
  }
  
  /**
   * Process prefetch queue
   */
  async processPrefetchQueue() {
    if (this.isPaused || this.prefetchQueue.length === 0 || this.activePrefetches.size >= this.maxConcurrentPrefetches) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    
    // Get next item from queue
    const queueItem = this.prefetchQueue.shift();
    
    if (!queueItem) {
      this.isProcessing = false;
      return;
    }
    
    const { prefetchId, item, type } = queueItem;
    
    // Add to active prefetches
    this.activePrefetches.set(prefetchId, queueItem);
    
    try {
      // Perform prefetch based on type
      switch (type) {
        case PREFETCH_TYPES.METADATA:
          await this._prefetchMetadata(item);
          break;
        case PREFETCH_TYPES.THUMBNAIL:
          await this._prefetchImage(item.thumbnailUrl);
          break;
        case PREFETCH_TYPES.POSTER:
          await this._prefetchImage(item.posterUrl);
          break;
        case PREFETCH_TYPES.TRAILER:
          await this._prefetchVideo(item.trailerUrl, true);
          break;
        case PREFETCH_TYPES.SUBTITLES:
          await this._prefetchSubtitles(item);
          break;
        case PREFETCH_TYPES.MEDIA_INFO:
          await this._prefetchMediaInfo(item);
          break;
        default:
          console.warn(`[Prefetch] Unknown prefetch type: ${type}`);
      }
      
      // Add to prefetched items
      this.prefetchedItems.add(prefetchId);
      
      // Track prefetch for analytics
      analyticsService.trackEvent(
        EVENT_CATEGORIES.PERFORMANCE,
        'content_prefetch',
        {
          itemId: item.id,
          itemType: item.type || 'movie',
          prefetchType: type,
          networkCondition: this.networkCondition
        }
      );
    } catch (error) {
      console.error(`[Prefetch] Failed to prefetch ${type} for ${item.id}:`, error);
    } finally {
      // Remove from active prefetches
      this.activePrefetches.delete(prefetchId);
      
      // Continue processing queue
      setTimeout(() => {
        this.processPrefetchQueue();
      }, 100);
    }
  }
  
  /**
   * Prefetch related content
   * @param {Object} item - Item to prefetch related content for
   * @returns {Promise<boolean>} Whether prefetch was successful
   */
  async prefetchRelatedContent(item) {
    if (!item || !item.id) {
      return false;
    }
    
    try {
      // Prefetch item metadata first
      await this.prefetchItem(item, PREFETCH_TYPES.METADATA, PREFETCH_PRIORITY.HIGH);
      
      // Prefetch item poster and thumbnail
      this.prefetchItem(item, PREFETCH_TYPES.POSTER, PREFETCH_PRIORITY.HIGH);
      this.prefetchItem(item, PREFETCH_TYPES.THUMBNAIL, PREFETCH_PRIORITY.HIGH);
      
      // Fetch related items
      const relatedItems = await this._fetchRelatedItems(item);
      
      // Prefetch metadata for related items
      relatedItems.forEach((relatedItem, index) => {
        // Prefetch first 5 items with medium priority, rest with low priority
        const priority = index < 5 ? PREFETCH_PRIORITY.MEDIUM : PREFETCH_PRIORITY.LOW;
        
        this.prefetchItem(relatedItem, PREFETCH_TYPES.METADATA, priority);
        this.prefetchItem(relatedItem, PREFETCH_TYPES.THUMBNAIL, priority);
      });
      
      // Prefetch trailer for main item
      if (item.trailerUrl) {
        this.prefetchItem(item, PREFETCH_TYPES.TRAILER, PREFETCH_PRIORITY.MEDIUM);
      }
      
      return true;
    } catch (error) {
      console.error(`[Prefetch] Failed to prefetch related content for ${item.id}:`, error);
      return false;
    }
  }
  
  /**
   * Prefetch up next content
   * @param {Object} currentItem - Current item being watched
   * @param {number} progress - Current progress (0-1)
   * @returns {Promise<boolean>} Whether prefetch was successful
   */
  async prefetchUpNext(currentItem, progress = 0) {
    if (!currentItem || !currentItem.id) {
      return false;
    }
    
    try {
      // Only prefetch up next when progress is past 70%
      if (progress < 0.7) {
        return false;
      }
      
      // Fetch up next items
      const upNextItems = await this._fetchUpNextItems(currentItem);
      
      if (upNextItems.length === 0) {
        return false;
      }
      
      // Prefetch first up next item with high priority
      const nextItem = upNextItems[0];
      
      await this.prefetchItem(nextItem, PREFETCH_TYPES.METADATA, PREFETCH_PRIORITY.HIGH);
      await this.prefetchItem(nextItem, PREFETCH_TYPES.POSTER, PREFETCH_PRIORITY.HIGH);
      await this.prefetchItem(nextItem, PREFETCH_TYPES.THUMBNAIL, PREFETCH_PRIORITY.HIGH);
      
      // Prefetch media info for first up next item
      await this.prefetchItem(nextItem, PREFETCH_TYPES.MEDIA_INFO, PREFETCH_PRIORITY.HIGH);
      
      // Prefetch subtitles for first up next item
      await this.prefetchItem(nextItem, PREFETCH_TYPES.SUBTITLES, PREFETCH_PRIORITY.MEDIUM);
      
      // Prefetch metadata for other up next items
      upNextItems.slice(1).forEach((item, index) => {
        const priority = index < 2 ? PREFETCH_PRIORITY.MEDIUM : PREFETCH_PRIORITY.LOW;
        
        this.prefetchItem(item, PREFETCH_TYPES.METADATA, priority);
        this.prefetchItem(item, PREFETCH_TYPES.THUMBNAIL, priority);
      });
      
      return true;
    } catch (error) {
      console.error(`[Prefetch] Failed to prefetch up next content for ${currentItem.id}:`, error);
      return false;
    }
  }
  
  /**
   * Prefetch search results
   * @param {string} query - Search query
   * @returns {Promise<boolean>} Whether prefetch was successful
   */
  async prefetchSearch(query) {
    if (!query || query.length < 3) {
      return false;
    }
    
    try {
      // Fetch search results
      const searchResults = await this._fetchSearchResults(query);
      
      // Prefetch metadata for search results
      searchResults.forEach((item, index) => {
        // Prefetch first 3 items with medium priority, rest with low priority
        const priority = index < 3 ? PREFETCH_PRIORITY.MEDIUM : PREFETCH_PRIORITY.LOW;
        
        this.prefetchItem(item, PREFETCH_TYPES.METADATA, priority);
        this.prefetchItem(item, PREFETCH_TYPES.THUMBNAIL, priority);
      });
      
      return true;
    } catch (error) {
      console.error(`[Prefetch] Failed to prefetch search results for "${query}":`, error);
      return false;
    }
  }
  
  /**
   * Pause prefetching
   */
  pausePrefetching() {
    this.isPaused = true;
  }
  
  /**
   * Resume prefetching
   */
  resumePrefetching() {
    this.isPaused = false;
    
    // Resume processing queue
    if (this.prefetchQueue.length > 0 && !this.isProcessing) {
      this.processPrefetchQueue();
    }
  }
  
  /**
   * Clear prefetch queue
   */
  clearPrefetchQueue() {
    this.prefetchQueue = [];
  }
  
  /**
   * Update user behavior model
   * @param {Object} data - User behavior data
   */
  updateUserBehaviorModel(data) {
    if (!data) {
      return;
    }
    
    // Update watch history
    if (data.watchItem) {
      // Add to watch history (limit to 20 items)
      this.userBehaviorModel.watchHistory = [
        data.watchItem,
        ...this.userBehaviorModel.watchHistory.filter(item => item.id !== data.watchItem.id)
      ].slice(0, 20);
      
      // Update genre preferences
      if (data.watchItem.genres) {
        data.watchItem.genres.forEach(genre => {
          this.userBehaviorModel.genres[genre] = (this.userBehaviorModel.genres[genre] || 0) + 1;
        });
      }
      
      // Update actor preferences
      if (data.watchItem.actors) {
        data.watchItem.actors.forEach(actor => {
          this.userBehaviorModel.actors[actor] = (this.userBehaviorModel.actors[actor] || 0) + 1;
        });
      }
      
      // Update director preferences
      if (data.watchItem.director) {
        this.userBehaviorModel.directors[data.watchItem.director] = 
          (this.userBehaviorModel.directors[data.watchItem.director] || 0) + 1;
      }
      
      // Update time of day preferences
      const hour = new Date().getHours();
      const timeSlot = Math.floor(hour / 4); // 0-5 (0-3, 4-7, 8-11, 12-15, 16-19, 20-23)
      
      this.userBehaviorModel.timeOfDay[timeSlot] = 
        (this.userBehaviorModel.timeOfDay[timeSlot] || 0) + 1;
      
      // Update day of week preferences
      const dayOfWeek = new Date().getDay(); // 0-6 (Sunday-Saturday)
      
      this.userBehaviorModel.dayOfWeek[dayOfWeek] = 
        (this.userBehaviorModel.dayOfWeek[dayOfWeek] || 0) + 1;
    }
    
    // Save user behavior model to localStorage
    try {
      localStorage.setItem('movo_user_behavior_model', JSON.stringify(this.userBehaviorModel));
    } catch (error) {
      console.error('Failed to save user behavior model', error);
    }
    
    // Use model to prefetch recommended content
    this._prefetchRecommendedContent();
  }
  
  /**
   * Prefetch metadata
   * @private
   * @param {Object} item - Item to prefetch metadata for
   * @returns {Promise<Object>} Metadata
   */
  async _prefetchMetadata(item) {
    try {
      const response = await fetchWithErrorHandling(`/api/metadata/${item.id}`);
      return response;
    } catch (error) {
      console.error(`[Prefetch] Failed to prefetch metadata for ${item.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Prefetch image
   * @private
   * @param {string} url - Image URL
   * @returns {Promise<boolean>} Whether prefetch was successful
   */
  async _prefetchImage(url) {
    if (!url) {
      return false;
    }
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve(true);
      };
      
      img.onerror = (error) => {
        reject(error);
      };
      
      img.src = url;
    });
  }
  
  /**
   * Prefetch video
   * @private
   * @param {string} url - Video URL
   * @param {boolean} metadataOnly - Whether to prefetch only metadata
   * @returns {Promise<boolean>} Whether prefetch was successful
   */
  async _prefetchVideo(url, metadataOnly = true) {
    if (!url) {
      return false;
    }
    
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      
      video.preload = metadataOnly ? 'metadata' : 'auto';
      
      video.onloadedmetadata = () => {
        if (metadataOnly) {
          video.src = '';
          resolve(true);
        }
      };
      
      video.oncanplaythrough = () => {
        video.src = '';
        resolve(true);
      };
      
      video.onerror = (error) => {
        reject(error);
      };
      
      video.src = url;
    });
  }
  
  /**
   * Prefetch subtitles
   * @private
   * @param {Object} item - Item to prefetch subtitles for
   * @returns {Promise<Object>} Subtitles
   */
  async _prefetchSubtitles(item) {
    try {
      const response = await fetchWithErrorHandling(`/api/subtitles/${item.id}`);
      return response;
    } catch (error) {
      console.error(`[Prefetch] Failed to prefetch subtitles for ${item.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Prefetch media info
   * @private
   * @param {Object} item - Item to prefetch media info for
   * @returns {Promise<Object>} Media info
   */
  async _prefetchMediaInfo(item) {
    try {
      const response = await fetchWithErrorHandling(`/api/media/${item.id}/info`);
      return response;
    } catch (error) {
      console.error(`[Prefetch] Failed to prefetch media info for ${item.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Fetch related items
   * @private
   * @param {Object} item - Item to fetch related items for
   * @returns {Promise<Array>} Related items
   */
  async _fetchRelatedItems(item) {
    try {
      const response = await fetchWithErrorHandling(`/api/related/${item.id}`);
      return response.items || [];
    } catch (error) {
      console.error(`[Prefetch] Failed to fetch related items for ${item.id}:`, error);
      return [];
    }
  }
  
  /**
   * Fetch up next items
   * @private
   * @param {Object} item - Item to fetch up next items for
   * @returns {Promise<Array>} Up next items
   */
  async _fetchUpNextItems(item) {
    try {
      const response = await fetchWithErrorHandling(`/api/upnext/${item.id}`);
      return response.items || [];
    } catch (error) {
      console.error(`[Prefetch] Failed to fetch up next items for ${item.id}:`, error);
      return [];
    }
  }
  
  /**
   * Fetch search results
   * @private
   * @param {string} query - Search query
   * @returns {Promise<Array>} Search results
   */
  async _fetchSearchResults(query) {
    try {
      const response = await fetchWithErrorHandling(`/api/search?q=${encodeURIComponent(query)}`);
      return response.results || [];
    } catch (error) {
      console.error(`[Prefetch] Failed to fetch search results for "${query}":`, error);
      return [];
    }
  }
  
  /**
   * Prefetch recommended content based on user behavior model
   * @private
   */
  async _prefetchRecommendedContent() {
    try {
      // Get top genres
      const topGenres = Object.entries(this.userBehaviorModel.genres)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genre]) => genre);
      
      // Get top actors
      const topActors = Object.entries(this.userBehaviorModel.actors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([actor]) => actor);
      
      // Get top directors
      const topDirectors = Object.entries(this.userBehaviorModel.directors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([director]) => director);
      
      // Fetch recommended content
      const recommendedItems = await this._fetchRecommendedItems({
        genres: topGenres,
        actors: topActors,
        directors: topDirectors
      });
      
      // Prefetch metadata for recommended items
      recommendedItems.forEach((item, index) => {
        const priority = index < 5 ? PREFETCH_PRIORITY.MEDIUM : PREFETCH_PRIORITY.LOW;
        
        this.prefetchItem(item, PREFETCH_TYPES.METADATA, priority);
        this.prefetchItem(item, PREFETCH_TYPES.THUMBNAIL, priority);
      });
    } catch (error) {
      console.error('[Prefetch] Failed to prefetch recommended content:', error);
    }
  }
  
  /**
   * Fetch recommended items
   * @private
   * @param {Object} preferences - User preferences
   * @returns {Promise<Array>} Recommended items
   */
  async _fetchRecommendedItems(preferences) {
    try {
      const response = await fetchWithErrorHandling('/api/recommendations', {
        method: 'POST',
        body: JSON.stringify(preferences)
      });
      
      return response.items || [];
    } catch (error) {
      console.error('[Prefetch] Failed to fetch recommended items:', error);
      return [];
    }
  }
}

// Create singleton instance
const prefetchService = new PrefetchService();

export default prefetchService;
export { PREFETCH_PRIORITY, PREFETCH_TYPES };
