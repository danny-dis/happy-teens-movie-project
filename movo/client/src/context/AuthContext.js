/**
 * Authentication Context for React
 * Provides authentication state and methods throughout the app
 * 
 * @author zophlic
 * @updated 2025
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService, { AUTH_EVENTS } from '../services/authService';

// Create context
const AuthContext = createContext(null);

/**
 * Authentication Provider Component
 * Wraps the app to provide authentication context
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const initialized = await authService.initialize();
        
        if (initialized && authService.isAuthenticated()) {
          setUser(authService.getCurrentUser());
          setIsAuthenticated(true);
          
          // Fetch fresh user info from server
          try {
            const freshUser = await authService.getUserInfo();
            setUser(freshUser);
          } catch (err) {
            console.warn('Failed to fetch fresh user info:', err.message);
          }
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for auth events
  useEffect(() => {
    const handleLogin = (event) => {
      setUser(event.user);
      setIsAuthenticated(true);
      setError(null);
    };

    const handleLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    };

    const handleSessionExpired = (event) => {
      setUser(null);
      setIsAuthenticated(false);
      setError(event.error || 'Session expired');
    };

    // Subscribe to events
    authService.addEventListener(AUTH_EVENTS.LOGIN, handleLogin);
    authService.addEventListener(AUTH_EVENTS.LOGOUT, handleLogout);
    authService.addEventListener(AUTH_EVENTS.SESSION_EXPIRED, handleSessionExpired);

    // Cleanup subscriptions
    return () => {
      authService.removeEventListener(AUTH_EVENTS.LOGIN, handleLogin);
      authService.removeEventListener(AUTH_EVENTS.LOGOUT, handleLogout);
      authService.removeEventListener(AUTH_EVENTS.SESSION_EXPIRED, handleSessionExpired);
    };
  }, []);

  // Login function
  const login = useCallback(async (username, password) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authService.login(username, password);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      setError(null);
      const user = await authService.register(userData);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Change password function
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.changePassword(currentPassword, newPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (profileData) => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedUser = await authService.updateProfile(profileData);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh user info
  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await authService.getUserInfo();
      setUser(freshUser);
      return freshUser;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      throw err;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    changePassword,
    updateProfile,
    refreshUser,
    clearError,
    authService
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 * @returns {Object} Authentication context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Higher-order component for protected routes
 * @param {Component} Component - Component to wrap
 * @returns {Component} Wrapped component with auth check
 */
export const withAuth = (Component) => {
  return function WithAuthComponent(props) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return <div>Loading...</div>; // Or a proper loading component
    }

    if (!isAuthenticated) {
      // Redirect to login or show login modal
      window.location.href = '/login';
      return null;
    }

    return <Component {...props} />;
  };
};

export default AuthContext;
