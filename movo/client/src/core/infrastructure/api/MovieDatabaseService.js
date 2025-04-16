/**
 * Movie Database Service for Movo
 * Provides access to movie and TV show information
 * 
 * @author zophlic
 */

import loggingService from '../logging/LoggingService';
import telemetryService from '../telemetry/TelemetryService';
import configService from '../config/ConfigService';

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
    this.cacheExpiration = 30 * 60 * 1000; // 30 minutes
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.searchMovies = this.searchMovies.bind(this);
    this.searchTvShows = this.searchTvShows.bind(this);
    this.getMovieDetails = this.getMovieDetails.bind(this);
    this.getTvShowDetails = this.getTvShowDetails.bind(this);
    this.getPopularMovies = this.getPopularMovies.bind(this);
    this.getPopularTvShows = this.getPopularTvShows.bind(this);
    this.getTrendingContent = this.getTrendingContent.bind(this);
    this.getRecommendations = this.getRecommendations.bind(this);
    this.getImageUrl = this.getImageUrl.bind(this);
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize movie database service
   */
  async initialize() {
    loggingService.info('Initializing movie database service');
    
    try {
      // Get configuration from API
      const config = await this._fetchFromApi('/configuration');
      
      if (config && config.images) {
        this.imageBaseUrl = config.images.secure_base_url || this.imageBaseUrl;
        this.imageSizes = config.images.poster_sizes || ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'];
        this.backdropSizes = config.images.backdrop_sizes || ['w300', 'w780', 'w1280', 'original'];
        this.profileSizes = config.images.profile_sizes || ['w45', 'w185', 'h632', 'original'];
      }
      
      // Track event
      telemetryService.trackEvent('api', 'initialize_movie_db', {
        success: true
      });
      
      loggingService.info('Movie database service initialized');
    } catch (error) {
      loggingService.error('Failed to initialize movie database service', { error });
      
      // Track event
      telemetryService.trackEvent('api', 'initialize_movie_db', {
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Search for movies
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {number} options.page - Page number
   * @param {string} options.language - Language code
   * @param {boolean} options.includeAdult - Include adult content
   * @param {string} options.region - Region code
   * @param {number} options.year - Primary release year
   * @returns {Promise<Object>} Search results
   */
  async searchMovies(query, options = {}) {
    loggingService.info('Searching for movies', { query, options });
    
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
      
      // Track event
      telemetryService.trackEvent('api', 'search_movies', {
        query,
        resultsCount: results.total_results
      });
      
      return results;
    } catch (error) {
      loggingService.error('Failed to search for movies', { error, query });
      throw error;
    }
  }
  
  /**
   * Search for TV shows
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {number} options.page - Page number
   * @param {string} options.language - Language code
   * @param {boolean} options.includeAdult - Include adult content
   * @param {string} options.firstAirDateYear - First air date year
   * @returns {Promise<Object>} Search results
   */
  async searchTvShows(query, options = {}) {
    loggingService.info('Searching for TV shows', { query, options });
    
    try {
      const params = {
        query,
        page: options.page || 1,
        language: options.language || this.language,
        include_adult: options.includeAdult || false,
        first_air_date_year: options.firstAirDateYear
      };
      
      const results = await this._fetchFromApi('/search/tv', params);
      
      // Track event
      telemetryService.trackEvent('api', 'search_tv_shows', {
        query,
        resultsCount: results.total_results
      });
      
      return results;
    } catch (error) {
      loggingService.error('Failed to search for TV shows', { error, query });
      throw error;
    }
  }
  
  /**
   * Get movie details
   * @param {number} movieId - Movie ID
   * @param {Object} options - Options
   * @param {string} options.language - Language code
   * @param {string} options.appendToResponse - Additional data to append to response
   * @returns {Promise<Object>} Movie details
   */
  async getMovieDetails(movieId, options = {}) {
    loggingService.info('Getting movie details', { movieId, options });
    
    try {
      const params = {
        language: options.language || this.language,
        append_to_response: options.appendToResponse || 'credits,videos,images,recommendations,similar'
      };
      
      const results = await this._fetchFromApi(`/movie/${movieId}`, params);
      
      // Track event
      telemetryService.trackEvent('api', 'get_movie_details', {
        movieId,
        title: results.title
      });
      
      return results;
    } catch (error) {
      loggingService.error('Failed to get movie details', { error, movieId });
      throw error;
    }
  }
  
  /**
   * Get TV show details
   * @param {number} tvShowId - TV show ID
   * @param {Object} options - Options
   * @param {string} options.language - Language code
   * @param {string} options.appendToResponse - Additional data to append to response
   * @returns {Promise<Object>} TV show details
   */
  async getTvShowDetails(tvShowId, options = {}) {
    loggingService.info('Getting TV show details', { tvShowId, options });
    
    try {
      const params = {
        language: options.language || this.language,
        append_to_response: options.appendToResponse || 'credits,videos,images,recommendations,similar'
      };
      
      const results = await this._fetchFromApi(`/tv/${tvShowId}`, params);
      
      // Track event
      telemetryService.trackEvent('api', 'get_tv_show_details', {
        tvShowId,
        name: results.name
      });
      
      return results;
    } catch (error) {
      loggingService.error('Failed to get TV show details', { error, tvShowId });
      throw error;
    }
  }
  
  /**
   * Get popular movies
   * @param {Object} options - Options
   * @param {number} options.page - Page number
   * @param {string} options.language - Language code
   * @param {string} options.region - Region code
   * @returns {Promise<Object>} Popular movies
   */
  async getPopularMovies(options = {}) {
    loggingService.info('Getting popular movies', { options });
    
    try {
      const params = {
        page: options.page || 1,
        language: options.language || this.language,
        region: options.region
      };
      
      const results = await this._fetchFromApi('/movie/popular', params);
      
      // Track event
      telemetryService.trackEvent('api', 'get_popular_movies', {
        page: params.page,
        resultsCount: results.results.length
      });
      
      return results;
    } catch (error) {
      loggingService.error('Failed to get popular movies', { error });
      throw error;
    }
  }
  
  /**
   * Get popular TV shows
   * @param {Object} options - Options
   * @param {number} options.page - Page number
   * @param {string} options.language - Language code
   * @returns {Promise<Object>} Popular TV shows
   */
  async getPopularTvShows(options = {}) {
    loggingService.info('Getting popular TV shows', { options });
    
    try {
      const params = {
        page: options.page || 1,
        language: options.language || this.language
      };
      
      const results = await this._fetchFromApi('/tv/popular', params);
      
      // Track event
      telemetryService.trackEvent('api', 'get_popular_tv_shows', {
        page: params.page,
        resultsCount: results.results.length
      });
      
      return results;
    } catch (error) {
      loggingService.error('Failed to get popular TV shows', { error });
      throw error;
    }
  }
  
  /**
   * Get trending content
   * @param {string} mediaType - Media type (all, movie, tv, person)
   * @param {string} timeWindow - Time window (day, week)
   * @param {Object} options - Options
   * @param {number} options.page - Page number
   * @param {string} options.language - Language code
   * @returns {Promise<Object>} Trending content
   */
  async getTrendingContent(mediaType = 'all', timeWindow = 'week', options = {}) {
    loggingService.info('Getting trending content', { mediaType, timeWindow, options });
    
    try {
      const params = {
        page: options.page || 1,
        language: options.language || this.language
      };
      
      const results = await this._fetchFromApi(`/trending/${mediaType}/${timeWindow}`, params);
      
      // Track event
      telemetryService.trackEvent('api', 'get_trending_content', {
        mediaType,
        timeWindow,
        page: params.page,
        resultsCount: results.results.length
      });
      
      return results;
    } catch (error) {
      loggingService.error('Failed to get trending content', { error, mediaType, timeWindow });
      throw error;
    }
  }
  
  /**
   * Get recommendations
   * @param {string} mediaType - Media type (movie, tv)
   * @param {number} id - Media ID
   * @param {Object} options - Options
   * @param {number} options.page - Page number
   * @param {string} options.language - Language code
   * @returns {Promise<Object>} Recommendations
   */
  async getRecommendations(mediaType, id, options = {}) {
    loggingService.info('Getting recommendations', { mediaType, id, options });
    
    try {
      const params = {
        page: options.page || 1,
        language: options.language || this.language
      };
      
      const results = await this._fetchFromApi(`/${mediaType}/${id}/recommendations`, params);
      
      // Track event
      telemetryService.trackEvent('api', 'get_recommendations', {
        mediaType,
        id,
        page: params.page,
        resultsCount: results.results.length
      });
      
      return results;
    } catch (error) {
      loggingService.error('Failed to get recommendations', { error, mediaType, id });
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
}

// Create singleton instance
const movieDatabaseService = new MovieDatabaseService();

export default movieDatabaseService;
