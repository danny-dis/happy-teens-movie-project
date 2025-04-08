/**
 * P2P Network Module
 * 
 * Provides peer-to-peer networking capabilities:
 * - Content discovery and sharing
 * - Direct peer connections
 * - Multi-protocol support (WebTorrent, WebRTC)
 * 
 * @author zophlic
 */

import WebTorrent from 'webtorrent';

export class P2PNetwork {
  constructor() {
    this.client = null;
    this.peers = new Map();
    this.torrents = new Map();
    this.stats = {
      uploadSpeed: 0,
      downloadSpeed: 0,
      peers: 0,
      torrents: 0,
      uploaded: 0,
      downloaded: 0,
      ratio: 0
    };
    this.listeners = new Map();
    this.initialized = false;
  }
  
  /**
   * Initialize the P2P network
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      console.log('Initializing P2P network...');
      
      // Create WebTorrent client
      this.client = new WebTorrent({
        tracker: {
          announce: [
            'wss://tracker.openwebtorrent.com',
            'wss://tracker.btorrent.xyz',
            'wss://tracker.fastcast.nz'
          ]
        },
        dht: true,
        webSeeds: true
      });
      
      // Set up event listeners
      this.client.on('error', this._handleError.bind(this));
      this.client.on('torrent', this._handleNewTorrent.bind(this));
      
      // Start stats update interval
      this.statsInterval = setInterval(() => this._updateStats(), 1000);
      
      this.initialized = true;
      console.log('P2P network initialized');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize P2P network:', error);
      return false;
    }
  }
  
  /**
   * Share content with the network
   * @param {File|Blob} file - File to share
   * @param {Object} metadata - Content metadata
   * @returns {Promise<Object>} Shared content info
   */
  async shareContent(file, metadata) {
    if (!this.initialized) await this.initialize();
    
    return new Promise((resolve, reject) => {
      console.log('Sharing content:', metadata.title || file.name);
      
      // Create torrent from file
      this.client.seed(file, {
        name: metadata.title || file.name,
        comment: JSON.stringify(metadata),
        announceList: [
          ['wss://tracker.openwebtorrent.com'],
          ['wss://tracker.btorrent.xyz'],
          ['wss://tracker.fastcast.nz']
        ]
      }, torrent => {
        console.log('Content seeding started:', torrent.infoHash);
        
        // Store torrent info
        this.torrents.set(torrent.infoHash, {
          infoHash: torrent.infoHash,
          name: torrent.name,
          metadata,
          file,
          torrent,
          added: Date.now()
        });
        
        // Emit event
        this._emit('content:shared', {
          infoHash: torrent.infoHash,
          name: torrent.name,
          metadata
        });
        
        resolve({
          contentId: torrent.infoHash,
          infoHash: torrent.infoHash,
          magnetURI: torrent.magnetURI,
          name: torrent.name,
          metadata
        });
      });
    });
  }
  
  /**
   * Download content from the network
   * @param {string} infoHash - Content info hash
   * @param {Object} options - Download options
   * @returns {Promise<Object>} Download info
   */
  async downloadContent(infoHash, options = {}) {
    if (!this.initialized) await this.initialize();
    
    return new Promise((resolve, reject) => {
      console.log('Downloading content:', infoHash);
      
      // Check if already downloading
      if (this.torrents.has(infoHash)) {
        const existing = this.torrents.get(infoHash);
        resolve(existing);
        return;
      }
      
      // Start downloading
      this.client.add(infoHash, options, torrent => {
        console.log('Content download started:', infoHash);
        
        // Store torrent info
        this.torrents.set(torrent.infoHash, {
          infoHash: torrent.infoHash,
          name: torrent.name,
          torrent,
          progress: 0,
          downloaded: 0,
          added: Date.now()
        });
        
        // Set up progress tracking
        torrent.on('download', bytes => {
          const info = this.torrents.get(torrent.infoHash);
          info.progress = torrent.progress;
          info.downloaded = torrent.downloaded;
          
          // Emit progress event
          this._emit('content:progress', {
            infoHash: torrent.infoHash,
            progress: torrent.progress,
            downloadSpeed: torrent.downloadSpeed
          });
        });
        
        // Handle completion
        torrent.on('done', () => {
          console.log('Content download complete:', infoHash);
          
          const info = this.torrents.get(torrent.infoHash);
          info.progress = 1;
          info.complete = true;
          
          // Emit completion event
          this._emit('content:complete', {
            infoHash: torrent.infoHash,
            name: torrent.name
          });
        });
        
        resolve({
          infoHash: torrent.infoHash,
          name: torrent.name,
          files: torrent.files,
          progress: 0
        });
      });
    });
  }
  
  /**
   * Stream content from the network
   * @param {string} infoHash - Content info hash
   * @returns {Promise<Object>} Stream info
   */
  async streamContent(infoHash) {
    if (!this.initialized) await this.initialize();
    
    console.log('Streaming content:', infoHash);
    
    // Check if already downloading
    if (this.torrents.has(infoHash)) {
      const existing = this.torrents.get(infoHash);
      
      if (existing.torrent.files && existing.torrent.files.length > 0) {
        const file = existing.torrent.files[0];
        
        return {
          infoHash,
          name: existing.name,
          url: file.streamURL || URL.createObjectURL(file),
          file
        };
      }
    }
    
    // Start downloading for streaming
    const downloadInfo = await this.downloadContent(infoHash, {
      priority: 0, // Highest priority
      strategy: 'sequential' // Download sequentially for streaming
    });
    
    // Wait for the first file to be available
    return new Promise((resolve, reject) => {
      const torrent = this.client.get(infoHash);
      
      if (!torrent) {
        reject(new Error('Failed to get torrent for streaming'));
        return;
      }
      
      // If files are already available
      if (torrent.files && torrent.files.length > 0) {
        const file = torrent.files[0];
        
        resolve({
          infoHash,
          name: torrent.name,
          url: file.streamURL || URL.createObjectURL(file),
          file
        });
        return;
      }
      
      // Wait for files to become available
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for stream to start'));
      }, 30000); // 30 second timeout
      
      torrent.on('ready', () => {
        clearTimeout(timeout);
        
        if (torrent.files && torrent.files.length > 0) {
          const file = torrent.files[0];
          
          resolve({
            infoHash,
            name: torrent.name,
            url: file.streamURL || URL.createObjectURL(file),
            file
          });
        } else {
          reject(new Error('No files found in torrent'));
        }
      });
    });
  }
  
  /**
   * Announce presence to the network
   * @param {string} publicKey - User's public key
   * @returns {Promise<boolean>} Success status
   */
  async announce(publicKey) {
    if (!this.initialized) await this.initialize();
    
    console.log('Announcing presence to network:', publicKey.slice(0, 10) + '...');
    
    // In a real implementation, this would announce to a DHT or tracker
    // For now, we'll just emit an event
    this._emit('peer:announce', {
      publicKey,
      timestamp: Date.now()
    });
    
    return true;
  }
  
  /**
   * Get network statistics
   * @returns {Object} Network statistics
   */
  getStats() {
    return { ...this.stats };
  }
  
  /**
   * Get all active torrents
   * @returns {Array} Active torrents
   */
  getTorrents() {
    return Array.from(this.torrents.values());
  }
  
  /**
   * Stop sharing content
   * @param {string} infoHash - Content info hash
   * @returns {Promise<boolean>} Success status
   */
  async stopSharing(infoHash) {
    if (!this.initialized) return false;
    
    if (!this.torrents.has(infoHash)) {
      return false;
    }
    
    const torrentInfo = this.torrents.get(infoHash);
    
    return new Promise((resolve) => {
      torrentInfo.torrent.destroy({
        destroyStore: false
      }, () => {
        this.torrents.delete(infoHash);
        this._emit('content:stopped', { infoHash });
        resolve(true);
      });
    });
  }
  
  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    return () => {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }
  
  /**
   * Clean up resources
   */
  destroy() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    
    if (this.client) {
      this.client.destroy();
    }
    
    this.initialized = false;
    this.listeners.clear();
    this.peers.clear();
    this.torrents.clear();
  }
  
  /**
   * Emit event to listeners
   * @private
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  _emit(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      }
    }
  }
  
  /**
   * Update network statistics
   * @private
   */
  _updateStats() {
    if (!this.client) return;
    
    this.stats = {
      uploadSpeed: this.client.uploadSpeed,
      downloadSpeed: this.client.downloadSpeed,
      peers: this.client.torrents.reduce((sum, t) => sum + t.numPeers, 0),
      torrents: this.client.torrents.length,
      uploaded: this.client.torrents.reduce((sum, t) => sum + t.uploaded, 0),
      downloaded: this.client.torrents.reduce((sum, t) => sum + t.downloaded, 0),
      ratio: this.client.downloadSpeed ? this.client.uploadSpeed / this.client.downloadSpeed : 0
    };
    
    this._emit('stats:updated', this.stats);
  }
  
  /**
   * Handle P2P network error
   * @private
   * @param {Error} error - Error object
   */
  _handleError(error) {
    console.error('P2P network error:', error);
    this._emit('error', error);
  }
  
  /**
   * Handle new torrent
   * @private
   * @param {Object} torrent - Torrent object
   */
  _handleNewTorrent(torrent) {
    console.log('New torrent added:', torrent.infoHash);
    
    // Set up torrent event handlers
    torrent.on('wire', wire => {
      this._handleNewPeer(torrent, wire);
    });
    
    torrent.on('error', error => {
      console.error('Torrent error:', error);
      this._emit('torrent:error', {
        infoHash: torrent.infoHash,
        error
      });
    });
  }
  
  /**
   * Handle new peer connection
   * @private
   * @param {Object} torrent - Torrent object
   * @param {Object} wire - Peer wire connection
   */
  _handleNewPeer(torrent, wire) {
    const peerId = wire.peerId.toString('hex');
    
    // Track peer
    this.peers.set(peerId, {
      id: peerId,
      torrent: torrent.infoHash,
      wire,
      connected: Date.now()
    });
    
    // Emit event
    this._emit('peer:connected', {
      peerId,
      torrentId: torrent.infoHash
    });
    
    // Handle peer disconnect
    wire.on('close', () => {
      this.peers.delete(peerId);
      
      // Emit event
      this._emit('peer:disconnected', {
        peerId,
        torrentId: torrent.infoHash
      });
    });
  }
}
