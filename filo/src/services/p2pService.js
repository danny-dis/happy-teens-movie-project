/**
 * Enhanced P2P Service for Filo
 * Handles peer discovery, connections, and data transfer
 * 
 * @author zophlic
 */

import { P2PError, P2P_ERROR_CODES, handleP2PError } from '../utils/errorHandling';

// Constants
const STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302'
];

const TURN_SERVERS = [
  { urls: 'turn:turn.example.com', username: 'filo', credential: 'p2pconnect' }
];

/**
 * P2P Service class
 */
class P2PService {
  constructor() {
    this.peers = new Map();
    this.connections = new Map();
    this.dataChannels = new Map();
    this.listeners = new Map();
    this.isInitialized = false;
    this.peerId = null;
    
    // Configuration
    this.config = {
      useStun: true,
      useTurn: true,
      maxRetries: 3,
      connectionTimeout: 30000,
      keepAliveInterval: 20000,
      chunkSize: 16384, // 16KB
      useEncryption: true
    };
  }
  
  /**
   * Initialize P2P service
   * @param {Object} options - Initialization options
   * @returns {Promise<string>} Peer ID
   */
  async initialize(options = {}) {
    if (this.isInitialized) return this.peerId;
    
    try {
      // Merge options
      this.config = { ...this.config, ...options };
      
      // Generate peer ID if not provided
      this.peerId = options.peerId || this._generatePeerId();
      
      // Set up ICE servers
      this.iceServers = [];
      
      if (this.config.useStun) {
        this.iceServers.push(...STUN_SERVERS.map(url => ({ urls: url })));
      }
      
      if (this.config.useTurn) {
        this.iceServers.push(...TURN_SERVERS);
      }
      
      // Set up peer connection config
      this.peerConnectionConfig = {
        iceServers: this.iceServers,
        iceTransportPolicy: this.config.useTurn ? 'relay' : 'all'
      };
      
      // Load persistent peers from storage
      await this._loadPersistentPeers();
      
      this.isInitialized = true;
      return this.peerId;
    } catch (error) {
      throw new P2PError(
        'Failed to initialize P2P service',
        P2P_ERROR_CODES.UNKNOWN,
        { error: error.message }
      );
    }
  }
  
  /**
   * Connect to a peer
   * @param {string} remotePeerId - Remote peer ID
   * @param {Object} options - Connection options
   * @returns {Promise<RTCPeerConnection>} Peer connection
   */
  async connectToPeer(remotePeerId, options = {}) {
    if (!this.isInitialized) {
      throw new P2PError(
        'P2P service not initialized',
        P2P_ERROR_CODES.UNKNOWN
      );
    }
    
    // Check if already connected
    if (this.connections.has(remotePeerId)) {
      return this.connections.get(remotePeerId);
    }
    
    try {
      // Create peer connection
      const peerConnection = new RTCPeerConnection(this.peerConnectionConfig);
      
      // Set up connection timeout
      const timeoutId = setTimeout(() => {
        if (this.connections.has(remotePeerId)) {
          this.disconnectFromPeer(remotePeerId);
          this._notifyListeners('connection_timeout', { peerId: remotePeerId });
        }
      }, this.config.connectionTimeout);
      
      // Set up data channel
      const dataChannel = peerConnection.createDataChannel('filo-data', {
        ordered: true
      });
      
      // Set up data channel events
      this._setupDataChannel(dataChannel, remotePeerId);
      
      // Store connection
      this.connections.set(remotePeerId, peerConnection);
      this.dataChannels.set(remotePeerId, dataChannel);
      
      // Set up connection events
      this._setupPeerConnection(peerConnection, remotePeerId);
      
      // Create and send offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // In a real implementation, this would send the offer to the remote peer
      // through a signaling server. For now, we'll simulate it.
      console.log(`[P2P] Sending offer to ${remotePeerId}`);
      
      // Simulate receiving answer from remote peer
      setTimeout(async () => {
        try {
          // Simulate answer
          const answer = {
            type: 'answer',
            sdp: 'simulated_sdp_answer'
          };
          
          await peerConnection.setRemoteDescription(answer);
          
          // Clear timeout
          clearTimeout(timeoutId);
          
          // Store peer info
          this.peers.set(remotePeerId, {
            id: remotePeerId,
            connectedAt: new Date(),
            lastSeen: new Date(),
            connection: peerConnection,
            dataChannel
          });
          
          // Notify listeners
          this._notifyListeners('peer_connected', { peerId: remotePeerId });
          
          // Save to persistent storage
          this._savePersistentPeers();
        } catch (error) {
          this.disconnectFromPeer(remotePeerId);
          throw new P2PError(
            'Failed to process answer',
            P2P_ERROR_CODES.CONNECTION_FAILED,
            { peerId: remotePeerId, error: error.message }
          );
        }
      }, 1000);
      
      return peerConnection;
    } catch (error) {
      // Clean up any partial connection
      if (this.connections.has(remotePeerId)) {
        this.disconnectFromPeer(remotePeerId);
      }
      
      throw new P2PError(
        'Failed to connect to peer',
        P2P_ERROR_CODES.CONNECTION_FAILED,
        { peerId: remotePeerId, error: error.message }
      );
    }
  }
  
  /**
   * Disconnect from a peer
   * @param {string} peerId - Peer ID
   * @returns {boolean} Whether disconnection was successful
   */
  disconnectFromPeer(peerId) {
    try {
      // Close data channel
      if (this.dataChannels.has(peerId)) {
        const dataChannel = this.dataChannels.get(peerId);
        dataChannel.close();
        this.dataChannels.delete(peerId);
      }
      
      // Close connection
      if (this.connections.has(peerId)) {
        const connection = this.connections.get(peerId);
        connection.close();
        this.connections.delete(peerId);
      }
      
      // Remove peer
      this.peers.delete(peerId);
      
      // Save to persistent storage
      this._savePersistentPeers();
      
      // Notify listeners
      this._notifyListeners('peer_disconnected', { peerId });
      
      return true;
    } catch (error) {
      console.error(`Failed to disconnect from peer ${peerId}`, error);
      return false;
    }
  }
  
  /**
   * Send data to a peer
   * @param {string} peerId - Peer ID
   * @param {any} data - Data to send
   * @returns {Promise<boolean>} Whether data was sent successfully
   */
  async sendToPeer(peerId, data) {
    if (!this.isInitialized) {
      throw new P2PError(
        'P2P service not initialized',
        P2P_ERROR_CODES.UNKNOWN
      );
    }
    
    if (!this.dataChannels.has(peerId)) {
      throw new P2PError(
        'No data channel to peer',
        P2P_ERROR_CODES.PEER_UNAVAILABLE,
        { peerId }
      );
    }
    
    const dataChannel = this.dataChannels.get(peerId);
    
    if (dataChannel.readyState !== 'open') {
      throw new P2PError(
        'Data channel not open',
        P2P_ERROR_CODES.PEER_UNAVAILABLE,
        { peerId, state: dataChannel.readyState }
      );
    }
    
    try {
      // Prepare data
      let dataToSend = data;
      
      // Convert to string if not already
      if (typeof data !== 'string') {
        dataToSend = JSON.stringify(data);
      }
      
      // Encrypt if enabled
      if (this.config.useEncryption) {
        dataToSend = await this._encryptData(dataToSend);
      }
      
      // Send data
      dataChannel.send(dataToSend);
      
      // Update last seen
      if (this.peers.has(peerId)) {
        const peerInfo = this.peers.get(peerId);
        peerInfo.lastSeen = new Date();
      }
      
      return true;
    } catch (error) {
      throw new P2PError(
        'Failed to send data to peer',
        P2P_ERROR_CODES.DATA_TRANSFER_FAILED,
        { peerId, error: error.message }
      );
    }
  }
  
  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  addEventListener(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(listener);
  }
  
  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  removeEventListener(event, listener) {
    if (!this.listeners.has(event)) {
      return;
    }
    
    this.listeners.get(event).delete(listener);
    
    if (this.listeners.get(event).size === 0) {
      this.listeners.delete(event);
    }
  }
  
  /**
   * Get connected peers
   * @returns {Array} Connected peers
   */
  getConnectedPeers() {
    return Array.from(this.peers.values()).map(peer => ({
      id: peer.id,
      connectedAt: peer.connectedAt,
      lastSeen: peer.lastSeen
    }));
  }
  
  /**
   * Set up data channel events
   * @private
   * @param {RTCDataChannel} dataChannel - Data channel
   * @param {string} peerId - Peer ID
   */
  _setupDataChannel(dataChannel, peerId) {
    dataChannel.onopen = () => {
      console.log(`[P2P] Data channel open to ${peerId}`);
      this._notifyListeners('data_channel_open', { peerId });
    };
    
    dataChannel.onclose = () => {
      console.log(`[P2P] Data channel closed to ${peerId}`);
      this._notifyListeners('data_channel_close', { peerId });
    };
    
    dataChannel.onerror = (error) => {
      console.error(`[P2P] Data channel error with ${peerId}`, error);
      this._notifyListeners('data_channel_error', { peerId, error: error.message });
    };
    
    dataChannel.onmessage = async (event) => {
      try {
        let data = event.data;
        
        // Decrypt if enabled
        if (this.config.useEncryption) {
          data = await this._decryptData(data);
        }
        
        // Parse JSON if possible
        try {
          data = JSON.parse(data);
        } catch (e) {
          // Not JSON, use as is
        }
        
        // Update last seen
        if (this.peers.has(peerId)) {
          const peerInfo = this.peers.get(peerId);
          peerInfo.lastSeen = new Date();
        }
        
        // Notify listeners
        this._notifyListeners('data_received', { peerId, data });
      } catch (error) {
        console.error(`[P2P] Error processing message from ${peerId}`, error);
        this._notifyListeners('data_error', { peerId, error: error.message });
      }
    };
  }
  
  /**
   * Set up peer connection events
   * @private
   * @param {RTCPeerConnection} peerConnection - Peer connection
   * @param {string} peerId - Peer ID
   */
  _setupPeerConnection(peerConnection, peerId) {
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // In a real implementation, this would send the ICE candidate to the remote peer
        console.log(`[P2P] New ICE candidate for ${peerId}`);
      }
    };
    
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`[P2P] ICE connection state change: ${peerConnection.iceConnectionState}`);
      
      if (peerConnection.iceConnectionState === 'disconnected' || 
          peerConnection.iceConnectionState === 'failed' || 
          peerConnection.iceConnectionState === 'closed') {
        this.disconnectFromPeer(peerId);
      }
    };
    
    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      this._setupDataChannel(dataChannel, peerId);
      this.dataChannels.set(peerId, dataChannel);
    };
  }
  
  /**
   * Encrypt data
   * @private
   * @param {string} data - Data to encrypt
   * @returns {Promise<string>} Encrypted data
   */
  async _encryptData(data) {
    // In a real implementation, this would use the Web Crypto API
    // For now, we'll just simulate encryption
    return `encrypted:${data}`;
  }
  
  /**
   * Decrypt data
   * @private
   * @param {string} data - Data to decrypt
   * @returns {Promise<string>} Decrypted data
   */
  async _decryptData(data) {
    // In a real implementation, this would use the Web Crypto API
    // For now, we'll just simulate decryption
    if (data.startsWith('encrypted:')) {
      return data.substring(10);
    }
    return data;
  }
  
  /**
   * Generate a peer ID
   * @private
   * @returns {string} Peer ID
   */
  _generatePeerId() {
    return 'peer-' + Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Load persistent peers from storage
   * @private
   */
  async _loadPersistentPeers() {
    try {
      const peersJson = localStorage.getItem('filo_persistent_peers');
      
      if (peersJson) {
        const peerIds = JSON.parse(peersJson);
        
        // Connect to persistent peers
        for (const peerId of peerIds) {
          try {
            await this.connectToPeer(peerId);
          } catch (error) {
            console.warn(`Failed to connect to persistent peer ${peerId}`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load persistent peers', error);
    }
  }
  
  /**
   * Save persistent peers to storage
   * @private
   */
  _savePersistentPeers() {
    try {
      const peerIds = Array.from(this.peers.keys());
      localStorage.setItem('filo_persistent_peers', JSON.stringify(peerIds));
    } catch (error) {
      console.error('Failed to save persistent peers', error);
    }
  }
  
  /**
   * Notify event listeners
   * @private
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  _notifyListeners(event, data) {
    if (!this.listeners.has(event)) {
      return;
    }
    
    // Add timestamp to event data
    const eventData = {
      ...data,
      timestamp: Date.now(),
    };
    
    // Notify listeners
    this.listeners.get(event).forEach(listener => {
      try {
        listener(eventData);
      } catch (error) {
        console.error(`Error in P2P event listener for ${event}:`, error);
      }
    });
  }
}

// Create singleton instance
const p2pService = new P2PService();

export default p2pService;
