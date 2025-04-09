/**
 * Media Repository Implementation for Movo
 * Implements the MediaRepository interface
 * 
 * @author zophlic
 */

import { MediaRepository } from '../../domain/repositories';
import { Media, ModelFactory } from '../../domain/models';
import { fetchWithErrorHandling } from '../errors/ErrorHandlingService';
import configService from '../config/ConfigService';
import loggingService from '../logging/LoggingService';

/**
 * Media repository implementation class
 */
export class MediaRepositoryImpl extends MediaRepository {
  constructor() {
    super();
    this.baseUrl = configService.get('api.baseUrl');
    this.cache = new Map();
    this.cacheTTL = configService.get('api.cacheTTL', 300000); // 5 minutes
  }
  
  /**
   * Get a media by ID
   * @param {string} id - Media ID
   * @returns {Promise<Media>} Media
   */
  async getById(id) {
    try {
      // Check cache
      const cachedMedia = this._getFromCache(`media_${id}`);
      if (cachedMedia) {
        return cachedMedia;
      }
      
      // Fetch from API
      const data = await fetchWithErrorHandling(`${this.baseUrl}/media/${id}`);
      
      // Convert to domain model
      const media = ModelFactory.create('Media', data);
      
      // Cache result
      this._addToCache(`media_${id}`, media);
      
      return media;
    } catch (error) {
      loggingService.error(`Failed to get media by ID: ${id}`, { error });
      throw error;
    }
  }
  
  /**
   * Get all media
   * @param {Object} params - Query parameters
   * @returns {Promise<Media[]>} Media list
   */
  async getAll(params = {}) {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      
      if (params.page) {
        queryParams.append('page', params.page);
      }
      
      if (params.limit) {
        queryParams.append('limit', params.limit);
      }
      
      if (params.sort) {
        queryParams.append('sort', params.sort);
      }
      
      if (params.type) {
        queryParams.append('type', params.type);
      }
      
      const queryString = queryParams.toString();
      const cacheKey = `media_all_${queryString}`;
      
      // Check cache
      const cachedMedia = this._getFromCache(cacheKey);
      if (cachedMedia) {
        return cachedMedia;
      }
      
      // Fetch from API
      const url = `${this.baseUrl}/media${queryString ? `?${queryString}` : ''}`;
      const data = await fetchWithErrorHandling(url);
      
      // Convert to domain models
      const mediaList = data.items.map(item => ModelFactory.create('Media', item));
      
      // Cache result
      this._addToCache(cacheKey, mediaList);
      
      return mediaList;
    } catch (error) {
      loggingService.error('Failed to get all media', { error, params });
      throw error;
    }
  }
  
  /**
   * Search for media
   * @param {string} query - Search query
   * @param {Object} params - Search parameters
   * @returns {Promise<Media[]>} Media results
   */
  async search(query, params = {}) {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      queryParams.append('q', query);
      
      if (params.page) {
        queryParams.append('page', params.page);
      }
      
      if (params.limit) {
        queryParams.append('limit', params.limit);
      }
      
      if (params.type) {
        queryParams.append('type', params.type);
      }
      
      if (params.genre) {
        queryParams.append('genre', params.genre);
      }
      
      const queryString = queryParams.toString();
      const cacheKey = `media_search_${queryString}`;
      
      // Check cache
      const cachedResults = this._getFromCache(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }
      
      // Fetch from API
      const url = `${this.baseUrl}/media/search?${queryString}`;
      const data = await fetchWithErrorHandling(url);
      
      // Convert to domain models
      const mediaList = data.results.map(item => ModelFactory.create('Media', item));
      
      // Cache result
      this._addToCache(cacheKey, mediaList);
      
      return mediaList;
    } catch (error) {
      loggingService.error('Failed to search media', { error, query, params });
      throw error;
    }
  }
  
  /**
   * Get trending media
   * @param {Object} params - Query parameters
   * @returns {Promise<Media[]>} Trending media
   */
  async getTrending(params = {}) {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      
      if (params.page) {
        queryParams.append('page', params.page);
      }
      
      if (params.limit) {
        queryParams.append('limit', params.limit);
      }
      
      if (params.timeWindow) {
        queryParams.append('time_window', params.timeWindow);
      }
      
      if (params.type) {
        queryParams.append('type', params.type);
      }
      
      const queryString = queryParams.toString();
      const cacheKey = `media_trending_${queryString}`;
      
      // Check cache
      const cachedResults = this._getFromCache(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }
      
      // Fetch from API
      const url = `${this.baseUrl}/media/trending${queryString ? `?${queryString}` : ''}`;
      const data = await fetchWithErrorHandling(url);
      
      // Convert to domain models
      const mediaList = data.items.map(item => ModelFactory.create('Media', item));
      
      // Cache result
      this._addToCache(cacheKey, mediaList);
      
      return mediaList;
    } catch (error) {
      loggingService.error('Failed to get trending media', { error, params });
      throw error;
    }
  }
  
  /**
   * Get media by genre
   * @param {string} genreId - Genre ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Media[]>} Media in genre
   */
  async getByGenre(genreId, params = {}) {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      
      if (params.page) {
        queryParams.append('page', params.page);
      }
      
      if (params.limit) {
        queryParams.append('limit', params.limit);
      }
      
      if (params.sort) {
        queryParams.append('sort', params.sort);
      }
      
      if (params.type) {
        queryParams.append('type', params.type);
      }
      
      const queryString = queryParams.toString();
      const cacheKey = `media_genre_${genreId}_${queryString}`;
      
      // Check cache
      const cachedResults = this._getFromCache(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }
      
      // Fetch from API
      const url = `${this.baseUrl}/media/genre/${genreId}${queryString ? `?${queryString}` : ''}`;
      const data = await fetchWithErrorHandling(url);
      
      // Convert to domain models
      const mediaList = data.items.map(item => ModelFactory.create('Media', item));
      
      // Cache result
      this._addToCache(cacheKey, mediaList);
      
      return mediaList;
    } catch (error) {
      loggingService.error('Failed to get media by genre', { error, genreId, params });
      throw error;
    }
  }
  
  /**
   * Get similar media
   * @param {string} mediaId - Media ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Media[]>} Similar media
   */
  async getSimilar(mediaId, params = {}) {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      
      if (params.page) {
        queryParams.append('page', params.page);
      }
      
      if (params.limit) {
        queryParams.append('limit', params.limit);
      }
      
      const queryString = queryParams.toString();
      const cacheKey = `media_similar_${mediaId}_${queryString}`;
      
      // Check cache
      const cachedResults = this._getFromCache(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }
      
      // Fetch from API
      const url = `${this.baseUrl}/media/${mediaId}/similar${queryString ? `?${queryString}` : ''}`;
      const data = await fetchWithErrorHandling(url);
      
      // Convert to domain models
      const mediaList = data.items.map(item => ModelFactory.create('Media', item));
      
      // Cache result
      this._addToCache(cacheKey, mediaList);
      
      return mediaList;
    } catch (error) {
      loggingService.error('Failed to get similar media', { error, mediaId, params });
      throw error;
    }
  }
  
  /**
   * Get media details
   * @param {string} mediaId - Media ID
   * @returns {Promise<Media>} Media details
   */
  async getDetails(mediaId) {
    try {
      // Check cache
      const cacheKey = `media_details_${mediaId}`;
      const cachedDetails = this._getFromCache(cacheKey);
      if (cachedDetails) {
        return cachedDetails;
      }
      
      // Fetch from API
      const url = `${this.baseUrl}/media/${mediaId}/details`;
      const data = await fetchWithErrorHandling(url);
      
      // Convert to domain model
      const media = ModelFactory.create('Media', data);
      
      // Cache result
      this._addToCache(cacheKey, media);
      
      return media;
    } catch (error) {
      loggingService.error('Failed to get media details', { error, mediaId });
      throw error;
    }
  }
  
  /**
   * Get downloaded media
   * @param {Object} params - Query parameters
   * @returns {Promise<Media[]>} Downloaded media
   */
  async getDownloaded(params = {}) {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      
      if (params.page) {
        queryParams.append('page', params.page);
      }
      
      if (params.limit) {
        queryParams.append('limit', params.limit);
      }
      
      if (params.sort) {
        queryParams.append('sort', params.sort);
      }
      
      if (params.type) {
        queryParams.append('type', params.type);
      }
      
      const queryString = queryParams.toString();
      const cacheKey = `media_downloaded_${queryString}`;
      
      // Check cache
      const cachedResults = this._getFromCache(cacheKey);
      if (cachedResults) {
        return cachedResults;
      }
      
      // Fetch from API
      const url = `${this.baseUrl}/media/downloaded${queryString ? `?${queryString}` : ''}`;
      const data = await fetchWithErrorHandling(url);
      
      // Convert to domain models
      const mediaList = data.items.map(item => ModelFactory.create('Media', item));
      
      // Cache result
      this._addToCache(cacheKey, mediaList);
      
      return mediaList;
    } catch (error) {
      loggingService.error('Failed to get downloaded media', { error, params });
      throw error;
    }
  }
  
  /**
   * Create a media
   * @param {Media} media - Media to create
   * @returns {Promise<Media>} Created media
   */
  async create(media) {
    try {
      // Fetch from API
      const url = `${this.baseUrl}/media`;
      const data = await fetchWithErrorHandling(url, {
        method: 'POST',
        body: JSON.stringify(media)
      });
      
      // Convert to domain model
      const createdMedia = ModelFactory.create('Media', data);
      
      // Invalidate cache
      this._invalidateCache(/^media_all/);
      
      return createdMedia;
    } catch (error) {
      loggingService.error('Failed to create media', { error, media });
      throw error;
    }
  }
  
  /**
   * Update a media
   * @param {string} id - Media ID
   * @param {Partial<Media>} media - Media fields to update
   * @returns {Promise<Media>} Updated media
   */
  async update(id, media) {
    try {
      // Fetch from API
      const url = `${this.baseUrl}/media/${id}`;
      const data = await fetchWithErrorHandling(url, {
        method: 'PATCH',
        body: JSON.stringify(media)
      });
      
      // Convert to domain model
      const updatedMedia = ModelFactory.create('Media', data);
      
      // Invalidate cache
      this._invalidateCache(new RegExp(`^media_${id}`));
      this._invalidateCache(/^media_all/);
      
      return updatedMedia;
    } catch (error) {
      loggingService.error('Failed to update media', { error, id, media });
      throw error;
    }
  }
  
  /**
   * Delete a media
   * @param {string} id - Media ID
   * @returns {Promise<boolean>} Whether deletion was successful
   */
  async delete(id) {
    try {
      // Fetch from API
      const url = `${this.baseUrl}/media/${id}`;
      await fetchWithErrorHandling(url, {
        method: 'DELETE'
      });
      
      // Invalidate cache
      this._invalidateCache(new RegExp(`^media_${id}`));
      this._invalidateCache(/^media_all/);
      
      return true;
    } catch (error) {
      loggingService.error('Failed to delete media', { error, id });
      throw error;
    }
  }
  
  /**
   * Get from cache
   * @private
   * @param {string} key - Cache key
   * @returns {any} Cached value or null
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }
  
  /**
   * Add to cache
   * @private
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  _addToCache(key, value) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.cacheTTL
    });
  }
  
  /**
   * Invalidate cache
   * @private
   * @param {RegExp} pattern - Key pattern to invalidate
   */
  _invalidateCache(pattern) {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
const mediaRepository = new MediaRepositoryImpl();

export default mediaRepository;
