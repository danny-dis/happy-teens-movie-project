import React, { useState, useEffect } from 'react';
import { useChimera } from '../context/ChimeraContext';
import analyticsService, { EVENT_CATEGORIES } from '../services/analyticsService';

/**
 * Chimera Mode Toggle Component
 * Allows switching between streaming and local content modes
 * 
 * @author zophlic
 */
const ChimeraToggle = () => {
  const { 
    isStreamingMode, 
    toggleMode, 
    autoSwitch, 
    toggleAutoSwitch 
  } = useChimera();
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Track mode changes for analytics
  useEffect(() => {
    analyticsService.trackEvent(
      EVENT_CATEGORIES.CHIMERA,
      'mode_change',
      { mode: isStreamingMode ? 'streaming' : 'local' }
    );
  }, [isStreamingMode]);
  
  // Handle toggle click
  const handleToggle = () => {
    setIsAnimating(true);
    toggleMode();
    
    // Track toggle interaction
    analyticsService.trackEvent(
      EVENT_CATEGORIES.CHIMERA,
      'toggle_click',
      { 
        previousMode: isStreamingMode ? 'streaming' : 'local',
        newMode: isStreamingMode ? 'local' : 'streaming'
      }
    );
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };
  
  // Handle auto-switch toggle
  const handleAutoSwitchToggle = () => {
    toggleAutoSwitch();
    
    // Track auto-switch toggle
    analyticsService.trackEvent(
      EVENT_CATEGORIES.CHIMERA,
      'auto_switch_toggle',
      { enabled: !autoSwitch }
    );
  };
  
  return (
    <div className="chimera-toggle-container">
      <div className="mode-indicator">
        <div className={`mode-label ${isStreamingMode ? 'active' : ''}`}>
          Streaming
        </div>
        <div 
          className={`toggle-switch ${isStreamingMode ? 'streaming' : 'local'} ${isAnimating ? 'animating' : ''}`}
          onClick={handleToggle}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="toggle-handle">
            {isStreamingMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 7l5 3l-5 3V7zm9 0l5 3l-5 3V7z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
                <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </div>
          
          {showTooltip && (
            <div className="toggle-tooltip">
              Switch to {isStreamingMode ? 'Local' : 'Streaming'} Mode
            </div>
          )}
        </div>
        <div className={`mode-label ${!isStreamingMode ? 'active' : ''}`}>
          Local
        </div>
      </div>
      
      <div className="auto-switch-container">
        <label className="auto-switch-label">
          <input 
            type="checkbox" 
            checked={autoSwitch} 
            onChange={handleAutoSwitchToggle} 
          />
          <span>Auto-switch based on network</span>
        </label>
      </div>
      
      <div className="mode-description">
        {isStreamingMode ? (
          <p>Streaming mode: Content is streamed from online sources.</p>
        ) : (
          <p>Local mode: Only showing content stored on your device.</p>
        )}
      </div>
      
      <style jsx>{`
        .chimera-toggle-container {
          padding: 16px;
          background-color: #1a1a1a;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .mode-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        
        .mode-label {
          font-size: 14px;
          color: #888;
          transition: color 0.3s ease;
          margin: 0 12px;
        }
        
        .mode-label.active {
          color: #fff;
          font-weight: 600;
        }
        
        .toggle-switch {
          position: relative;
          width: 60px;
          height: 30px;
          background-color: #333;
          border-radius: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0 4px;
          transition: background-color 0.3s ease;
        }
        
        .toggle-switch.streaming {
          background-color: #4a90e2;
        }
        
        .toggle-switch.local {
          background-color: #50c878;
        }
        
        .toggle-handle {
          position: absolute;
          width: 24px;
          height: 24px;
          background-color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
          transition: transform 0.3s ease;
        }
        
        .toggle-switch.streaming .toggle-handle {
          transform: translateX(30px);
        }
        
        .toggle-switch.local .toggle-handle {
          transform: translateX(2px);
        }
        
        .toggle-switch.animating .toggle-handle {
          animation: pulse 0.6s ease;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .toggle-tooltip {
          position: absolute;
          top: -30px;
          left: 50%;
          transform: translateX(-50%);
          background-color: rgba(0, 0, 0, 0.8);
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
        }
        
        .auto-switch-container {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        
        .auto-switch-label {
          display: flex;
          align-items: center;
          font-size: 13px;
          color: #aaa;
          cursor: pointer;
        }
        
        .auto-switch-label input {
          margin-right: 8px;
        }
        
        .mode-description {
          font-size: 13px;
          color: #888;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default ChimeraToggle;
