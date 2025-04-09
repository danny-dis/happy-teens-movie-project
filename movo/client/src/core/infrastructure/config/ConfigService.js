/**
 * Configuration Service for Movo
 * Provides centralized configuration management
 * 
 * @author zophlic
 */

import loggingService from '../logging/LoggingService';

/**
 * Configuration service class
 */
export class ConfigService {
  constructor() {
    this.config = {};
    this.listeners = new Map();
    
    // Bind methods
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.load = this.load.bind(this);
    this.save = this.save.bind(this);
    this.onChange = this.onChange.bind(this);
    this.offChange = this.offChange.bind(this);
    
    // Load initial config
    this._loadInitialConfig();
  }
  
  /**
   * Get a configuration value
   * @param {string} key - Configuration key
   * @param {any} defaultValue - Default value
   * @returns {any} Configuration value
   */
  get(key, defaultValue = null) {
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value === undefined || value === null || typeof value !== 'object') {
        return defaultValue;
      }
      
      value = value[k];
    }
    
    return value === undefined ? defaultValue : value;
  }
  
  /**
   * Set a configuration value
   * @param {string} key - Configuration key
   * @param {any} value - Configuration value
   */
  set(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    let obj = this.config;
    
    for (const k of keys) {
      if (obj[k] === undefined || obj[k] === null || typeof obj[k] !== 'object') {
        obj[k] = {};
      }
      
      obj = obj[k];
    }
    
    const oldValue = obj[lastKey];
    obj[lastKey] = value;
    
    // Notify listeners
    this._notifyListeners(key, value, oldValue);
    
    // Save to localStorage
    this.save();
  }
  
  /**
   * Load configuration from JSON
   * @param {Object} config - Configuration object
   */
  load(config) {
    this.config = { ...config };
    
    // Notify listeners
    this._notifyListeners('*', this.config, null);
    
    // Save to localStorage
    this.save();
  }
  
  /**
   * Save configuration to localStorage
   */
  save() {
    try {
      localStorage.setItem('movo_config', JSON.stringify(this.config));
    } catch (error) {
      loggingService.error('Failed to save configuration', { error });
    }
  }
  
  /**
   * Add configuration change listener
   * @param {string} key - Configuration key
   * @param {Function} listener - Change listener
   */
  onChange(key, listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key).add(listener);
  }
  
  /**
   * Remove configuration change listener
   * @param {string} key - Configuration key
   * @param {Function} listener - Change listener
   */
  offChange(key, listener) {
    if (!this.listeners.has(key)) {
      return;
    }
    
    this.listeners.get(key).delete(listener);
    
    if (this.listeners.get(key).size === 0) {
      this.listeners.delete(key);
    }
  }
  
  /**
   * Load initial configuration
   * @private
   */
  _loadInitialConfig() {
    // Load from environment variables
    const envConfig = {
      api: {
        baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
        timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000', 10)
      },
      app: {
        name: process.env.REACT_APP_NAME || 'Movo',
        version: process.env.REACT_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      features: {
        chimeraMode: process.env.REACT_APP_FEATURE_CHIMERA_MODE !== 'false',
        offlineMode: process.env.REACT_APP_FEATURE_OFFLINE_MODE !== 'false',
        p2pStreaming: process.env.REACT_APP_FEATURE_P2P_STREAMING !== 'false',
        analytics: process.env.REACT_APP_FEATURE_ANALYTICS !== 'false',
        experimentalFeatures: process.env.REACT_APP_FEATURE_EXPERIMENTAL === 'true'
      },
      ui: {
        theme: 'system',
        language: 'en',
        animations: true,
        reducedMotion: false
      },
      player: {
        defaultQuality: 'auto',
        autoplay: true,
        muted: false,
        volume: 1,
        playbackRate: 1,
        subtitles: true,
        subtitlesLanguage: 'en'
      },
      storage: {
        maxCacheSize: parseInt(process.env.REACT_APP_MAX_CACHE_SIZE || '1073741824', 10), // 1GB
        persistUserPreferences: true,
        persistWatchProgress: true
      }
    };
    
    // Load from localStorage
    try {
      const savedConfig = localStorage.getItem('movo_config');
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        
        // Merge with environment config
        this.config = this._deepMerge(envConfig, parsedConfig);
      } else {
        this.config = envConfig;
      }
    } catch (error) {
      loggingService.error('Failed to load configuration', { error });
      this.config = envConfig;
    }
  }
  
  /**
   * Deep merge objects
   * @private
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  _deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = this._deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }
  
  /**
   * Notify configuration change listeners
   * @private
   * @param {string} key - Configuration key
   * @param {any} value - New value
   * @param {any} oldValue - Old value
   */
  _notifyListeners(key, value, oldValue) {
    // Notify specific key listeners
    if (this.listeners.has(key)) {
      for (const listener of this.listeners.get(key)) {
        try {
          listener(value, oldValue, key);
        } catch (error) {
          loggingService.error('Error in configuration change listener', { error, key });
        }
      }
    }
    
    // Notify wildcard listeners
    if (this.listeners.has('*') && key !== '*') {
      for (const listener of this.listeners.get('*')) {
        try {
          listener(this.config, null, key);
        } catch (error) {
          loggingService.error('Error in configuration change listener', { error, key });
        }
      }
    }
    
    // Notify parent key listeners
    const keyParts = key.split('.');
    while (keyParts.length > 1) {
      keyParts.pop();
      const parentKey = keyParts.join('.');
      
      if (this.listeners.has(parentKey)) {
        const parentValue = this.get(parentKey);
        
        for (const listener of this.listeners.get(parentKey)) {
          try {
            listener(parentValue, null, key);
          } catch (error) {
            loggingService.error('Error in configuration change listener', { error, key: parentKey });
          }
        }
      }
    }
  }
}

// Create singleton instance
const configService = new ConfigService();

export default configService;
