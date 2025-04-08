/**
 * Resource Awareness Utilities
 * 
 * Provides utilities for adapting to device resources and conditions:
 * - Battery status monitoring
 * - Visibility detection
 * - Memory pressure detection
 * - Network condition awareness
 * 
 * @author zophlic
 */

/**
 * Battery status monitor
 */
export class BatteryMonitor {
  constructor() {
    this.battery = null;
    this.listeners = new Set();
    this.isInitialized = false;
    this.lastStatus = {
      level: 1.0,
      charging: true,
      chargingTime: 0,
      dischargingTime: Infinity
    };
  }
  
  /**
   * Initialize battery monitoring
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Check if Battery API is supported
      if (!navigator.getBattery) {
        console.warn('Battery API not supported');
        return false;
      }
      
      // Get battery manager
      this.battery = await navigator.getBattery();
      
      // Set up event listeners
      this.battery.addEventListener('levelchange', () => this._notifyListeners());
      this.battery.addEventListener('chargingchange', () => this._notifyListeners());
      this.battery.addEventListener('chargingtimechange', () => this._notifyListeners());
      this.battery.addEventListener('dischargingtimechange', () => this._notifyListeners());
      
      // Update last status
      this._updateStatus();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize battery monitoring:', error);
      return false;
    }
  }
  
  /**
   * Add a listener for battery status changes
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
    
    // Notify the new listener of the current status
    if (this.isInitialized) {
      listener(this.getStatus());
    }
  }
  
  /**
   * Remove a listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }
  
  /**
   * Get current battery status
   * @returns {Object} Battery status
   */
  getStatus() {
    if (!this.isInitialized) {
      return this.lastStatus;
    }
    
    return {
      level: this.battery.level,
      charging: this.battery.charging,
      chargingTime: this.battery.chargingTime,
      dischargingTime: this.battery.dischargingTime,
      // Add derived properties
      isLow: this.battery.level < 0.2,
      isCritical: this.battery.level < 0.1,
      powerSaveRecommended: this.battery.level < 0.3 && !this.battery.charging
    };
  }
  
  /**
   * Update last status
   * @private
   */
  _updateStatus() {
    if (!this.isInitialized) return;
    
    this.lastStatus = {
      level: this.battery.level,
      charging: this.battery.charging,
      chargingTime: this.battery.chargingTime,
      dischargingTime: this.battery.dischargingTime,
      isLow: this.battery.level < 0.2,
      isCritical: this.battery.level < 0.1,
      powerSaveRecommended: this.battery.level < 0.3 && !this.battery.charging
    };
  }
  
  /**
   * Notify listeners of status change
   * @private
   */
  _notifyListeners() {
    this._updateStatus();
    
    for (const listener of this.listeners) {
      try {
        listener(this.lastStatus);
      } catch (error) {
        console.error('Error in battery status listener:', error);
      }
    }
  }
}

/**
 * Visibility monitor
 */
export class VisibilityMonitor {
  constructor() {
    this.listeners = new Set();
    this.isInitialized = false;
    this.isVisible = !document.hidden;
  }
  
  /**
   * Initialize visibility monitoring
   * @returns {boolean} Whether initialization was successful
   */
  initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Set up event listener
      document.addEventListener('visibilitychange', () => this._handleVisibilityChange());
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize visibility monitoring:', error);
      return false;
    }
  }
  
  /**
   * Add a listener for visibility changes
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
    
    // Notify the new listener of the current status
    if (this.isInitialized) {
      listener(this.isVisible);
    }
  }
  
  /**
   * Remove a listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }
  
  /**
   * Get current visibility status
   * @returns {boolean} Whether the page is visible
   */
  isPageVisible() {
    return this.isVisible;
  }
  
  /**
   * Handle visibility change
   * @private
   */
  _handleVisibilityChange() {
    this.isVisible = !document.hidden;
    
    for (const listener of this.listeners) {
      try {
        listener(this.isVisible);
      } catch (error) {
        console.error('Error in visibility change listener:', error);
      }
    }
  }
}

/**
 * Memory pressure monitor
 */
export class MemoryMonitor {
  constructor() {
    this.listeners = new Set();
    this.isInitialized = false;
    this.memoryInfo = null;
    this.monitorInterval = null;
    this.lastPressureLevel = 'normal';
  }
  
  /**
   * Initialize memory monitoring
   * @param {Object} options - Initialization options
   * @returns {boolean} Whether initialization was successful
   */
  initialize(options = {}) {
    if (this.isInitialized) return true;
    
    try {
      // Check if Performance API with memory is supported
      if (!performance.memory) {
        console.warn('Memory API not supported');
        return false;
      }
      
      // Default options
      const defaultOptions = {
        interval: 10000, // 10 seconds
        highThreshold: 0.7, // 70% of memory limit
        criticalThreshold: 0.85 // 85% of memory limit
      };
      
      // Merge options
      const opts = { ...defaultOptions, ...options };
      
      // Start monitoring
      this.monitorInterval = setInterval(() => this._checkMemory(opts), opts.interval);
      
      // Initial check
      this._checkMemory(opts);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize memory monitoring:', error);
      return false;
    }
  }
  
  /**
   * Add a listener for memory pressure changes
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
    
    // Notify the new listener of the current status
    if (this.isInitialized && this.memoryInfo) {
      listener(this.getPressureLevel(), this.memoryInfo);
    }
  }
  
  /**
   * Remove a listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }
  
  /**
   * Get current memory info
   * @returns {Object|null} Memory info or null if not available
   */
  getMemoryInfo() {
    if (!this.isInitialized || !performance.memory) {
      return null;
    }
    
    return {
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      usageRatio: performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit
    };
  }
  
  /**
   * Get current memory pressure level
   * @returns {string} Pressure level ('normal', 'high', or 'critical')
   */
  getPressureLevel() {
    return this.lastPressureLevel;
  }
  
  /**
   * Check memory usage
   * @private
   * @param {Object} options - Options
   */
  _checkMemory(options) {
    if (!performance.memory) return;
    
    // Get memory info
    this.memoryInfo = this.getMemoryInfo();
    
    // Determine pressure level
    let pressureLevel = 'normal';
    
    if (this.memoryInfo.usageRatio >= options.criticalThreshold) {
      pressureLevel = 'critical';
    } else if (this.memoryInfo.usageRatio >= options.highThreshold) {
      pressureLevel = 'high';
    }
    
    // Notify listeners if pressure level changed
    if (pressureLevel !== this.lastPressureLevel) {
      this.lastPressureLevel = pressureLevel;
      
      for (const listener of this.listeners) {
        try {
          listener(pressureLevel, this.memoryInfo);
        } catch (error) {
          console.error('Error in memory pressure listener:', error);
        }
      }
    }
  }
  
  /**
   * Dispose of resources
   */
  dispose() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    
    this.listeners.clear();
    this.isInitialized = false;
  }
}

/**
 * Network condition monitor
 */
export class NetworkMonitor {
  constructor() {
    this.listeners = new Set();
    this.isInitialized = false;
    this.connection = null;
    this.lastConnectionType = 'unknown';
  }
  
  /**
   * Initialize network monitoring
   * @returns {boolean} Whether initialization was successful
   */
  initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Check if Network Information API is supported
      if (!navigator.connection) {
        console.warn('Network Information API not supported');
        return false;
      }
      
      this.connection = navigator.connection;
      
      // Set up event listener
      this.connection.addEventListener('change', () => this._handleConnectionChange());
      
      // Initial check
      this._handleConnectionChange();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize network monitoring:', error);
      return false;
    }
  }
  
  /**
   * Add a listener for network condition changes
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
    
    // Notify the new listener of the current status
    if (this.isInitialized && this.connection) {
      listener(this.getConnectionInfo());
    }
  }
  
  /**
   * Remove a listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }
  
  /**
   * Get current connection info
   * @returns {Object} Connection info
   */
  getConnectionInfo() {
    if (!this.isInitialized || !this.connection) {
      return {
        type: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false,
        isOffline: !navigator.onLine,
        isMetered: false,
        isLowBandwidth: false
      };
    }
    
    return {
      type: this.connection.type || 'unknown',
      effectiveType: this.connection.effectiveType || 'unknown',
      downlink: this.connection.downlink || 0,
      rtt: this.connection.rtt || 0,
      saveData: !!this.connection.saveData,
      isOffline: !navigator.onLine,
      isMetered: this.connection.type === 'cellular',
      isLowBandwidth: this.connection.downlink < 1.0 || this.connection.effectiveType === 'slow-2g' || this.connection.effectiveType === '2g'
    };
  }
  
  /**
   * Handle connection change
   * @private
   */
  _handleConnectionChange() {
    const connectionInfo = this.getConnectionInfo();
    
    // Notify listeners if connection type changed
    if (connectionInfo.type !== this.lastConnectionType) {
      this.lastConnectionType = connectionInfo.type;
      
      for (const listener of this.listeners) {
        try {
          listener(connectionInfo);
        } catch (error) {
          console.error('Error in network condition listener:', error);
        }
      }
    }
  }
}

/**
 * Resource manager that combines all monitors
 */
export class ResourceManager {
  constructor() {
    this.batteryMonitor = new BatteryMonitor();
    this.visibilityMonitor = new VisibilityMonitor();
    this.memoryMonitor = new MemoryMonitor();
    this.networkMonitor = new NetworkMonitor();
    
    this.listeners = new Set();
    this.isInitialized = false;
    
    this.resourceState = {
      battery: null,
      visibility: true,
      memory: 'normal',
      network: null,
      powerSaveMode: false
    };
  }
  
  /**
   * Initialize resource monitoring
   * @param {Object} options - Initialization options
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(options = {}) {
    if (this.isInitialized) return true;
    
    try {
      // Initialize monitors
      const batteryInitialized = await this.batteryMonitor.initialize();
      const visibilityInitialized = this.visibilityMonitor.initialize();
      const memoryInitialized = this.memoryMonitor.initialize(options.memory);
      const networkInitialized = this.networkMonitor.initialize();
      
      // Set up listeners
      if (batteryInitialized) {
        this.batteryMonitor.addListener(status => this._handleBatteryChange(status));
      }
      
      if (visibilityInitialized) {
        this.visibilityMonitor.addListener(isVisible => this._handleVisibilityChange(isVisible));
      }
      
      if (memoryInitialized) {
        this.memoryMonitor.addListener((level, info) => this._handleMemoryChange(level, info));
      }
      
      if (networkInitialized) {
        this.networkMonitor.addListener(info => this._handleNetworkChange(info));
      }
      
      // Update initial state
      this._updateResourceState();
      
      this.isInitialized = true;
      return batteryInitialized || visibilityInitialized || memoryInitialized || networkInitialized;
    } catch (error) {
      console.error('Failed to initialize resource monitoring:', error);
      return false;
    }
  }
  
  /**
   * Add a listener for resource state changes
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
    
    // Notify the new listener of the current state
    if (this.isInitialized) {
      listener(this.getResourceState());
    }
  }
  
  /**
   * Remove a listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }
  
  /**
   * Get current resource state
   * @returns {Object} Resource state
   */
  getResourceState() {
    return { ...this.resourceState };
  }
  
  /**
   * Get recommended quality level based on resource state
   * @returns {string} Recommended quality level ('low', 'medium', or 'high')
   */
  getRecommendedQuality() {
    const state = this.resourceState;
    
    // Critical conditions - use low quality
    if (
      (state.battery && state.battery.isCritical) ||
      state.memory === 'critical' ||
      (state.network && state.network.isLowBandwidth) ||
      state.powerSaveMode
    ) {
      return 'low';
    }
    
    // Challenging conditions - use medium quality
    if (
      (state.battery && state.battery.isLow) ||
      state.memory === 'high' ||
      (state.network && state.network.isMetered) ||
      !state.visibility
    ) {
      return 'medium';
    }
    
    // Good conditions - use high quality
    return 'high';
  }
  
  /**
   * Get recommended render scale based on resource state
   * @returns {number} Recommended render scale (0.5-1.0)
   */
  getRecommendedRenderScale() {
    const quality = this.getRecommendedQuality();
    
    switch (quality) {
      case 'low':
        return 0.5;
      case 'medium':
        return 0.75;
      case 'high':
        return 1.0;
      default:
        return 0.75;
    }
  }
  
  /**
   * Handle battery status change
   * @private
   * @param {Object} status - Battery status
   */
  _handleBatteryChange(status) {
    this.resourceState.battery = status;
    this._updateResourceState();
  }
  
  /**
   * Handle visibility change
   * @private
   * @param {boolean} isVisible - Whether the page is visible
   */
  _handleVisibilityChange(isVisible) {
    this.resourceState.visibility = isVisible;
    this._updateResourceState();
  }
  
  /**
   * Handle memory pressure change
   * @private
   * @param {string} level - Pressure level
   * @param {Object} info - Memory info
   */
  _handleMemoryChange(level, info) {
    this.resourceState.memory = level;
    this._updateResourceState();
  }
  
  /**
   * Handle network condition change
   * @private
   * @param {Object} info - Connection info
   */
  _handleNetworkChange(info) {
    this.resourceState.network = info;
    this._updateResourceState();
  }
  
  /**
   * Update resource state and notify listeners
   * @private
   */
  _updateResourceState() {
    // Check if device is in power save mode
    // This is a best-effort detection based on battery and other factors
    if (this.resourceState.battery) {
      this.resourceState.powerSaveMode = 
        this.resourceState.battery.powerSaveRecommended ||
        (this.resourceState.battery.level < 0.15 && !this.resourceState.battery.charging);
    }
    
    // Notify listeners
    for (const listener of this.listeners) {
      try {
        listener(this.getResourceState());
      } catch (error) {
        console.error('Error in resource state listener:', error);
      }
    }
  }
  
  /**
   * Dispose of resources
   */
  dispose() {
    this.memoryMonitor.dispose();
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Create singleton instance
export const resourceManager = new ResourceManager();
