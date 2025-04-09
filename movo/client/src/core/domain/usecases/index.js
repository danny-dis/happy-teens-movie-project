/**
 * Use Cases for Movo
 * Contains the application's business logic
 * 
 * @author zophlic
 */

/**
 * Base use case interface
 */
export class UseCase {
  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @returns {Promise<any>} Use case result
   */
  async execute(params) {
    throw new Error('Method not implemented');
  }
}

/**
 * Media use cases
 */
export class GetMediaUseCase extends UseCase {
  /**
   * @param {import('../repositories').MediaRepository} mediaRepository - Media repository
   */
  constructor(mediaRepository) {
    super();
    this.mediaRepository = mediaRepository;
  }

  /**
   * Execute the use case
   * @param {string} mediaId - Media ID
   * @returns {Promise<import('../models').Media>} Media
   */
  async execute(mediaId) {
    return this.mediaRepository.getById(mediaId);
  }
}

export class SearchMediaUseCase extends UseCase {
  /**
   * @param {import('../repositories').MediaRepository} mediaRepository - Media repository
   */
  constructor(mediaRepository) {
    super();
    this.mediaRepository = mediaRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query
   * @param {Object} params.filters - Search filters
   * @returns {Promise<import('../models').Media[]>} Media results
   */
  async execute(params) {
    return this.mediaRepository.search(params.query, params.filters);
  }
}

export class GetTrendingMediaUseCase extends UseCase {
  /**
   * @param {import('../repositories').MediaRepository} mediaRepository - Media repository
   */
  constructor(mediaRepository) {
    super();
    this.mediaRepository = mediaRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Query parameters
   * @returns {Promise<import('../models').Media[]>} Trending media
   */
  async execute(params) {
    return this.mediaRepository.getTrending(params);
  }
}

export class GetMediaByGenreUseCase extends UseCase {
  /**
   * @param {import('../repositories').MediaRepository} mediaRepository - Media repository
   */
  constructor(mediaRepository) {
    super();
    this.mediaRepository = mediaRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Query parameters
   * @param {string} params.genreId - Genre ID
   * @param {Object} params.filters - Additional filters
   * @returns {Promise<import('../models').Media[]>} Media in genre
   */
  async execute(params) {
    return this.mediaRepository.getByGenre(params.genreId, params.filters);
  }
}

export class GetSimilarMediaUseCase extends UseCase {
  /**
   * @param {import('../repositories').MediaRepository} mediaRepository - Media repository
   */
  constructor(mediaRepository) {
    super();
    this.mediaRepository = mediaRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Query parameters
   * @param {string} params.mediaId - Media ID
   * @param {Object} params.filters - Additional filters
   * @returns {Promise<import('../models').Media[]>} Similar media
   */
  async execute(params) {
    return this.mediaRepository.getSimilar(params.mediaId, params.filters);
  }
}

/**
 * User use cases
 */
export class GetCurrentUserUseCase extends UseCase {
  /**
   * @param {import('../repositories').UserRepository} userRepository - User repository
   */
  constructor(userRepository) {
    super();
    this.userRepository = userRepository;
  }

  /**
   * Execute the use case
   * @returns {Promise<import('../models').User>} Current user
   */
  async execute() {
    return this.userRepository.getCurrentUser();
  }
}

export class UpdateUserPreferencesUseCase extends UseCase {
  /**
   * @param {import('../repositories').UserRepository} userRepository - User repository
   */
  constructor(userRepository) {
    super();
    this.userRepository = userRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.userId - User ID
   * @param {import('../models').UserPreferences} params.preferences - User preferences
   * @returns {Promise<import('../models').User>} Updated user
   */
  async execute(params) {
    return this.userRepository.updatePreferences(params.userId, params.preferences);
  }
}

export class AddToWatchlistUseCase extends UseCase {
  /**
   * @param {import('../repositories').UserRepository} userRepository - User repository
   */
  constructor(userRepository) {
    super();
    this.userRepository = userRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.userId - User ID
   * @param {string} params.mediaId - Media ID
   * @returns {Promise<boolean>} Whether addition was successful
   */
  async execute(params) {
    return this.userRepository.addToWatchlist(params.userId, params.mediaId);
  }
}

export class RemoveFromWatchlistUseCase extends UseCase {
  /**
   * @param {import('../repositories').UserRepository} userRepository - User repository
   */
  constructor(userRepository) {
    super();
    this.userRepository = userRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.userId - User ID
   * @param {string} params.mediaId - Media ID
   * @returns {Promise<boolean>} Whether removal was successful
   */
  async execute(params) {
    return this.userRepository.removeFromWatchlist(params.userId, params.mediaId);
  }
}

export class GetWatchlistUseCase extends UseCase {
  /**
   * @param {import('../repositories').UserRepository} userRepository - User repository
   */
  constructor(userRepository) {
    super();
    this.userRepository = userRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.userId - User ID
   * @param {Object} params.filters - Additional filters
   * @returns {Promise<import('../models').Media[]>} Watchlist media
   */
  async execute(params) {
    return this.userRepository.getWatchlist(params.userId, params.filters);
  }
}

export class GetWatchHistoryUseCase extends UseCase {
  /**
   * @param {import('../repositories').UserRepository} userRepository - User repository
   */
  constructor(userRepository) {
    super();
    this.userRepository = userRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.userId - User ID
   * @param {Object} params.filters - Additional filters
   * @returns {Promise<Array<{media: import('../models').Media, progress: import('../models').WatchProgress}>>} Watch history
   */
  async execute(params) {
    return this.userRepository.getWatchHistory(params.userId, params.filters);
  }
}

export class UpdateWatchProgressUseCase extends UseCase {
  /**
   * @param {import('../repositories').UserRepository} userRepository - User repository
   */
  constructor(userRepository) {
    super();
    this.userRepository = userRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.userId - User ID
   * @param {import('../models').WatchProgress} params.progress - Watch progress
   * @returns {Promise<import('../models').WatchProgress>} Updated watch progress
   */
  async execute(params) {
    return this.userRepository.updateWatchProgress(params.userId, params.progress);
  }
}

/**
 * Authentication use cases
 */
export class SignInUseCase extends UseCase {
  /**
   * @param {import('../repositories').AuthRepository} authRepository - Auth repository
   */
  constructor(authRepository) {
    super();
    this.authRepository = authRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.email - User email
   * @param {string} params.password - User password
   * @returns {Promise<{user: import('../models').User, token: string}>} Authentication result
   */
  async execute(params) {
    return this.authRepository.signIn(params.email, params.password);
  }
}

export class SignUpUseCase extends UseCase {
  /**
   * @param {import('../repositories').AuthRepository} authRepository - Auth repository
   */
  constructor(authRepository) {
    super();
    this.authRepository = authRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.email - User email
   * @param {string} params.password - User password
   * @param {string} params.username - User username
   * @returns {Promise<{user: import('../models').User, token: string}>} Authentication result
   */
  async execute(params) {
    return this.authRepository.signUp(params);
  }
}

export class SignOutUseCase extends UseCase {
  /**
   * @param {import('../repositories').AuthRepository} authRepository - Auth repository
   */
  constructor(authRepository) {
    super();
    this.authRepository = authRepository;
  }

  /**
   * Execute the use case
   * @returns {Promise<boolean>} Whether sign out was successful
   */
  async execute() {
    return this.authRepository.signOut();
  }
}

export class RefreshTokenUseCase extends UseCase {
  /**
   * @param {import('../repositories').AuthRepository} authRepository - Auth repository
   */
  constructor(authRepository) {
    super();
    this.authRepository = authRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.refreshToken - Refresh token
   * @returns {Promise<{token: string, refreshToken: string}>} New tokens
   */
  async execute(params) {
    return this.authRepository.refreshToken(params.refreshToken);
  }
}

/**
 * Streaming use cases
 */
export class GetStreamingSourcesUseCase extends UseCase {
  /**
   * @param {import('../repositories').StreamingRepository} streamingRepository - Streaming repository
   */
  constructor(streamingRepository) {
    super();
    this.streamingRepository = streamingRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.mediaId - Media ID
   * @returns {Promise<import('../models').StreamingSource[]>} Streaming sources
   */
  async execute(params) {
    return this.streamingRepository.getStreamingSources(params.mediaId);
  }
}

export class StartStreamingSessionUseCase extends UseCase {
  /**
   * @param {import('../repositories').StreamingRepository} streamingRepository - Streaming repository
   */
  constructor(streamingRepository) {
    super();
    this.streamingRepository = streamingRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.mediaId - Media ID
   * @param {string} params.quality - Streaming quality
   * @param {string} params.source - Streaming source
   * @returns {Promise<import('../models').StreamingSession>} Streaming session
   */
  async execute(params) {
    return this.streamingRepository.startStreamingSession(
      params.mediaId,
      params.quality,
      params.source
    );
  }
}

export class EndStreamingSessionUseCase extends UseCase {
  /**
   * @param {import('../repositories').StreamingRepository} streamingRepository - Streaming repository
   */
  constructor(streamingRepository) {
    super();
    this.streamingRepository = streamingRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.sessionId - Session ID
   * @param {number} params.progress - Playback progress (0-1)
   * @returns {Promise<import('../models').StreamingSession>} Updated streaming session
   */
  async execute(params) {
    return this.streamingRepository.endStreamingSession(
      params.sessionId,
      params.progress
    );
  }
}

export class GetStreamingUrlUseCase extends UseCase {
  /**
   * @param {import('../repositories').StreamingRepository} streamingRepository - Streaming repository
   */
  constructor(streamingRepository) {
    super();
    this.streamingRepository = streamingRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.mediaId - Media ID
   * @param {string} params.quality - Streaming quality
   * @returns {Promise<string>} Streaming URL
   */
  async execute(params) {
    return this.streamingRepository.getStreamingUrl(
      params.mediaId,
      params.quality
    );
  }
}

/**
 * Download use cases
 */
export class StartDownloadUseCase extends UseCase {
  /**
   * @param {import('../repositories').DownloadRepository} downloadRepository - Download repository
   */
  constructor(downloadRepository) {
    super();
    this.downloadRepository = downloadRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.mediaId - Media ID
   * @param {string} params.quality - Download quality
   * @returns {Promise<{downloadId: string, progress: number}>} Download info
   */
  async execute(params) {
    return this.downloadRepository.startDownload(
      params.mediaId,
      params.quality
    );
  }
}

export class CancelDownloadUseCase extends UseCase {
  /**
   * @param {import('../repositories').DownloadRepository} downloadRepository - Download repository
   */
  constructor(downloadRepository) {
    super();
    this.downloadRepository = downloadRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.downloadId - Download ID
   * @returns {Promise<boolean>} Whether cancellation was successful
   */
  async execute(params) {
    return this.downloadRepository.cancelDownload(params.downloadId);
  }
}

export class GetDownloadProgressUseCase extends UseCase {
  /**
   * @param {import('../repositories').DownloadRepository} downloadRepository - Download repository
   */
  constructor(downloadRepository) {
    super();
    this.downloadRepository = downloadRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.downloadId - Download ID
   * @returns {Promise<{progress: number, status: string}>} Download progress
   */
  async execute(params) {
    return this.downloadRepository.getDownloadProgress(params.downloadId);
  }
}

export class GetAllDownloadsUseCase extends UseCase {
  /**
   * @param {import('../repositories').DownloadRepository} downloadRepository - Download repository
   */
  constructor(downloadRepository) {
    super();
    this.downloadRepository = downloadRepository;
  }

  /**
   * Execute the use case
   * @returns {Promise<Array<{id: string, mediaId: string, progress: number, status: string}>>} Downloads
   */
  async execute() {
    return this.downloadRepository.getAllDownloads();
  }
}

export class DeleteDownloadedMediaUseCase extends UseCase {
  /**
   * @param {import('../repositories').DownloadRepository} downloadRepository - Download repository
   */
  constructor(downloadRepository) {
    super();
    this.downloadRepository = downloadRepository;
  }

  /**
   * Execute the use case
   * @param {Object} params - Use case parameters
   * @param {string} params.mediaId - Media ID
   * @returns {Promise<boolean>} Whether deletion was successful
   */
  async execute(params) {
    return this.downloadRepository.deleteDownloadedMedia(params.mediaId);
  }
}

/**
 * Use case factory
 */
export class UseCaseFactory {
  /**
   * Create a use case instance
   * @param {string} useCaseName - Use case name
   * @param {Object} dependencies - Use case dependencies
   * @returns {UseCase} Use case instance
   */
  static create(useCaseName, dependencies) {
    switch (useCaseName) {
      // Media use cases
      case 'GetMediaUseCase':
        return new GetMediaUseCase(dependencies.mediaRepository);
      case 'SearchMediaUseCase':
        return new SearchMediaUseCase(dependencies.mediaRepository);
      case 'GetTrendingMediaUseCase':
        return new GetTrendingMediaUseCase(dependencies.mediaRepository);
      case 'GetMediaByGenreUseCase':
        return new GetMediaByGenreUseCase(dependencies.mediaRepository);
      case 'GetSimilarMediaUseCase':
        return new GetSimilarMediaUseCase(dependencies.mediaRepository);
        
      // User use cases
      case 'GetCurrentUserUseCase':
        return new GetCurrentUserUseCase(dependencies.userRepository);
      case 'UpdateUserPreferencesUseCase':
        return new UpdateUserPreferencesUseCase(dependencies.userRepository);
      case 'AddToWatchlistUseCase':
        return new AddToWatchlistUseCase(dependencies.userRepository);
      case 'RemoveFromWatchlistUseCase':
        return new RemoveFromWatchlistUseCase(dependencies.userRepository);
      case 'GetWatchlistUseCase':
        return new GetWatchlistUseCase(dependencies.userRepository);
      case 'GetWatchHistoryUseCase':
        return new GetWatchHistoryUseCase(dependencies.userRepository);
      case 'UpdateWatchProgressUseCase':
        return new UpdateWatchProgressUseCase(dependencies.userRepository);
        
      // Authentication use cases
      case 'SignInUseCase':
        return new SignInUseCase(dependencies.authRepository);
      case 'SignUpUseCase':
        return new SignUpUseCase(dependencies.authRepository);
      case 'SignOutUseCase':
        return new SignOutUseCase(dependencies.authRepository);
      case 'RefreshTokenUseCase':
        return new RefreshTokenUseCase(dependencies.authRepository);
        
      // Streaming use cases
      case 'GetStreamingSourcesUseCase':
        return new GetStreamingSourcesUseCase(dependencies.streamingRepository);
      case 'StartStreamingSessionUseCase':
        return new StartStreamingSessionUseCase(dependencies.streamingRepository);
      case 'EndStreamingSessionUseCase':
        return new EndStreamingSessionUseCase(dependencies.streamingRepository);
      case 'GetStreamingUrlUseCase':
        return new GetStreamingUrlUseCase(dependencies.streamingRepository);
        
      // Download use cases
      case 'StartDownloadUseCase':
        return new StartDownloadUseCase(dependencies.downloadRepository);
      case 'CancelDownloadUseCase':
        return new CancelDownloadUseCase(dependencies.downloadRepository);
      case 'GetDownloadProgressUseCase':
        return new GetDownloadProgressUseCase(dependencies.downloadRepository);
      case 'GetAllDownloadsUseCase':
        return new GetAllDownloadsUseCase(dependencies.downloadRepository);
      case 'DeleteDownloadedMediaUseCase':
        return new DeleteDownloadedMediaUseCase(dependencies.downloadRepository);
        
      default:
        throw new Error(`Unknown use case: ${useCaseName}`);
    }
  }
}
