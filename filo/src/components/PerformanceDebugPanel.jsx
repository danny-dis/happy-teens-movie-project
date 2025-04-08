import React, { useState, useEffect, useRef } from 'react';
import { useP2P } from '../context/P2PContext';
import offlineStorageService from '../services/offlineStorageService';

/**
 * Performance Debug Panel Component
 * Displays performance metrics and debug information
 * 
 * @author zophlic
 */
const PerformanceDebugPanel = () => {
  const { connections, connectionStats } = useP2P();
  const [isVisible, setIsVisible] = useState(false);
  const [metrics, setMetrics] = useState({
    memory: { usage: 0, limit: 0, percent: 0 },
    storage: { usage: 0, quota: 0, percent: 0 },
    fps: { current: 0, average: 0, min: 60, max: 0 },
    network: { downlink: 0, rtt: 0, effectiveType: 'unknown' },
    p2p: { connections: 0, dataTransferred: 0, avgLatency: 0 }
  });
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('metrics');
  const fpsCounterRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const frameTimesRef = useRef([]);
  const animationFrameRef = useRef(null);
  const logContainerRef = useRef(null);
  
  // Initialize and clean up
  useEffect(() => {
    // Override console methods to capture logs
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };
    
    // Custom console methods
    console.log = (...args) => {
      addLog('log', args);
      originalConsole.log(...args);
    };
    
    console.warn = (...args) => {
      addLog('warn', args);
      originalConsole.warn(...args);
    };
    
    console.error = (...args) => {
      addLog('error', args);
      originalConsole.error(...args);
    };
    
    console.info = (...args) => {
      addLog('info', args);
      originalConsole.info(...args);
    };
    
    // Start monitoring
    startMonitoring();
    
    // Clean up
    return () => {
      // Restore original console methods
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
      
      // Stop monitoring
      stopMonitoring();
    };
  }, []);
  
  // Update P2P metrics when connections change
  useEffect(() => {
    setMetrics(prev => ({
      ...prev,
      p2p: {
        connections: connections.length,
        dataTransferred: connectionStats.totalDataTransferred,
        avgLatency: connectionStats.avgLatency
      }
    }));
  }, [connections, connectionStats]);
  
  // Scroll logs to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);
  
  // Add a log entry
  const addLog = (level, args) => {
    const timestamp = new Date().toISOString().substring(11, 23);
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    setLogs(prev => {
      // Keep only the last 100 logs
      const newLogs = [...prev, { level, message, timestamp }];
      if (newLogs.length > 100) {
        return newLogs.slice(-100);
      }
      return newLogs;
    });
  };
  
  // Start performance monitoring
  const startMonitoring = () => {
    // Monitor FPS
    const updateFPS = (timestamp) => {
      if (lastFrameTimeRef.current) {
        const frameTime = timestamp - lastFrameTimeRef.current;
        const fps = 1000 / frameTime;
        
        // Update frame times history (keep last 60 frames)
        frameTimesRef.current.push(fps);
        if (frameTimesRef.current.length > 60) {
          frameTimesRef.current.shift();
        }
        
        // Calculate FPS stats
        const avgFps = frameTimesRef.current.reduce((sum, fps) => sum + fps, 0) / frameTimesRef.current.length;
        const minFps = Math.min(...frameTimesRef.current);
        const maxFps = Math.max(...frameTimesRef.current);
        
        // Update metrics every 10 frames
        fpsCounterRef.current++;
        if (fpsCounterRef.current >= 10) {
          fpsCounterRef.current = 0;
          
          setMetrics(prev => ({
            ...prev,
            fps: {
              current: Math.round(fps),
              average: Math.round(avgFps),
              min: Math.round(minFps),
              max: Math.round(maxFps)
            }
          }));
        }
      }
      
      lastFrameTimeRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(updateFPS);
    };
    
    // Start FPS monitoring
    animationFrameRef.current = requestAnimationFrame(updateFPS);
    
    // Monitor memory usage
    const updateMemory = () => {
      if (performance.memory) {
        const usage = performance.memory.usedJSHeapSize;
        const limit = performance.memory.jsHeapSizeLimit;
        const percent = (usage / limit) * 100;
        
        setMetrics(prev => ({
          ...prev,
          memory: {
            usage: formatBytes(usage),
            limit: formatBytes(limit),
            percent: Math.round(percent)
          }
        }));
      }
    };
    
    // Monitor storage usage
    const updateStorage = async () => {
      try {
        const storageInfo = await offlineStorageService.getStorageInfo();
        
        setMetrics(prev => ({
          ...prev,
          storage: {
            usage: formatBytes(storageInfo.usage),
            quota: formatBytes(storageInfo.quota),
            percent: Math.round(storageInfo.percentUsed)
          }
        }));
      } catch (error) {
        console.error('Failed to get storage info', error);
      }
    };
    
    // Monitor network conditions
    const updateNetwork = () => {
      if (navigator.connection) {
        setMetrics(prev => ({
          ...prev,
          network: {
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
            effectiveType: navigator.connection.effectiveType
          }
        }));
      }
    };
    
    // Set up interval for metrics that don't need to update every frame
    const intervalId = setInterval(() => {
      updateMemory();
      updateStorage();
      updateNetwork();
    }, 2000);
    
    // Initial update
    updateMemory();
    updateStorage();
    updateNetwork();
    
    // Store interval ID for cleanup
    window.debugIntervalId = intervalId;
  };
  
  // Stop performance monitoring
  const stopMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (window.debugIntervalId) {
      clearInterval(window.debugIntervalId);
    }
  };
  
  // Format bytes to human-readable string
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  // Toggle panel visibility
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };
  
  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };
  
  // Render metrics tab
  const renderMetricsTab = () => (
    <div className="metrics-container">
      <div className="metric-group">
        <h3>Performance</h3>
        <div className="metric">
          <span className="metric-label">FPS:</span>
          <span className="metric-value">{metrics.fps.current}</span>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill" 
              style={{ 
                width: `${Math.min(100, (metrics.fps.current / 60) * 100)}%`,
                backgroundColor: metrics.fps.current < 30 ? '#e74c3c' : 
                                 metrics.fps.current < 50 ? '#f39c12' : '#2ecc71'
              }}
            ></div>
          </div>
        </div>
        <div className="metric-details">
          <span>Avg: {metrics.fps.average}</span>
          <span>Min: {metrics.fps.min}</span>
          <span>Max: {metrics.fps.max}</span>
        </div>
      </div>
      
      <div className="metric-group">
        <h3>Memory</h3>
        <div className="metric">
          <span className="metric-label">Heap:</span>
          <span className="metric-value">{metrics.memory.usage}</span>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill" 
              style={{ 
                width: `${metrics.memory.percent}%`,
                backgroundColor: metrics.memory.percent > 80 ? '#e74c3c' : 
                                 metrics.memory.percent > 60 ? '#f39c12' : '#2ecc71'
              }}
            ></div>
          </div>
        </div>
        <div className="metric-details">
          <span>Limit: {metrics.memory.limit}</span>
          <span>Used: {metrics.memory.percent}%</span>
        </div>
      </div>
      
      <div className="metric-group">
        <h3>Storage</h3>
        <div className="metric">
          <span className="metric-label">Used:</span>
          <span className="metric-value">{metrics.storage.usage}</span>
          <div className="metric-bar">
            <div 
              className="metric-bar-fill" 
              style={{ 
                width: `${metrics.storage.percent}%`,
                backgroundColor: metrics.storage.percent > 80 ? '#e74c3c' : 
                                 metrics.storage.percent > 60 ? '#f39c12' : '#2ecc71'
              }}
            ></div>
          </div>
        </div>
        <div className="metric-details">
          <span>Quota: {metrics.storage.quota}</span>
          <span>Used: {metrics.storage.percent}%</span>
        </div>
      </div>
      
      <div className="metric-group">
        <h3>Network</h3>
        <div className="metric-details network-details">
          <div>
            <span className="metric-label">Type:</span>
            <span className="metric-value">{metrics.network.effectiveType}</span>
          </div>
          <div>
            <span className="metric-label">Downlink:</span>
            <span className="metric-value">{metrics.network.downlink} Mbps</span>
          </div>
          <div>
            <span className="metric-label">RTT:</span>
            <span className="metric-value">{metrics.network.rtt} ms</span>
          </div>
        </div>
      </div>
      
      <div className="metric-group">
        <h3>P2P</h3>
        <div className="metric-details p2p-details">
          <div>
            <span className="metric-label">Connections:</span>
            <span className="metric-value">{metrics.p2p.connections}</span>
          </div>
          <div>
            <span className="metric-label">Data Transferred:</span>
            <span className="metric-value">{formatBytes(metrics.p2p.dataTransferred)}</span>
          </div>
          <div>
            <span className="metric-label">Avg Latency:</span>
            <span className="metric-value">{metrics.p2p.avgLatency} ms</span>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render logs tab
  const renderLogsTab = () => (
    <div className="logs-container" ref={logContainerRef}>
      <div className="logs-header">
        <button className="clear-logs-button" onClick={clearLogs}>Clear Logs</button>
      </div>
      <div className="logs-list">
        {logs.map((log, index) => (
          <div key={index} className={`log-entry log-${log.level}`}>
            <span className="log-timestamp">{log.timestamp}</span>
            <span className="log-level">[{log.level.toUpperCase()}]</span>
            <span className="log-message">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
  
  // Render connections tab
  const renderConnectionsTab = () => (
    <div className="connections-container">
      <h3>Active P2P Connections</h3>
      {connections.length === 0 ? (
        <div className="no-connections">No active connections</div>
      ) : (
        <div className="connections-list">
          {connections.map((connection, index) => (
            <div key={index} className="connection-item">
              <div className="connection-header">
                <span className="connection-id">{connection.peerId}</span>
                <span className={`connection-status status-${connection.status}`}>
                  {connection.status}
                </span>
              </div>
              <div className="connection-details">
                <div>
                  <span className="detail-label">Connected:</span>
                  <span className="detail-value">
                    {new Date(connection.connectedAt).toLocaleTimeString()}
                  </span>
                </div>
                <div>
                  <span className="detail-label">Latency:</span>
                  <span className="detail-value">{connection.latency} ms</span>
                </div>
                <div>
                  <span className="detail-label">Data:</span>
                  <span className="detail-value">{formatBytes(connection.dataTransferred)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  return (
    <>
      <button 
        className={`debug-toggle-button ${isVisible ? 'active' : ''}`}
        onClick={toggleVisibility}
      >
        {isVisible ? 'Hide Debug' : 'Debug'}
      </button>
      
      {isVisible && (
        <div className="debug-panel">
          <div className="debug-header">
            <h2>Performance Debug Panel</h2>
            <div className="debug-tabs">
              <button 
                className={activeTab === 'metrics' ? 'active' : ''}
                onClick={() => setActiveTab('metrics')}
              >
                Metrics
              </button>
              <button 
                className={activeTab === 'logs' ? 'active' : ''}
                onClick={() => setActiveTab('logs')}
              >
                Logs
              </button>
              <button 
                className={activeTab === 'connections' ? 'active' : ''}
                onClick={() => setActiveTab('connections')}
              >
                Connections
              </button>
            </div>
          </div>
          
          <div className="debug-content">
            {activeTab === 'metrics' && renderMetricsTab()}
            {activeTab === 'logs' && renderLogsTab()}
            {activeTab === 'connections' && renderConnectionsTab()}
          </div>
          
          <div className="debug-footer">
            <span>Filo Debug Panel by zophlic</span>
            <button className="close-button" onClick={() => setIsVisible(false)}>Close</button>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .debug-toggle-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: #2c3e50;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 14px;
          cursor: pointer;
          z-index: 9998;
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }
        
        .debug-toggle-button:hover {
          opacity: 1;
        }
        
        .debug-toggle-button.active {
          background-color: #e74c3c;
        }
        
        .debug-panel {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 400px;
          height: 600px;
          background-color: #1a1a1a;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          color: #ecf0f1;
          font-family: monospace;
        }
        
        .debug-header {
          padding: 12px;
          background-color: #2c3e50;
          border-bottom: 1px solid #34495e;
        }
        
        .debug-header h2 {
          margin: 0 0 10px 0;
          font-size: 16px;
          font-weight: normal;
        }
        
        .debug-tabs {
          display: flex;
          gap: 8px;
        }
        
        .debug-tabs button {
          background-color: transparent;
          border: none;
          color: #bdc3c7;
          padding: 4px 8px;
          font-size: 14px;
          cursor: pointer;
          border-radius: 4px;
        }
        
        .debug-tabs button.active {
          background-color: #3498db;
          color: white;
        }
        
        .debug-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }
        
        .debug-footer {
          padding: 8px 12px;
          background-color: #2c3e50;
          border-top: 1px solid #34495e;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
        }
        
        .close-button {
          background-color: #e74c3c;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
        }
        
        /* Metrics tab styles */
        .metrics-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .metric-group {
          background-color: #2c3e50;
          border-radius: 4px;
          padding: 12px;
        }
        
        .metric-group h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #3498db;
        }
        
        .metric {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          flex-wrap: wrap;
        }
        
        .metric-label {
          width: 60px;
          font-size: 14px;
          color: #bdc3c7;
        }
        
        .metric-value {
          width: 80px;
          font-size: 14px;
          color: #ecf0f1;
        }
        
        .metric-bar {
          flex: 1;
          height: 8px;
          background-color: #34495e;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .metric-bar-fill {
          height: 100%;
          transition: width 0.3s ease, background-color 0.3s ease;
        }
        
        .metric-details {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #95a5a6;
        }
        
        .network-details, .p2p-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        /* Logs tab styles */
        .logs-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .logs-header {
          margin-bottom: 8px;
        }
        
        .clear-logs-button {
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .logs-list {
          flex: 1;
          overflow-y: auto;
          font-size: 12px;
          background-color: #2c3e50;
          border-radius: 4px;
          padding: 8px;
        }
        
        .log-entry {
          margin-bottom: 4px;
          word-break: break-word;
          display: flex;
          gap: 8px;
        }
        
        .log-timestamp {
          color: #95a5a6;
          white-space: nowrap;
        }
        
        .log-level {
          color: #3498db;
          white-space: nowrap;
        }
        
        .log-message {
          color: #ecf0f1;
        }
        
        .log-error .log-level {
          color: #e74c3c;
        }
        
        .log-warn .log-level {
          color: #f39c12;
        }
        
        .log-info .log-level {
          color: #2ecc71;
        }
        
        /* Connections tab styles */
        .connections-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .connections-container h3 {
          margin: 0;
          font-size: 14px;
          color: #3498db;
        }
        
        .no-connections {
          background-color: #2c3e50;
          border-radius: 4px;
          padding: 12px;
          text-align: center;
          color: #95a5a6;
        }
        
        .connections-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .connection-item {
          background-color: #2c3e50;
          border-radius: 4px;
          padding: 12px;
        }
        
        .connection-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .connection-id {
          font-size: 14px;
          color: #ecf0f1;
        }
        
        .connection-status {
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .status-connected {
          background-color: #2ecc71;
          color: white;
        }
        
        .status-connecting {
          background-color: #f39c12;
          color: white;
        }
        
        .status-disconnected {
          background-color: #e74c3c;
          color: white;
        }
        
        .connection-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
        }
        
        .detail-label {
          color: #bdc3c7;
          width: 80px;
          display: inline-block;
        }
        
        .detail-value {
          color: #ecf0f1;
        }
      `}</style>
    </>
  );
};

export default PerformanceDebugPanel;
