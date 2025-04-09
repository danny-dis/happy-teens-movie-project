/**
 * Theme Provider for Movo
 * Provides theme context for the application
 * 
 * @author zophlic
 */

import React, { useEffect } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { useTheme, useActiveTheme, THEME } from '../stores/settingsStore';
import telemetryService from '../../infrastructure/telemetry/TelemetryService';

// Light theme
const lightTheme = {
  // Colors
  primary: '#3498db',
  secondary: '#2ecc71',
  accent: '#f39c12',
  background: '#ffffff',
  surface: '#f8f9fa',
  text: '#212529',
  textSecondary: '#6c757d',
  border: '#dee2e6',
  error: '#e74c3c',
  success: '#2ecc71',
  warning: '#f1c40f',
  info: '#3498db',
  
  // Elevation
  elevation1: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  elevation2: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
  elevation3: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
  elevation4: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
  
  // Typography
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
  fontSizeSmall: '0.875rem',
  fontSizeNormal: '1rem',
  fontSizeMedium: '1.25rem',
  fontSizeLarge: '1.5rem',
  fontSizeXLarge: '2rem',
  fontWeightLight: 300,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  
  // Spacing
  spacingXSmall: '0.25rem',
  spacingSmall: '0.5rem',
  spacingMedium: '1rem',
  spacingLarge: '1.5rem',
  spacingXLarge: '2rem',
  
  // Border radius
  borderRadiusSmall: '0.25rem',
  borderRadiusMedium: '0.5rem',
  borderRadiusLarge: '1rem',
  borderRadiusXLarge: '2rem',
  
  // Transitions
  transitionFast: '0.15s',
  transitionNormal: '0.3s',
  transitionSlow: '0.5s',
  
  // Z-index
  zIndexDropdown: 100,
  zIndexSticky: 200,
  zIndexModal: 300,
  zIndexToast: 400,
  
  // Component specific
  headerBackground: 'rgba(255, 255, 255, 0.9)',
  cardBackground: '#ffffff',
  inputBackground: '#ffffff',
  inputBorder: '#ced4da',
  modalBackground: '#ffffff',
  modalBackdrop: 'rgba(0, 0, 0, 0.5)',
  tooltipBackground: '#212529',
  tooltipText: '#ffffff',
  
  // Chimera mode
  streamingModeColor: '#3498db',
  localModeColor: '#2ecc71'
};

// Dark theme
const darkTheme = {
  // Colors
  primary: '#3498db',
  secondary: '#2ecc71',
  accent: '#f39c12',
  background: '#121212',
  surface: '#1e1e1e',
  text: '#e9ecef',
  textSecondary: '#adb5bd',
  border: '#2d2d2d',
  error: '#e74c3c',
  success: '#2ecc71',
  warning: '#f1c40f',
  info: '#3498db',
  
  // Elevation
  elevation1: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4)',
  elevation2: '0 3px 6px rgba(0, 0, 0, 0.4), 0 3px 6px rgba(0, 0, 0, 0.5)',
  elevation3: '0 10px 20px rgba(0, 0, 0, 0.5), 0 6px 6px rgba(0, 0, 0, 0.5)',
  elevation4: '0 14px 28px rgba(0, 0, 0, 0.6), 0 10px 10px rgba(0, 0, 0, 0.5)',
  
  // Typography
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
  fontSizeSmall: '0.875rem',
  fontSizeNormal: '1rem',
  fontSizeMedium: '1.25rem',
  fontSizeLarge: '1.5rem',
  fontSizeXLarge: '2rem',
  fontWeightLight: 300,
  fontWeightNormal: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  
  // Spacing
  spacingXSmall: '0.25rem',
  spacingSmall: '0.5rem',
  spacingMedium: '1rem',
  spacingLarge: '1.5rem',
  spacingXLarge: '2rem',
  
  // Border radius
  borderRadiusSmall: '0.25rem',
  borderRadiusMedium: '0.5rem',
  borderRadiusLarge: '1rem',
  borderRadiusXLarge: '2rem',
  
  // Transitions
  transitionFast: '0.15s',
  transitionNormal: '0.3s',
  transitionSlow: '0.5s',
  
  // Z-index
  zIndexDropdown: 100,
  zIndexSticky: 200,
  zIndexModal: 300,
  zIndexToast: 400,
  
  // Component specific
  headerBackground: 'rgba(18, 18, 18, 0.9)',
  cardBackground: '#1e1e1e',
  inputBackground: '#2d2d2d',
  inputBorder: '#444444',
  modalBackground: '#1e1e1e',
  modalBackdrop: 'rgba(0, 0, 0, 0.7)',
  tooltipBackground: '#e9ecef',
  tooltipText: '#212529',
  
  // Chimera mode
  streamingModeColor: '#3498db',
  localModeColor: '#2ecc71'
};

/**
 * Theme provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Theme provider component
 */
const ThemeProvider = ({ children }) => {
  const theme = useTheme();
  const activeTheme = useActiveTheme();
  
  // Track theme changes
  useEffect(() => {
    telemetryService.trackEvent('ui', 'theme_applied', {
      theme: activeTheme
    });
  }, [activeTheme]);
  
  // Apply theme to meta theme-color
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        activeTheme === THEME.DARK ? '#121212' : '#ffffff'
      );
    }
  }, [activeTheme]);
  
  return (
    <StyledThemeProvider theme={activeTheme === THEME.DARK ? darkTheme : lightTheme}>
      {children}
    </StyledThemeProvider>
  );
};

export default ThemeProvider;
export { lightTheme, darkTheme };
