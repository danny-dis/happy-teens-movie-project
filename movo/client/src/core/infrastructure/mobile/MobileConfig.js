/**
 * Mobile Configuration for Movo
 * Provides mobile-specific configuration and utilities
 * 
 * @author zophlic
 */

import loggingService from '../logging/LoggingService';
import telemetryService from '../telemetry/TelemetryService';
import configService from '../config/ConfigService';

/**
 * Mobile configuration class
 */
class MobileConfig {
  constructor() {
    this.isMobileDevice = this._detectMobileDevice();
    this.isNativeApp = this._detectNativeApp();
    this.platform = this._detectPlatform();
    this.deviceInfo = this._getDeviceInfo();
    
    // Mobile-specific settings
    this.settings = {
      enableHapticFeedback: configService.get('mobile.hapticFeedback', true),
      enableGestureNavigation: configService.get('mobile.gestureNavigation', true),
      enablePictureInPicture: configService.get('mobile.pictureInPicture', true),
      enableBackgroundPlayback: configService.get('mobile.backgroundPlayback', true),
      enableOfflineMode: configService.get('mobile.offlineMode', true),
      enablePushNotifications: configService.get('mobile.pushNotifications', true),
      enableBatteryOptimizations: configService.get('mobile.batteryOptimizations', true),
      maxVideoQuality: configService.get('mobile.maxVideoQuality', 'auto'),
      downloadQuality: configService.get('mobile.downloadQuality', 'HD'),
      downloadNetworkRestriction: configService.get('mobile.downloadNetworkRestriction', 'wifi')
    };
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.applyMobileOptimizations = this.applyMobileOptimizations.bind(this);
    this.setupGestureNavigation = this.setupGestureNavigation.bind(this);
    this.setupHapticFeedback = this.setupHapticFeedback.bind(this);
    this.setupNativeIntegration = this.setupNativeIntegration.bind(this);
    
    // Initialize
    this.initialize();
  }
  
  /**
   * Initialize mobile configuration
   */
  initialize() {
    loggingService.info('Initializing mobile configuration', {
      isMobileDevice: this.isMobileDevice,
      isNativeApp: this.isNativeApp,
      platform: this.platform
    });
    
    try {
      // Apply mobile optimizations
      if (this.isMobileDevice) {
        this.applyMobileOptimizations();
      }
      
      // Setup gesture navigation
      if (this.settings.enableGestureNavigation) {
        this.setupGestureNavigation();
      }
      
      // Setup haptic feedback
      if (this.settings.enableHapticFeedback) {
        this.setupHapticFeedback();
      }
      
      // Setup native integration
      if (this.isNativeApp) {
        this.setupNativeIntegration();
      }
      
      // Track event
      telemetryService.trackEvent('mobile', 'initialize', {
        isMobileDevice: this.isMobileDevice,
        isNativeApp: this.isNativeApp,
        platform: this.platform,
        settings: this.settings
      });
      
      loggingService.info('Mobile configuration initialized');
    } catch (error) {
      loggingService.error('Failed to initialize mobile configuration', { error });
    }
  }
  
  /**
   * Detect if the device is mobile
   * @private
   * @returns {boolean} Whether the device is mobile
   */
  _detectMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  /**
   * Detect if the app is running in a native wrapper
   * @private
   * @returns {boolean} Whether the app is running in a native wrapper
   */
  _detectNativeApp() {
    // Check for Capacitor
    if (window.Capacitor && window.Capacitor.isNative) {
      return true;
    }
    
    // Check for Cordova
    if (window.cordova) {
      return true;
    }
    
    // Check for React Native
    if (window.ReactNativeWebView) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Detect the platform
   * @private
   * @returns {string} The platform (android, ios, web)
   */
  _detectPlatform() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/android/i.test(userAgent)) {
      return 'android';
    }
    
    if (/iphone|ipad|ipod/i.test(userAgent)) {
      return 'ios';
    }
    
    return 'web';
  }
  
  /**
   * Get device information
   * @private
   * @returns {Object} Device information
   */
  _getDeviceInfo() {
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      pixelRatio: window.devicePixelRatio || 1,
      orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown',
      connectionType: 'unknown'
    };
    
    // Get connection type if available
    if (navigator.connection) {
      info.connectionType = navigator.connection.effectiveType || navigator.connection.type || 'unknown';
      info.downlink = navigator.connection.downlink;
      info.rtt = navigator.connection.rtt;
    }
    
    return info;
  }
  
  /**
   * Apply mobile optimizations
   */
  applyMobileOptimizations() {
    try {
      // Add mobile-specific meta tags
      const metaTags = [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'mobile-web-app-capable', content: 'yes' }
      ];
      
      metaTags.forEach(tag => {
        let metaTag = document.querySelector(`meta[name="${tag.name}"]`);
        
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.name = tag.name;
          document.head.appendChild(metaTag);
        }
        
        metaTag.content = tag.content;
      });
      
      // Add mobile-specific styles
      const style = document.createElement('style');
      style.textContent = `
        * {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        
        body {
          overscroll-behavior: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        input, textarea {
          -webkit-user-select: auto;
          user-select: auto;
        }
        
        /* Optimize scrolling */
        .scroll-container {
          -webkit-overflow-scrolling: touch;
          scroll-behavior: smooth;
        }
        
        /* Optimize buttons for touch */
        button, .button, [role="button"] {
          min-height: 44px;
          min-width: 44px;
        }
      `;
      document.head.appendChild(style);
      
      // Apply battery optimizations
      if (this.settings.enableBatteryOptimizations) {
        // Reduce animation complexity
        document.documentElement.classList.add('battery-optimized');
        
        // Add battery optimization styles
        const batteryStyle = document.createElement('style');
        batteryStyle.textContent = `
          .battery-optimized * {
            transition-duration: 0.1s !important;
          }
          
          .battery-optimized video:not([data-high-quality]) {
            max-resolution: 720p;
          }
        `;
        document.head.appendChild(batteryStyle);
      }
      
      loggingService.info('Mobile optimizations applied');
    } catch (error) {
      loggingService.error('Failed to apply mobile optimizations', { error });
    }
  }
  
  /**
   * Setup gesture navigation
   */
  setupGestureNavigation() {
    try {
      // Add swipe detection
      let touchStartX = 0;
      let touchStartY = 0;
      let touchEndX = 0;
      let touchEndY = 0;
      
      document.addEventListener('touchstart', (event) => {
        touchStartX = event.changedTouches[0].screenX;
        touchStartY = event.changedTouches[0].screenY;
      }, { passive: true });
      
      document.addEventListener('touchend', (event) => {
        touchEndX = event.changedTouches[0].screenX;
        touchEndY = event.changedTouches[0].screenY;
        
        // Calculate swipe direction
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Minimum swipe distance (in pixels)
        const minSwipeDistance = 100;
        
        // Detect horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            // Right swipe
            document.dispatchEvent(new CustomEvent('swiperight'));
          } else {
            // Left swipe
            document.dispatchEvent(new CustomEvent('swipeleft'));
          }
        }
        
        // Detect vertical swipe
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0) {
            // Down swipe
            document.dispatchEvent(new CustomEvent('swipedown'));
          } else {
            // Up swipe
            document.dispatchEvent(new CustomEvent('swipeup'));
          }
        }
      }, { passive: true });
      
      loggingService.info('Gesture navigation setup');
    } catch (error) {
      loggingService.error('Failed to setup gesture navigation', { error });
    }
  }
  
  /**
   * Setup haptic feedback
   */
  setupHapticFeedback() {
    try {
      // Check if vibration API is available
      if ('vibrate' in navigator) {
        // Define haptic feedback patterns
        const hapticPatterns = {
          light: [10],
          medium: [20],
          heavy: [30],
          success: [10, 30, 10],
          warning: [30, 50, 30],
          error: [50, 100, 50]
        };
        
        // Create haptic feedback function
        window.hapticFeedback = (pattern) => {
          if (this.settings.enableHapticFeedback) {
            const vibrationPattern = hapticPatterns[pattern] || hapticPatterns.medium;
            navigator.vibrate(vibrationPattern);
          }
        };
        
        // Add haptic feedback to buttons
        document.addEventListener('click', (event) => {
          if (event.target.closest('button, .button, [role="button"]')) {
            window.hapticFeedback('light');
          }
        }, { passive: true });
        
        loggingService.info('Haptic feedback setup');
      } else {
        loggingService.warn('Vibration API not available, haptic feedback disabled');
      }
    } catch (error) {
      loggingService.error('Failed to setup haptic feedback', { error });
    }
  }
  
  /**
   * Setup native integration
   */
  setupNativeIntegration() {
    try {
      // Setup Capacitor integration
      if (window.Capacitor && window.Capacitor.isNative) {
        // Import Capacitor plugins
        const { StatusBar, SplashScreen, App } = window.Capacitor.Plugins;
        
        // Configure status bar
        if (StatusBar) {
          StatusBar.setStyle({ style: 'DARK' });
          
          // Set status bar color based on theme
          const isDarkMode = document.documentElement.classList.contains('dark-theme');
          StatusBar.setBackgroundColor({ color: isDarkMode ? '#121212' : '#ffffff' });
        }
        
        // Hide splash screen
        if (SplashScreen) {
          SplashScreen.hide();
        }
        
        // Handle app state changes
        if (App) {
          App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
              // App came to foreground
              document.dispatchEvent(new CustomEvent('app:resume'));
            } else {
              // App went to background
              document.dispatchEvent(new CustomEvent('app:pause'));
            }
          });
        }
      }
      
      // Setup Cordova integration
      if (window.cordova) {
        document.addEventListener('deviceready', () => {
          // Handle back button
          document.addEventListener('backbutton', (event) => {
            event.preventDefault();
            document.dispatchEvent(new CustomEvent('app:backbutton'));
          }, false);
          
          // Handle pause and resume
          document.addEventListener('pause', () => {
            document.dispatchEvent(new CustomEvent('app:pause'));
          }, false);
          
          document.addEventListener('resume', () => {
            document.dispatchEvent(new CustomEvent('app:resume'));
          }, false);
        }, false);
      }
      
      loggingService.info('Native integration setup');
    } catch (error) {
      loggingService.error('Failed to setup native integration', { error });
    }
  }
  
  /**
   * Get mobile configuration
   * @returns {Object} Mobile configuration
   */
  getConfig() {
    return {
      isMobileDevice: this.isMobileDevice,
      isNativeApp: this.isNativeApp,
      platform: this.platform,
      deviceInfo: this.deviceInfo,
      settings: { ...this.settings }
    };
  }
  
  /**
   * Update mobile settings
   * @param {Object} newSettings - New settings
   */
  updateSettings(newSettings) {
    this.settings = {
      ...this.settings,
      ...newSettings
    };
    
    // Save settings to config service
    Object.entries(newSettings).forEach(([key, value]) => {
      configService.set(`mobile.${key}`, value);
    });
    
    // Track event
    telemetryService.trackEvent('mobile', 'update_settings', {
      settings: newSettings
    });
    
    loggingService.info('Mobile settings updated', { settings: newSettings });
  }
}

// Create singleton instance
const mobileConfig = new MobileConfig();

export default mobileConfig;
