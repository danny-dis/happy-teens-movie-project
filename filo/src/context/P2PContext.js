import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import useLocalStorage from '../hooks/useLocalStorage';
import { P2PError, P2P_ERROR_CODES, handleP2PError } from '../utils/errorHandling';

/**
 * Context for managing P2P connections and state
 * @author zophlic
 */

// Create context
const P2PContext = createContext();

/**
 * Provider component for P2P context
 */
export const P2PProvider = ({ children }) => {
  // Use localStorage to persist P2P settings
  const [peerSettings, setPeerSettings] = useLocalStorage('p2pSettings', {
    maxConnections: 5,
    connectionTimeout: 30000,
    enableEncryption: true,
    enableCompression: true,
    maxChunkSize: 16384, // 16KB
    autoReconnect: true,
    useStun: true,
    useTurn: true,
  });

  // State for active connections
  const [connections, setConnections] = useState([]);
  const [connectionStats, setConnectionStats] = useState({
    totalConnected: 0,
    totalDisconnected: 0,
    totalDataTransferred: 0,
    avgLatency: 0,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  /**
   * Connect to a peer
   * @param {string} peerId - Peer ID to connect to
   * @returns {Promise<Object>} Connection object
   */
  const connectToPeer = useCallback(async (peerId) => {
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // Simulate P2P connection (in a real implementation, this would use WebRTC)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create mock connection
      const newConnection = {
        id: `conn-${Date.now()}`,
        peerId,
        status: 'connected',
        connectedAt: new Date(),
        latency: Math.floor(Math.random() * 100) + 20, // 20-120ms
        dataTransferred: 0,
      };

      // Update connections
      setConnections(prev => [...prev, newConnection]);
      
      // Update stats
      setConnectionStats(prev => ({
        ...prev,
        totalConnected: prev.totalConnected + 1,
        avgLatency: (prev.avgLatency * prev.totalConnected + newConnection.latency) / (prev.totalConnected + 1),
      }));

      setIsConnecting(false);
      return newConnection;
    } catch (error) {
      const p2pError = new P2PError(
        'Failed to connect to peer',
        P2P_ERROR_CODES.CONNECTION_FAILED,
        { peerId }
      );
      
      setConnectionError(handleP2PError(p2pError));
      setIsConnecting(false);
      throw p2pError;
    }
  }, []);

  /**
   * Disconnect from a peer
   * @param {string} connectionId - Connection ID to disconnect
   */
  const disconnectFromPeer = useCallback((connectionId) => {
    setConnections(prev => {
      const connection = prev.find(conn => conn.id === connectionId);
      
      if (!connection) {
        return prev;
      }
      
      // Update stats
      setConnectionStats(prevStats => ({
        ...prevStats,
        totalDisconnected: prevStats.totalDisconnected + 1,
      }));
      
      // Remove connection
      return prev.filter(conn => conn.id !== connectionId);
    });
  }, []);

  /**
   * Send data to a peer
   * @param {string} connectionId - Connection ID to send data to
   * @param {any} data - Data to send
   * @returns {Promise<boolean>} Whether the data was sent successfully
   */
  const sendToPeer = useCallback(async (connectionId, data) => {
    try {
      const connection = connections.find(conn => conn.id === connectionId);
      
      if (!connection) {
        throw new P2PError(
          'Connection not found',
          P2P_ERROR_CODES.PEER_UNAVAILABLE,
          { connectionId }
        );
      }
      
      // Simulate data transfer
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Calculate data size (in a real implementation, this would be the actual size)
      const dataSize = JSON.stringify(data).length;
      
      // Update connection stats
      setConnections(prev => prev.map(conn => {
        if (conn.id === connectionId) {
          return {
            ...conn,
            dataTransferred: conn.dataTransferred + dataSize,
          };
        }
        return conn;
      }));
      
      // Update global stats
      setConnectionStats(prev => ({
        ...prev,
        totalDataTransferred: prev.totalDataTransferred + dataSize,
      }));
      
      return true;
    } catch (error) {
      const p2pError = error instanceof P2PError ? error : new P2PError(
        'Failed to send data to peer',
        P2P_ERROR_CODES.DATA_TRANSFER_FAILED,
        { connectionId }
      );
      
      handleP2PError(p2pError);
      throw p2pError;
    }
  }, [connections]);

  /**
   * Update P2P settings
   * @param {Object} newSettings - New settings object
   */
  const updateSettings = useCallback((newSettings) => {
    setPeerSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  }, [setPeerSettings]);

  // Clean up connections on unmount
  useEffect(() => {
    return () => {
      // In a real implementation, this would close all WebRTC connections
      setConnections([]);
    };
  }, []);

  // Context value
  const value = {
    peerSettings,
    connections,
    connectionStats,
    isConnecting,
    connectionError,
    connectToPeer,
    disconnectFromPeer,
    sendToPeer,
    updateSettings,
  };

  return (
    <P2PContext.Provider value={value}>
      {children}
    </P2PContext.Provider>
  );
};

P2PProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook for using P2P context
 * @returns {Object} P2P context value
 */
export const useP2P = () => {
  const context = useContext(P2PContext);
  
  if (context === undefined) {
    throw new Error('useP2P must be used within a P2PProvider');
  }
  
  return context;
};

export default P2PContext;
