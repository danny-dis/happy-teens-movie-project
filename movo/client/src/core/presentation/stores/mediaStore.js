/**
 * Media Store for Movo
 * Provides a Zustand store for media state
 * 
 * @author zophlic
 */

import { createStoreWithSelectors } from '../hooks/useStore';
import { UseCaseFactory } from '../../domain/usecases';
import container from '../../infrastructure/di/Container';
import loggingService from '../../infrastructure/logging/LoggingService';
import telemetryService from '../../infrastructure/telemetry/TelemetryService';

// Create media store
const mediaStore = createStoreWithSelectors(
  (set, get) => ({
    // State
    trending: [],
    genres: {},
    currentMedia: null,
    searchResults: [],
    searchQuery: '',
    recentSearches: [],
    isLoading: false,
    error: null,
    
    // Actions
    getTrending: async (params = {}) => {
      set({ isLoading: true, error: null });
      
      try {
        // Get use case
        const getTrendingMediaUseCase = UseCaseFactory.create('GetTrendingMediaUseCase', {
          mediaRepository: container.get('MediaRepository')
        });
        
        // Execute use case
        const trending = await getTrendingMediaUseCase.execute(params);
        
        // Update state
        set({
          trending,
          isLoading: false
        });
        
        return trending;
      } catch (error) {
        loggingService.error('Failed to get trending media', { error, params });
        
        set({
          isLoading: false,
          error: error.message || 'Failed to get trending media'
        });
        
        throw error;
      }
    },
    
    getMediaByGenre: async (genreId, params = {}) => {
      set({ isLoading: true, error: null });
      
      try {
        // Get use case
        const getMediaByGenreUseCase = UseCaseFactory.create('GetMediaByGenreUseCase', {
          mediaRepository: container.get('MediaRepository')
        });
        
        // Execute use case
        const media = await getMediaByGenreUseCase.execute({
          genreId,
          filters: params
        });
        
        // Update state
        set(state => ({
          genres: {
            ...state.genres,
            [genreId]: media
          },
          isLoading: false
        }));
        
        return media;
      } catch (error) {
        loggingService.error('Failed to get media by genre', { error, genreId, params });
        
        set({
          isLoading: false,
          error: error.message || 'Failed to get media by genre'
        });
        
        throw error;
      }
    },
    
    getMediaDetails: async (mediaId) => {
      set({ isLoading: true, error: null });
      
      try {
        // Get use case
        const getMediaUseCase = UseCaseFactory.create('GetMediaUseCase', {
          mediaRepository: container.get('MediaRepository')
        });
        
        // Execute use case
        const media = await getMediaUseCase.execute(mediaId);
        
        // Update state
        set({
          currentMedia: media,
          isLoading: false
        });
        
        // Track event
        telemetryService.trackEvent('content', 'view_details', {
          mediaId,
          mediaType: media.type,
          mediaTitle: media.title
        });
        
        return media;
      } catch (error) {
        loggingService.error('Failed to get media details', { error, mediaId });
        
        set({
          isLoading: false,
          error: error.message || 'Failed to get media details'
        });
        
        throw error;
      }
    },
    
    getSimilarMedia: async (mediaId, params = {}) => {
      set({ isLoading: true, error: null });
      
      try {
        // Get use case
        const getSimilarMediaUseCase = UseCaseFactory.create('GetSimilarMediaUseCase', {
          mediaRepository: container.get('MediaRepository')
        });
        
        // Execute use case
        const similarMedia = await getSimilarMediaUseCase.execute({
          mediaId,
          filters: params
        });
        
        // Update state if current media matches
        if (get().currentMedia?.id === mediaId) {
          set(state => ({
            currentMedia: {
              ...state.currentMedia,
              similarMedia
            },
            isLoading: false
          }));
        } else {
          set({ isLoading: false });
        }
        
        return similarMedia;
      } catch (error) {
        loggingService.error('Failed to get similar media', { error, mediaId, params });
        
        set({
          isLoading: false,
          error: error.message || 'Failed to get similar media'
        });
        
        throw error;
      }
    },
    
    searchMedia: async (query, params = {}) => {
      set({ isLoading: true, error: null, searchQuery: query });
      
      try {
        // Get use case
        const searchMediaUseCase = UseCaseFactory.create('SearchMediaUseCase', {
          mediaRepository: container.get('MediaRepository')
        });
        
        // Execute use case
        const results = await searchMediaUseCase.execute({
          query,
          filters: params
        });
        
        // Update state
        set(state => {
          // Add to recent searches if not already present
          const recentSearches = [query, ...state.recentSearches.filter(q => q !== query)].slice(0, 10);
          
          return {
            searchResults: results,
            recentSearches,
            isLoading: false
          };
        });
        
        // Track event
        telemetryService.trackEvent('content', 'search', {
          query,
          resultCount: results.length
        });
        
        return results;
      } catch (error) {
        loggingService.error('Failed to search media', { error, query, params });
        
        set({
          isLoading: false,
          error: error.message || 'Failed to search media'
        });
        
        throw error;
      }
    },
    
    clearSearch: () => {
      set({
        searchResults: [],
        searchQuery: ''
      });
    },
    
    clearRecentSearches: () => {
      set({ recentSearches: [] });
    },
    
    clearCurrentMedia: () => {
      set({ currentMedia: null });
    },
    
    clearError: () => {
      set({ error: null });
    }
  }),
  
  // Selectors
  {
    trending: (state) => state.trending,
    genres: (state) => state.genres,
    currentMedia: (state) => state.currentMedia,
    searchResults: (state) => state.searchResults,
    searchQuery: (state) => state.searchQuery,
    recentSearches: (state) => state.recentSearches,
    isLoading: (state) => state.isLoading,
    error: (state) => state.error
  },
  
  // Options
  {
    persist: true,
    name: 'media'
  }
);

export const {
  useStore,
  useTrending,
  useGenres,
  useCurrentMedia,
  useSearchResults,
  useSearchQuery,
  useRecentSearches,
  useIsLoading,
  useError
} = mediaStore;

export default mediaStore;
