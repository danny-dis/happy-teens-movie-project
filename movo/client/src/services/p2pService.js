/**
 * Enhanced P2P Service for Movo
 *
 * This service implements advanced peer-to-peer streaming functionality using WebTorrent,
 * allowing users to share and stream content directly between devices with enhanced
 * security, performance, and user experience features.
 *
 * The P2P service enables Chimera Mode by providing seamless content sharing between
 * online and offline states, ensuring a consistent user experience regardless of
 * internet connectivity.
 */

import WebTorrent from 'webtorrent';
import { v4 as uuidv4 } from 'uuid';
import SimplePeer from 'simple-peer';
import CryptoJS from 'crypto-js';

class P2PService {
  constructor() {
    this.client = null;
    this.torrents = new Map(); // Map of active torrents
    this.seedingFiles = new Map(); // Map of files being seeded
    this.downloadingFiles = new Map(); // Map of files being downloaded
    this.peers = new Map(); // Map of connected peers with metadata
    this.peerStats = new Map(); // Map of peer statistics
    this.contentVerificationCache = new Map(); // Cache for verified content

    // Enhanced tracker list with more options for redundancy
    this.trackers = [
      'wss://tracker.openwebtorrent.com',
      'wss://tracker.btorrent.xyz',
      'wss://tracker.fastcast.nz',
      'wss://tracker.webtorrent.io',
      'wss://tracker.files.fm:7073/announce',
      'wss://spacetradersapi-chatbox.herokuapp.com:443/announce'
    ];

    // DHT configuration for better peer discovery
    this.dhtConfig = {
      bootstrap: [
        'dht.transmissionbt.com:6881',
        'router.bittorrent.com:6881',
        'router.utorrent.com:6881'
      ],
      concurrency: 30
    };

    this.initialized = false;

    // Enhanced user identification with rotation schedule
    this.userId = localStorage.getItem('p2pUserId') || this._generateUserId();
    this.userIdLastRotated = localStorage.getItem('p2pUserIdLastRotated') || new Date().toISOString();
    this.userIdRotationInterval = 24 * 60 * 60 * 1000; // 24 hours

    // Enhanced statistics tracking
    this.uploadStats = {
      totalUploaded: parseInt(localStorage.getItem('p2pTotalUploaded') || '0', 10),
      uploadSpeed: 0,
      peakUploadSpeed: parseInt(localStorage.getItem('p2pPeakUploadSpeed') || '0', 10),
      averageUploadSpeed: 0,
      uploadedByContent: new Map()
    };

    this.downloadStats = {
      totalDownloaded: parseInt(localStorage.getItem('p2pTotalDownloaded') || '0', 10),
      downloadSpeed: 0,
      peakDownloadSpeed: parseInt(localStorage.getItem('p2pPeakDownloadSpeed') || '0', 10),
      averageDownloadSpeed: 0,
      downloadedByContent: new Map()
    };

    // Network quality metrics
    this.networkMetrics = {
      averageLatency: 0,
      connectionSuccessRate: 1.0,
      peerAvailability: 0,
      healthScore: 0
    };

    // Enhanced event listeners
    this.listeners = {
      onPeerConnect: [],
      onPeerDisconnect: [],
      onDownloadProgress: [],
      onDownloadComplete: [],
      onSeedingStart: [],
      onError: [],
      onNetworkQualityChange: [],
      onSecurityEvent: [],
      onBandwidthChange: [],
      onContentVerification: []
    };

    // Performance optimization settings
    this.performanceConfig = {
      useWebWorker: true,
      chunkSize: 16384, // 16KB chunks by default
      maxBufferSize: 5 * 1024 * 1024, // 5MB buffer
      prioritizePlaybackPosition: true,
      preBufferSeconds: 30,
      adaptiveBitrate: true
    };

    // Security settings
    this.securityConfig = {
      encryptMetadata: true,
      verifyContent: true,
      encryptionKey: localStorage.getItem('p2pEncryptionKey') || this._generateEncryptionKey(),
      peerBlacklist: new Set(JSON.parse(localStorage.getItem('p2pPeerBlacklist') || '[]')),
      contentSignatureRequired: false,
      maxConnectionsPerIP: 5
    };

    // User preferences (loaded from localStorage)
    this.userPreferences = JSON.parse(localStorage.getItem('p2pUserPreferences') || JSON.stringify({
      maxUploadSpeed: 1024, // KB/s
      maxDownloadSpeed: 0, // Unlimited
      maxConnections: 50,
      onlyOnWifi: true,
      saveBattery: true,
      allowBackgroundSeeding: true,
      contentCategories: {
        movies: true,
        shows: true,
        documentaries: true
      },
      sharingDuration: 'forever' // 'session', '1day', '1week', '1month', 'forever'
    }));

    // Worker for background processing
    this.worker = null;

    // Timers and intervals
    this.statsInterval = null;
    this.peerRotationInterval = null;
    this.networkCheckInterval = null;
    this.storageCleanupInterval = null;

    // Network connection info
    this.connectionType = this._detectConnectionType();
    this.isMetered = this._isMeteredConnection();
    this.batteryStatus = {
      charging: true,
      level: 1.0
    };
  }

  /**
   * Initialize the P2P client with enhanced features
   * @returns {Promise} Resolves when client is initialized
   */
  async initialize() {
    if (this.initialized) return Promise.resolve();

    return new Promise((resolve, reject) => {
      try {
        // Check if user ID needs rotation
        this._rotateUserIdIfNeeded();

        // Update network and battery status
        this._updateConnectionInfo();
        this._updateBatteryStatus();

        // Initialize Web Worker if enabled
        if (this.performanceConfig.useWebWorker && window.Worker) {
          this._initializeWorker();
        }

        // Enhanced WebTorrent client configuration
        const clientConfig = {
          tracker: {
            announce: this.trackers,
            getAnnounceOpts: () => {
              // Add user metadata to announce requests
              return {
                uploaded: this.uploadStats.totalUploaded,
                downloaded: this.downloadStats.totalDownloaded,
                numwant: this.userPreferences.maxConnections,
                supportedExtensions: ['ut_pex', 'ut_metadata', 'lt_donthave']
              };
            }
          },
          dht: this.dhtConfig,
          webSeeds: true,
          maxConns: this.userPreferences.maxConnections,
          uploadLimit: this.userPreferences.maxUploadSpeed * 1024, // Convert to bytes/sec
          downloadLimit: this.userPreferences.maxDownloadSpeed * 1024 || -1, // -1 means unlimited
          nodeId: this.userId
        };

        // Create WebTorrent client with enhanced config
        this.client = new WebTorrent(clientConfig);

        // Set up enhanced event listeners
        this.client.on('error', (err) => {
          console.error('WebTorrent client error:', err);
          this._notifyListeners('onError', err);

          // Attempt recovery for certain errors
          if (err.message.includes('tracker')) {
            this._recoverFromTrackerError();
          }
        });

        this.client.on('torrent', (torrent) => {
          this._setupTorrentEvents(torrent);
        });

        this.client.on('warning', (warning) => {
          console.warn('WebTorrent warning:', warning);
        });

        // Set up periodic tasks
        this._setupPeriodicTasks();

        // Set up network change listeners
        this._setupNetworkListeners();

        // Initialize content verification system
        this._initializeContentVerification();

        this.initialized = true;
        console.log('Enhanced P2P service initialized with user ID:', this.userId);

        // Calculate initial network health
        this._calculateNetworkHealth();

        resolve();
      } catch (error) {
        console.error('Failed to initialize P2P service:', error);
        reject(error);
      }
    });
  }

  /**
   * Set up periodic maintenance tasks
   * @private
   */
  _setupPeriodicTasks() {
    // Update stats more frequently for responsive UI
    this.statsInterval = setInterval(() => {
      this._updateStats();
    }, 1000);

    // Rotate peer connections periodically to improve network health
    this.peerRotationInterval = setInterval(() => {
      this._rotatePeerConnections();
    }, 30 * 60 * 1000); // 30 minutes

    // Check network conditions periodically
    this.networkCheckInterval = setInterval(() => {
      this._updateConnectionInfo();
      this._calculateNetworkHealth();
    }, 5 * 60 * 1000); // 5 minutes

    // Clean up storage periodically
    this.storageCleanupInterval = setInterval(() => {
      this._cleanupStorage();
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Set up network change listeners
   * @private
   */
  _setupNetworkListeners() {
    if (navigator.connection) {
      navigator.connection.addEventListener('change', () => {
        this.connectionType = this._detectConnectionType();
        this.isMetered = this._isMeteredConnection();

        // Adjust sharing based on new network conditions
        if (this.isMetered && this.userPreferences.onlyOnWifi) {
          this._pauseAllSeeding();
          this._notifyListeners('onBandwidthChange', {
            action: 'pause_seeding',
            reason: 'metered_connection'
          });
        } else if (!this.isMetered) {
          this._resumeAllSeeding();
          this._notifyListeners('onBandwidthChange', {
            action: 'resume_seeding',
            reason: 'unmetered_connection'
          });
        }

        this._notifyListeners('onNetworkQualityChange', {
          connectionType: this.connectionType,
          isMetered: this.isMetered
        });
      });
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this._resumeAllSeeding();
      this._notifyListeners('onNetworkQualityChange', {
        status: 'online'
      });
    });

    window.addEventListener('offline', () => {
      this._pauseAllSeeding();
      this._notifyListeners('onNetworkQualityChange', {
        status: 'offline'
      });
    });
  }

  /**
   * Initialize the content verification system
   * @private
   */
  _initializeContentVerification() {
    // In a real implementation, this would set up the cryptographic verification system
    // For now, we'll just set up the cache
    this.contentVerificationCache.clear();

    // Load any previously verified content from localStorage
    try {
      const savedVerifications = localStorage.getItem('p2pVerifiedContent');
      if (savedVerifications) {
        const verifications = JSON.parse(savedVerifications);
        Object.entries(verifications).forEach(([infoHash, verified]) => {
          this.contentVerificationCache.set(infoHash, verified);
        });
      }
    } catch (error) {
      console.error('Error loading content verifications:', error);
    }
  }

  /**
   * Initialize Web Worker for background processing
   * This creates a worker to handle CPU-intensive tasks in a background thread
   * to prevent UI blocking and improve performance.
   *
   * @author zophlic
   * @private
   */
  _initializeWorker() {
    try {
      // In a production implementation, this would create an actual Web Worker
      // with a dedicated file for processing tasks like content verification,
      // encryption/decryption, and data processing.

      // For now, we use a mock implementation that simulates the worker interface
      // but processes everything in the main thread.
      this.worker = {
        postMessage: (message) => {
          // Process the message based on its type
          if (message && message.type) {
            switch(message.type) {
              case 'verify_content':
                // Simulate content verification
                setTimeout(() => {
                  this._handleWorkerResponse({
                    type: 'verification_result',
                    infoHash: message.infoHash,
                    verified: true
                  });
                }, 100);
                break;
              default:
                // Handle unknown message types
                console.warn('Unknown worker message type:', message.type);
            }
          }
        },
        terminate: () => {
          // Clean up any resources that would be used by the worker
        }
      };
    } catch (error) {
      console.error('Failed to initialize Web Worker:', error);
      this.performanceConfig.useWebWorker = false;
    }
  }

  /**
   * Handle responses from the Web Worker
   * Implementation by zophlic (2023)
   * @private
   * @param {Object} response - Response from the worker
   */
  _handleWorkerResponse(response) {
    if (!response || !response.type) return;

    switch(response.type) {
      case 'verification_result':
        // Update verification cache with the result
        if (response.infoHash) {
          this.contentVerificationCache.set(response.infoHash, response.verified);
          this._saveVerificationCache();

          // Notify listeners about verification result
          this._notifyListeners('onContentVerification', {
            infoHash: response.infoHash,
            verified: response.verified
          });
        }
        break;
      default:
        console.warn('Unknown worker response type:', response.type);
    }
  }

  /**
   * Update connection information
   * @private
   */
  _updateConnectionInfo() {
    this.connectionType = this._detectConnectionType();
    this.isMetered = this._isMeteredConnection();
  }

  /**
   * Rotate user ID if needed for privacy
   * @private
   */
  _rotateUserIdIfNeeded() {
    const lastRotated = new Date(this.userIdLastRotated).getTime();
    const now = new Date().getTime();

    if (now - lastRotated > this.userIdRotationInterval) {
      // Generate a new user ID
      this.userId = this._generateUserId();
      console.log('Rotated user ID for privacy:', this.userId);
    }
  }

  /**
   * Rotate peer connections to improve network health
   * @private
   */
  _rotatePeerConnections() {
    if (!this.client) return;

    // For each torrent, disconnect from some peers and find new ones
    this.client.torrents.forEach(torrent => {
      // Only rotate if we have enough peers
      if (torrent.wires.length > 5) {
        // Disconnect from 20% of peers
        const peersToDisconnect = Math.ceil(torrent.wires.length * 0.2);

        // Sort peers by upload/download speed (keep the best ones)
        const sortedWires = [...torrent.wires].sort((a, b) => {
          const aScore = a.downloadSpeed + a.uploadSpeed;
          const bScore = b.downloadSpeed + b.uploadSpeed;
          return bScore - aScore; // Descending order
        });

        // Disconnect from the slowest peers
        for (let i = sortedWires.length - 1; i >= sortedWires.length - peersToDisconnect; i--) {
          if (i >= 0) {
            sortedWires[i].destroy();
          }
        }

        // Announce to trackers to find new peers
        torrent.announce();
      }
    });
  }

  /**
   * Recover from tracker errors
   * @private
   */
  _recoverFromTrackerError() {
    if (!this.client) return;

    // Try alternative trackers
    this.client.torrents.forEach(torrent => {
      // Add any trackers that aren't already in the torrent
      this.trackers.forEach(tracker => {
        if (!torrent.announce.includes(tracker)) {
          torrent.announce.push(tracker);
        }
      });

      // Announce to all trackers
      torrent.announce();
    });
  }

  /**
   * Clean up storage to prevent excessive usage
   * @private
   */
  _cleanupStorage() {
    // Check if we need to remove old content based on sharing duration preference
    if (this.userPreferences.sharingDuration !== 'forever') {
      const now = new Date().getTime();

      // Calculate the cutoff time based on sharing duration preference
      let cutoffTime;
      switch (this.userPreferences.sharingDuration) {
        case 'session':
          // Don't persist across sessions, but we can't enforce that here
          break;
        case '1day':
          cutoffTime = now - (24 * 60 * 60 * 1000);
          break;
        case '1week':
          cutoffTime = now - (7 * 24 * 60 * 60 * 1000);
          break;
        case '1month':
          cutoffTime = now - (30 * 24 * 60 * 60 * 1000);
          break;
        default:
          return; // No cleanup needed
      }

      // Find torrents that are older than the cutoff time
      const torrentsToRemove = [];
      this.seedingFiles.forEach((fileInfo, infoHash) => {
        const addedTime = new Date(fileInfo.addedAt).getTime();
        if (addedTime < cutoffTime) {
          torrentsToRemove.push(infoHash);
        }
      });

      // Remove the old torrents
      torrentsToRemove.forEach(infoHash => {
        this.stopTorrent(infoHash).catch(err => {
          console.error('Error removing old torrent:', err);
        });
      });
    }
  }

  /**
   * Generate a unique user ID for P2P identification
   * @private
   * @returns {string} Unique user ID
   */
  _generateUserId() {
    const userId = uuidv4();
    localStorage.setItem('p2pUserId', userId);
    localStorage.setItem('p2pUserIdLastRotated', new Date().toISOString());
    return userId;
  }

  /**
   * Generate an encryption key for secure communications
   * @private
   * @returns {string} Encryption key
   */
  _generateEncryptionKey() {
    const key = CryptoJS.lib.WordArray.random(16).toString();
    localStorage.setItem('p2pEncryptionKey', key);
    return key;
  }

  /**
   * Detect the current connection type
   * @private
   * @returns {string} Connection type
   */
  _detectConnectionType() {
    if (navigator.connection) {
      return navigator.connection.type || navigator.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Check if the current connection is metered
   * @private
   * @returns {boolean} True if connection is metered
   */
  _isMeteredConnection() {
    if (navigator.connection) {
      return navigator.connection.saveData || false;
    }
    return false;
  }

  /**
   * Check if the current network conditions allow P2P sharing
   * @private
   * @returns {boolean} True if P2P is allowed
   */
  _canShareContent() {
    // Don't share if we're on a metered connection and user prefers WiFi only
    if (this.isMetered && this.userPreferences.onlyOnWifi) {
      return false;
    }

    // Don't share if we're on battery and user prefers to save battery
    if (!this.batteryStatus.charging &&
        this.batteryStatus.level < 0.3 &&
        this.userPreferences.saveBattery) {
      return false;
    }

    return true;
  }

  /**
   * Update battery status information
   * @private
   */
  async _updateBatteryStatus() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        this.batteryStatus.charging = battery.charging;
        this.batteryStatus.level = battery.level;

        // Add event listeners for battery status changes
        battery.addEventListener('chargingchange', () => {
          this.batteryStatus.charging = battery.charging;
          this._adjustSharingBasedOnPower();
        });

        battery.addEventListener('levelchange', () => {
          this.batteryStatus.level = battery.level;
          this._adjustSharingBasedOnPower();
        });
      } catch (error) {
        console.error('Error getting battery status:', error);
      }
    }
  }

  /**
   * Adjust sharing behavior based on power status
   * @private
   */
  _adjustSharingBasedOnPower() {
    if (!this.batteryStatus.charging &&
        this.batteryStatus.level < 0.3 &&
        this.userPreferences.saveBattery) {
      // Pause all seeding to save battery
      this._pauseAllSeeding();
      this._notifyListeners('onBandwidthChange', {
        action: 'pause_seeding',
        reason: 'battery_saving'
      });
    } else if (this.batteryStatus.charging || this.batteryStatus.level > 0.5) {
      // Resume seeding if we were previously paused
      this._resumeAllSeeding();
      this._notifyListeners('onBandwidthChange', {
        action: 'resume_seeding',
        reason: 'battery_sufficient'
      });
    }
  }

  /**
   * Pause all seeding activity
   * @private
   */
  _pauseAllSeeding() {
    if (!this.client) return;

    this.client.torrents.forEach(torrent => {
      if (torrent.done) {
        torrent.pause();
      }
    });
  }

  /**
   * Resume all seeding activity
   * @private
   */
  _resumeAllSeeding() {
    if (!this.client) return;

    this.client.torrents.forEach(torrent => {
      if (torrent.paused) {
        torrent.resume();
      }
    });
  }

  /**
   * Encrypt data for secure transmission
   * @private
   * @param {*} data - Data to encrypt
   * @returns {string} Encrypted data
   */
  _encryptData(data) {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, this.securityConfig.encryptionKey).toString();
  }

  /**
   * Decrypt received data
   * @private
   * @param {string} encryptedData - Encrypted data
   * @returns {*} Decrypted data
   */
  _decryptData(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.securityConfig.encryptionKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Error decrypting data:', error);
      this._notifyListeners('onSecurityEvent', {
        type: 'decryption_failure',
        error: error.message
      });
      return null;
    }
  }

  /**
   * Verify the integrity of downloaded content
   * @private
   * @param {Object} torrent - WebTorrent torrent object
   * @returns {Promise<boolean>} True if content is verified
   */
  async _verifyContentIntegrity(torrent) {
    // If verification is disabled, always return true
    if (!this.securityConfig.verifyContent) {
      return true;
    }

    // Check if we've already verified this content
    if (this.contentVerificationCache.has(torrent.infoHash)) {
      return this.contentVerificationCache.get(torrent.infoHash);
    }

    return new Promise((resolve) => {
      // In a real implementation, this would perform cryptographic verification
      // For now, we'll just check that the torrent is complete and not corrupted
      const isVerified = torrent.done && !torrent.destroyed && torrent.pieces.every(piece => piece);

      // Cache the result
      this.contentVerificationCache.set(torrent.infoHash, isVerified);

      this._notifyListeners('onContentVerification', {
        infoHash: torrent.infoHash,
        verified: isVerified
      });

      resolve(isVerified);
    });
  }

  /**
   * Calculate network health score
   * @private
   * @returns {number} Health score from 0-1
   */
  _calculateNetworkHealth() {
    // Factors that contribute to network health:
    // 1. Number of connected peers
    // 2. Average latency
    // 3. Connection success rate
    // 4. Download/upload speeds

    const peerCountScore = Math.min(this.peers.size / 10, 1); // Max score at 10+ peers
    const latencyScore = this.networkMetrics.averageLatency > 0 ?
      Math.max(0, 1 - (this.networkMetrics.averageLatency / 1000)) : 0.5; // Lower latency is better
    const connectionScore = this.networkMetrics.connectionSuccessRate;
    const speedScore = Math.min((this.downloadStats.downloadSpeed / 1024 / 1024), 1); // Max score at 1MB/s

    // Weighted average
    const healthScore = (
      peerCountScore * 0.3 +
      latencyScore * 0.3 +
      connectionScore * 0.2 +
      speedScore * 0.2
    );

    this.networkMetrics.healthScore = healthScore;
    return healthScore;
  }

  /**
   * Set up enhanced event listeners for a torrent
   * @private
   * @param {Object} torrent - WebTorrent torrent object
   */
  _setupTorrentEvents(torrent) {
    // Track download progress with enhanced metrics
    torrent.on('download', (bytes) => {
      const progress = torrent.progress;
      const downloadSpeed = torrent.downloadSpeed;
      const fileInfo = this.downloadingFiles.get(torrent.infoHash);

      if (fileInfo) {
        // Update file info with enhanced metrics
        fileInfo.progress = progress;
        fileInfo.downloadSpeed = downloadSpeed;
        fileInfo.downloadedBytes = torrent.downloaded;
        fileInfo.timeRemaining = this._calculateTimeRemaining(torrent);
        fileInfo.healthScore = this._calculateTorrentHealth(torrent);
        fileInfo.lastUpdated = new Date().toISOString();

        // If we're prioritizing playback position, adjust piece priority
        if (this.performanceConfig.prioritizePlaybackPosition &&
            fileInfo.metadata &&
            fileInfo.metadata.playbackPosition) {
          this._prioritizePlaybackPieces(torrent, fileInfo.metadata.playbackPosition);
        }

        // Notify listeners with enhanced progress information
        this._notifyListeners('onDownloadProgress', {
          fileId: fileInfo.id,
          fileName: fileInfo.name,
          progress,
          downloadSpeed,
          peers: torrent.numPeers,
          timeRemaining: fileInfo.timeRemaining,
          healthScore: fileInfo.healthScore,
          downloadedBytes: fileInfo.downloadedBytes
        });
      }
    });

    // Handle download completion with verification
    torrent.on('done', async () => {
      const fileInfo = this.downloadingFiles.get(torrent.infoHash);
      if (fileInfo) {
        // Verify content integrity before marking as complete
        const isVerified = await this._verifyContentIntegrity(torrent);

        if (isVerified) {
          fileInfo.status = 'completed';
          fileInfo.completedAt = new Date().toISOString();

          // Save verification status
          this.contentVerificationCache.set(torrent.infoHash, true);
          this._saveVerificationCache();

          this._notifyListeners('onDownloadComplete', {
            fileId: fileInfo.id,
            fileName: fileInfo.name,
            size: torrent.length,
            verified: true
          });

          // Enhanced seeding metadata
          const seedingInfo = {
            id: fileInfo.id,
            name: fileInfo.name,
            size: torrent.length,
            infoHash: torrent.infoHash,
            magnetURI: torrent.magnetURI,
            status: 'seeding',
            addedAt: fileInfo.addedAt,
            completedAt: fileInfo.completedAt,
            uploadSpeed: 0,
            uploaded: 0,
            uploadRatio: 0,
            category: fileInfo.metadata?.category || 'unknown',
            quality: fileInfo.metadata?.quality || 'unknown',
            verified: true
          };

          // Move from downloading to seeding
          this.seedingFiles.set(torrent.infoHash, seedingInfo);
          this.downloadingFiles.delete(torrent.infoHash);

          // Check if we should continue seeding based on user preferences
          if (!this._canShareContent()) {
            torrent.pause();
          }
        } else {
          // Content verification failed
          fileInfo.status = 'error';
          fileInfo.error = 'Content verification failed';

          this._notifyListeners('onSecurityEvent', {
            type: 'verification_failure',
            fileId: fileInfo.id,
            fileName: fileInfo.name,
            infoHash: torrent.infoHash
          });

          // Remove the torrent
          this.client.remove(torrent.infoHash, { removeFiles: true });
          this.downloadingFiles.delete(torrent.infoHash);
        }
      }
    });

    // Track upload statistics with enhanced metrics
    torrent.on('upload', (bytes) => {
      const fileInfo = this.seedingFiles.get(torrent.infoHash);
      if (fileInfo) {
        // Update seeding statistics
        fileInfo.uploadSpeed = torrent.uploadSpeed;
        fileInfo.uploaded = torrent.uploaded;
        fileInfo.uploadRatio = torrent.uploaded / torrent.length;
        fileInfo.lastUploadAt = new Date().toISOString();

        // Track upload by content for analytics
        if (!this.uploadStats.uploadedByContent.has(fileInfo.id)) {
          this.uploadStats.uploadedByContent.set(fileInfo.id, 0);
        }
        this.uploadStats.uploadedByContent.set(
          fileInfo.id,
          this.uploadStats.uploadedByContent.get(fileInfo.id) + bytes
        );

        // Apply upload limits if needed
        if (this.userPreferences.maxUploadSpeed > 0 &&
            torrent.uploadSpeed > this.userPreferences.maxUploadSpeed * 1024) {
          // Throttle this specific torrent
          torrent.uploadSpeed = this.userPreferences.maxUploadSpeed * 1024;
        }
      }
    });

    // Enhanced peer connection management
    torrent.on('wire', (wire, addr) => {
      // Create enhanced peer metadata
      const peerInfo = {
        address: addr,
        connectedAt: new Date().toISOString(),
        downloadSpeed: 0,
        uploadSpeed: 0,
        downloaded: 0,
        uploaded: 0,
        latency: 0,
        clientVersion: wire.peerExtensions?.v || 'unknown',
        torrentIds: [torrent.infoHash]
      };

      // Check if this peer is blacklisted
      if (this.securityConfig.peerBlacklist.has(addr)) {
        wire.destroy();
        this._notifyListeners('onSecurityEvent', {
          type: 'blocked_peer',
          peerAddress: addr
        });
        return;
      }

      // Check if we already know this peer
      if (this.peers.has(addr)) {
        // Update existing peer info
        const existingPeer = this.peers.get(addr);
        if (!existingPeer.torrentIds.includes(torrent.infoHash)) {
          existingPeer.torrentIds.push(torrent.infoHash);
        }
        this.peers.set(addr, existingPeer);
      } else {
        // Add new peer
        this.peers.set(addr, peerInfo);

        // Initialize peer stats
        this.peerStats.set(addr, {
          totalDownloaded: 0,
          totalUploaded: 0,
          connectionCount: 1,
          lastSeen: new Date().toISOString(),
          averageLatency: 0,
          successfulConnections: 1,
          failedConnections: 0
        });
      }

      // Use enhanced extension with encryption
      wire.use(this._createExtension(torrent));

      // Measure peer latency
      this._measurePeerLatency(wire, addr);

      // Set up enhanced wire event listeners
      wire.on('download', (bytes) => {
        // Update peer stats
        if (this.peers.has(addr)) {
          const peer = this.peers.get(addr);
          peer.downloadSpeed = wire.downloadSpeed;
          peer.downloaded += bytes;
          this.peers.set(addr, peer);

          // Update peer stats
          const stats = this.peerStats.get(addr);
          if (stats) {
            stats.totalDownloaded += bytes;
            stats.lastSeen = new Date().toISOString();
            this.peerStats.set(addr, stats);
          }
        }
      });

      wire.on('upload', (bytes) => {
        // Update peer stats
        if (this.peers.has(addr)) {
          const peer = this.peers.get(addr);
          peer.uploadSpeed = wire.uploadSpeed;
          peer.uploaded += bytes;
          this.peers.set(addr, peer);

          // Update peer stats
          const stats = this.peerStats.get(addr);
          if (stats) {
            stats.totalUploaded += bytes;
            stats.lastSeen = new Date().toISOString();
            this.peerStats.set(addr, stats);
          }
        }
      });

      wire.on('close', () => {
        // Update peer info on disconnect
        if (this.peers.has(addr)) {
          const peer = this.peers.get(addr);
          peer.torrentIds = peer.torrentIds.filter(id => id !== torrent.infoHash);

          if (peer.torrentIds.length === 0) {
            // Remove peer if not connected to any torrents
            this.peers.delete(addr);
          } else {
            // Update peer info
            this.peers.set(addr, peer);
          }
        }

        this._notifyListeners('onPeerDisconnect', {
          peerId: addr,
          torrentId: torrent.infoHash,
          numPeers: torrent.numPeers,
          reason: 'peer_disconnected'
        });
      });

      // Notify about new peer connection
      this._notifyListeners('onPeerConnect', {
        peerId: addr,
        torrentId: torrent.infoHash,
        numPeers: torrent.numPeers,
        clientVersion: peerInfo.clientVersion
      });
    });

    // Handle errors
    torrent.on('error', (err) => {
      console.error('Torrent error:', err);

      const fileInfo = this.downloadingFiles.get(torrent.infoHash) ||
                       this.seedingFiles.get(torrent.infoHash);

      if (fileInfo) {
        fileInfo.status = 'error';
        fileInfo.error = err.message;
      }

      this._notifyListeners('onError', {
        torrentId: torrent.infoHash,
        error: err.message
      });
    });

    // Handle warnings
    torrent.on('warning', (warning) => {
      console.warn('Torrent warning:', warning);

      this._notifyListeners('onError', {
        torrentId: torrent.infoHash,
        warning: warning.message || warning,
        level: 'warning'
      });
    });

    // Handle tracker responses for better error handling
    torrent.on('trackerResponse', (tracker, numPeers) => {
      // Update network metrics
      this.networkMetrics.peerAvailability = Math.max(
        this.networkMetrics.peerAvailability,
        numPeers > 0 ? 1 : 0
      );
    });
  }

  /**
   * Measure peer latency
   * @private
   * @param {Object} wire - WebTorrent wire object
   * @param {string} addr - Peer address
   */
  _measurePeerLatency(wire, addr) {
    // In a real implementation, this would use a ping/pong mechanism
    // For now, we'll just use a random value for demonstration
    const simulatedLatency = Math.random() * 200 + 50; // 50-250ms

    if (this.peers.has(addr)) {
      const peer = this.peers.get(addr);
      peer.latency = simulatedLatency;
      this.peers.set(addr, peer);

      // Update average latency metric
      const totalPeers = this.peers.size;
      let totalLatency = 0;

      this.peers.forEach(peer => {
        totalLatency += peer.latency;
      });

      this.networkMetrics.averageLatency = totalLatency / totalPeers;
    }
  }

  /**
   * Calculate estimated time remaining for download
   * @private
   * @param {Object} torrent - WebTorrent torrent object
   * @returns {number} Time remaining in seconds
   */
  _calculateTimeRemaining(torrent) {
    if (torrent.done || torrent.downloadSpeed === 0) {
      return 0;
    }

    const remainingBytes = torrent.length - torrent.downloaded;
    return Math.ceil(remainingBytes / torrent.downloadSpeed);
  }

  /**
   * Calculate torrent health score
   * @private
   * @param {Object} torrent - WebTorrent torrent object
   * @returns {number} Health score from 0-1
   */
  _calculateTorrentHealth(torrent) {
    // Factors that contribute to torrent health:
    // 1. Number of peers
    // 2. Download speed
    // 3. Availability of pieces
    // 4. Progress

    const peerScore = Math.min(torrent.numPeers / 5, 1); // Max score at 5+ peers
    const speedScore = Math.min(torrent.downloadSpeed / (1024 * 1024), 1); // Max score at 1MB/s

    // Calculate piece availability (simplified)
    let availabilityScore = 0;
    if (torrent.pieces && torrent.pieces.length > 0) {
      const availablePieces = torrent.pieces.filter(piece => piece).length;
      availabilityScore = availablePieces / torrent.pieces.length;
    }

    // Progress contributes to health
    const progressScore = torrent.progress;

    // Weighted average
    return (
      peerScore * 0.4 +
      speedScore * 0.3 +
      availabilityScore * 0.2 +
      progressScore * 0.1
    );
  }

  /**
   * Prioritize pieces near the current playback position
   * @private
   * @param {Object} torrent - WebTorrent torrent object
   * @param {number} playbackPosition - Current playback position in seconds
   */
  _prioritizePlaybackPieces(torrent, playbackPosition) {
    if (!torrent.files || torrent.files.length === 0) return;

    const file = torrent.files[0]; // Assume the first file is the video

    // Convert playback position (seconds) to byte position
    // This is a simplified calculation and would need to be more sophisticated in a real player
    const bytesPerSecond = file.length / (file.duration || 7200); // Default to 2 hours if duration unknown
    const bytePosition = playbackPosition * bytesPerSecond;

    // Calculate which piece contains this byte position
    const pieceLength = torrent.pieceLength;
    const currentPiece = Math.floor((file.offset + bytePosition) / pieceLength);

    // Prioritize pieces in a window around the current playback position
    // Higher priority for pieces immediately needed, lower for pieces further ahead
    const preBufferPieces = Math.ceil((this.performanceConfig.preBufferSeconds * bytesPerSecond) / pieceLength);

    for (let i = 0; i < torrent.pieces.length; i++) {
      // Distance from current piece (positive means ahead, negative means behind)
      const distance = i - currentPiece;

      if (distance >= 0 && distance < preBufferPieces) {
        // Ahead of playback position and within pre-buffer window - highest priority
        torrent.select(i, i, 10);
      } else if (distance >= preBufferPieces && distance < preBufferPieces * 2) {
        // Further ahead - medium priority
        torrent.select(i, i, 5);
      } else if (distance < 0 && distance > -5) {
        // Just behind playback position - high priority (for seeking back)
        torrent.select(i, i, 7);
      } else {
        // Far behind or far ahead - normal priority
        torrent.select(i, i, 1);
      }
    }
  }

  /**
   * Save the content verification cache to localStorage
   * @private
   */
  _saveVerificationCache() {
    try {
      const cacheObject = {};
      this.contentVerificationCache.forEach((verified, infoHash) => {
        cacheObject[infoHash] = verified;
      });

      localStorage.setItem('p2pVerifiedContent', JSON.stringify(cacheObject));
    } catch (error) {
      console.error('Error saving verification cache:', error);
    }
  }

  /**
   * Create an enhanced custom extension for secure peer metadata exchange
   * @private
   * @param {Object} torrent - WebTorrent torrent object
   * @returns {Object} Extension object
   */
  _createExtension(torrent) {
    return {
      name: 'movo-p2p-enhanced',
      onHandshake: (handshake) => {
        // Create secure handshake with minimal information
        // We don't want to leak too much data to peers
        const handshakeData = {
          protocolVersion: '2.0.0',
          clientVersion: '2.0.0',
          capabilities: {
            encryption: true,
            streaming: true,
            adaptiveBitrate: this.performanceConfig.adaptiveBitrate,
            supportsResolutions: ['720p', '1080p', '4K']
          },
          // Use a session-specific ID instead of the persistent user ID
          sessionId: uuidv4().substring(0, 8)
        };

        // Encrypt the handshake if encryption is enabled
        if (this.securityConfig.encryptMetadata) {
          // In a real implementation, we would encrypt with the peer's public key
          // For now, we'll just use a simple encryption
          return {
            encrypted: true,
            data: this._encryptData(handshakeData)
          };
        }

        return handshakeData;
      },

      onExtendedHandshake: (handshake) => {
        try {
          // Process the handshake data
          let peerData;

          if (handshake.encrypted && handshake.data) {
            // Decrypt the handshake data
            peerData = this._decryptData(handshake.data);
            if (!peerData) {
              console.warn('Failed to decrypt peer handshake data');
              return;
            }
          } else {
            peerData = handshake;
          }

          // Store peer capabilities
          const wire = torrent.wires.find(w => w.peerId === handshake.peerId);
          if (wire && peerData.capabilities) {
            wire.peerCapabilities = peerData.capabilities;
          }

          // Log peer information (in a real app, we would use this for analytics)
          console.log('Extended handshake from peer:', {
            sessionId: peerData.sessionId,
            protocolVersion: peerData.protocolVersion,
            capabilities: peerData.capabilities
          });

          // Negotiate optimal streaming parameters based on peer capabilities
          this._negotiateStreamingParameters(wire, peerData);
        } catch (err) {
          console.error('Error processing extended handshake:', err);
        }
      },

      onMessage: (buf) => {
        try {
          // Check if the message is encrypted
          let message;
          const rawData = buf.toString();

          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(rawData);

            if (parsed.encrypted && parsed.data) {
              // Decrypt the message
              message = this._decryptData(parsed.data);
              if (!message) {
                console.warn('Failed to decrypt peer message');
                return;
              }
            } else {
              message = parsed;
            }
          } catch (parseErr) {
            // Not valid JSON, might be encrypted directly
            try {
              message = this._decryptData(rawData);
            } catch (decryptErr) {
              console.error('Error decrypting peer message:', decryptErr);
              return;
            }
          }

          // Process different message types
          this._handlePeerMessage(message, torrent);
        } catch (err) {
          console.error('Error handling peer message:', err);
        }
      }
    };
  }

  /**
   * Handle different types of peer messages
   * @private
   * @param {Object} message - Peer message
   * @param {Object} torrent - WebTorrent torrent object
   */
  _handlePeerMessage(message, torrent) {
    if (!message || !message.type) {
      console.warn('Received invalid peer message:', message);
      return;
    }

    switch (message.type) {
      case 'have-metadata':
        // Peer has metadata for a specific file
        console.log('Peer has metadata for:', message.infoHash);
        break;

      case 'request-metadata':
        // Peer is requesting metadata
        this._sendMetadataToPeer(message.infoHash, torrent);
        break;

      case 'streaming-stats':
        // Peer is sharing streaming statistics
        this._updatePeerStreamingStats(message.stats, torrent);
        break;

      case 'bitfield-update':
        // Peer is updating their bitfield
        this._updatePeerBitfield(message.bitfield, torrent);
        break;

      case 'network-info':
        // Peer is sharing network information
        this._updateNetworkInfo(message.info, torrent);
        break;

      default:
        console.log('Received unknown message type:', message.type);
    }
  }

  /**
   * Negotiate optimal streaming parameters with peer
   * @private
   * @param {Object} wire - WebTorrent wire object
   * @param {Object} peerData - Peer handshake data
   */
  _negotiateStreamingParameters(wire, peerData) {
    if (!wire || !peerData.capabilities) return;

    // Determine the highest resolution both peers support
    const ourResolutions = ['720p', '1080p', '4K'];
    const peerResolutions = peerData.capabilities.supportsResolutions || [];

    const commonResolutions = ourResolutions.filter(res =>
      peerResolutions.includes(res)
    );

    // Use the highest common resolution
    if (commonResolutions.length > 0) {
      const highestResolution = commonResolutions[commonResolutions.length - 1];

      // In a real implementation, we would adjust streaming parameters
      console.log(`Negotiated resolution with peer: ${highestResolution}`);
    }
  }

  /**
   * Send metadata to a peer that requested it
   * @private
   * @param {string} infoHash - Info hash of the requested content
   * @param {Object} torrent - WebTorrent torrent object
   */
  _sendMetadataToPeer(infoHash, torrent) {
    // Check if we have the requested content
    const fileInfo = this.seedingFiles.get(infoHash);
    if (!fileInfo) return;

    // Prepare metadata to send
    const metadata = {
      type: 'metadata-response',
      infoHash: infoHash,
      name: fileInfo.name,
      size: fileInfo.size,
      category: fileInfo.category || 'unknown',
      quality: fileInfo.quality || 'unknown'
    };

    // In a real implementation, we would send this to the specific peer
    console.log('Would send metadata to peer:', metadata);
  }

  /**
   * Update peer streaming statistics
   * @private
   * @param {Object} stats - Peer streaming stats
   * @param {Object} torrent - WebTorrent torrent object
   */
  _updatePeerStreamingStats(stats, torrent) {
    // In a real implementation, we would use this to optimize streaming
    console.log('Peer streaming stats:', stats);
  }

  /**
   * Update peer bitfield information
   * @private
   * @param {Array} bitfield - Peer bitfield
   * @param {Object} torrent - WebTorrent torrent object
   */
  _updatePeerBitfield(bitfield, torrent) {
    // In a real implementation, we would use this to optimize piece selection
    console.log('Peer bitfield update received');
  }

  /**
   * Update network information from peer
   * @private
   * @param {Object} info - Network information
   * @param {Object} torrent - WebTorrent torrent object
   */
  _updateNetworkInfo(info, torrent) {
    // In a real implementation, we would use this to optimize connections
    console.log('Peer network info:', info);
  }

  /**
   * Update global upload/download statistics with enhanced metrics
   * @private
   */
  _updateStats() {
    if (!this.client) return;

    let totalUploadSpeed = 0;
    let totalDownloadSpeed = 0;
    let totalUploaded = 0;
    let totalDownloaded = 0;
    let activeTorrents = 0;
    let activePeers = 0;
    let healthyTorrents = 0;

    // Calculate moving averages for speeds
    const now = Date.now();
    const speedSamples = this.speedSamples || [];

    // Keep only recent samples (last 30 seconds)
    while (speedSamples.length > 0 && now - speedSamples[0].timestamp > 30000) {
      speedSamples.shift();
    }

    // Process each torrent
    this.client.torrents.forEach(torrent => {
      // Basic stats
      totalUploadSpeed += torrent.uploadSpeed;
      totalDownloadSpeed += torrent.downloadSpeed;
      totalUploaded += torrent.uploaded;
      totalDownloaded += torrent.downloaded;

      // Count active torrents and peers
      if (torrent.uploadSpeed > 0 || torrent.downloadSpeed > 0) {
        activeTorrents++;
      }

      activePeers += torrent.numPeers;

      // Count healthy torrents
      const health = this._calculateTorrentHealth(torrent);
      if (health > 0.5) {
        healthyTorrents++;
      }

      // Update per-content statistics
      const fileInfo = this.seedingFiles.get(torrent.infoHash) ||
                       this.downloadingFiles.get(torrent.infoHash);

      if (fileInfo) {
        // Update content-specific stats
        if (torrent.uploaded > 0) {
          if (!this.uploadStats.uploadedByContent.has(fileInfo.id)) {
            this.uploadStats.uploadedByContent.set(fileInfo.id, 0);
          }
          this.uploadStats.uploadedByContent.set(
            fileInfo.id,
            torrent.uploaded
          );
        }

        if (torrent.downloaded > 0) {
          if (!this.downloadStats.downloadedByContent.has(fileInfo.id)) {
            this.downloadStats.downloadedByContent.set(fileInfo.id, 0);
          }
          this.downloadStats.downloadedByContent.set(
            fileInfo.id,
            torrent.downloaded
          );
        }
      }
    });

    // Add current speed sample
    speedSamples.push({
      timestamp: now,
      uploadSpeed: totalUploadSpeed,
      downloadSpeed: totalDownloadSpeed
    });

    this.speedSamples = speedSamples;

    // Calculate average speeds
    let avgUploadSpeed = 0;
    let avgDownloadSpeed = 0;

    if (speedSamples.length > 0) {
      avgUploadSpeed = speedSamples.reduce((sum, sample) => sum + sample.uploadSpeed, 0) / speedSamples.length;
      avgDownloadSpeed = speedSamples.reduce((sum, sample) => sum + sample.downloadSpeed, 0) / speedSamples.length;
    }

    // Update peak speeds
    const peakUploadSpeed = Math.max(this.uploadStats.peakUploadSpeed || 0, totalUploadSpeed);
    const peakDownloadSpeed = Math.max(this.downloadStats.peakDownloadSpeed || 0, totalDownloadSpeed);

    // Update upload stats
    this.uploadStats = {
      totalUploaded,
      uploadSpeed: totalUploadSpeed,
      peakUploadSpeed,
      averageUploadSpeed: avgUploadSpeed,
      uploadedByContent: this.uploadStats.uploadedByContent
    };

    // Update download stats
    this.downloadStats = {
      totalDownloaded,
      downloadSpeed: totalDownloadSpeed,
      peakDownloadSpeed,
      averageDownloadSpeed: avgDownloadSpeed,
      downloadedByContent: this.downloadStats.downloadedByContent
    };

    // Update network metrics
    this.networkMetrics = {
      ...this.networkMetrics,
      activeTorrents,
      activePeers,
      healthyTorrents,
      healthScore: this._calculateNetworkHealth(),
      lastUpdated: now
    };

    // Persist stats to localStorage periodically (every 5 minutes)
    if (!this.lastStatsSave || now - this.lastStatsSave > 5 * 60 * 1000) {
      this._persistStats();
      this.lastStatsSave = now;
    }
  }

  /**
   * Persist statistics to localStorage
   * @private
   */
  _persistStats() {
    try {
      // Save total uploaded/downloaded
      localStorage.setItem('p2pTotalUploaded', this.uploadStats.totalUploaded.toString());
      localStorage.setItem('p2pTotalDownloaded', this.downloadStats.totalDownloaded.toString());
      localStorage.setItem('p2pPeakUploadSpeed', this.uploadStats.peakUploadSpeed.toString());
      localStorage.setItem('p2pPeakDownloadSpeed', this.downloadStats.peakDownloadSpeed.toString());

      // Save content-specific stats
      const uploadedByContent = {};
      this.uploadStats.uploadedByContent.forEach((value, key) => {
        uploadedByContent[key] = value;
      });

      const downloadedByContent = {};
      this.downloadStats.downloadedByContent.forEach((value, key) => {
        downloadedByContent[key] = value;
      });

      localStorage.setItem('p2pUploadedByContent', JSON.stringify(uploadedByContent));
      localStorage.setItem('p2pDownloadedByContent', JSON.stringify(downloadedByContent));
    } catch (error) {
      console.error('Error persisting P2P stats:', error);
    }
  }

  /**
   * Notify all registered listeners for a specific event
   * @private
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  _notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in ${event} listener:`, err);
        }
      });
    }
  }

  /**
   * Add a listener for a specific event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  addEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  /**
   * Remove a listener for a specific event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  removeEventListener(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  /**
   * Create a torrent from a file and start seeding it
   * @param {File|Blob} file - File or Blob to seed
   * @param {Object} metadata - Additional metadata for the file
   * @returns {Promise} Resolves with the torrent info when seeding starts
   */
  async seedFile(file, metadata = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const opts = {
        announceList: this.trackers,
        comment: `Shared via Movo P2P - User: ${this.userId}`,
        createdBy: 'Movo P2P',
        private: false,
        info: {
          name: file.name,
          ...metadata
        }
      };

      this.client.seed(file, opts, (torrent) => {
        const fileInfo = {
          id: metadata.id || uuidv4(),
          name: file.name,
          size: file.size,
          type: file.type,
          infoHash: torrent.infoHash,
          magnetURI: torrent.magnetURI,
          status: 'seeding',
          addedAt: new Date().toISOString(),
          metadata
        };

        this.seedingFiles.set(torrent.infoHash, fileInfo);
        this.torrents.set(torrent.infoHash, torrent);

        this._notifyListeners('onSeedingStart', fileInfo);

        console.log('Started seeding:', fileInfo.name);
        console.log('Magnet URI:', torrent.magnetURI);

        resolve(fileInfo);
      });
    });
  }

  /**
   * Download a file using its magnet URI or info hash
   * @param {string} magnetURI - Magnet URI or info hash
   * @param {Object} metadata - Additional metadata for the file
   * @returns {Promise} Resolves with the torrent info when download starts
   */
  async downloadFile(magnetURI, metadata = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const opts = {
        announce: this.trackers
      };

      this.client.add(magnetURI, opts, (torrent) => {
        const fileInfo = {
          id: metadata.id || uuidv4(),
          name: torrent.name || 'Unknown',
          size: torrent.length,
          infoHash: torrent.infoHash,
          magnetURI: torrent.magnetURI,
          status: 'downloading',
          progress: 0,
          downloadSpeed: 0,
          addedAt: new Date().toISOString(),
          metadata
        };

        this.downloadingFiles.set(torrent.infoHash, fileInfo);
        this.torrents.set(torrent.infoHash, torrent);

        console.log('Started downloading:', fileInfo.name);

        resolve(fileInfo);
      });
    });
  }

  /**
   * Stream a file to a video element
   * @param {string} magnetURI - Magnet URI or info hash
   * @param {HTMLVideoElement} videoElement - Video element to stream to
   * @param {Object} options - Streaming options
   * @returns {Promise} Resolves with the torrent info when streaming starts
   */
  async streamToVideo(magnetURI, videoElement, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const opts = {
        announce: this.trackers,
        buffer: (options.buffer || 30) * 1000, // Buffer in milliseconds
        maxWebConns: options.maxConnections || 20
      };

      this.client.add(magnetURI, opts, (torrent) => {
        // Get the largest video file
        const file = torrent.files.find(file => {
          const name = file.name.toLowerCase();
          return name.endsWith('.mp4') || name.endsWith('.webm') ||
                 name.endsWith('.mkv') || name.endsWith('.avi');
        }) || torrent.files[0];

        // Stream to video element
        file.renderTo(videoElement);

        const fileInfo = {
          id: options.id || uuidv4(),
          name: file.name,
          size: file.length,
          infoHash: torrent.infoHash,
          magnetURI: torrent.magnetURI,
          status: 'streaming',
          progress: 0,
          downloadSpeed: 0,
          addedAt: new Date().toISOString(),
          metadata: options.metadata || {}
        };

        this.downloadingFiles.set(torrent.infoHash, fileInfo);
        this.torrents.set(torrent.infoHash, torrent);

        console.log('Started streaming:', fileInfo.name);

        resolve(fileInfo);
      });
    });
  }

  /**
   * Get a file from a torrent as a blob URL
   * @param {string} magnetURI - Magnet URI or info hash
   * @param {string} fileName - Optional file name to select from the torrent
   * @returns {Promise} Resolves with the blob URL
   */
  async getFileAsBlob(magnetURI, fileName = null) {
    if (!this.initialized) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      this.client.add(magnetURI, (torrent) => {
        let file;

        if (fileName) {
          file = torrent.files.find(f => f.name === fileName);
        } else {
          file = torrent.files[0];
        }

        if (!file) {
          reject(new Error('File not found in torrent'));
          return;
        }

        file.getBlobURL((err, url) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(url);
        });
      });
    });
  }

  /**
   * Stop downloading or seeding a file
   * @param {string} infoHash - Info hash of the torrent
   * @returns {Promise} Resolves when the torrent is removed
   */
  async stopTorrent(infoHash) {
    return new Promise((resolve, reject) => {
      const torrent = this.torrents.get(infoHash);

      if (!torrent) {
        reject(new Error('Torrent not found'));
        return;
      }

      this.client.remove(infoHash, (err) => {
        if (err) {
          reject(err);
          return;
        }

        this.torrents.delete(infoHash);
        this.seedingFiles.delete(infoHash);
        this.downloadingFiles.delete(infoHash);

        resolve();
      });
    });
  }

  /**
   * Get all active torrents
   * @returns {Object} Object containing seeding and downloading files
   */
  getActiveTorrents() {
    return {
      seeding: Array.from(this.seedingFiles.values()),
      downloading: Array.from(this.downloadingFiles.values())
    };
  }

  /**
   * Get statistics about P2P activity
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      peers: this.peers.size,
      upload: this.uploadStats,
      download: this.downloadStats,
      torrents: {
        seeding: this.seedingFiles.size,
        downloading: this.downloadingFiles.size,
        total: this.torrents.size
      }
    };
  }

  /**
   * Create a magnet URI for a movie
   * @param {Object} movie - Movie object
   * @returns {string} Magnet URI
   */
  createMovieMagnetURI(movie) {
    const trackerString = this.trackers.map(t => `&tr=${encodeURIComponent(t)}`).join('');
    return `magnet:?xt=urn:btih:${movie.infoHash || uuidv4()}&dn=${encodeURIComponent(movie.title)}&xl=${movie.size || 0}${trackerString}`;
  }

  /**
   * Destroy the P2P client and clean up resources
   */
  destroy() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    if (this.client) {
      this.client.destroy();
      this.client = null;
    }

    this.initialized = false;
    this.torrents.clear();
    this.seedingFiles.clear();
    this.downloadingFiles.clear();
    this.peers.clear();
  }
}

// Create singleton instance
const p2pService = new P2PService();

export default p2pService;
