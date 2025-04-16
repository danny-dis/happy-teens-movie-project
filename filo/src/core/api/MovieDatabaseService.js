/**
 * Movie Database Service for Filo
 * Provides access to movie and TV show information
 * 
 * @author zophlic
 */

/**
 * Movie Database Service class
 */
class MovieDatabaseService {
  constructor() {
    // API configuration
    this.apiKey = '24591ce8a9f0a35e1e9d6aa8f93ab04e';
    this.baseUrl = 'https://api.themoviedb.org/3';
    this.imageBaseUrl = 'https://image.tmdb.org/t/p';
    this.language = 'en-US';
    
    // Cache configuration
    this.cache = new Map();
    this.cacheExpiration = 60 * 60 * 1000; // 1 hour (longer for Filo since it's more offline-focused)
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize movie database service
   */
  async initialize() {
    console.info('Initializing movie database service');
    
    try {
      // Get configuration from API
      const config = await this._fetchFromApi('/configuration');
      
      if (config && config.images) {
        this.imageBaseUrl = config.images.secure_base_url || this.imageBaseUrl;
        this.imageSizes = config.images.poster_sizes || ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'];
        this.backdropSizes = config.images.backdrop_sizes || ['w300', 'w780', 'w1280', 'original'];
        this.profileSizes = config.images.profile_sizes || ['w45', 'w185', 'h632', 'original'];
      }
      
      console.info('Movie database service initialized');
      
      // Save configuration to local storage for offline use
      this._saveConfigToLocalStorage(config);
    } catch (error) {
      console.error('Failed to initialize movie database service', error);
      
      // Try to load configuration from local storage
      this._loadConfigFromLocalStorage();
    }
  }
  
  /**
   * Search for movies
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchMovies(query, options = {}) {
    console.info('Searching for movies', { query, options });
    
    try {
      const params = {
        query,
        page: options.page || 1,
        language: options.language || this.language,
        include_adult: options.includeAdult || false,
        region: options.region,
        year: options.year
      };
      
      const results = await this._fetchFromApi('/search/movie', params);
      
      // Save results to local storage for offline use
      this._saveToLocalStorage(`search_movies_${query}_${params.page}`, results);
      
      return results;
    } catch (error) {
      console.error('Failed to search for movies', error);
      
      // Try to load results from local storage
      const cachedResults = this._loadFromLocalStorage(`search_movies_${query}_${options.page || 1}`);
      if (cachedResults) {
        return cachedResults;
      }
      
      throw error;
    }
  }
  
  /**
   * Search for TV shows
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchTvShows(query, options = {}) {
    console.info('Searching for TV shows', { query, options });
    
    try {
      const params = {
        query,
        page: options.page || 1,
        language: options.language || this.language,
        include_adult: options.includeAdult || false,
        first_air_date_year: options.firstAirDateYear
      };
      
      const results = await this._fetchFromApi('/search/tv', params);
      
      // Save results to local storage for offline use
      this._saveToLocalStorage(`search_tv_${query}_${params.page}`, results);
      
      return results;
    } catch (error) {
      console.error('Failed to search for TV shows', error);
      
      // Try to load results from local storage
      const cachedResults = this._loadFromLocalStorage(`search_tv_${query}_${options.page || 1}`);
      if (cachedResults) {
        return cachedResults;
      }
      
      throw error;
    }
  }
  
  /**
   * Get movie details
   * @param {number} movieId - Movie ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Movie details
   */
  async getMovieDetails(movieId, options = {}) {
    console.info('Getting movie details', { movieId, options });
    
    try {
      const params = {
        language: options.language || this.language,
        append_to_response: options.appendToResponse || 'credits,videos,images,recommendations,similar'
      };
      
      const results = await this._fetchFromApi(`/movie/${movieId}`, params);
      
      // Save results to local storage for offline use
      this._saveToLocalStorage(`movie_${movieId}`, results);
      
      return results;
    } catch (error) {
      console.error('Failed to get movie details', error);
      
      // Try to load results from local storage
      const cachedResults = this._loadFromLocalStorage(`movie_${movieId}`);
      if (cachedResults) {
        return cachedResults;
      }
      
      throw error;
    }
  }
  
  /**
   * Get TV show details
   * @param {number} tvShowId - TV show ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} TV show details
   */
  async getTvShowDetails(tvShowId, options = {}) {
    console.info('Getting TV show details', { tvShowId, options });
    
    try {
      const params = {
        language: options.language || this.language,
        append_to_response: options.appendToResponse || 'credits,videos,images,recommendations,similar'
      };
      
      const results = await this._fetchFromApi(`/tv/${tvShowId}`, params);
      
      // Save results to local storage for offline use
      this._saveToLocalStorage(`tv_${tvShowId}`, results);
      
      return results;
    } catch (error) {
      console.error('Failed to get TV show details', error);
      
      // Try to load results from local storage
      const cachedResults = this._loadFromLocalStorage(`tv_${tvShowId}`);
      if (cachedResults) {
        return cachedResults;
      }
      
      throw error;
    }
  }
  
  /**
   * Get popular movies
   * @param {Object} options - Options
   * @returns {Promise<Object>} Popular movies
   */
  async getPopularMovies(options = {}) {
    console.info('Getting popular movies', { options });
    
    try {
      const params = {
        page: options.page || 1,
        language: options.language || this.language,
        region: options.region
      };
      
      const results = await this._fetchFromApi('/movie/popular', params);
      
      // Save results to local storage for offline use
      this._saveToLocalStorage(`popular_movies_${params.page}`, results);
      
      return results;
    } catch (error) {
      console.error('Failed to get popular movies', error);
      
      // Try to load results from local storage
      const cachedResults = this._loadFromLocalStorage(`popular_movies_${options.page || 1}`);
      if (cachedResults) {
        return cachedResults;
      }
      
      throw error;
    }
  }
  
  /**
   * Get popular TV shows
   * @param {Object} options - Options
   * @returns {Promise<Object>} Popular TV shows
   */
  async getPopularTvShows(options = {}) {
    console.info('Getting popular TV shows', { options });
    
    try {
      const params = {
        page: options.page || 1,
        language: options.language || this.language
      };
      
      const results = await this._fetchFromApi('/tv/popular', params);
      
      // Save results to local storage for offline use
      this._saveToLocalStorage(`popular_tv_${params.page}`, results);
      
      return results;
    } catch (error) {
      console.error('Failed to get popular TV shows', error);
      
      // Try to load results from local storage
      const cachedResults = this._loadFromLocalStorage(`popular_tv_${options.page || 1}`);
      if (cachedResults) {
        return cachedResults;
      }
      
      throw error;
    }
  }
  
  /**
   * Get trending content
   * @param {string} mediaType - Media type (all, movie, tv, person)
   * @param {string} timeWindow - Time window (day, week)
   * @param {Object} options - Options
   * @returns {Promise<Object>} Trending content
   */
  async getTrendingContent(mediaType = 'all', timeWindow = 'week', options = {}) {
    console.info('Getting trending content', { mediaType, timeWindow, options });
    
    try {
      const params = {
        page: options.page || 1,
        language: options.language || this.language
      };
      
      const results = await this._fetchFromApi(`/trending/${mediaType}/${timeWindow}`, params);
      
      // Save results to local storage for offline use
      this._saveToLocalStorage(`trending_${mediaType}_${timeWindow}_${params.page}`, results);
      
      return results;
    } catch (error) {
      console.error('Failed to get trending content', error);
      
      // Try to load results from local storage
      const cachedResults = this._loadFromLocalStorage(`trending_${mediaType}_${timeWindow}_${options.page || 1}`);
      if (cachedResults) {
        return cachedResults;
      }
      
      throw error;
    }
  }
  
  /**
   * Get recommendations
   * @param {string} mediaType - Media type (movie, tv)
   * @param {number} id - Media ID
   * @param {Object} options - Options
   * @returns {Promise<Object>} Recommendations
   */
  async getRecommendations(mediaType, id, options = {}) {
    console.info('Getting recommendations', { mediaType, id, options });
    
    try {
      const params = {
        page: options.page || 1,
        language: options.language || this.language
      };
      
      const results = await this._fetchFromApi(`/${mediaType}/${id}/recommendations`, params);
      
      // Save results to local storage for offline use
      this._saveToLocalStorage(`recommendations_${mediaType}_${id}_${params.page}`, results);
      
      return results;
    } catch (error) {
      console.error('Failed to get recommendations', error);
      
      // Try to load results from local storage
      const cachedResults = this._loadFromLocalStorage(`recommendations_${mediaType}_${id}_${options.page || 1}`);
      if (cachedResults) {
        return cachedResults;
      }
      
      throw error;
    }
  }
  
  /**
   * Get image URL
   * @param {string} path - Image path
   * @param {string} size - Image size
   * @param {string} type - Image type (poster, backdrop, profile)
   * @returns {string} Image URL
   */
  getImageUrl(path, size, type = 'poster') {
    if (!path) {
      return null;
    }
    
    let sizeToUse = size;
    
    // Get appropriate size based on type
    if (!sizeToUse) {
      switch (type) {
        case 'backdrop':
          sizeToUse = this.backdropSizes ? this.backdropSizes[1] : 'w780';
          break;
        case 'profile':
          sizeToUse = this.profileSizes ? this.profileSizes[1] : 'w185';
          break;
        case 'poster':
        default:
          sizeToUse = this.imageSizes ? this.imageSizes[3] : 'w342';
      }
    }
    
    return `${this.imageBaseUrl}/${sizeToUse}${path}`;
  }
  
  /**
   * Download image for offline use
   * @param {string} path - Image path
   * @param {string} size - Image size
   * @param {string} type - Image type (poster, backdrop, profile)
   * @returns {Promise<string>} Local image URL
   */
  async downloadImage(path, size, type = 'poster') {
    if (!path) {
      return null;
    }
    
    const imageUrl = this.getImageUrl(path, size, type);
    const storageKey = `image_${path.replace(/\//g, '_')}_${size}`;
    
    // Check if image is already downloaded
    const cachedImage = this._loadFromLocalStorage(storageKey);
    if (cachedImage) {
      return cachedImage;
    }
    
    try {
      // Fetch image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Convert to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result;
          
          // Save to local storage
          this._saveToLocalStorage(storageKey, base64data);
          
          resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to download image', error);
      return imageUrl; // Fall back to online URL
    }
  }
  
  /**
   * Fetch data from API
   * @private
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response
   */
  async _fetchFromApi(endpoint, params = {}) {
    // Build URL
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add API key
    url.searchParams.append('api_key', this.apiKey);
    
    // Add other parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
    
    // Generate cache key
    const cacheKey = url.toString();
    
    // Check cache
    const cachedData = this._getFromCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    
    // Fetch data
    const response = await fetch(url.toString());
    
    // Check for errors
    if (!response.ok) {
      const error = await response.json().catch(() => ({ status_message: response.statusText }));
      throw new Error(error.status_message || `API request failed with status ${response.status}`);
    }
    
    // Parse response
    const data = await response.json();
    
    // Cache data
    this._addToCache(cacheKey, data);
    
    return data;
  }
  
  /**
   * Get data from cache
   * @private
   * @param {string} key - Cache key
   * @returns {Object|null} Cached data
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() < cached.expiration) {
      return cached.data;
    }
    
    return null;
  }
  
  /**
   * Add data to cache
   * @private
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  _addToCache(key, data) {
    this.cache.set(key, {
      data,
      expiration: Date.now() + this.cacheExpiration
    });
    
    // Clean up cache if it gets too large
    if (this.cache.size > 1000) {
      this._cleanCache();
    }
  }
  
  /**
   * Clean cache
   * @private
   */
  _cleanCache() {
    const now = Date.now();
    
    // Remove expired entries
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiration) {
        this.cache.delete(key);
      }
    }
    
    // If still too large, remove oldest entries
    if (this.cache.size > 500) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].expiration - b[1].expiration);
      
      // Remove oldest half
      const toRemove = Math.floor(entries.length / 2);
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }
  
  /**
   * Save configuration to local storage
   * @private
   * @param {Object} config - Configuration object
   */
  _saveConfigToLocalStorage(config) {
    try {
      localStorage.setItem('movie_db_config', JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save configuration to local storage', error);
    }
  }
  
  /**
   * Load configuration from local storage
   * @private
   */
  _loadConfigFromLocalStorage() {
    try {
      const config = JSON.parse(localStorage.getItem('movie_db_config'));
      
      if (config && config.images) {
        this.imageBaseUrl = config.images.secure_base_url || this.imageBaseUrl;
        this.imageSizes = config.images.poster_sizes || ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'];
        this.backdropSizes = config.images.backdrop_sizes || ['w300', 'w780', 'w1280', 'original'];
        this.profileSizes = config.images.profile_sizes || ['w45', 'w185', 'h632', 'original'];
      }
    } catch (error) {
      console.error('Failed to load configuration from local storage', error);
    }
  }
  
  /**
   * Save data to local storage
   * @private
   * @param {string} key - Storage key
   * @param {Object} data - Data to save
   */
  _saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(`movie_db_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to save data to local storage', error);
      
      // If storage is full, clear old items
      this._cleanLocalStorage();
      
      // Try again
      try {
        localStorage.setItem(`movie_db_${key}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (retryError) {
        console.error('Failed to save data to local storage after cleanup', retryError);
      }
    }
  }
  
  /**
   * Load data from local storage
   * @private
   * @param {string} key - Storage key
   * @returns {Object|null} Loaded data
   */
  _loadFromLocalStorage(key) {
    try {
      const item = localStorage.getItem(`movie_db_${key}`);
      
      if (!item) {
        return null;
      }
      
      const { data, timestamp } = JSON.parse(item);
      
      // Check if data is expired (7 days)
      if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(`movie_db_${key}`);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to load data from local storage', error);
      return null;
    }
  }
  
  /**
   * Clean local storage
   * @private
   */
  _cleanLocalStorage() {
    try {
      // Get all keys
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('movie_db_')) {
          keys.push(key);
        }
      }
      
      // Sort by timestamp
      keys.sort((a, b) => {
        const itemA = JSON.parse(localStorage.getItem(a));
        const itemB = JSON.parse(localStorage.getItem(b));
        return itemA.timestamp - itemB.timestamp;
      });
      
      // Remove oldest half
      const toRemove = Math.floor(keys.length / 2);
      for (let i = 0; i < toRemove; i++) {
        localStorage.removeItem(keys[i]);
      }
    } catch (error) {
      console.error('Failed to clean local storage', error);
      
      // If all else fails, clear all movie_db items
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key.startsWith('movie_db_')) {
          localStorage.removeItem(key);
        }
      }
    }
  }
}

// Create singleton instance
const movieDatabaseService = new MovieDatabaseService();

export default movieDatabaseService;
