/**
 * Player Store for Movo
 * Provides a Zustand store for player state
 * 
 * @author zophlic
 */

import { createStoreWithSelectors } from '../hooks/useStore';
import { UseCaseFactory } from '../../domain/usecases';
import container from '../../infrastructure/di/Container';
import loggingService from '../../infrastructure/logging/LoggingService';
import telemetryService from '../../infrastructure/telemetry/TelemetryService';
import { userStore } from './userStore';

// Player states
export const PLAYER_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  PLAYING: 'playing',
  PAUSED: 'paused',
  BUFFERING: 'buffering',
  ENDED: 'ended',
  ERROR: 'error'
};

// Create player store
const playerStore = createStoreWithSelectors(
  (set, get) => ({
    // State
    currentMedia: null,
    streamingSession: null,
    streamingUrl: null,
    subtitles: [],
    state: PLAYER_STATE.IDLE,
    volume: 1,
    muted: false,
    playbackRate: 1,
    currentTime: 0,
    duration: 0,
    buffered: [],
    quality: 'auto',
    availableQualities: [],
    fullscreen: false,
    pip: false,
    error: null,
    
    // Actions
    startPlayback: async (mediaId, quality = 'auto') => {
      set({
        state: PLAYER_STATE.LOADING,
        error: null
      });
      
      try {
        // Get media details
        const getMediaUseCase = UseCaseFactory.create('GetMediaUseCase', {
          mediaRepository: container.get('MediaRepository')
        });
        
        const media = await getMediaUseCase.execute(mediaId);
        
        // Get streaming URL
        const getStreamingUrlUseCase = UseCaseFactory.create('GetStreamingUrlUseCase', {
          streamingRepository: container.get('StreamingRepository')
        });
        
        const streamingUrl = await getStreamingUrlUseCase.execute({
          mediaId,
          quality
        });
        
        // Start streaming session
        const startStreamingSessionUseCase = UseCaseFactory.create('StartStreamingSessionUseCase', {
          streamingRepository: container.get('StreamingRepository')
        });
        
        const streamingSession = await startStreamingSessionUseCase.execute({
          mediaId,
          quality,
          source: 'centralized' // TODO: Determine source based on availability
        });
        
        // Get subtitles
        const subtitles = await get().loadSubtitles(mediaId);
        
        // Update state
        set({
          currentMedia: media,
          streamingSession,
          streamingUrl,
          subtitles,
          state: PLAYER_STATE.PLAYING,
          quality,
          availableQualities: ['auto', '240p', '360p', '480p', '720p', '1080p'], // TODO: Get from API
          currentTime: 0,
          duration: 0
        });
        
        // Track event
        telemetryService.trackEvent('playback', 'start', {
          mediaId,
          mediaType: media.type,
          mediaTitle: media.title,
          quality,
          source: streamingSession.source
        });
        
        // Load watch progress if available
        const { user } = userStore.getState();
        
        if (user) {
          const historyItem = user.watchHistory.find(item => item.mediaId === mediaId);
          
          if (historyItem && historyItem.position > 0) {
            // Resume from last position
            get().seekTo(historyItem.position);
          }
        }
        
        return { media, streamingUrl, streamingSession };
      } catch (error) {
        loggingService.error('Failed to start playback', { error, mediaId, quality });
        
        set({
          state: PLAYER_STATE.ERROR,
          error: error.message || 'Failed to start playback'
        });
        
        // Track error
        telemetryService.trackEvent('playback', 'error', {
          mediaId,
          error: error.message || 'Failed to start playback'
        });
        
        throw error;
      }
    },
    
    stopPlayback: async () => {
      const { streamingSession, currentTime, duration } = get();
      
      if (streamingSession) {
        try {
          // End streaming session
          const endStreamingSessionUseCase = UseCaseFactory.create('EndStreamingSessionUseCase', {
            streamingRepository: container.get('StreamingRepository')
          });
          
          await endStreamingSessionUseCase.execute({
            sessionId: streamingSession.id,
            progress: currentTime / duration
          });
          
          // Track event
          telemetryService.trackEvent('playback', 'stop', {
            mediaId: get().currentMedia?.id,
            progress: currentTime / duration,
            duration: currentTime
          });
        } catch (error) {
          loggingService.error('Failed to end streaming session', { error, sessionId: streamingSession.id });
        }
      }
      
      // Reset state
      set({
        currentMedia: null,
        streamingSession: null,
        streamingUrl: null,
        subtitles: [],
        state: PLAYER_STATE.IDLE,
        currentTime: 0,
        duration: 0,
        buffered: []
      });
    },
    
    play: () => {
      set({ state: PLAYER_STATE.PLAYING });
      
      // Track event
      telemetryService.trackEvent('playback', 'play', {
        mediaId: get().currentMedia?.id,
        currentTime: get().currentTime
      });
    },
    
    pause: () => {
      set({ state: PLAYER_STATE.PAUSED });
      
      // Track event
      telemetryService.trackEvent('playback', 'pause', {
        mediaId: get().currentMedia?.id,
        currentTime: get().currentTime
      });
      
      // Update watch progress
      get().updateWatchProgress();
    },
    
    seekTo: (time) => {
      set({ currentTime: time });
      
      // Track event if seek delta is significant
      const currentTime = get().currentTime;
      if (Math.abs(time - currentTime) > 5) {
        telemetryService.trackEvent('playback', 'seek', {
          mediaId: get().currentMedia?.id,
          from: currentTime,
          to: time
        });
      }
    },
    
    setVolume: (volume) => {
      set({ volume: Math.max(0, Math.min(1, volume)) });
    },
    
    setMuted: (muted) => {
      set({ muted });
    },
    
    setPlaybackRate: (rate) => {
      set({ playbackRate: rate });
      
      // Track event
      telemetryService.trackEvent('playback', 'rate_change', {
        mediaId: get().currentMedia?.id,
        rate
      });
    },
    
    setQuality: (quality) => {
      set({ quality });
      
      // Track event
      telemetryService.trackEvent('playback', 'quality_change', {
        mediaId: get().currentMedia?.id,
        quality
      });
    },
    
    toggleFullscreen: () => {
      const fullscreen = !get().fullscreen;
      set({ fullscreen });
      
      // Track event
      telemetryService.trackEvent('playback', fullscreen ? 'enter_fullscreen' : 'exit_fullscreen', {
        mediaId: get().currentMedia?.id
      });
    },
    
    togglePip: () => {
      const pip = !get().pip;
      set({ pip });
      
      // Track event
      telemetryService.trackEvent('playback', pip ? 'enter_pip' : 'exit_pip', {
        mediaId: get().currentMedia?.id
      });
    },
    
    updatePlayerState: (state) => {
      set({ state });
      
      // Track buffering events
      if (state === PLAYER_STATE.BUFFERING) {
        telemetryService.trackEvent('playback', 'buffering', {
          mediaId: get().currentMedia?.id,
          currentTime: get().currentTime
        });
      }
      
      // Update watch progress when playback ends
      if (state === PLAYER_STATE.ENDED) {
        get().updateWatchProgress(true);
        
        // Track event
        telemetryService.trackEvent('playback', 'complete', {
          mediaId: get().currentMedia?.id,
          duration: get().duration
        });
      }
    },
    
    updateProgress: (currentTime, duration, buffered) => {
      set({ currentTime, duration, buffered });
      
      // Update watch progress periodically (every 10 seconds)
      if (currentTime % 10 < 1 && currentTime > 0) {
        get().updateWatchProgress();
      }
    },
    
    updateWatchProgress: (completed = false) => {
      const { currentMedia, currentTime, duration } = get();
      
      if (!currentMedia || !currentTime) {
        return;
      }
      
      try {
        // Get user store
        const { updateWatchProgress } = userStore.getState();
        
        // Update watch progress
        updateWatchProgress(currentMedia.id, {
          position: currentTime,
          duration,
          timestamp: Date.now(),
          completed
        });
      } catch (error) {
        loggingService.error('Failed to update watch progress', { error, mediaId: currentMedia.id });
      }
    },
    
    loadSubtitles: async (mediaId) => {
      try {
        // TODO: Implement subtitle loading
        return [];
      } catch (error) {
        loggingService.error('Failed to load subtitles', { error, mediaId });
        return [];
      }
    },
    
    clearError: () => {
      set({ error: null });
    }
  }),
  
  // Selectors
  {
    currentMedia: (state) => state.currentMedia,
    streamingUrl: (state) => state.streamingUrl,
    subtitles: (state) => state.subtitles,
    state: (state) => state.state,
    volume: (state) => state.volume,
    muted: (state) => state.muted,
    playbackRate: (state) => state.playbackRate,
    currentTime: (state) => state.currentTime,
    duration: (state) => state.duration,
    buffered: (state) => state.buffered,
    quality: (state) => state.quality,
    availableQualities: (state) => state.availableQualities,
    fullscreen: (state) => state.fullscreen,
    pip: (state) => state.pip,
    error: (state) => state.error,
    progress: (state) => state.duration ? state.currentTime / state.duration : 0,
    isPlaying: (state) => state.state === PLAYER_STATE.PLAYING,
    isBuffering: (state) => state.state === PLAYER_STATE.BUFFERING,
    isEnded: (state) => state.state === PLAYER_STATE.ENDED,
    hasError: (state) => state.state === PLAYER_STATE.ERROR
  },
  
  // Options
  {
    persist: false,
    name: 'player'
  }
);

export const {
  useStore,
  useCurrentMedia,
  useStreamingUrl,
  useSubtitles,
  useState,
  useVolume,
  useMuted,
  usePlaybackRate,
  useCurrentTime,
  useDuration,
  useBuffered,
  useQuality,
  useAvailableQualities,
  useFullscreen,
  usePip,
  useError,
  useProgress,
  useIsPlaying,
  useIsBuffering,
  useIsEnded,
  useHasError
} = playerStore;

export default playerStore;
