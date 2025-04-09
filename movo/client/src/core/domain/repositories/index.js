/**
 * Repository Interfaces for Movo
 * Defines the contracts for data access
 * 
 * @author zophlic
 */

/**
 * Base repository interface
 * @template T
 */
export class Repository {
  /**
   * Get an entity by ID
   * @param {string} id - Entity ID
   * @returns {Promise<T>} Entity
   */
  async getById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Get all entities
   * @param {Object} params - Query parameters
   * @returns {Promise<T[]>} Entities
   */
  async getAll(params) {
    throw new Error('Method not implemented');
  }

  /**
   * Create an entity
   * @param {T} entity - Entity to create
   * @returns {Promise<T>} Created entity
   */
  async create(entity) {
    throw new Error('Method not implemented');
  }

  /**
   * Update an entity
   * @param {string} id - Entity ID
   * @param {Partial<T>} entity - Entity fields to update
   * @returns {Promise<T>} Updated entity
   */
  async update(id, entity) {
    throw new Error('Method not implemented');
  }

  /**
   * Delete an entity
   * @param {string} id - Entity ID
   * @returns {Promise<boolean>} Whether deletion was successful
   */
  async delete(id) {
    throw new Error('Method not implemented');
  }
}

/**
 * Media repository interface
 */
export class MediaRepository extends Repository {
  /**
   * Search for media
   * @param {string} query - Search query
   * @param {Object} params - Search parameters
   * @returns {Promise<import('../models').Media[]>} Media results
   */
  async search(query, params) {
    throw new Error('Method not implemented');
  }

  /**
   * Get trending media
   * @param {Object} params - Query parameters
   * @returns {Promise<import('../models').Media[]>} Trending media
   */
  async getTrending(params) {
    throw new Error('Method not implemented');
  }

  /**
   * Get media by genre
   * @param {string} genreId - Genre ID
   * @param {Object} params - Query parameters
   * @returns {Promise<import('../models').Media[]>} Media in genre
   */
  async getByGenre(genreId, params) {
    throw new Error('Method not implemented');
  }

  /**
   * Get similar media
   * @param {string} mediaId - Media ID
   * @param {Object} params - Query parameters
   * @returns {Promise<import('../models').Media[]>} Similar media
   */
  async getSimilar(mediaId, params) {
    throw new Error('Method not implemented');
  }

  /**
   * Get media details
   * @param {string} mediaId - Media ID
   * @returns {Promise<import('../models').Media>} Media details
   */
  async getDetails(mediaId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get downloaded media
   * @param {Object} params - Query parameters
   * @returns {Promise<import('../models').Media[]>} Downloaded media
   */
  async getDownloaded(params) {
    throw new Error('Method not implemented');
  }
}

/**
 * User repository interface
 */
export class UserRepository extends Repository {
  /**
   * Get current user
   * @returns {Promise<import('../models').User>} Current user
   */
  async getCurrentUser() {
    throw new Error('Method not implemented');
  }

  /**
   * Update user preferences
   * @param {string} userId - User ID
   * @param {import('../models').UserPreferences} preferences - User preferences
   * @returns {Promise<import('../models').User>} Updated user
   */
  async updatePreferences(userId, preferences) {
    throw new Error('Method not implemented');
  }

  /**
   * Add media to watchlist
   * @param {string} userId - User ID
   * @param {string} mediaId - Media ID
   * @returns {Promise<boolean>} Whether addition was successful
   */
  async addToWatchlist(userId, mediaId) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove media from watchlist
   * @param {string} userId - User ID
   * @param {string} mediaId - Media ID
   * @returns {Promise<boolean>} Whether removal was successful
   */
  async removeFromWatchlist(userId, mediaId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get user watchlist
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise<import('../models').Media[]>} Watchlist media
   */
  async getWatchlist(userId, params) {
    throw new Error('Method not implemented');
  }

  /**
   * Get user watch history
   * @param {string} userId - User ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Array<{media: import('../models').Media, progress: import('../models').WatchProgress}>>} Watch history
   */
  async getWatchHistory(userId, params) {
    throw new Error('Method not implemented');
  }

  /**
   * Update watch progress
   * @param {string} userId - User ID
   * @param {import('../models').WatchProgress} progress - Watch progress
   * @returns {Promise<import('../models').WatchProgress>} Updated watch progress
   */
  async updateWatchProgress(userId, progress) {
    throw new Error('Method not implemented');
  }
}

/**
 * Authentication repository interface
 */
export class AuthRepository {
  /**
   * Sign in user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{user: import('../models').User, token: string}>} Authentication result
   */
  async signIn(email, password) {
    throw new Error('Method not implemented');
  }

  /**
   * Sign up user
   * @param {Object} userData - User data
   * @returns {Promise<{user: import('../models').User, token: string}>} Authentication result
   */
  async signUp(userData) {
    throw new Error('Method not implemented');
  }

  /**
   * Sign out user
   * @returns {Promise<boolean>} Whether sign out was successful
   */
  async signOut() {
    throw new Error('Method not implemented');
  }

  /**
   * Refresh authentication token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<{token: string, refreshToken: string}>} New tokens
   */
  async refreshToken(refreshToken) {
    throw new Error('Method not implemented');
  }

  /**
   * Reset password
   * @param {string} email - User email
   * @returns {Promise<boolean>} Whether reset request was successful
   */
  async resetPassword(email) {
    throw new Error('Method not implemented');
  }

  /**
   * Verify email
   * @param {string} token - Verification token
   * @returns {Promise<boolean>} Whether verification was successful
   */
  async verifyEmail(token) {
    throw new Error('Method not implemented');
  }
}

/**
 * Streaming repository interface
 */
export class StreamingRepository {
  /**
   * Get streaming sources for media
   * @param {string} mediaId - Media ID
   * @returns {Promise<import('../models').StreamingSource[]>} Streaming sources
   */
  async getStreamingSources(mediaId) {
    throw new Error('Method not implemented');
  }

  /**
   * Start streaming session
   * @param {string} mediaId - Media ID
   * @param {string} quality - Streaming quality
   * @param {string} source - Streaming source
   * @returns {Promise<import('../models').StreamingSession>} Streaming session
   */
  async startStreamingSession(mediaId, quality, source) {
    throw new Error('Method not implemented');
  }

  /**
   * End streaming session
   * @param {string} sessionId - Session ID
   * @param {number} progress - Playback progress (0-1)
   * @returns {Promise<import('../models').StreamingSession>} Updated streaming session
   */
  async endStreamingSession(sessionId, progress) {
    throw new Error('Method not implemented');
  }

  /**
   * Update streaming session metrics
   * @param {string} sessionId - Session ID
   * @param {Object} metrics - Session metrics
   * @returns {Promise<import('../models').StreamingSession>} Updated streaming session
   */
  async updateSessionMetrics(sessionId, metrics) {
    throw new Error('Method not implemented');
  }

  /**
   * Get streaming URL
   * @param {string} mediaId - Media ID
   * @param {string} quality - Streaming quality
   * @returns {Promise<string>} Streaming URL
   */
  async getStreamingUrl(mediaId, quality) {
    throw new Error('Method not implemented');
  }

  /**
   * Get subtitles
   * @param {string} mediaId - Media ID
   * @param {string} language - Subtitle language
   * @returns {Promise<string>} Subtitle URL
   */
  async getSubtitles(mediaId, language) {
    throw new Error('Method not implemented');
  }
}

/**
 * Download repository interface
 */
export class DownloadRepository {
  /**
   * Start download
   * @param {string} mediaId - Media ID
   * @param {string} quality - Download quality
   * @returns {Promise<{downloadId: string, progress: number}>} Download info
   */
  async startDownload(mediaId, quality) {
    throw new Error('Method not implemented');
  }

  /**
   * Cancel download
   * @param {string} downloadId - Download ID
   * @returns {Promise<boolean>} Whether cancellation was successful
   */
  async cancelDownload(downloadId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get download progress
   * @param {string} downloadId - Download ID
   * @returns {Promise<{progress: number, status: string}>} Download progress
   */
  async getDownloadProgress(downloadId) {
    throw new Error('Method not implemented');
  }

  /**
   * Get all downloads
   * @returns {Promise<Array<{id: string, mediaId: string, progress: number, status: string}>>} Downloads
   */
  async getAllDownloads() {
    throw new Error('Method not implemented');
  }

  /**
   * Delete downloaded media
   * @param {string} mediaId - Media ID
   * @returns {Promise<boolean>} Whether deletion was successful
   */
  async deleteDownloadedMedia(mediaId) {
    throw new Error('Method not implemented');
  }
}

/**
 * Analytics repository interface
 */
export class AnalyticsRepository {
  /**
   * Track event
   * @param {string} eventName - Event name
   * @param {Object} eventData - Event data
   * @returns {Promise<boolean>} Whether tracking was successful
   */
  async trackEvent(eventName, eventData) {
    throw new Error('Method not implemented');
  }

  /**
   * Track page view
   * @param {string} pageName - Page name
   * @param {Object} pageData - Page data
   * @returns {Promise<boolean>} Whether tracking was successful
   */
  async trackPageView(pageName, pageData) {
    throw new Error('Method not implemented');
  }

  /**
   * Track error
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   * @returns {Promise<boolean>} Whether tracking was successful
   */
  async trackError(error, context) {
    throw new Error('Method not implemented');
  }

  /**
   * Track performance metrics
   * @param {Object} metrics - Performance metrics
   * @returns {Promise<boolean>} Whether tracking was successful
   */
  async trackPerformance(metrics) {
    throw new Error('Method not implemented');
  }
}

/**
 * Repository factory
 */
export class RepositoryFactory {
  /**
   * Create a repository instance
   * @param {string} repositoryName - Repository name
   * @returns {Repository} Repository instance
   */
  static create(repositoryName) {
    switch (repositoryName) {
      case 'MediaRepository':
        return new MediaRepository();
      case 'UserRepository':
        return new UserRepository();
      case 'AuthRepository':
        return new AuthRepository();
      case 'StreamingRepository':
        return new StreamingRepository();
      case 'DownloadRepository':
        return new DownloadRepository();
      case 'AnalyticsRepository':
        return new AnalyticsRepository();
      default:
        throw new Error(`Unknown repository: ${repositoryName}`);
    }
  }
}
