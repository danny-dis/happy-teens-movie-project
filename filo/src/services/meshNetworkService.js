/**
 * Mesh Network Service
 *
 * Networking solution that creates self-organizing networks between nearby devices
 * without requiring internet infrastructure. Enables content sharing in environments
 * with limited or no connectivity.
 *
 * Core capabilities:
 * - Device discovery over local networks
 * - Direct device-to-device communication
 * - Content sharing without internet dependency
 * - Network visualization and management
 *
 * @author zophlic
 */

import { createHash } from '../crypto/hash';

class MeshNetworkService {
  constructor() {
    this.initialized = false;
    this.isActive = false;
    this.deviceId = null;
    this.peers = new Map();
    this.connections = new Map();
    this.discoveryInterval = null;
    this.networkGraph = {
      nodes: [],
      edges: []
    };
    this.settings = {
      discoveryInterval: 30000, // 30 seconds
      connectionTimeout: 10000, // 10 seconds
      maxPeers: 10,
      enableRelay: true,
      enableBluetooth: false,
      enableWifi: true,
      scanRadius: 'local' // 'local', 'medium', 'extended'
    };
    this.eventListeners = {};
  }

  /**
   * Initialize the Mesh Network service
   * @param {Object} options - Initialization options
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(options = {}) {
    if (this.initialized) return true;

    try {
      console.log('Initializing Mesh Network service...');

      // Override default settings
      if (options.settings) {
        this.settings = {
          ...this.settings,
          ...options.settings
        };
      }

      // Generate device ID if not already set
      this.deviceId = localStorage.getItem('mesh_device_id');
      if (!this.deviceId) {
        this.deviceId = await this._generateDeviceId();
        localStorage.setItem('mesh_device_id', this.deviceId);
      }

      // Check for required APIs
      const hasRequiredAPIs = this._checkRequiredAPIs();
      if (!hasRequiredAPIs) {
        console.warn('Some required APIs for mesh networking are not available');
      }

      this.initialized = true;
      console.log('Mesh Network service initialized with device ID:', this.deviceId);

      return true;
    } catch (error) {
      console.error('Failed to initialize Mesh Network service:', error);
      return false;
    }
  }

  /**
   * Start the mesh network
   * @returns {Promise<boolean>} Success status
   */
  async start() {
    if (!this.initialized) await this.initialize();

    if (this.isActive) {
      console.log('Mesh network is already active');
      return true;
    }

    try {
      console.log('Starting mesh network...');

      // Start peer discovery
      await this._startDiscovery();

      this.isActive = true;
      this._triggerEvent('networkStarted', { deviceId: this.deviceId });

      return true;
    } catch (error) {
      console.error('Failed to start mesh network:', error);
      return false;
    }
  }

  /**
   * Stop the mesh network
   * @returns {Promise<boolean>} Success status
   */
  async stop() {
    if (!this.isActive) {
      console.log('Mesh network is not active');
      return true;
    }

    try {
      console.log('Stopping mesh network...');

      // Stop peer discovery
      this._stopDiscovery();

      // Close all connections
      await this._closeAllConnections();

      this.isActive = false;
      this._triggerEvent('networkStopped', { deviceId: this.deviceId });

      return true;
    } catch (error) {
      console.error('Failed to stop mesh network:', error);
      return false;
    }
  }

  /**
   * Get the network status
   * @returns {Object} Network status
   */
  getNetworkStatus() {
    return {
      isActive: this.isActive,
      deviceId: this.deviceId,
      peerCount: this.peers.size,
      connectionCount: this.connections.size,
      settings: { ...this.settings }
    };
  }

  /**
   * Get the network graph
   * @returns {Object} Network graph
   */
  getNetworkGraph() {
    return { ...this.networkGraph };
  }

  /**
   * Send data to a peer
   * @param {string} peerId - Peer ID
   * @param {Object} data - Data to send
   * @returns {Promise<boolean>} Success status
   */
  async sendToPeer(peerId, data) {
    if (!this.isActive) {
      throw new Error('Mesh network is not active');
    }

    if (!this.connections.has(peerId)) {
      throw new Error(`No connection to peer ${peerId}`);
    }

    try {
      console.log(`Sending data to peer ${peerId}...`);

      // In a real implementation, this would use WebRTC data channels
      // For now, we'll simulate it

      // Simulate sending data
      setTimeout(() => {
        this._triggerEvent('dataSent', {
          peerId,
          data,
          timestamp: Date.now()
        });
      }, 100);

      return true;
    } catch (error) {
      console.error(`Failed to send data to peer ${peerId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast data to all peers
   * @param {Object} data - Data to broadcast
   * @returns {Promise<Object>} Broadcast results
   */
  async broadcast(data) {
    if (!this.isActive) {
      throw new Error('Mesh network is not active');
    }

    try {
      console.log(`Broadcasting data to ${this.connections.size} peers...`);

      const results = {
        total: this.connections.size,
        successful: 0,
        failed: 0,
        peerResults: {}
      };

      // Send to each peer
      for (const peerId of this.connections.keys()) {
        try {
          await this.sendToPeer(peerId, data);
          results.successful++;
          results.peerResults[peerId] = true;
        } catch (error) {
          results.failed++;
          results.peerResults[peerId] = false;
        }
      }

      this._triggerEvent('dataBroadcast', {
        data,
        results,
        timestamp: Date.now()
      });

      return results;
    } catch (error) {
      console.error('Failed to broadcast data:', error);
      throw error;
    }
  }

  /**
   * Request content from the mesh network
   * @param {string} contentId - Content ID
   * @returns {Promise<Object>} Content response
   */
  async requestContent(contentId) {
    if (!this.isActive) {
      throw new Error('Mesh network is not active');
    }

    try {
      console.log(`Requesting content ${contentId} from mesh network...`);

      // Create content request
      const request = {
        type: 'content_request',
        contentId,
        requesterId: this.deviceId,
        timestamp: Date.now()
      };

      // Broadcast the request
      await this.broadcast(request);

      // In a real implementation, this would wait for responses
      // For now, we'll simulate a response

      return new Promise((resolve) => {
        setTimeout(() => {
          // Simulate finding the content
          const found = Math.random() > 0.3;

          if (found) {
            resolve({
              contentId,
              found: true,
              provider: Array.from(this.peers.keys())[Math.floor(Math.random() * this.peers.size)],
              size: Math.floor(Math.random() * 1000000000),
              metadata: {
                title: `Content ${contentId}`,
                type: Math.random() > 0.5 ? 'video' : 'audio',
                duration: Math.floor(Math.random() * 7200)
              }
            });
          } else {
            resolve({
              contentId,
              found: false
            });
          }
        }, 1000);
      });
    } catch (error) {
      console.error(`Failed to request content ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  addEventListener(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }

    this.eventListeners[event].push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  removeEventListener(event, callback) {
    if (!this.eventListeners[event]) return;

    this.eventListeners[event] = this.eventListeners[event].filter(
      cb => cb !== callback
    );
  }

  /**
   * Generate a device ID
   * @private
   * @returns {Promise<string>} Device ID
   */
  async _generateDeviceId() {
    // Generate a unique device ID
    const randomPart = Math.random().toString(36).substring(2, 10);
    const timePart = Date.now().toString(36);

    // Create a hash
    const deviceData = {
      random: randomPart,
      time: timePart,
      userAgent: navigator.userAgent
    };

    const hash = await createHash(JSON.stringify(deviceData));
    return `mesh-${hash.substring(0, 12)}`;
  }

  /**
   * Check for required APIs
   * @private
   * @returns {boolean} Whether required APIs are available
   */
  _checkRequiredAPIs() {
    // Check for WebRTC support
    const hasWebRTC = 'RTCPeerConnection' in window;

    // Check for Web Bluetooth API if enabled
    const hasWebBluetooth = this.settings.enableBluetooth ?
      'bluetooth' in navigator : true;

    // Check for WebRTC data channels
    const hasDataChannel = 'RTCDataChannel' in window;

    return hasWebRTC && hasWebBluetooth && hasDataChannel;
  }

  /**
   * Start peer discovery - optimized for lower resource usage
   * @private
   * @returns {Promise<void>}
   */
  async _startDiscovery() {
    // In a real implementation, this would use WebRTC for discovery
    // For now, we'll simulate it with optimized resource usage

    console.log('Starting peer discovery...');

    // Use a more efficient approach with dynamic intervals
    const runDiscovery = () => {
      // Only schedule next discovery if the service is still active
      if (!this.isActive) return;

      this._simulateDiscovery();

      // Adjust interval based on peer count - longer intervals when we have more peers
      const adjustedInterval = this.peers.size > 0 ?
        this.settings.discoveryInterval * (1 + this.peers.size / 10) : // Increase interval as we find more peers
        this.settings.discoveryInterval;

      // Use setTimeout instead of setInterval for more control and to prevent overlapping executions
      this.discoveryInterval = setTimeout(runDiscovery, adjustedInterval);
    };

    // Start the discovery process
    runDiscovery();
  }

  /**
   * Stop peer discovery
   * @private
   */
  _stopDiscovery() {
    console.log('Stopping peer discovery...');

    if (this.discoveryInterval) {
      clearTimeout(this.discoveryInterval); // Changed from clearInterval to clearTimeout
      this.discoveryInterval = null;
    }
  }

  /**
   * Simulate peer discovery - optimized for lower resource usage
   * @private
   */
  _simulateDiscovery() {
    // Only discover new peers if we haven't reached the maximum
    if (this.peers.size >= this.settings.maxPeers) {
      console.log('Maximum peer count reached, skipping discovery');
      return;
    }

    // Simulate finding 1-2 peers (reduced from 1-3 for better performance)
    const peerCount = Math.min(this.settings.maxPeers - this.peers.size, Math.floor(Math.random() * 2) + 1);

    if (peerCount > 0) {
      console.log(`Discovered ${peerCount} peers`);

      // Create all peers at once to reduce iterations
      const newPeers = [];

      for (let i = 0; i < peerCount; i++) {
        // Generate a deterministic peer ID based on timestamp and index for better performance
        const timestamp = Date.now();
        const peerId = `mesh-${timestamp}-${i}`;

        // Create peer info with minimal random calculations
        const peer = {
          id: peerId,
          name: `Peer ${i+1}`,
          discoveredAt: timestamp,
          capabilities: {
            relay: i % 2 === 0, // Deterministic instead of random
            bluetooth: i % 3 === 0, // Deterministic instead of random
            wifi: true
          },
          signalStrength: 60 + (i * 10) % 40 // Range 60-100, deterministic
        };

        // Add to peers
        this.peers.set(peerId, peer);
        newPeers.push(peer);
      }

      // Update network graph once for all new peers
      this._updateNetworkGraph();

      // Trigger events and simulate connections
      for (const peer of newPeers) {
        this._triggerEvent('peerDiscovered', { peer });
        this._simulateConnection(peer.id);
      }
    }
  }

  /**
   * Simulate establishing a connection - optimized for lower resource usage
   * @private
   * @param {string} peerId - Peer ID
   */
  _simulateConnection(peerId) {
    const peer = this.peers.get(peerId);

    if (!peer) return;

    console.log(`Establishing connection to peer ${peerId}...`);

    // Use a fixed delay instead of random for better performance and predictability
    const connectionDelay = 500; // Fixed 500ms delay instead of random

    // Use requestAnimationFrame for better performance when browser tab is inactive
    const startTime = performance.now();
    const checkTime = () => {
      if (performance.now() - startTime >= connectionDelay) {
        // 90% chance of successful connection (increased from 80% for better user experience)
        // Use a deterministic approach based on peerId for consistency
        const peerIdSum = peerId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const success = (peerIdSum % 10) < 9; // 90% success rate

        if (success) {
          // Create connection info with deterministic values based on peerId
          const connection = {
            peerId,
            establishedAt: Date.now(),
            quality: 70 + (peerIdSum % 30), // Range 70-99
            latency: 20 + (peerIdSum % 80), // Range 20-99 ms
            bandwidth: 1000000 + (peerIdSum * 100000) % 9000000 // Range 1-10 Mbps
          };

          // Add to connections
          this.connections.set(peerId, connection);

          // Update network graph
          this._updateNetworkGraph();

          // Trigger event
          this._triggerEvent('peerConnected', { peer, connection });

          console.log(`Connected to peer ${peerId}`);
        } else {
          console.log(`Failed to connect to peer ${peerId}`);

          // Trigger event
          this._triggerEvent('peerConnectionFailed', { peer });
        }
      } else {
        requestAnimationFrame(checkTime);
      }
    };

    requestAnimationFrame(checkTime);
  }

  /**
   * Close all connections
   * @private
   * @returns {Promise<void>}
   */
  async _closeAllConnections() {
    console.log(`Closing ${this.connections.size} connections...`);

    // Close each connection
    for (const [peerId, connection] of this.connections.entries()) {
      // Trigger event
      this._triggerEvent('peerDisconnected', {
        peerId,
        connection
      });
    }

    // Clear connections
    this.connections.clear();

    // Clear peers
    this.peers.clear();

    // Update network graph
    this._updateNetworkGraph();
  }

  /**
   * Update the network graph - optimized for lower resource usage
   * @private
   */
  _updateNetworkGraph() {
    // Only update if we have peers or connections to reduce unnecessary processing
    if (this.peers.size === 0 && this.connections.size === 0) {
      this.networkGraph = { nodes: [{ id: this.deviceId, label: 'You', type: 'self' }], edges: [] };
      return;
    }

    // Create nodes array with pre-allocated size for better performance
    const nodes = new Array(this.peers.size + 1);

    // Add self node
    nodes[0] = {
      id: this.deviceId,
      label: 'You',
      type: 'self'
    };

    // Add peer nodes
    let nodeIndex = 1;
    for (const [peerId, peer] of this.peers.entries()) {
      nodes[nodeIndex++] = {
        id: peerId,
        label: peer.name,
        type: 'peer',
        connected: this.connections.has(peerId)
      };
    }

    // Create edges for each connection - limit to maximum 20 edges for better performance
    const edges = [];
    const maxEdges = 20;

    // Add direct connections first (most important)
    for (const [peerId, connection] of this.connections.entries()) {
      if (edges.length >= maxEdges) break;

      edges.push({
        source: this.deviceId,
        target: peerId,
        quality: connection.quality,
        latency: connection.latency
      });
    }

    // Add peer-to-peer connections if we have space for them
    // Use a deterministic approach instead of random for better performance
    if (edges.length < maxEdges && this.connections.size > 1) {
      const connectedPeers = Array.from(this.connections.keys());

      // Create a limited number of peer-to-peer connections
      const p2pConnectionCount = Math.min(maxEdges - edges.length, Math.floor(connectedPeers.length / 2));

      for (let i = 0; i < p2pConnectionCount; i++) {
        const sourceIndex = i % connectedPeers.length;
        const targetIndex = (i + 1) % connectedPeers.length;

        if (sourceIndex !== targetIndex) {
          const sourcePeerId = connectedPeers[sourceIndex];
          const targetPeerId = connectedPeers[targetIndex];

          // Use deterministic values based on peer IDs
          const sourceSum = sourcePeerId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
          const targetSum = targetPeerId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

          edges.push({
            source: sourcePeerId,
            target: targetPeerId,
            quality: 60 + ((sourceSum + targetSum) % 40), // Range 60-99
            latency: 30 + ((sourceSum + targetSum) % 70) // Range 30-99 ms
          });
        }
      }
    }

    // Update the network graph
    this.networkGraph = {
      nodes,
      edges
    };
  }

  /**
   * Trigger an event
   * @private
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  _triggerEvent(event, data) {
    if (!this.eventListeners[event]) return;

    for (const callback of this.eventListeners[event]) {
      callback(data);
    }
  }
}

export default new MeshNetworkService();
