/**
 * Device Manager for Movo
 * Manages smart device integration and casting
 * 
 * @author zophlic
 */

import loggingService from '../logging/LoggingService';
import telemetryService from '../telemetry/TelemetryService';
import configService from '../config/ConfigService';
import { EventEmitter } from '../events/EventEmitter';

// Device types
export const DEVICE_TYPE = {
  CHROMECAST: 'chromecast',
  SMART_TV: 'smart_tv',
  ROKU: 'roku',
  FIRE_TV: 'fire_tv',
  APPLE_TV: 'apple_tv',
  GAME_CONSOLE: 'game_console',
  SPEAKER: 'speaker',
  OTHER: 'other'
};

// Connection states
export const CONNECTION_STATE = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error'
};

/**
 * Device Manager class
 */
class DeviceManager extends EventEmitter {
  constructor() {
    super();
    
    this.devices = [];
    this.activeDevice = null;
    this.connectionState = CONNECTION_STATE.DISCONNECTED;
    this.castingSession = null;
    this.castingMedia = null;
    
    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.discoverDevices = this.discoverDevices.bind(this);
    this.connectToDevice = this.connectToDevice.bind(this);
    this.disconnectFromDevice = this.disconnectFromDevice.bind(this);
    this.castMedia = this.castMedia.bind(this);
    this.stopCasting = this.stopCasting.bind(this);
    this.getDevices = this.getDevices.bind(this);
    this.getActiveDevice = this.getActiveDevice.bind(this);
    this.getConnectionState = this.getConnectionState.bind(this);
    
    // Initialize if enabled
    if (configService.get('devices.enabled', true)) {
      this.initialize();
    }
  }
  
  /**
   * Initialize device manager
   */
  async initialize() {
    loggingService.info('Initializing device manager');
    
    try {
      // Check if Chromecast API is available
      if (window.chrome && window.chrome.cast) {
        await this._initializeChromecast();
      }
      
      // Check for other device APIs
      this._initializeOtherDevices();
      
      // Start device discovery
      this.discoverDevices();
      
      // Track event
      telemetryService.trackEvent('devices', 'initialize', {
        success: true
      });
    } catch (error) {
      loggingService.error('Failed to initialize device manager', { error });
      
      // Track event
      telemetryService.trackEvent('devices', 'initialize', {
        success: false,
        error: error.message
      });
    }
  }
  
  /**
   * Initialize Chromecast
   * @private
   */
  async _initializeChromecast() {
    return new Promise((resolve, reject) => {
      if (!window.chrome || !window.chrome.cast) {
        reject(new Error('Chromecast API not available'));
        return;
      }
      
      const sessionRequest = new window.chrome.cast.SessionRequest(
        configService.get('devices.chromecast.appId', 'CC1AD845')
      );
      
      const apiConfig = new window.chrome.cast.ApiConfig(
        sessionRequest,
        this._onCastSessionSuccess.bind(this),
        this._onCastReceiverAvailable.bind(this)
      );
      
      window.chrome.cast.initialize(
        apiConfig,
        () => {
          loggingService.info('Chromecast initialized');
          resolve();
        },
        (error) => {
          loggingService.error('Failed to initialize Chromecast', { error });
          reject(error);
        }
      );
    });
  }
  
  /**
   * Initialize other device APIs
   * @private
   */
  _initializeOtherDevices() {
    // TODO: Add support for other device APIs
    // This is a placeholder for future implementation
  }
  
  /**
   * Handle cast session success
   * @param {Object} session - Cast session
   * @private
   */
  _onCastSessionSuccess(session) {
    this.castingSession = session;
    this.connectionState = CONNECTION_STATE.CONNECTED;
    
    // Find the device
    const device = this.devices.find(d => d.id === session.receiver.label);
    if (device) {
      this.activeDevice = device;
    } else {
      // Create a new device if not found
      const newDevice = {
        id: session.receiver.label,
        name: session.receiver.friendlyName,
        type: DEVICE_TYPE.CHROMECAST,
        model: 'Chromecast',
        capabilities: ['video', 'audio']
      };
      
      this.devices.push(newDevice);
      this.activeDevice = newDevice;
    }
    
    // Add session listeners
    session.addUpdateListener(this._onCastSessionUpdate.bind(this));
    session.addMediaListener(this._onCastMediaDiscovered.bind(this));
    
    // Emit event
    this.emit('deviceConnected', this.activeDevice);
    
    // Track event
    telemetryService.trackEvent('devices', 'connect', {
      deviceType: this.activeDevice.type,
      deviceName: this.activeDevice.name
    });
    
    loggingService.info('Connected to cast device', { device: this.activeDevice });
  }
  
  /**
   * Handle cast receiver available
   * @param {string} availability - Receiver availability
   * @private
   */
  _onCastReceiverAvailable(availability) {
    if (availability === window.chrome.cast.ReceiverAvailability.AVAILABLE) {
      this.discoverDevices();
    }
  }
  
  /**
   * Handle cast session update
   * @param {boolean} isAlive - Whether the session is alive
   * @private
   */
  _onCastSessionUpdate(isAlive) {
    if (!isAlive) {
      this._onCastSessionDisconnected();
    }
  }
  
  /**
   * Handle cast session disconnected
   * @private
   */
  _onCastSessionDisconnected() {
    this.castingSession = null;
    this.castingMedia = null;
    this.activeDevice = null;
    this.connectionState = CONNECTION_STATE.DISCONNECTED;
    
    // Emit event
    this.emit('deviceDisconnected');
    
    // Track event
    telemetryService.trackEvent('devices', 'disconnect');
    
    loggingService.info('Disconnected from cast device');
  }
  
  /**
   * Handle cast media discovered
   * @param {Object} media - Cast media
   * @private
   */
  _onCastMediaDiscovered(media) {
    this.castingMedia = media;
    
    // Add media listeners
    media.addUpdateListener(this._onCastMediaUpdate.bind(this));
    
    // Emit event
    this.emit('mediaCasting', {
      media: this.castingMedia,
      device: this.activeDevice
    });
    
    loggingService.info('Media discovered on cast device');
  }
  
  /**
   * Handle cast media update
   * @param {boolean} isAlive - Whether the media is alive
   * @private
   */
  _onCastMediaUpdate(isAlive) {
    if (!isAlive) {
      this.castingMedia = null;
      
      // Emit event
      this.emit('mediaStopped');
      
      loggingService.info('Media stopped on cast device');
    }
  }
  
  /**
   * Discover available devices
   * @returns {Promise<Array>} List of discovered devices
   */
  async discoverDevices() {
    loggingService.info('Discovering devices');
    
    try {
      // Clear existing devices
      this.devices = [];
      
      // Discover Chromecast devices
      if (window.chrome && window.chrome.cast) {
        await this._discoverChromecastDevices();
      }
      
      // Discover other devices
      await this._discoverOtherDevices();
      
      // Emit event
      this.emit('devicesDiscovered', this.devices);
      
      // Track event
      telemetryService.trackEvent('devices', 'discover', {
        deviceCount: this.devices.length
      });
      
      loggingService.info('Devices discovered', { count: this.devices.length });
      
      return this.devices;
    } catch (error) {
      loggingService.error('Failed to discover devices', { error });
      
      // Track event
      telemetryService.trackEvent('devices', 'discover', {
        success: false,
        error: error.message
      });
      
      return [];
    }
  }
  
  /**
   * Discover Chromecast devices
   * @private
   */
  async _discoverChromecastDevices() {
    // This is handled by the Chromecast API
    // We'll receive callbacks when devices are available
  }
  
  /**
   * Discover other devices
   * @private
   */
  async _discoverOtherDevices() {
    // TODO: Add support for other device discovery
    // This is a placeholder for future implementation
    
    // For demo purposes, add some mock devices
    if (configService.get('devices.mockDevices', true)) {
      this._addMockDevices();
    }
  }
  
  /**
   * Add mock devices for testing
   * @private
   */
  _addMockDevices() {
    const mockDevices = [
      {
        id: 'smart-tv-1',
        name: 'Living Room TV',
        type: DEVICE_TYPE.SMART_TV,
        model: 'Samsung Q80T',
        capabilities: ['video', 'audio']
      },
      {
        id: 'speaker-1',
        name: 'Kitchen Speaker',
        type: DEVICE_TYPE.SPEAKER,
        model: 'Sonos One',
        capabilities: ['audio']
      },
      {
        id: 'roku-1',
        name: 'Bedroom Roku',
        type: DEVICE_TYPE.ROKU,
        model: 'Roku Ultra',
        capabilities: ['video', 'audio']
      }
    ];
    
    this.devices.push(...mockDevices);
  }
  
  /**
   * Connect to a device
   * @param {string} deviceId - Device ID
   * @returns {Promise<boolean>} Whether connection was successful
   */
  async connectToDevice(deviceId) {
    loggingService.info('Connecting to device', { deviceId });
    
    try {
      // Find the device
      const device = this.devices.find(d => d.id === deviceId);
      
      if (!device) {
        throw new Error(`Device not found: ${deviceId}`);
      }
      
      // Update connection state
      this.connectionState = CONNECTION_STATE.CONNECTING;
      
      // Emit event
      this.emit('deviceConnecting', device);
      
      // Connect based on device type
      let success = false;
      
      switch (device.type) {
        case DEVICE_TYPE.CHROMECAST:
          success = await this._connectToChromecast(device);
          break;
        case DEVICE_TYPE.SMART_TV:
        case DEVICE_TYPE.ROKU:
        case DEVICE_TYPE.FIRE_TV:
        case DEVICE_TYPE.APPLE_TV:
        case DEVICE_TYPE.GAME_CONSOLE:
        case DEVICE_TYPE.SPEAKER:
        case DEVICE_TYPE.OTHER:
          // For mock devices, simulate successful connection
          if (configService.get('devices.mockDevices', true)) {
            success = true;
            this.activeDevice = device;
            this.connectionState = CONNECTION_STATE.CONNECTED;
            
            // Emit event
            this.emit('deviceConnected', device);
          } else {
            throw new Error(`Device type not supported: ${device.type}`);
          }
          break;
        default:
          throw new Error(`Unknown device type: ${device.type}`);
      }
      
      // Track event
      telemetryService.trackEvent('devices', 'connect', {
        success,
        deviceType: device.type,
        deviceName: device.name
      });
      
      return success;
    } catch (error) {
      loggingService.error('Failed to connect to device', { error });
      
      // Update connection state
      this.connectionState = CONNECTION_STATE.ERROR;
      
      // Emit event
      this.emit('deviceError', {
        error: error.message
      });
      
      // Track event
      telemetryService.trackEvent('devices', 'connect', {
        success: false,
        error: error.message
      });
      
      return false;
    }
  }
  
  /**
   * Connect to a Chromecast device
   * @param {Object} device - Device to connect to
   * @returns {Promise<boolean>} Whether connection was successful
   * @private
   */
  async _connectToChromecast(device) {
    return new Promise((resolve, reject) => {
      if (!window.chrome || !window.chrome.cast) {
        reject(new Error('Chromecast API not available'));
        return;
      }
      
      window.chrome.cast.requestSession(
        (session) => {
          this._onCastSessionSuccess(session);
          resolve(true);
        },
        (error) => {
          loggingService.error('Failed to connect to Chromecast', { error });
          reject(error);
        }
      );
    });
  }
  
  /**
   * Disconnect from the current device
   * @returns {Promise<boolean>} Whether disconnection was successful
   */
  async disconnectFromDevice() {
    if (!this.activeDevice) {
      return false;
    }
    
    loggingService.info('Disconnecting from device', { device: this.activeDevice });
    
    try {
      // Disconnect based on device type
      let success = false;
      
      switch (this.activeDevice.type) {
        case DEVICE_TYPE.CHROMECAST:
          success = await this._disconnectFromChromecast();
          break;
        case DEVICE_TYPE.SMART_TV:
        case DEVICE_TYPE.ROKU:
        case DEVICE_TYPE.FIRE_TV:
        case DEVICE_TYPE.APPLE_TV:
        case DEVICE_TYPE.GAME_CONSOLE:
        case DEVICE_TYPE.SPEAKER:
        case DEVICE_TYPE.OTHER:
          // For mock devices, simulate successful disconnection
          if (configService.get('devices.mockDevices', true)) {
            success = true;
            
            // Reset state
            const device = this.activeDevice;
            this.activeDevice = null;
            this.connectionState = CONNECTION_STATE.DISCONNECTED;
            
            // Emit event
            this.emit('deviceDisconnected', device);
          } else {
            throw new Error(`Device type not supported: ${this.activeDevice.type}`);
          }
          break;
        default:
          throw new Error(`Unknown device type: ${this.activeDevice.type}`);
      }
      
      // Track event
      telemetryService.trackEvent('devices', 'disconnect', {
        success,
        deviceType: this.activeDevice.type,
        deviceName: this.activeDevice.name
      });
      
      return success;
    } catch (error) {
      loggingService.error('Failed to disconnect from device', { error });
      
      // Update connection state
      this.connectionState = CONNECTION_STATE.ERROR;
      
      // Emit event
      this.emit('deviceError', {
        error: error.message
      });
      
      // Track event
      telemetryService.trackEvent('devices', 'disconnect', {
        success: false,
        error: error.message
      });
      
      return false;
    }
  }
  
  /**
   * Disconnect from a Chromecast device
   * @returns {Promise<boolean>} Whether disconnection was successful
   * @private
   */
  async _disconnectFromChromecast() {
    return new Promise((resolve, reject) => {
      if (!this.castingSession) {
        resolve(false);
        return;
      }
      
      this.castingSession.stop(
        () => {
          this._onCastSessionDisconnected();
          resolve(true);
        },
        (error) => {
          loggingService.error('Failed to disconnect from Chromecast', { error });
          reject(error);
        }
      );
    });
  }
  
  /**
   * Cast media to the connected device
   * @param {Object} mediaInfo - Media information
   * @param {string} mediaInfo.url - Media URL
   * @param {string} mediaInfo.title - Media title
   * @param {string} mediaInfo.subtitle - Media subtitle
   * @param {string} mediaInfo.imageUrl - Media image URL
   * @param {string} mediaInfo.mimeType - Media MIME type
   * @param {number} mediaInfo.duration - Media duration in seconds
   * @returns {Promise<boolean>} Whether casting was successful
   */
  async castMedia(mediaInfo) {
    if (!this.activeDevice || this.connectionState !== CONNECTION_STATE.CONNECTED) {
      loggingService.warn('Cannot cast media: No device connected');
      return false;
    }
    
    loggingService.info('Casting media', { media: mediaInfo, device: this.activeDevice });
    
    try {
      // Cast based on device type
      let success = false;
      
      switch (this.activeDevice.type) {
        case DEVICE_TYPE.CHROMECAST:
          success = await this._castMediaToChromecast(mediaInfo);
          break;
        case DEVICE_TYPE.SMART_TV:
        case DEVICE_TYPE.ROKU:
        case DEVICE_TYPE.FIRE_TV:
        case DEVICE_TYPE.APPLE_TV:
        case DEVICE_TYPE.GAME_CONSOLE:
        case DEVICE_TYPE.SPEAKER:
        case DEVICE_TYPE.OTHER:
          // For mock devices, simulate successful casting
          if (configService.get('devices.mockDevices', true)) {
            success = true;
            
            // Emit event
            this.emit('mediaCasting', {
              media: mediaInfo,
              device: this.activeDevice
            });
          } else {
            throw new Error(`Device type not supported: ${this.activeDevice.type}`);
          }
          break;
        default:
          throw new Error(`Unknown device type: ${this.activeDevice.type}`);
      }
      
      // Track event
      telemetryService.trackEvent('devices', 'cast_media', {
        success,
        deviceType: this.activeDevice.type,
        deviceName: this.activeDevice.name,
        mediaTitle: mediaInfo.title
      });
      
      return success;
    } catch (error) {
      loggingService.error('Failed to cast media', { error });
      
      // Emit event
      this.emit('deviceError', {
        error: error.message
      });
      
      // Track event
      telemetryService.trackEvent('devices', 'cast_media', {
        success: false,
        error: error.message
      });
      
      return false;
    }
  }
  
  /**
   * Cast media to a Chromecast device
   * @param {Object} mediaInfo - Media information
   * @returns {Promise<boolean>} Whether casting was successful
   * @private
   */
  async _castMediaToChromecast(mediaInfo) {
    return new Promise((resolve, reject) => {
      if (!this.castingSession) {
        reject(new Error('No Chromecast session'));
        return;
      }
      
      // Create media info
      const mediaInfoObj = new window.chrome.cast.media.MediaInfo(
        mediaInfo.url,
        mediaInfo.mimeType || 'video/mp4'
      );
      
      // Set metadata
      const metadata = new window.chrome.cast.media.GenericMediaMetadata();
      metadata.title = mediaInfo.title;
      metadata.subtitle = mediaInfo.subtitle;
      
      if (mediaInfo.imageUrl) {
        metadata.images = [
          { url: mediaInfo.imageUrl }
        ];
      }
      
      mediaInfoObj.metadata = metadata;
      
      // Set duration if provided
      if (mediaInfo.duration) {
        mediaInfoObj.duration = mediaInfo.duration;
      }
      
      // Create request
      const request = new window.chrome.cast.media.LoadRequest(mediaInfoObj);
      
      // Load media
      this.castingSession.loadMedia(
        request,
        (media) => {
          this._onCastMediaDiscovered(media);
          resolve(true);
        },
        (error) => {
          loggingService.error('Failed to cast media to Chromecast', { error });
          reject(error);
        }
      );
    });
  }
  
  /**
   * Stop casting media
   * @returns {Promise<boolean>} Whether stopping was successful
   */
  async stopCasting() {
    if (!this.castingMedia) {
      return false;
    }
    
    loggingService.info('Stopping media casting');
    
    try {
      // Stop based on device type
      let success = false;
      
      switch (this.activeDevice.type) {
        case DEVICE_TYPE.CHROMECAST:
          success = await this._stopCastingOnChromecast();
          break;
        case DEVICE_TYPE.SMART_TV:
        case DEVICE_TYPE.ROKU:
        case DEVICE_TYPE.FIRE_TV:
        case DEVICE_TYPE.APPLE_TV:
        case DEVICE_TYPE.GAME_CONSOLE:
        case DEVICE_TYPE.SPEAKER:
        case DEVICE_TYPE.OTHER:
          // For mock devices, simulate successful stop
          if (configService.get('devices.mockDevices', true)) {
            success = true;
            
            // Emit event
            this.emit('mediaStopped');
          } else {
            throw new Error(`Device type not supported: ${this.activeDevice.type}`);
          }
          break;
        default:
          throw new Error(`Unknown device type: ${this.activeDevice.type}`);
      }
      
      // Track event
      telemetryService.trackEvent('devices', 'stop_casting', {
        success,
        deviceType: this.activeDevice.type,
        deviceName: this.activeDevice.name
      });
      
      return success;
    } catch (error) {
      loggingService.error('Failed to stop casting', { error });
      
      // Emit event
      this.emit('deviceError', {
        error: error.message
      });
      
      // Track event
      telemetryService.trackEvent('devices', 'stop_casting', {
        success: false,
        error: error.message
      });
      
      return false;
    }
  }
  
  /**
   * Stop casting on a Chromecast device
   * @returns {Promise<boolean>} Whether stopping was successful
   * @private
   */
  async _stopCastingOnChromecast() {
    return new Promise((resolve, reject) => {
      if (!this.castingMedia) {
        resolve(false);
        return;
      }
      
      this.castingMedia.stop(
        () => {
          this.castingMedia = null;
          
          // Emit event
          this.emit('mediaStopped');
          
          resolve(true);
        },
        (error) => {
          loggingService.error('Failed to stop casting on Chromecast', { error });
          reject(error);
        }
      );
    });
  }
  
  /**
   * Get all discovered devices
   * @returns {Array} List of devices
   */
  getDevices() {
    return [...this.devices];
  }
  
  /**
   * Get the active device
   * @returns {Object|null} Active device
   */
  getActiveDevice() {
    return this.activeDevice;
  }
  
  /**
   * Get the current connection state
   * @returns {string} Connection state
   */
  getConnectionState() {
    return this.connectionState;
  }
}

// Create singleton instance
const deviceManager = new DeviceManager();

export default deviceManager;
