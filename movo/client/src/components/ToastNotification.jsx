import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * ToastNotification - Animated notification component
 * Provides feedback for user actions
 * 
 * @author zophlic
 */
const ToastNotification = ({ 
  message, 
  type = 'info', 
  duration = 3000, 
  onClose,
  position = 'bottom-right',
  showProgress = true,
  action = null
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const [intervalId, setIntervalId] = useState(null);
  
  // Handle close
  const handleClose = useCallback(() => {
    setIsVisible(false);
    
    // Clear interval if exists
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    // Call onClose callback after animation completes
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 300);
  }, [onClose, intervalId]);
  
  // Set up auto-close timer and progress bar
  useEffect(() => {
    if (duration > 0) {
      // Set timeout for auto-close
      const closeTimeout = setTimeout(() => {
        handleClose();
      }, duration);
      
      // Set up progress bar
      if (showProgress) {
        const updateInterval = 10; // Update every 10ms
        const steps = duration / updateInterval;
        const decrementAmount = 100 / steps;
        
        const id = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev - decrementAmount;
            return newProgress < 0 ? 0 : newProgress;
          });
        }, updateInterval);
        
        setIntervalId(id);
      }
      
      // Clean up on unmount
      return () => {
        clearTimeout(closeTimeout);
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [duration, handleClose, showProgress, intervalId]);
  
  // Get icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        );
      case 'error':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        );
      case 'warning':
        return (
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        );
    }
  };
  
  // Get position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return {
          top: '20px',
          left: '20px'
        };
      case 'top-center':
        return {
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)'
        };
      case 'top-right':
        return {
          top: '20px',
          right: '20px'
        };
      case 'bottom-left':
        return {
          bottom: '20px',
          left: '20px'
        };
      case 'bottom-center':
        return {
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)'
        };
      case 'bottom-right':
      default:
        return {
          bottom: '20px',
          right: '20px'
        };
    }
  };
  
  return (
    <div 
      className={`toast-notification ${type} ${isVisible ? 'visible' : 'hidden'}`}
      style={getPositionStyles()}
      role="alert"
    >
      <div className="toast-content">
        <div className="toast-icon">
          {getIcon()}
        </div>
        
        <div className="toast-message">
          {message}
        </div>
        
        {action && (
          <button 
            className="toast-action"
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
        
        <button 
          className="toast-close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>
      
      {showProgress && duration > 0 && (
        <div 
          className="toast-progress"
          style={{ width: `${progress}%` }}
        ></div>
      )}
      
      <style jsx>{`
        .toast-notification {
          position: fixed;
          z-index: 1000;
          min-width: 300px;
          max-width: 400px;
          background-color: #2c3e50;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          transition: transform 0.3s ease, opacity 0.3s ease;
        }
        
        .toast-notification.hidden {
          transform: translateY(20px);
          opacity: 0;
        }
        
        .toast-notification.visible {
          transform: translateY(0);
          opacity: 1;
        }
        
        .toast-notification.success {
          border-left: 4px solid #2ecc71;
        }
        
        .toast-notification.error {
          border-left: 4px solid #e74c3c;
        }
        
        .toast-notification.warning {
          border-left: 4px solid #f39c12;
        }
        
        .toast-notification.info {
          border-left: 4px solid #3498db;
        }
        
        .toast-content {
          display: flex;
          align-items: center;
          padding: 16px;
        }
        
        .toast-icon {
          margin-right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .toast-notification.success .toast-icon {
          color: #2ecc71;
        }
        
        .toast-notification.error .toast-icon {
          color: #e74c3c;
        }
        
        .toast-notification.warning .toast-icon {
          color: #f39c12;
        }
        
        .toast-notification.info .toast-icon {
          color: #3498db;
        }
        
        .toast-message {
          flex: 1;
          font-size: 14px;
          color: #ecf0f1;
        }
        
        .toast-action {
          margin-left: 12px;
          background: none;
          border: none;
          color: #3498db;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }
        
        .toast-action:hover {
          background-color: rgba(52, 152, 219, 0.1);
        }
        
        .toast-close {
          margin-left: 12px;
          background: none;
          border: none;
          color: #95a5a6;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          transition: background-color 0.2s ease;
        }
        
        .toast-close:hover {
          background-color: rgba(149, 165, 166, 0.1);
          color: #ecf0f1;
        }
        
        .toast-progress {
          height: 4px;
          background-color: rgba(255, 255, 255, 0.2);
          transition: width linear;
        }
        
        .toast-notification.success .toast-progress {
          background-color: #2ecc71;
        }
        
        .toast-notification.error .toast-progress {
          background-color: #e74c3c;
        }
        
        .toast-notification.warning .toast-progress {
          background-color: #f39c12;
        }
        
        .toast-notification.info .toast-progress {
          background-color: #3498db;
        }
      `}</style>
    </div>
  );
};

ToastNotification.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  duration: PropTypes.number,
  onClose: PropTypes.func,
  position: PropTypes.oneOf([
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right'
  ]),
  showProgress: PropTypes.bool,
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
  })
};

export default ToastNotification;
