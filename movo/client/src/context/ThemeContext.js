/**
 * Theme Context for Movo
 * Provides theme management with system preference detection
 * 
 * @author zophlic
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import analyticsService, { EVENT_CATEGORIES } from '../services/analyticsService';

// Theme options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Create context
const ThemeContext = createContext();

/**
 * Theme Provider Component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Provider component
 */
export const ThemeProvider = ({ children }) => {
  // State for theme preference
  const [themePreference, setThemePreference] = useState(THEMES.SYSTEM);
  
  // State for actual theme (light or dark, not system)
  const [activeTheme, setActiveTheme] = useState(THEMES.DARK);
  
  // State for transition animation
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Get system theme preference
  const getSystemTheme = useCallback(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 
      THEMES.DARK : THEMES.LIGHT;
  }, []);
  
  // Update active theme based on preference
  const updateActiveTheme = useCallback(() => {
    if (themePreference === THEMES.SYSTEM) {
      setActiveTheme(getSystemTheme());
    } else {
      setActiveTheme(themePreference);
    }
  }, [themePreference, getSystemTheme]);
  
  // Set theme preference
  const setTheme = useCallback((theme) => {
    if (!Object.values(THEMES).includes(theme)) {
      console.error(`Invalid theme: ${theme}`);
      return;
    }
    
    // Start transition animation
    setIsTransitioning(true);
    
    // Set theme preference
    setThemePreference(theme);
    
    // Save to localStorage
    try {
      localStorage.setItem('movo_theme_preference', theme);
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
    
    // Track theme change
    analyticsService.trackEvent(
      EVENT_CATEGORIES.USER,
      'theme_change',
      {
        theme,
        previousTheme: themePreference
      }
    );
    
    // End transition animation after a delay
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  }, [themePreference]);
  
  // Toggle between light and dark themes
  const toggleTheme = useCallback(() => {
    if (activeTheme === THEMES.DARK) {
      setTheme(THEMES.LIGHT);
    } else {
      setTheme(THEMES.DARK);
    }
  }, [activeTheme, setTheme]);
  
  // Load saved theme preference on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('movo_theme_preference');
      
      if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
        setThemePreference(savedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme preference', error);
    }
  }, []);
  
  // Update active theme when preference changes
  useEffect(() => {
    updateActiveTheme();
  }, [themePreference, updateActiveTheme]);
  
  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (themePreference === THEMES.SYSTEM) {
        updateActiveTheme();
      }
    };
    
    // Add listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }
    
    // Clean up
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [themePreference, updateActiveTheme]);
  
  // Apply theme to document
  useEffect(() => {
    // Remove previous theme classes
    document.documentElement.classList.remove(THEMES.LIGHT, THEMES.DARK);
    
    // Add current theme class
    document.documentElement.classList.add(activeTheme);
    
    // Set meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        activeTheme === THEMES.DARK ? '#121212' : '#ffffff'
      );
    }
  }, [activeTheme]);
  
  // Context value
  const contextValue = {
    themePreference,
    activeTheme,
    isTransitioning,
    setTheme,
    toggleTheme,
    isDarkMode: activeTheme === THEMES.DARK
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook to use theme context
 * @returns {Object} Theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeContext;
