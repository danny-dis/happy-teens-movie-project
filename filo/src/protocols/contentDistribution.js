/**
 * Content Distribution Protocol
 * 
 * Manages the distribution of content across the P2P network:
 * - Multi-protocol content sharing (WebTorrent, IPFS)
 * - Adaptive streaming optimization
 * - Content availability tracking
 * 
 * @author zophlic
 */

export class ContentDistribution {
  constructor(network) {
    this.network = network;
    this.contentAvailability = new Map();
    this.streamingSessions = new Map();
    this.downloadQueue = [];
    this.initialized = false;
    
    // Performance metrics
    this.metrics = {
      totalShared: 0,
      totalDownloaded: 0,
      activeStreams: 0,
      successRate: 1.0
    };
  }
  
  /**
   * Initialize the content distribution system
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Ensure network is initialized
      if (!this.network.initialized) {
        await this.network.initialize();
      }
      
      // Set up network event listeners
      this.network.on('content:shared', this._handleContentShared.bind(this));
      this.network.on('content:progress', this._handleDownloadProgress.bind(this));
      this.network.on('content:complete', this._handleDownloadComplete.bind(this));
      
      this.initialized = true;
      console.log('Content distribution system initialized');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize content distribution:', error);
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
    
    try {
      console.log('Sharing content:', metadata.title || file.name);
      
      // Share via WebTorrent
      const sharedContent = await this.network.shareContent(file, metadata);
      
      // Track content availability
      this.contentAvailability.set(sharedContent.contentId, {
        contentId: sharedContent.contentId,
        infoHash: sharedContent.infoHash,
        magnetURI: sharedContent.magnetURI,
        metadata,
        protocols: ['webtorrent'],
        availability: 1.0,
        shared: Date.now()
      });
      
      // Update metrics
      this.metrics.totalShared += file.size;
      
      return sharedContent;
    } catch (error) {
      console.error('Failed to share content:', error);
      throw error;
    }
  }
  
  /**
   * Download content from the network
   * @param {string} contentId - Content identifier
   * @param {Object} metadata - Content metadata
   * @returns {Promise<Object>} Download info
   */
  async downloadContent(contentId, metadata) {
    if (!this.initialized) await this.initialize();
    
    try {
      console.log('Downloading content:', contentId);
      
      // Check if content is already in download queue
      const existingDownload = this.downloadQueue.find(item => item.contentId === contentId);
      if (existingDownload) {
        return existingDownload;
      }
      
      // Create download entry
      const downloadEntry = {
        contentId,
        metadata,
        started: Date.now(),
        progress: 0,
        status: 'queued'
      };
      
      // Add to download queue
      this.downloadQueue.push(downloadEntry);
      
      // Start download via WebTorrent
      downloadEntry.status = 'downloading';
      const downloadInfo = await this.network.downloadContent(contentId, {
        strategy: 'sequential' // Download sequentially for better streaming
      });
      
      // Update download entry
      downloadEntry.infoHash = downloadInfo.infoHash;
      downloadEntry.name = downloadInfo.name;
      
      return downloadEntry;
    } catch (error) {
      console.error('Failed to download content:', error);
      throw error;
    }
  }
  
  /**
   * Stream content from the network
   * @param {string} contentId - Content identifier
   * @returns {Promise<Object>} Stream info
   */
  async streamContent(contentId) {
    if (!this.initialized) await this.initialize();
    
    try {
      console.log('Streaming content:', contentId);
      
      // Check if already streaming
      if (this.streamingSessions.has(contentId)) {
        return this.streamingSessions.get(contentId);
      }
      
      // Start streaming
      const streamInfo = await this.network.streamContent(contentId);
      
      // Create streaming session
      const streamingSession = {
        contentId,
        infoHash: streamInfo.infoHash,
        url: streamInfo.url,
        file: streamInfo.file,
        started: Date.now(),
        status: 'streaming'
      };
      
      // Track streaming session
      this.streamingSessions.set(contentId, streamingSession);
      
      // Update metrics
      this.metrics.activeStreams++;
      
      return streamingSession;
    } catch (error) {
      console.error('Failed to stream content:', error);
      throw error;
    }
  }
  
  /**
   * Stop streaming content
   * @param {string} contentId - Content identifier
   * @returns {Promise<boolean>} Success status
   */
  async stopStreaming(contentId) {
    if (!this.initialized || !this.streamingSessions.has(contentId)) {
      return false;
    }
    
    try {
      const session = this.streamingSessions.get(contentId);
      
      // Clean up URL object
      if (session.url && session.url.startsWith('blob:')) {
        URL.revokeObjectURL(session.url);
      }
      
      // Remove session
      this.streamingSessions.delete(contentId);
      
      // Update metrics
      this.metrics.activeStreams--;
      
      return true;
    } catch (error) {
      console.error('Failed to stop streaming:', error);
      return false;
    }
  }
  
  /**
   * Get content availability
   * @param {string} contentId - Content identifier
   * @returns {Object|null} Content availability info
   */
  getContentAvailability(contentId) {
    return this.contentAvailability.get(contentId) || null;
  }
  
  /**
   * Get all content availability
   * @returns {Array} Content availability info
   */
  getAllContentAvailability() {
    return Array.from(this.contentAvailability.values());
  }
  
  /**
   * Get download queue
   * @returns {Array} Download queue
   */
  getDownloadQueue() {
    return [...this.downloadQueue];
  }
  
  /**
   * Get streaming sessions
   * @returns {Array} Streaming sessions
   */
  getStreamingSessions() {
    return Array.from(this.streamingSessions.values());
  }
  
  /**
   * Get distribution metrics
   * @returns {Object} Distribution metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Handle content shared event
   * @private
   * @param {Object} data - Event data
   */
  _handleContentShared(data) {
    const { infoHash, metadata } = data;
    
    // Update content availability
    if (!this.contentAvailability.has(infoHash)) {
      this.contentAvailability.set(infoHash, {
        contentId: infoHash,
        infoHash,
        metadata,
        protocols: ['webtorrent'],
        availability: 1.0,
        shared: Date.now()
      });
    }
  }
  
  /**
   * Handle download progress event
   * @private
   * @param {Object} data - Event data
   */
  _handleDownloadProgress(data) {
    const { infoHash, progress } = data;
    
    // Update download queue
    const downloadEntry = this.downloadQueue.find(item => item.infoHash === infoHash);
    if (downloadEntry) {
      downloadEntry.progress = progress;
      downloadEntry.lastUpdated = Date.now();
    }
  }
  
  /**
   * Handle download complete event
   * @private
   * @param {Object} data - Event data
   */
  _handleDownloadComplete(data) {
    const { infoHash } = data;
    
    // Update download queue
    const downloadEntry = this.downloadQueue.find(item => item.infoHash === infoHash);
    if (downloadEntry) {
      downloadEntry.progress = 1;
      downloadEntry.status = 'completed';
      downloadEntry.completed = Date.now();
      
      // Update metrics
      if (downloadEntry.metadata && downloadEntry.metadata.size) {
        this.metrics.totalDownloaded += downloadEntry.metadata.size;
      }
    }
  }
}
