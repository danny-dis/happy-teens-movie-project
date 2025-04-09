/**
 * Domain Models for Movo
 * Contains the core business entities and value objects
 * 
 * @author zophlic
 */

/**
 * Media entity representing a movie or TV show
 */
export class Media {
  constructor({
    id,
    title,
    description,
    type,
    genres = [],
    releaseDate,
    duration,
    posterUrl,
    backdropUrl,
    trailerUrl,
    rating,
    cast = [],
    director,
    isDownloaded = false,
    isNew = false,
    streamingSources = []
  }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.type = type; // 'movie' or 'tvShow'
    this.genres = genres;
    this.releaseDate = releaseDate;
    this.duration = duration;
    this.posterUrl = posterUrl;
    this.backdropUrl = backdropUrl;
    this.trailerUrl = trailerUrl;
    this.rating = rating;
    this.cast = cast;
    this.director = director;
    this.isDownloaded = isDownloaded;
    this.isNew = isNew;
    this.streamingSources = streamingSources;
  }

  /**
   * Get the release year
   * @returns {number|null} Release year
   */
  get releaseYear() {
    if (!this.releaseDate) return null;
    return new Date(this.releaseDate).getFullYear();
  }

  /**
   * Check if media is available for streaming
   * @returns {boolean} Whether media is available for streaming
   */
  get isStreamable() {
    return this.streamingSources.length > 0;
  }

  /**
   * Get formatted duration (e.g., "2h 15m")
   * @returns {string} Formatted duration
   */
  get formattedDuration() {
    if (!this.duration) return '';
    
    const hours = Math.floor(this.duration / 60);
    const minutes = this.duration % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
    }
    
    return `${minutes}m`;
  }

  /**
   * Create Media instance from API response
   * @param {Object} data - API response data
   * @returns {Media} Media instance
   */
  static fromApiResponse(data) {
    return new Media({
      id: data.id,
      title: data.title,
      description: data.overview || data.description,
      type: data.media_type || 'movie',
      genres: data.genres?.map(g => g.name) || [],
      releaseDate: data.release_date || data.first_air_date,
      duration: data.runtime || data.episode_run_time?.[0],
      posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
      backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
      trailerUrl: data.videos?.results?.find(v => v.type === 'Trailer')?.key 
        ? `https://www.youtube.com/watch?v=${data.videos.results.find(v => v.type === 'Trailer').key}` 
        : null,
      rating: data.vote_average,
      cast: data.credits?.cast?.map(c => c.name) || [],
      director: data.credits?.crew?.find(c => c.job === 'Director')?.name,
      isDownloaded: data.is_downloaded || false,
      isNew: data.is_new || false,
      streamingSources: data.streaming_sources || []
    });
  }
}

/**
 * User entity representing a user of the application
 */
export class User {
  constructor({
    id,
    username,
    email,
    profilePicture,
    preferences = {},
    watchlist = [],
    watchHistory = []
  }) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.profilePicture = profilePicture;
    this.preferences = preferences;
    this.watchlist = watchlist;
    this.watchHistory = watchHistory;
  }

  /**
   * Check if media is in watchlist
   * @param {string} mediaId - Media ID
   * @returns {boolean} Whether media is in watchlist
   */
  isInWatchlist(mediaId) {
    return this.watchlist.includes(mediaId);
  }

  /**
   * Check if media has been watched
   * @param {string} mediaId - Media ID
   * @returns {boolean} Whether media has been watched
   */
  hasWatched(mediaId) {
    return this.watchHistory.some(item => item.mediaId === mediaId);
  }

  /**
   * Get watch progress for media
   * @param {string} mediaId - Media ID
   * @returns {Object|null} Watch progress or null if not watched
   */
  getWatchProgress(mediaId) {
    const historyItem = this.watchHistory.find(item => item.mediaId === mediaId);
    return historyItem ? historyItem.progress : null;
  }

  /**
   * Create User instance from API response
   * @param {Object} data - API response data
   * @returns {User} User instance
   */
  static fromApiResponse(data) {
    return new User({
      id: data.id,
      username: data.username,
      email: data.email,
      profilePicture: data.profile_picture,
      preferences: data.preferences || {},
      watchlist: data.watchlist || [],
      watchHistory: data.watch_history || []
    });
  }
}

/**
 * StreamingSession entity representing a streaming session
 */
export class StreamingSession {
  constructor({
    id,
    mediaId,
    userId,
    quality,
    startTime,
    endTime,
    progress,
    source,
    metrics = {}
  }) {
    this.id = id;
    this.mediaId = mediaId;
    this.userId = userId;
    this.quality = quality;
    this.startTime = startTime;
    this.endTime = endTime;
    this.progress = progress;
    this.source = source; // 'local', 'streaming', 'p2p'
    this.metrics = metrics;
  }

  /**
   * Get session duration in seconds
   * @returns {number} Session duration in seconds
   */
  get duration() {
    if (!this.endTime) return 0;
    return (this.endTime - this.startTime) / 1000;
  }

  /**
   * Check if session is active
   * @returns {boolean} Whether session is active
   */
  get isActive() {
    return !this.endTime;
  }

  /**
   * End the session
   * @param {number} progress - Playback progress (0-1)
   */
  end(progress) {
    this.endTime = Date.now();
    this.progress = progress;
  }

  /**
   * Update session metrics
   * @param {Object} metrics - Session metrics
   */
  updateMetrics(metrics) {
    this.metrics = { ...this.metrics, ...metrics };
  }

  /**
   * Create StreamingSession instance from API response
   * @param {Object} data - API response data
   * @returns {StreamingSession} StreamingSession instance
   */
  static fromApiResponse(data) {
    return new StreamingSession({
      id: data.id,
      mediaId: data.media_id,
      userId: data.user_id,
      quality: data.quality,
      startTime: data.start_time,
      endTime: data.end_time,
      progress: data.progress,
      source: data.source,
      metrics: data.metrics || {}
    });
  }
}

/**
 * Value object representing a genre
 */
export class Genre {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }
}

/**
 * Value object representing a person (actor, director, etc.)
 */
export class Person {
  constructor(id, name, role, profileUrl) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.profileUrl = profileUrl;
  }
}

/**
 * Value object representing a streaming source
 */
export class StreamingSource {
  constructor(id, name, url, quality, price = null) {
    this.id = id;
    this.name = name;
    this.url = url;
    this.quality = quality;
    this.price = price;
  }

  /**
   * Check if source is free
   * @returns {boolean} Whether source is free
   */
  get isFree() {
    return this.price === null || this.price === 0;
  }
}

/**
 * Value object representing user preferences
 */
export class UserPreferences {
  constructor({
    theme = 'system',
    subtitlesEnabled = false,
    subtitlesLanguage = 'en',
    autoplayEnabled = true,
    autoplayNextEnabled = true,
    defaultQuality = 'auto',
    defaultAudioLanguage = 'en',
    preferredGenres = []
  }) {
    this.theme = theme;
    this.subtitlesEnabled = subtitlesEnabled;
    this.subtitlesLanguage = subtitlesLanguage;
    this.autoplayEnabled = autoplayEnabled;
    this.autoplayNextEnabled = autoplayNextEnabled;
    this.defaultQuality = defaultQuality;
    this.defaultAudioLanguage = defaultAudioLanguage;
    this.preferredGenres = preferredGenres;
  }

  /**
   * Create UserPreferences instance from API response
   * @param {Object} data - API response data
   * @returns {UserPreferences} UserPreferences instance
   */
  static fromApiResponse(data) {
    return new UserPreferences({
      theme: data.theme || 'system',
      subtitlesEnabled: data.subtitles_enabled || false,
      subtitlesLanguage: data.subtitles_language || 'en',
      autoplayEnabled: data.autoplay_enabled !== false,
      autoplayNextEnabled: data.autoplay_next_enabled !== false,
      defaultQuality: data.default_quality || 'auto',
      defaultAudioLanguage: data.default_audio_language || 'en',
      preferredGenres: data.preferred_genres || []
    });
  }
}

/**
 * Value object representing watch progress
 */
export class WatchProgress {
  constructor(mediaId, position, duration, timestamp, completed = false) {
    this.mediaId = mediaId;
    this.position = position;
    this.duration = duration;
    this.timestamp = timestamp;
    this.completed = completed;
  }

  /**
   * Get progress percentage (0-100)
   * @returns {number} Progress percentage
   */
  get percentage() {
    if (!this.duration) return 0;
    return Math.min(100, Math.round((this.position / this.duration) * 100));
  }

  /**
   * Check if media has been started
   * @returns {boolean} Whether media has been started
   */
  get isStarted() {
    return this.position > 0;
  }

  /**
   * Check if media is in progress (started but not completed)
   * @returns {boolean} Whether media is in progress
   */
  get isInProgress() {
    return this.isStarted && !this.completed;
  }

  /**
   * Create WatchProgress instance from API response
   * @param {Object} data - API response data
   * @returns {WatchProgress} WatchProgress instance
   */
  static fromApiResponse(data) {
    return new WatchProgress(
      data.media_id,
      data.position,
      data.duration,
      data.timestamp,
      data.completed
    );
  }
}

/**
 * Factory for creating domain models
 */
export class ModelFactory {
  /**
   * Create a model instance from API response
   * @param {string} modelName - Model name
   * @param {Object} data - API response data
   * @returns {Object} Model instance
   */
  static create(modelName, data) {
    switch (modelName) {
      case 'Media':
        return Media.fromApiResponse(data);
      case 'User':
        return User.fromApiResponse(data);
      case 'StreamingSession':
        return StreamingSession.fromApiResponse(data);
      case 'UserPreferences':
        return UserPreferences.fromApiResponse(data);
      case 'WatchProgress':
        return WatchProgress.fromApiResponse(data);
      default:
        throw new Error(`Unknown model: ${modelName}`);
    }
  }
}
