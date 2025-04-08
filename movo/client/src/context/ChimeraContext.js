import React, { createContext, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import useLocalStorage from '../hooks/useLocalStorage';

/**
 * Context for managing Chimera mode (switching between streaming and local content)
 * @author zophlic
 */

// Create context
const ChimeraContext = createContext();

/**
 * Provider component for Chimera mode context
 */
export const ChimeraProvider = ({ children }) => {
  // Use localStorage to persist Chimera mode state
  const [isStreamingMode, setIsStreamingMode] = useLocalStorage('chimeraMode', true);
  const [autoSwitch, setAutoSwitch] = useLocalStorage('chimeraAutoSwitch', true);
  const [lastSwitch, setLastSwitch] = useLocalStorage('chimeraLastSwitch', null);

  /**
   * Toggle between streaming and local mode
   */
  const toggleMode = useCallback(() => {
    setIsStreamingMode(prevMode => !prevMode);
    setLastSwitch(new Date().toISOString());
  }, [setIsStreamingMode, setLastSwitch]);

  /**
   * Set specific mode
   * @param {boolean} isStreaming - Whether to use streaming mode
   */
  const setMode = useCallback((isStreaming) => {
    setIsStreamingMode(isStreaming);
    setLastSwitch(new Date().toISOString());
  }, [setIsStreamingMode, setLastSwitch]);

  /**
   * Toggle auto-switch setting
   */
  const toggleAutoSwitch = useCallback(() => {
    setAutoSwitch(prev => !prev);
  }, [setAutoSwitch]);

  /**
   * Auto-switch to local mode based on network conditions
   * @param {Object} networkInfo - Network information
   */
  const autoSwitchBasedOnNetwork = useCallback((networkInfo) => {
    if (!autoSwitch) return;
    
    // Switch to local mode if network is poor
    if (isStreamingMode && 
        (networkInfo.downlink < 1.0 || 
         networkInfo.effectiveType === 'slow-2g' || 
         networkInfo.effectiveType === '2g')) {
      setIsStreamingMode(false);
      setLastSwitch(new Date().toISOString());
    }
    
    // Switch back to streaming if network is good
    if (!isStreamingMode && 
        networkInfo.downlink > 2.0 && 
        networkInfo.effectiveType !== 'slow-2g' && 
        networkInfo.effectiveType !== '2g') {
      setIsStreamingMode(true);
      setLastSwitch(new Date().toISOString());
    }
  }, [autoSwitch, isStreamingMode, setIsStreamingMode, setLastSwitch]);

  // Context value
  const value = {
    isStreamingMode,
    autoSwitch,
    lastSwitch,
    toggleMode,
    setMode,
    toggleAutoSwitch,
    autoSwitchBasedOnNetwork
  };

  return (
    <ChimeraContext.Provider value={value}>
      {children}
    </ChimeraContext.Provider>
  );
};

ChimeraProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook for using Chimera context
 * @returns {Object} Chimera context value
 */
export const useChimera = () => {
  const context = useContext(ChimeraContext);
  
  if (context === undefined) {
    throw new Error('useChimera must be used within a ChimeraProvider');
  }
  
  return context;
};

export default ChimeraContext;
