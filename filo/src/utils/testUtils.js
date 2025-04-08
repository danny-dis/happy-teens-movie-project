/**
 * Test Utilities for Filo
 * Provides mock implementations for testing P2P and other functionality
 * 
 * @author zophlic
 */

/**
 * Create a mock peer connection
 * @param {string} peerId - Peer ID
 * @param {Object} options - Options
 * @returns {Object} Mock peer connection
 */
export const createMockPeerConnection = (peerId, options = {}) => {
  const defaultOptions = {
    isInitiator: false,
    latency: 50,
    packetLoss: 0,
    bandwidth: 1000000, // 1 Mbps
    connectionDelay: 500,
    disconnectAfter: null,
    failConnection: false
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Create mock RTCPeerConnection
  const mockPeerConnection = {
    peerId,
    localDescription: null,
    remoteDescription: null,
    iceConnectionState: 'new',
    signalingState: 'stable',
    connectionState: 'new',
    iceGatheringState: 'new',
    onicecandidate: null,
    oniceconnectionstatechange: null,
    onsignalingstatechange: null,
    onconnectionstatechange: null,
    ondatachannel: null,
    dataChannels: new Map(),
    
    // Methods
    createOffer: async () => {
      await simulateLatency(opts.latency);
      
      const offer = {
        type: 'offer',
        sdp: `mock-sdp-offer-${Date.now()}`
      };
      
      return offer;
    },
    
    createAnswer: async () => {
      await simulateLatency(opts.latency);
      
      const answer = {
        type: 'answer',
        sdp: `mock-sdp-answer-${Date.now()}`
      };
      
      return answer;
    },
    
    setLocalDescription: async (description) => {
      await simulateLatency(opts.latency);
      
      if (Math.random() < opts.packetLoss) {
        throw new Error('Simulated packet loss');
      }
      
      mockPeerConnection.localDescription = description;
      
      if (description.type === 'offer') {
        mockPeerConnection.signalingState = 'have-local-offer';
      } else if (description.type === 'answer') {
        mockPeerConnection.signalingState = 'stable';
      }
      
      if (mockPeerConnection.onsignalingstatechange) {
        mockPeerConnection.onsignalingstatechange();
      }
      
      // Simulate ICE gathering
      mockPeerConnection.iceGatheringState = 'gathering';
      
      // Simulate ICE candidates
      setTimeout(() => {
        if (mockPeerConnection.onicecandidate) {
          // Simulate a few ICE candidates
          for (let i = 0; i < 3; i++) {
            mockPeerConnection.onicecandidate({
              candidate: {
                candidate: `mock-ice-candidate-${i}`,
                sdpMid: 'data',
                sdpMLineIndex: 0
              }
            });
          }
          
          // Simulate end of candidates
          setTimeout(() => {
            mockPeerConnection.iceGatheringState = 'complete';
            mockPeerConnection.onicecandidate({ candidate: null });
          }, 200);
        }
      }, 100);
    },
    
    setRemoteDescription: async (description) => {
      await simulateLatency(opts.latency);
      
      if (Math.random() < opts.packetLoss) {
        throw new Error('Simulated packet loss');
      }
      
      mockPeerConnection.remoteDescription = description;
      
      if (description.type === 'offer') {
        mockPeerConnection.signalingState = 'have-remote-offer';
      } else if (description.type === 'answer') {
        mockPeerConnection.signalingState = 'stable';
      }
      
      if (mockPeerConnection.onsignalingstatechange) {
        mockPeerConnection.onsignalingstatechange();
      }
      
      // Simulate connection establishment
      setTimeout(() => {
        if (opts.failConnection) {
          mockPeerConnection.iceConnectionState = 'failed';
          if (mockPeerConnection.oniceconnectionstatechange) {
            mockPeerConnection.oniceconnectionstatechange();
          }
        } else {
          // Checking
          mockPeerConnection.iceConnectionState = 'checking';
          if (mockPeerConnection.oniceconnectionstatechange) {
            mockPeerConnection.oniceconnectionstatechange();
          }
          
          // Connected
          setTimeout(() => {
            mockPeerConnection.iceConnectionState = 'connected';
            mockPeerConnection.connectionState = 'connected';
            
            if (mockPeerConnection.oniceconnectionstatechange) {
              mockPeerConnection.oniceconnectionstatechange();
            }
            
            if (mockPeerConnection.onconnectionstatechange) {
              mockPeerConnection.onconnectionstatechange();
            }
            
            // Simulate data channel if remote
            if (!opts.isInitiator && mockPeerConnection.ondatachannel) {
              const dataChannel = createMockDataChannel('filo-data', {
                latency: opts.latency,
                packetLoss: opts.packetLoss,
                bandwidth: opts.bandwidth
              });
              
              mockPeerConnection.ondatachannel({ channel: dataChannel });
            }
            
            // Simulate disconnection if specified
            if (opts.disconnectAfter) {
              setTimeout(() => {
                mockPeerConnection.iceConnectionState = 'disconnected';
                mockPeerConnection.connectionState = 'disconnected';
                
                if (mockPeerConnection.oniceconnectionstatechange) {
                  mockPeerConnection.oniceconnectionstatechange();
                }
                
                if (mockPeerConnection.onconnectionstatechange) {
                  mockPeerConnection.onconnectionstatechange();
                }
                
                // Close all data channels
                mockPeerConnection.dataChannels.forEach(channel => {
                  channel.close();
                });
              }, opts.disconnectAfter);
            }
          }, opts.connectionDelay);
        }
      }, 100);
    },
    
    addIceCandidate: async (candidate) => {
      await simulateLatency(opts.latency);
      
      if (Math.random() < opts.packetLoss) {
        throw new Error('Simulated packet loss');
      }
      
      // Just simulate success
      return Promise.resolve();
    },
    
    createDataChannel: (label, options = {}) => {
      const dataChannel = createMockDataChannel(label, {
        latency: opts.latency,
        packetLoss: opts.packetLoss,
        bandwidth: opts.bandwidth
      });
      
      mockPeerConnection.dataChannels.set(label, dataChannel);
      
      return dataChannel;
    },
    
    close: () => {
      mockPeerConnection.iceConnectionState = 'closed';
      mockPeerConnection.connectionState = 'closed';
      mockPeerConnection.signalingState = 'closed';
      
      if (mockPeerConnection.oniceconnectionstatechange) {
        mockPeerConnection.oniceconnectionstatechange();
      }
      
      if (mockPeerConnection.onconnectionstatechange) {
        mockPeerConnection.onconnectionstatechange();
      }
      
      if (mockPeerConnection.onsignalingstatechange) {
        mockPeerConnection.onsignalingstatechange();
      }
      
      // Close all data channels
      mockPeerConnection.dataChannels.forEach(channel => {
        channel.close();
      });
    }
  };
  
  return mockPeerConnection;
};

/**
 * Create a mock data channel
 * @param {string} label - Channel label
 * @param {Object} options - Options
 * @returns {Object} Mock data channel
 */
export const createMockDataChannel = (label, options = {}) => {
  const defaultOptions = {
    latency: 50,
    packetLoss: 0,
    bandwidth: 1000000 // 1 Mbps
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Create mock RTCDataChannel
  const mockDataChannel = {
    label,
    readyState: 'connecting',
    bufferedAmount: 0,
    bufferedAmountLowThreshold: 0,
    maxRetransmits: null,
    ordered: true,
    protocol: '',
    negotiated: false,
    id: Math.floor(Math.random() * 65535),
    onopen: null,
    onclose: null,
    onerror: null,
    onmessage: null,
    onbufferedamountlow: null,
    
    // Methods
    send: (data) => {
      // Simulate buffering
      const dataSize = typeof data === 'string' ? data.length : data.byteLength;
      mockDataChannel.bufferedAmount += dataSize;
      
      // Simulate bandwidth limitation
      const transmissionTime = (dataSize * 8) / opts.bandwidth * 1000;
      
      setTimeout(() => {
        // Simulate packet loss
        if (Math.random() < opts.packetLoss) {
          if (mockDataChannel.onerror) {
            mockDataChannel.onerror(new Error('Simulated packet loss'));
          }
          return;
        }
        
        // Simulate successful transmission
        mockDataChannel.bufferedAmount -= dataSize;
        
        if (mockDataChannel.onbufferedamountlow && 
            mockDataChannel.bufferedAmount <= mockDataChannel.bufferedAmountLowThreshold) {
          mockDataChannel.onbufferedamountlow();
        }
        
        // Simulate message received on the other end
        if (mockDataChannel.remoteChannel && mockDataChannel.remoteChannel.onmessage) {
          setTimeout(() => {
            mockDataChannel.remoteChannel.onmessage({ data });
          }, opts.latency);
        }
      }, transmissionTime + opts.latency);
    },
    
    close: () => {
      mockDataChannel.readyState = 'closed';
      
      if (mockDataChannel.onclose) {
        mockDataChannel.onclose();
      }
      
      // Close remote channel if connected
      if (mockDataChannel.remoteChannel) {
        const remoteChannel = mockDataChannel.remoteChannel;
        remoteChannel.remoteChannel = null;
        mockDataChannel.remoteChannel = null;
        
        if (remoteChannel.readyState !== 'closed') {
          remoteChannel.readyState = 'closed';
          
          if (remoteChannel.onclose) {
            remoteChannel.onclose();
          }
        }
      }
    }
  };
  
  // Simulate connection establishment
  setTimeout(() => {
    mockDataChannel.readyState = 'open';
    
    if (mockDataChannel.onopen) {
      mockDataChannel.onopen();
    }
  }, 100);
  
  return mockDataChannel;
};

/**
 * Connect two mock data channels
 * @param {Object} channel1 - First data channel
 * @param {Object} channel2 - Second data channel
 */
export const connectMockDataChannels = (channel1, channel2) => {
  channel1.remoteChannel = channel2;
  channel2.remoteChannel = channel1;
};

/**
 * Create a mock P2P network
 * @param {number} peerCount - Number of peers
 * @param {Object} options - Options
 * @returns {Object} Mock P2P network
 */
export const createMockP2PNetwork = (peerCount = 5, options = {}) => {
  const defaultOptions = {
    latency: 50,
    packetLoss: 0,
    bandwidth: 1000000, // 1 Mbps
    connectionDelay: 500,
    disconnectProbability: 0.1,
    maxDisconnectTime: 10000
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Create peers
  const peers = new Map();
  
  for (let i = 0; i < peerCount; i++) {
    const peerId = `peer-${i}`;
    
    peers.set(peerId, {
      id: peerId,
      connections: new Map(),
      dataChannels: new Map(),
      isOnline: true
    });
  }
  
  // Create connections between peers
  const peerIds = Array.from(peers.keys());
  
  for (let i = 0; i < peerIds.length; i++) {
    const peerId1 = peerIds[i];
    
    for (let j = i + 1; j < peerIds.length; j++) {
      const peerId2 = peerIds[j];
      
      // Create connection from peer1 to peer2
      const connection1 = createMockPeerConnection(peerId2, {
        isInitiator: true,
        latency: opts.latency,
        packetLoss: opts.packetLoss,
        bandwidth: opts.bandwidth,
        connectionDelay: opts.connectionDelay
      });
      
      // Create connection from peer2 to peer1
      const connection2 = createMockPeerConnection(peerId1, {
        isInitiator: false,
        latency: opts.latency,
        packetLoss: opts.packetLoss,
        bandwidth: opts.bandwidth,
        connectionDelay: opts.connectionDelay
      });
      
      // Create data channels
      const dataChannel1 = connection1.createDataChannel('filo-data');
      
      // Connect peers
      peers.get(peerId1).connections.set(peerId2, connection1);
      peers.get(peerId2).connections.set(peerId1, connection2);
      
      // Store data channels
      peers.get(peerId1).dataChannels.set(peerId2, dataChannel1);
      
      // Simulate connection establishment
      setTimeout(() => {
        // Peer 1 creates offer
        connection1.createOffer()
          .then(offer => connection1.setLocalDescription(offer))
          .then(() => {
            // Simulate signaling
            setTimeout(() => {
              connection2.setRemoteDescription(connection1.localDescription)
                .then(() => connection2.createAnswer())
                .then(answer => connection2.setLocalDescription(answer))
                .then(() => {
                  // Simulate signaling
                  setTimeout(() => {
                    connection1.setRemoteDescription(connection2.localDescription);
                  }, opts.latency);
                });
            }, opts.latency);
          });
      }, 100);
      
      // Simulate random disconnections
      if (Math.random() < opts.disconnectProbability) {
        const disconnectTime = Math.random() * opts.maxDisconnectTime;
        
        setTimeout(() => {
          connection1.close();
          connection2.close();
          
          // Simulate reconnection
          setTimeout(() => {
            // Create new connections
            const newConnection1 = createMockPeerConnection(peerId2, {
              isInitiator: true,
              latency: opts.latency,
              packetLoss: opts.packetLoss,
              bandwidth: opts.bandwidth,
              connectionDelay: opts.connectionDelay
            });
            
            const newConnection2 = createMockPeerConnection(peerId1, {
              isInitiator: false,
              latency: opts.latency,
              packetLoss: opts.packetLoss,
              bandwidth: opts.bandwidth,
              connectionDelay: opts.connectionDelay
            });
            
            // Create data channels
            const newDataChannel1 = newConnection1.createDataChannel('filo-data');
            
            // Update peers
            peers.get(peerId1).connections.set(peerId2, newConnection1);
            peers.get(peerId2).connections.set(peerId1, newConnection2);
            
            // Update data channels
            peers.get(peerId1).dataChannels.set(peerId2, newDataChannel1);
            
            // Simulate connection establishment
            setTimeout(() => {
              // Peer 1 creates offer
              newConnection1.createOffer()
                .then(offer => newConnection1.setLocalDescription(offer))
                .then(() => {
                  // Simulate signaling
                  setTimeout(() => {
                    newConnection2.setRemoteDescription(newConnection1.localDescription)
                      .then(() => newConnection2.createAnswer())
                      .then(answer => newConnection2.setLocalDescription(answer))
                      .then(() => {
                        // Simulate signaling
                        setTimeout(() => {
                          newConnection1.setRemoteDescription(newConnection2.localDescription);
                        }, opts.latency);
                      });
                  }, opts.latency);
                });
            }, 100);
          }, 1000);
        }, disconnectTime);
      }
    }
  }
  
  return {
    peers,
    
    // Send data from one peer to another
    sendData: async (fromPeerId, toPeerId, data) => {
      const peer = peers.get(fromPeerId);
      
      if (!peer) {
        throw new Error(`Peer not found: ${fromPeerId}`);
      }
      
      const dataChannel = peer.dataChannels.get(toPeerId);
      
      if (!dataChannel) {
        throw new Error(`Data channel not found for peer: ${toPeerId}`);
      }
      
      if (dataChannel.readyState !== 'open') {
        throw new Error(`Data channel not open: ${dataChannel.readyState}`);
      }
      
      dataChannel.send(data);
    },
    
    // Broadcast data from one peer to all connected peers
    broadcastData: async (fromPeerId, data) => {
      const peer = peers.get(fromPeerId);
      
      if (!peer) {
        throw new Error(`Peer not found: ${fromPeerId}`);
      }
      
      const promises = [];
      
      peer.dataChannels.forEach((dataChannel, toPeerId) => {
        if (dataChannel.readyState === 'open') {
          promises.push(new Promise(resolve => {
            dataChannel.send(data);
            resolve();
          }));
        }
      });
      
      await Promise.all(promises);
    },
    
    // Disconnect a peer
    disconnectPeer: (peerId) => {
      const peer = peers.get(peerId);
      
      if (!peer) {
        throw new Error(`Peer not found: ${peerId}`);
      }
      
      peer.isOnline = false;
      
      // Close all connections
      peer.connections.forEach(connection => {
        connection.close();
      });
    },
    
    // Reconnect a peer
    reconnectPeer: (peerId) => {
      const peer = peers.get(peerId);
      
      if (!peer) {
        throw new Error(`Peer not found: ${peerId}`);
      }
      
      peer.isOnline = true;
      
      // Create new connections to all other peers
      peers.forEach((otherPeer, otherPeerId) => {
        if (otherPeerId !== peerId && otherPeer.isOnline) {
          // Create connection from peer to otherPeer
          const connection1 = createMockPeerConnection(otherPeerId, {
            isInitiator: true,
            latency: opts.latency,
            packetLoss: opts.packetLoss,
            bandwidth: opts.bandwidth,
            connectionDelay: opts.connectionDelay
          });
          
          // Create connection from otherPeer to peer
          const connection2 = createMockPeerConnection(peerId, {
            isInitiator: false,
            latency: opts.latency,
            packetLoss: opts.packetLoss,
            bandwidth: opts.bandwidth,
            connectionDelay: opts.connectionDelay
          });
          
          // Create data channels
          const dataChannel1 = connection1.createDataChannel('filo-data');
          
          // Connect peers
          peer.connections.set(otherPeerId, connection1);
          otherPeer.connections.set(peerId, connection2);
          
          // Store data channels
          peer.dataChannels.set(otherPeerId, dataChannel1);
          
          // Simulate connection establishment
          setTimeout(() => {
            // Peer creates offer
            connection1.createOffer()
              .then(offer => connection1.setLocalDescription(offer))
              .then(() => {
                // Simulate signaling
                setTimeout(() => {
                  connection2.setRemoteDescription(connection1.localDescription)
                    .then(() => connection2.createAnswer())
                    .then(answer => connection2.setLocalDescription(answer))
                    .then(() => {
                      // Simulate signaling
                      setTimeout(() => {
                        connection1.setRemoteDescription(connection2.localDescription);
                      }, opts.latency);
                    });
                }, opts.latency);
              });
          }, 100);
        }
      });
    }
  };
};

/**
 * Simulate network latency
 * @param {number} latency - Latency in milliseconds
 * @returns {Promise<void>}
 */
export const simulateLatency = (latency) => {
  return new Promise(resolve => setTimeout(resolve, latency));
};

/**
 * Create a mock file
 * @param {string} name - File name
 * @param {number} size - File size in bytes
 * @param {string} type - File MIME type
 * @returns {File} Mock file
 */
export const createMockFile = (name, size, type = 'application/octet-stream') => {
  // Create array buffer of specified size
  const buffer = new ArrayBuffer(size);
  const view = new Uint8Array(buffer);
  
  // Fill with random data
  for (let i = 0; i < size; i++) {
    view[i] = Math.floor(Math.random() * 256);
  }
  
  // Create file
  return new File([buffer], name, { type });
};
