/**
 * GraphQL Resolvers for Movo
 * Implements the resolvers for the GraphQL schema
 * 
 * @author zophlic
 */

const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const { AuthenticationError, UserInputError, ForbiddenError } = require('apollo-server-express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Custom scalar resolvers
const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value) {
    return value.toISOString();
  },
  parseValue(value) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  }
});

const jsonScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return value;
  },
  parseLiteral(ast) {
    switch (ast.kind) {
      case Kind.STRING:
        return JSON.parse(ast.value);
      case Kind.OBJECT:
        return ast.fields.reduce((obj, field) => {
          obj[field.name.value] = parseLiteral(field.value);
          return obj;
        }, {});
      default:
        return null;
    }
  }
});

// Helper functions
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

const checkAuth = (context) => {
  const { user } = context;
  
  if (!user) {
    throw new AuthenticationError('Not authenticated');
  }
  
  return user;
};

// Resolvers
const resolvers = {
  // Scalar resolvers
  DateTime: dateTimeScalar,
  JSON: jsonScalar,
  
  // Type resolvers
  Media: {
    genres: async (parent, args, { dataSources }) => {
      return dataSources.mediaAPI.getGenresByMediaId(parent.id);
    },
    cast: async (parent, args, { dataSources }) => {
      return dataSources.mediaAPI.getCastByMediaId(parent.id);
    },
    director: async (parent, args, { dataSources }) => {
      return dataSources.mediaAPI.getDirectorByMediaId(parent.id);
    },
    streamingSources: async (parent, args, { dataSources }) => {
      return dataSources.streamingAPI.getSourcesByMediaId(parent.id);
    },
    similarMedia: async (parent, { limit }, { dataSources }) => {
      return dataSources.mediaAPI.getSimilarMedia(parent.id, limit);
    },
    watchProgress: async (parent, args, { dataSources, user }) => {
      if (!user) return null;
      return dataSources.userAPI.getWatchProgress(user.id, parent.id);
    },
    isInWatchlist: async (parent, args, { dataSources, user }) => {
      if (!user) return false;
      return dataSources.userAPI.isInWatchlist(user.id, parent.id);
    }
  },
  
  Genre: {
    media: async (parent, { pagination, filter, sort }, { dataSources }) => {
      const { page = 1, limit = 20 } = pagination || {};
      return dataSources.mediaAPI.getMediaByGenre(parent.id, page, limit, filter, sort);
    }
  },
  
  Person: {
    media: async (parent, args, { dataSources }) => {
      return dataSources.mediaAPI.getMediaByPerson(parent.id);
    }
  },
  
  User: {
    watchlist: async (parent, args, { dataSources }) => {
      return dataSources.userAPI.getWatchlist(parent.id);
    },
    watchHistory: async (parent, args, { dataSources }) => {
      return dataSources.userAPI.getWatchHistory(parent.id);
    },
    downloads: async (parent, args, { dataSources }) => {
      return dataSources.downloadAPI.getDownloadsByUser(parent.id);
    },
    streamingSessions: async (parent, args, { dataSources }) => {
      return dataSources.streamingAPI.getSessionsByUser(parent.id);
    }
  },
  
  WatchHistoryItem: {
    media: async (parent, args, { dataSources }) => {
      return dataSources.mediaAPI.getMediaById(parent.mediaId);
    },
    progress: async (parent, args, { dataSources, user }) => {
      return parent.progress;
    }
  },
  
  Download: {
    media: async (parent, args, { dataSources }) => {
      return dataSources.mediaAPI.getMediaById(parent.mediaId);
    }
  },
  
  StreamingSession: {
    media: async (parent, args, { dataSources }) => {
      return dataSources.mediaAPI.getMediaById(parent.mediaId);
    }
  },
  
  // Query resolvers
  Query: {
    // Media queries
    media: async (_, { id }, { dataSources }) => {
      return dataSources.mediaAPI.getMediaById(id);
    },
    
    allMedia: async (_, { pagination, filter, sort }, { dataSources }) => {
      const { page = 1, limit = 20 } = pagination || {};
      return dataSources.mediaAPI.getAllMedia(page, limit, filter, sort);
    },
    
    searchMedia: async (_, { query, pagination }, { dataSources }) => {
      const { page = 1, limit = 20 } = pagination || {};
      return dataSources.mediaAPI.searchMedia(query, page, limit);
    },
    
    trendingMedia: async (_, { pagination, timeWindow }, { dataSources }) => {
      const { page = 1, limit = 20 } = pagination || {};
      return dataSources.mediaAPI.getTrendingMedia(page, limit, timeWindow);
    },
    
    recommendedMedia: async (_, { pagination }, { dataSources, user }) => {
      const { page = 1, limit = 20 } = pagination || {};
      
      if (!user) {
        // Return popular media for non-authenticated users
        return dataSources.mediaAPI.getPopularMedia(page, limit);
      }
      
      return dataSources.mediaAPI.getRecommendedMedia(user.id, page, limit);
    },
    
    newReleases: async (_, { pagination }, { dataSources }) => {
      const { page = 1, limit = 20 } = pagination || {};
      return dataSources.mediaAPI.getNewReleases(page, limit);
    },
    
    popularMedia: async (_, { pagination }, { dataSources }) => {
      const { page = 1, limit = 20 } = pagination || {};
      return dataSources.mediaAPI.getPopularMedia(page, limit);
    },
    
    // Genre queries
    genre: async (_, { id }, { dataSources }) => {
      return dataSources.mediaAPI.getGenreById(id);
    },
    
    allGenres: async (_, { pagination }, { dataSources }) => {
      const { page = 1, limit = 20 } = pagination || {};
      return dataSources.mediaAPI.getAllGenres(page, limit);
    },
    
    // User queries
    me: async (_, __, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      return dataSources.userAPI.getUserById(authUser.id);
    },
    
    user: async (_, { id }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      
      // Only admins can view other users
      if (authUser.role !== 'ADMIN' && authUser.id !== id) {
        throw new ForbiddenError('Not authorized to view this user');
      }
      
      return dataSources.userAPI.getUserById(id);
    },
    
    // Streaming queries
    streamingUrl: async (_, { mediaId, quality }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      return dataSources.streamingAPI.getStreamingUrl(mediaId, quality, authUser.id);
    },
    
    subtitles: async (_, { mediaId, language }, { dataSources }) => {
      return dataSources.streamingAPI.getSubtitles(mediaId, language);
    },
    
    // Download queries
    downloads: async (_, __, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      return dataSources.downloadAPI.getDownloadsByUser(authUser.id);
    },
    
    download: async (_, { id }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      const download = await dataSources.downloadAPI.getDownloadById(id);
      
      if (download.userId !== authUser.id) {
        throw new ForbiddenError('Not authorized to view this download');
      }
      
      return download;
    },
    
    // Watchlist queries
    watchlist: async (_, { pagination }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      const { page = 1, limit = 20 } = pagination || {};
      return dataSources.userAPI.getWatchlist(authUser.id, page, limit);
    },
    
    watchHistory: async (_, { pagination }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      const { page = 1, limit = 20 } = pagination || {};
      return dataSources.userAPI.getWatchHistory(authUser.id, page, limit);
    },
    
    // Search queries
    search: async (_, { query, pagination }, { dataSources }) => {
      const { page = 1, limit = 20 } = pagination || {};
      return dataSources.mediaAPI.searchMedia(query, page, limit);
    }
  },
  
  // Mutation resolvers
  Mutation: {
    // Auth mutations
    login: async (_, { input }, { dataSources }) => {
      const { email, password } = input;
      
      // Get user by email
      const user = await dataSources.userAPI.getUserByEmail(email);
      
      if (!user) {
        throw new UserInputError('Invalid email or password');
      }
      
      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        throw new UserInputError('Invalid email or password');
      }
      
      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);
      
      // Update refresh token in database
      await dataSources.userAPI.updateRefreshToken(user.id, refreshToken);
      
      return {
        token,
        refreshToken,
        user
      };
    },
    
    signup: async (_, { input }, { dataSources }) => {
      const { username, email, password } = input;
      
      // Check if user already exists
      const existingUser = await dataSources.userAPI.getUserByEmail(email);
      
      if (existingUser) {
        throw new UserInputError('User with this email already exists');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const user = await dataSources.userAPI.createUser({
        username,
        email,
        password: hashedPassword,
        role: 'USER'
      });
      
      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);
      
      // Update refresh token in database
      await dataSources.userAPI.updateRefreshToken(user.id, refreshToken);
      
      return {
        token,
        refreshToken,
        user
      };
    },
    
    refreshToken: async (_, { refreshToken }, { dataSources }) => {
      try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        // Get user
        const user = await dataSources.userAPI.getUserById(decoded.id);
        
        if (!user) {
          throw new AuthenticationError('Invalid refresh token');
        }
        
        // Check if refresh token matches
        const storedRefreshToken = await dataSources.userAPI.getRefreshToken(user.id);
        
        if (storedRefreshToken !== refreshToken) {
          throw new AuthenticationError('Invalid refresh token');
        }
        
        // Generate new tokens
        const token = generateToken(user);
        const newRefreshToken = generateRefreshToken(user);
        
        // Update refresh token in database
        await dataSources.userAPI.updateRefreshToken(user.id, newRefreshToken);
        
        return {
          token,
          refreshToken: newRefreshToken,
          user
        };
      } catch (error) {
        throw new AuthenticationError('Invalid refresh token');
      }
    },
    
    logout: async (_, __, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      
      // Clear refresh token
      await dataSources.userAPI.updateRefreshToken(authUser.id, null);
      
      return true;
    },
    
    // User mutations
    updateUser: async (_, { username, profilePicture }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      
      // Process profile picture upload if provided
      let profilePictureUrl = null;
      
      if (profilePicture) {
        const { createReadStream, filename, mimetype } = await profilePicture;
        profilePictureUrl = await dataSources.storageAPI.uploadFile(
          createReadStream(),
          filename,
          mimetype,
          `users/${authUser.id}/profile`
        );
      }
      
      // Update user
      return dataSources.userAPI.updateUser(authUser.id, {
        username,
        profilePicture: profilePictureUrl
      });
    },
    
    updateUserPreferences: async (_, { preferences }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      return dataSources.userAPI.updateUserPreferences(authUser.id, preferences);
    },
    
    // Watchlist mutations
    addToWatchlist: async (_, { mediaId }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      return dataSources.userAPI.addToWatchlist(authUser.id, mediaId);
    },
    
    removeFromWatchlist: async (_, { mediaId }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      return dataSources.userAPI.removeFromWatchlist(authUser.id, mediaId);
    },
    
    // Watch progress mutations
    updateWatchProgress: async (_, { input }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      const { mediaId, position, duration, completed } = input;
      
      return dataSources.userAPI.updateWatchProgress(authUser.id, {
        mediaId,
        position,
        duration,
        completed,
        timestamp: new Date()
      });
    },
    
    // Streaming mutations
    startStreamingSession: async (_, { input }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      const { mediaId, quality, source } = input;
      
      return dataSources.streamingAPI.startStreamingSession({
        mediaId,
        userId: authUser.id,
        quality,
        source,
        startTime: new Date()
      });
    },
    
    endStreamingSession: async (_, { sessionId, progress }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      
      // Get session
      const session = await dataSources.streamingAPI.getSessionById(sessionId);
      
      // Check if user owns the session
      if (session.userId !== authUser.id) {
        throw new ForbiddenError('Not authorized to end this session');
      }
      
      return dataSources.streamingAPI.endStreamingSession(sessionId, {
        endTime: new Date(),
        progress
      });
    },
    
    updateStreamingSessionMetrics: async (_, { sessionId, metrics }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      
      // Get session
      const session = await dataSources.streamingAPI.getSessionById(sessionId);
      
      // Check if user owns the session
      if (session.userId !== authUser.id) {
        throw new ForbiddenError('Not authorized to update this session');
      }
      
      return dataSources.streamingAPI.updateSessionMetrics(sessionId, metrics);
    },
    
    // Download mutations
    startDownload: async (_, { input }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      const { mediaId, quality } = input;
      
      return dataSources.downloadAPI.startDownload({
        id: uuidv4(),
        mediaId,
        userId: authUser.id,
        quality,
        progress: 0,
        status: 'QUEUED',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    },
    
    pauseDownload: async (_, { downloadId }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      
      // Get download
      const download = await dataSources.downloadAPI.getDownloadById(downloadId);
      
      // Check if user owns the download
      if (download.userId !== authUser.id) {
        throw new ForbiddenError('Not authorized to pause this download');
      }
      
      return dataSources.downloadAPI.updateDownloadStatus(downloadId, 'PAUSED');
    },
    
    resumeDownload: async (_, { downloadId }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      
      // Get download
      const download = await dataSources.downloadAPI.getDownloadById(downloadId);
      
      // Check if user owns the download
      if (download.userId !== authUser.id) {
        throw new ForbiddenError('Not authorized to resume this download');
      }
      
      return dataSources.downloadAPI.updateDownloadStatus(downloadId, 'DOWNLOADING');
    },
    
    cancelDownload: async (_, { downloadId }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      
      // Get download
      const download = await dataSources.downloadAPI.getDownloadById(downloadId);
      
      // Check if user owns the download
      if (download.userId !== authUser.id) {
        throw new ForbiddenError('Not authorized to cancel this download');
      }
      
      await dataSources.downloadAPI.updateDownloadStatus(downloadId, 'CANCELED');
      return true;
    },
    
    deleteDownload: async (_, { downloadId }, { dataSources, user }) => {
      const authUser = checkAuth({ user });
      
      // Get download
      const download = await dataSources.downloadAPI.getDownloadById(downloadId);
      
      // Check if user owns the download
      if (download.userId !== authUser.id) {
        throw new ForbiddenError('Not authorized to delete this download');
      }
      
      return dataSources.downloadAPI.deleteDownload(downloadId);
    }
  },
  
  // Subscription resolvers
  Subscription: {
    downloadProgressUpdated: {
      subscribe: (_, { downloadId }, { pubsub }) => {
        return pubsub.asyncIterator(`DOWNLOAD_PROGRESS_${downloadId}`);
      }
    },
    
    streamingSessionUpdated: {
      subscribe: (_, { sessionId }, { pubsub }) => {
        return pubsub.asyncIterator(`STREAMING_SESSION_${sessionId}`);
      }
    },
    
    watchProgressUpdated: {
      subscribe: (_, __, { pubsub, user }) => {
        if (!user) {
          throw new AuthenticationError('Not authenticated');
        }
        
        return pubsub.asyncIterator(`WATCH_PROGRESS_${user.id}`);
      }
    },
    
    newMediaAdded: {
      subscribe: (_, { genreId }, { pubsub }) => {
        return pubsub.asyncIterator(genreId ? `NEW_MEDIA_GENRE_${genreId}` : 'NEW_MEDIA');
      }
    }
  }
};

module.exports = resolvers;
