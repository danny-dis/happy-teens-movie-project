/**
 * User Store for Movo
 * Provides a Zustand store for user state
 * 
 * @author zophlic
 */

import { createStoreWithSelectors } from '../hooks/useStore';
import { UseCaseFactory } from '../../domain/usecases';
import container from '../../infrastructure/di/Container';
import loggingService from '../../infrastructure/logging/LoggingService';
import telemetryService from '../../infrastructure/telemetry/TelemetryService';

// Create user store
const userStore = createStoreWithSelectors(
  (set, get) => ({
    // State
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    
    // Actions
    signIn: async (email, password) => {
      set({ isLoading: true, error: null });
      
      try {
        // Get use case
        const signInUseCase = UseCaseFactory.create('SignInUseCase', {
          authRepository: container.get('AuthRepository')
        });
        
        // Execute use case
        const result = await signInUseCase.execute({ email, password });
        
        // Update state
        set({
          user: result.user,
          isAuthenticated: true,
          isLoading: false
        });
        
        // Set user ID in telemetry
        telemetryService.setUserId(result.user.id);
        
        // Track event
        telemetryService.trackEvent('user', 'sign_in', {
          userId: result.user.id
        });
        
        return result;
      } catch (error) {
        loggingService.error('Failed to sign in', { error, email });
        
        set({
          isLoading: false,
          error: error.message || 'Failed to sign in'
        });
        
        throw error;
      }
    },
    
    signUp: async (userData) => {
      set({ isLoading: true, error: null });
      
      try {
        // Get use case
        const signUpUseCase = UseCaseFactory.create('SignUpUseCase', {
          authRepository: container.get('AuthRepository')
        });
        
        // Execute use case
        const result = await signUpUseCase.execute(userData);
        
        // Update state
        set({
          user: result.user,
          isAuthenticated: true,
          isLoading: false
        });
        
        // Set user ID in telemetry
        telemetryService.setUserId(result.user.id);
        
        // Track event
        telemetryService.trackEvent('user', 'sign_up', {
          userId: result.user.id
        });
        
        return result;
      } catch (error) {
        loggingService.error('Failed to sign up', { error, userData });
        
        set({
          isLoading: false,
          error: error.message || 'Failed to sign up'
        });
        
        throw error;
      }
    },
    
    signOut: async () => {
      set({ isLoading: true, error: null });
      
      try {
        // Get use case
        const signOutUseCase = UseCaseFactory.create('SignOutUseCase', {
          authRepository: container.get('AuthRepository')
        });
        
        // Execute use case
        await signOutUseCase.execute();
        
        // Track event
        if (get().user) {
          telemetryService.trackEvent('user', 'sign_out', {
            userId: get().user.id
          });
        }
        
        // Update state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
        
        // Clear user ID in telemetry
        telemetryService.setUserId(null);
        
        return true;
      } catch (error) {
        loggingService.error('Failed to sign out', { error });
        
        set({
          isLoading: false,
          error: error.message || 'Failed to sign out'
        });
        
        throw error;
      }
    },
    
    getCurrentUser: async () => {
      set({ isLoading: true, error: null });
      
      try {
        // Get use case
        const getCurrentUserUseCase = UseCaseFactory.create('GetCurrentUserUseCase', {
          userRepository: container.get('UserRepository')
        });
        
        // Execute use case
        const user = await getCurrentUserUseCase.execute();
        
        // Update state
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false
        });
        
        // Set user ID in telemetry
        if (user) {
          telemetryService.setUserId(user.id);
        }
        
        return user;
      } catch (error) {
        loggingService.error('Failed to get current user', { error });
        
        set({
          isLoading: false,
          error: error.message || 'Failed to get current user'
        });
        
        throw error;
      }
    },
    
    updateUserPreferences: async (preferences) => {
      set({ isLoading: true, error: null });
      
      try {
        // Get current user
        const { user } = get();
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Get use case
        const updateUserPreferencesUseCase = UseCaseFactory.create('UpdateUserPreferencesUseCase', {
          userRepository: container.get('UserRepository')
        });
        
        // Execute use case
        const updatedUser = await updateUserPreferencesUseCase.execute({
          userId: user.id,
          preferences
        });
        
        // Update state
        set({
          user: updatedUser,
          isLoading: false
        });
        
        // Track event
        telemetryService.trackEvent('user', 'update_preferences', {
          userId: user.id
        });
        
        return updatedUser;
      } catch (error) {
        loggingService.error('Failed to update user preferences', { error, preferences });
        
        set({
          isLoading: false,
          error: error.message || 'Failed to update user preferences'
        });
        
        throw error;
      }
    },
    
    addToWatchlist: async (mediaId) => {
      set({ isLoading: true, error: null });
      
      try {
        // Get current user
        const { user } = get();
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Get use case
        const addToWatchlistUseCase = UseCaseFactory.create('AddToWatchlistUseCase', {
          userRepository: container.get('UserRepository')
        });
        
        // Execute use case
        const success = await addToWatchlistUseCase.execute({
          userId: user.id,
          mediaId
        });
        
        if (success) {
          // Update state
          set({
            user: {
              ...user,
              watchlist: [...user.watchlist, mediaId]
            },
            isLoading: false
          });
          
          // Track event
          telemetryService.trackEvent('user', 'add_to_watchlist', {
            userId: user.id,
            mediaId
          });
        } else {
          set({ isLoading: false });
        }
        
        return success;
      } catch (error) {
        loggingService.error('Failed to add to watchlist', { error, mediaId });
        
        set({
          isLoading: false,
          error: error.message || 'Failed to add to watchlist'
        });
        
        throw error;
      }
    },
    
    removeFromWatchlist: async (mediaId) => {
      set({ isLoading: true, error: null });
      
      try {
        // Get current user
        const { user } = get();
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Get use case
        const removeFromWatchlistUseCase = UseCaseFactory.create('RemoveFromWatchlistUseCase', {
          userRepository: container.get('UserRepository')
        });
        
        // Execute use case
        const success = await removeFromWatchlistUseCase.execute({
          userId: user.id,
          mediaId
        });
        
        if (success) {
          // Update state
          set({
            user: {
              ...user,
              watchlist: user.watchlist.filter(id => id !== mediaId)
            },
            isLoading: false
          });
          
          // Track event
          telemetryService.trackEvent('user', 'remove_from_watchlist', {
            userId: user.id,
            mediaId
          });
        } else {
          set({ isLoading: false });
        }
        
        return success;
      } catch (error) {
        loggingService.error('Failed to remove from watchlist', { error, mediaId });
        
        set({
          isLoading: false,
          error: error.message || 'Failed to remove from watchlist'
        });
        
        throw error;
      }
    },
    
    updateWatchProgress: async (mediaId, progress) => {
      try {
        // Get current user
        const { user } = get();
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        // Get use case
        const updateWatchProgressUseCase = UseCaseFactory.create('UpdateWatchProgressUseCase', {
          userRepository: container.get('UserRepository')
        });
        
        // Execute use case
        const updatedProgress = await updateWatchProgressUseCase.execute({
          userId: user.id,
          progress: {
            mediaId,
            ...progress
          }
        });
        
        // Update state
        const watchHistory = [...user.watchHistory];
        const existingIndex = watchHistory.findIndex(item => item.mediaId === mediaId);
        
        if (existingIndex >= 0) {
          watchHistory[existingIndex] = {
            ...watchHistory[existingIndex],
            ...updatedProgress
          };
        } else {
          watchHistory.push(updatedProgress);
        }
        
        set({
          user: {
            ...user,
            watchHistory
          }
        });
        
        return updatedProgress;
      } catch (error) {
        loggingService.error('Failed to update watch progress', { error, mediaId, progress });
        throw error;
      }
    },
    
    clearError: () => {
      set({ error: null });
    }
  }),
  
  // Selectors
  {
    user: (state) => state.user,
    isAuthenticated: (state) => state.isAuthenticated,
    isLoading: (state) => state.isLoading,
    error: (state) => state.error,
    watchlist: (state) => state.user?.watchlist || [],
    watchHistory: (state) => state.user?.watchHistory || [],
    preferences: (state) => state.user?.preferences || {}
  },
  
  // Options
  {
    persist: true,
    name: 'user'
  }
);

export const {
  useStore,
  useUser,
  useIsAuthenticated,
  useIsLoading,
  useError,
  useWatchlist,
  useWatchHistory,
  usePreferences
} = userStore;

export default userStore;
