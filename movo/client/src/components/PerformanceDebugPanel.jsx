import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import performanceMonitoringService, { METRICS, PERFORMANCE_THRESHOLDS } from '../services/performanceMonitoringService';

/**
 * PerformanceDebugPanel - Real-time performance metrics display
 * 
 * @author zophlic
 */
const PerformanceDebugPanel = ({ 
  position = 'bottom-right',
  initiallyExpanded = false,
  showFps = true,
  showMemory = true,
  showNetwork = true,
  showWebVitals = true,
  showCharts = true
}) => {
  const [metrics, setMetrics] = useState(performanceMonitoringService.getMetrics());
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const [activeTab, setActiveTab] = useState('overview');
  const fpsChartRef = useRef(null);
  const fpsChartInstance = useRef(null);
  const memoryChartRef = useRef(null);
  const memoryChartInstance = useRef(null);
  
  // Update metrics when they change
  useEffect(() => {
    const listenerId = 'performance-debug-panel';
    
    performanceMonitoringService.onMetricsUpdate(listenerId, (newMetrics) => {
      setMetrics(newMetrics);
      
      // Update charts if they exist
      if (showCharts) {
        updateFpsChart(newMetrics[METRICS.FPS]);
        updateMemoryChart(newMetrics[METRICS.MEMORY]);
      }
    });
    
    return () => {
      performanceMonitoringService.offMetricsUpdate(listenerId);
    };
  }, [showCharts]);
  
  // Initialize charts
  useEffect(() => {
    if (showCharts && isExpanded) {
      initializeCharts();
    }
    
    return () => {
      // Destroy charts on unmount
      if (fpsChartInstance.current) {
        fpsChartInstance.current.destroy();
      }
      
      if (memoryChartInstance.current) {
        memoryChartInstance.current.destroy();
      }
    };
  }, [showCharts, isExpanded]);
  
  // Initialize charts when tab changes
  useEffect(() => {
    if (showCharts && isExpanded && activeTab === 'charts') {
      // Small delay to ensure the canvas is rendered
      setTimeout(() => {
        initializeCharts();
      }, 100);
    }
  }, [activeTab, showCharts, isExpanded]);
  
  // Initialize charts
  const initializeCharts = () => {
    if (!window.Chart) {
      console.error('Chart.js not loaded');
      return;
    }
    
    // Initialize FPS chart
    if (fpsChartRef.current && !fpsChartInstance.current) {
      const ctx = fpsChartRef.current.getContext('2d');
      
      fpsChartInstance.current = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: Array(30).fill(''),
          datasets: [{
            label: 'FPS',
            data: Array(30).fill(0),
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.2)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          scales: {
            y: {
              min: 0,
              max: 60,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            },
            x: {
              display: false
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }
    
    // Initialize memory chart
    if (memoryChartRef.current && !memoryChartInstance.current) {
      const ctx = memoryChartRef.current.getContext('2d');
      
      memoryChartInstance.current = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: Array(30).fill(''),
          datasets: [{
            label: 'Memory Usage',
            data: Array(30).fill(0),
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.2)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          scales: {
            y: {
              min: 0,
              max: 100,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            },
            x: {
              display: false
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }
  };
  
  // Update FPS chart
  const updateFpsChart = (fpsMetrics) => {
    if (!fpsChartInstance.current) {
      return;
    }
    
    const chart = fpsChartInstance.current;
    const data = chart.data.datasets[0].data;
    
    // Add new data point
    data.push(fpsMetrics.current);
    
    // Remove oldest data point
    if (data.length > 30) {
      data.shift();
    }
    
    // Update chart
    chart.update();
  };
  
  // Update memory chart
  const updateMemoryChart = (memoryMetrics) => {
    if (!memoryChartInstance.current) {
      return;
    }
    
    const chart = memoryChartInstance.current;
    const data = chart.data.datasets[0].data;
    
    // Add new data point
    data.push(memoryMetrics.percent);
    
    // Remove oldest data point
    if (data.length > 30) {
      data.shift();
    }
    
    // Update chart
    chart.update();
  };
  
  // Get rating class based on value and thresholds
  const getRatingClass = (value, metricKey) => {
    const thresholds = PERFORMANCE_THRESHOLDS[metricKey];
    
    if (!thresholds) {
      return 'rating-unknown';
    }
    
    if (value <= thresholds.good) {
      return 'rating-good';
    } else if (value <= thresholds.acceptable) {
      return 'rating-acceptable';
    } else {
      return 'rating-poor';
    }
  };
  
  // Format bytes to human-readable format
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format milliseconds to human-readable format
  const formatMs = (ms) => {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else {
      return `${(ms / 1000).toFixed(2)}s`;
    }
  };
  
  // Toggle panel expansion
  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Render FPS metrics
  const renderFpsMetrics = () => {
    const fpsMetrics = metrics[METRICS.FPS];
    const fpsRating = getRatingClass(fpsMetrics.current, METRICS.FPS);
    
    return (
      <div className="metric-group">
        <h3>FPS</h3>
        <div className="metric-row">
          <div className="metric-label">Current:</div>
          <div className={`metric-value ${fpsRating}`}>{fpsMetrics.current}</div>
        </div>
        <div className="metric-row">
          <div className="metric-label">Average:</div>
          <div className="metric-value">{fpsMetrics.average}</div>
        </div>
        <div className="metric-row">
          <div className="metric-label">Min/Max:</div>
          <div className="metric-value">{fpsMetrics.min} / {fpsMetrics.max}</div>
        </div>
      </div>
    );
  };
  
  // Render memory metrics
  const renderMemoryMetrics = () => {
    const memoryMetrics = metrics[METRICS.MEMORY];
    const memoryRating = getRatingClass(memoryMetrics.percent / 100, METRICS.MEMORY);
    
    return (
      <div className="metric-group">
        <h3>Memory</h3>
        <div className="metric-row">
          <div className="metric-label">Usage:</div>
          <div className={`metric-value ${memoryRating}`}>
            {formatBytes(memoryMetrics.usage)} ({memoryMetrics.percent}%)
          </div>
        </div>
        <div className="metric-row">
          <div className="metric-label">Limit:</div>
          <div className="metric-value">{formatBytes(memoryMetrics.limit)}</div>
        </div>
      </div>
    );
  };
  
  // Render network metrics
  const renderNetworkMetrics = () => {
    const networkMetrics = metrics[METRICS.NETWORK];
    
    return (
      <div className="metric-group">
        <h3>Network</h3>
        <div className="metric-row">
          <div className="metric-label">Downlink:</div>
          <div className="metric-value">{networkMetrics.downlink} Mbps</div>
        </div>
        <div className="metric-row">
          <div className="metric-label">RTT:</div>
          <div className="metric-value">{networkMetrics.rtt} ms</div>
        </div>
        <div className="metric-row">
          <div className="metric-label">Type:</div>
          <div className="metric-value">{networkMetrics.effectiveType}</div>
        </div>
        {networkMetrics.saveData && (
          <div className="metric-row">
            <div className="metric-label">Data Saver:</div>
            <div className="metric-value">Enabled</div>
          </div>
        )}
      </div>
    );
  };
  
  // Render web vitals metrics
  const renderWebVitalsMetrics = () => {
    return (
      <div className="metric-group">
        <h3>Web Vitals</h3>
        <div className="metric-row">
          <div className="metric-label">FCP:</div>
          <div className={`metric-value ${getRatingClass(metrics[METRICS.FCP], METRICS.FCP)}`}>
            {formatMs(metrics[METRICS.FCP])}
          </div>
        </div>
        <div className="metric-row">
          <div className="metric-label">LCP:</div>
          <div className={`metric-value ${getRatingClass(metrics[METRICS.LCP], METRICS.LCP)}`}>
            {formatMs(metrics[METRICS.LCP])}
          </div>
        </div>
        <div className="metric-row">
          <div className="metric-label">CLS:</div>
          <div className={`metric-value ${getRatingClass(metrics[METRICS.CLS], METRICS.CLS)}`}>
            {metrics[METRICS.CLS].toFixed(3)}
          </div>
        </div>
        <div className="metric-row">
          <div className="metric-label">FID:</div>
          <div className={`metric-value ${getRatingClass(metrics[METRICS.FID], METRICS.FID)}`}>
            {formatMs(metrics[METRICS.FID])}
          </div>
        </div>
        <div className="metric-row">
          <div className="metric-label">TTFB:</div>
          <div className={`metric-value ${getRatingClass(metrics[METRICS.TTFB], METRICS.TTFB)}`}>
            {formatMs(metrics[METRICS.TTFB])}
          </div>
        </div>
        {metrics[METRICS.INP] > 0 && (
          <div className="metric-row">
            <div className="metric-label">INP:</div>
            <div className={`metric-value ${getRatingClass(metrics[METRICS.INP], METRICS.INP)}`}>
              {formatMs(metrics[METRICS.INP])}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render charts
  const renderCharts = () => {
    return (
      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>FPS Over Time</h3>
          <div className="chart">
            <canvas ref={fpsChartRef}></canvas>
          </div>
        </div>
        <div className="chart-wrapper">
          <h3>Memory Usage Over Time</h3>
          <div className="chart">
            <canvas ref={memoryChartRef}></canvas>
          </div>
        </div>
      </div>
    );
  };
  
  // Render panel content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="tab-content">
            {showFps && renderFpsMetrics()}
            {showMemory && renderMemoryMetrics()}
            {showNetwork && renderNetworkMetrics()}
          </div>
        );
      case 'web-vitals':
        return (
          <div className="tab-content">
            {showWebVitals && renderWebVitalsMetrics()}
          </div>
        );
      case 'charts':
        return (
          <div className="tab-content">
            {showCharts && renderCharts()}
          </div>
        );
      default:
        return null;
    }
  };
  
  // Render collapsed panel
  if (!isExpanded) {
    return (
      <div className={`performance-debug-panel collapsed ${position}`}>
        <button className="toggle-button" onClick={toggleExpansion}>
          <div className="fps-indicator">
            <span className={getRatingClass(metrics[METRICS.FPS].current, METRICS.FPS)}>
              {metrics[METRICS.FPS].current} FPS
            </span>
          </div>
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z" />
          </svg>
        </button>
        
        <style jsx>{`
          .performance-debug-panel {
            position: fixed;
            z-index: var(--z-index-fixed);
            background-color: rgba(0, 0, 0, 0.8);
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            color: white;
            font-family: monospace;
            font-size: 12px;
            transition: all 0.3s ease;
            backdrop-filter: blur(4px);
          }
          
          .performance-debug-panel.top-left {
            top: 20px;
            left: 20px;
          }
          
          .performance-debug-panel.top-right {
            top: 20px;
            right: 20px;
          }
          
          .performance-debug-panel.bottom-left {
            bottom: 20px;
            left: 20px;
          }
          
          .performance-debug-panel.bottom-right {
            bottom: 20px;
            right: 20px;
          }
          
          .toggle-button {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100px;
            padding: 8px 12px;
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-family: monospace;
            font-size: 12px;
          }
          
          .fps-indicator {
            display: flex;
            align-items: center;
          }
          
          .rating-good {
            color: #2ecc71;
          }
          
          .rating-acceptable {
            color: #f39c12;
          }
          
          .rating-poor {
            color: #e74c3c;
          }
          
          .rating-unknown {
            color: #95a5a6;
          }
        `}</style>
      </div>
    );
  }
  
  // Render expanded panel
  return (
    <div className={`performance-debug-panel expanded ${position}`}>
      <div className="panel-header">
        <h2>Performance Monitor</h2>
        <button className="toggle-button" onClick={toggleExpansion}>
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </button>
      </div>
      
      <div className="panel-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'web-vitals' ? 'active' : ''}`}
          onClick={() => setActiveTab('web-vitals')}
        >
          Web Vitals
        </button>
        <button 
          className={`tab-button ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          Charts
        </button>
      </div>
      
      {renderTabContent()}
      
      <style jsx>{`
        .performance-debug-panel {
          position: fixed;
          z-index: var(--z-index-fixed);
          background-color: rgba(0, 0, 0, 0.8);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          color: white;
          font-family: monospace;
          font-size: 12px;
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
          width: 300px;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .performance-debug-panel.top-left {
          top: 20px;
          left: 20px;
        }
        
        .performance-debug-panel.top-right {
          top: 20px;
          right: 20px;
        }
        
        .performance-debug-panel.bottom-left {
          bottom: 20px;
          left: 20px;
        }
        
        .performance-debug-panel.bottom-right {
          bottom: 20px;
          right: 20px;
        }
        
        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .panel-header h2 {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
        }
        
        .toggle-button {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }
        
        .panel-tabs {
          display: flex;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .tab-button {
          flex: 1;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 8px;
          font-family: monospace;
          font-size: 12px;
          opacity: 0.7;
          transition: opacity 0.2s ease, background-color 0.2s ease;
        }
        
        .tab-button:hover {
          opacity: 1;
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .tab-button.active {
          opacity: 1;
          border-bottom: 2px solid #3498db;
        }
        
        .tab-content {
          padding: 16px;
        }
        
        .metric-group {
          margin-bottom: 16px;
        }
        
        .metric-group h3 {
          margin: 0 0 8px 0;
          font-size: 13px;
          font-weight: 500;
          color: #3498db;
        }
        
        .metric-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        
        .metric-label {
          opacity: 0.7;
        }
        
        .metric-value {
          font-weight: 500;
        }
        
        .rating-good {
          color: #2ecc71;
        }
        
        .rating-acceptable {
          color: #f39c12;
        }
        
        .rating-poor {
          color: #e74c3c;
        }
        
        .rating-unknown {
          color: #95a5a6;
        }
        
        .charts-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .chart-wrapper {
          margin-bottom: 16px;
        }
        
        .chart-wrapper h3 {
          margin: 0 0 8px 0;
          font-size: 13px;
          font-weight: 500;
          color: #3498db;
        }
        
        .chart {
          height: 120px;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          padding: 8px;
        }
      `}</style>
    </div>
  );
};

PerformanceDebugPanel.propTypes = {
  position: PropTypes.oneOf(['top-left', 'top-right', 'bottom-left', 'bottom-right']),
  initiallyExpanded: PropTypes.bool,
  showFps: PropTypes.bool,
  showMemory: PropTypes.bool,
  showNetwork: PropTypes.bool,
  showWebVitals: PropTypes.bool,
  showCharts: PropTypes.bool
};

export default PerformanceDebugPanel;
