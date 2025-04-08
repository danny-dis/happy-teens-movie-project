import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import ToastNotification from './ToastNotification';

/**
 * Toast notification manager
 * Singleton for managing toast notifications
 * 
 * @author zophlic
 */
class ToastManager {
  constructor() {
    this.toasts = [];
    this.listeners = new Set();
    this.containerId = 'toast-container';
    this.maxToasts = 5;
    this.defaultPosition = 'bottom-right';
    
    // Create container if it doesn't exist
    this.ensureContainer();
  }
  
  /**
   * Ensure toast container exists in the DOM
   */
  ensureContainer() {
    if (typeof document !== 'undefined') {
      let container = document.getElementById(this.containerId);
      
      if (!container) {
        container = document.createElement('div');
        container.id = this.containerId;
        document.body.appendChild(container);
      }
    }
  }
  
  /**
   * Add a toast notification
   * @param {Object} toast - Toast configuration
   * @returns {string} Toast ID
   */
  addToast(toast) {
    const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const newToast = {
      id,
      message: toast.message,
      type: toast.type || 'info',
      duration: toast.duration !== undefined ? toast.duration : 3000,
      position: toast.position || this.defaultPosition,
      showProgress: toast.showProgress !== undefined ? toast.showProgress : true,
      action: toast.action,
      createdAt: Date.now()
    };
    
    // Add to toasts array
    this.toasts = [newToast, ...this.toasts].slice(0, this.maxToasts);
    
    // Notify listeners
    this.notifyListeners();
    
    return id;
  }
  
  /**
   * Remove a toast notification
   * @param {string} id - Toast ID
   */
  removeToast(id) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notifyListeners();
  }
  
  /**
   * Add a listener for toast changes
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
  }
  
  /**
   * Remove a listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }
  
  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.toasts));
  }
  
  /**
   * Show an info toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   * @returns {string} Toast ID
   */
  info(message, options = {}) {
    return this.addToast({
      message,
      type: 'info',
      ...options
    });
  }
  
  /**
   * Show a success toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   * @returns {string} Toast ID
   */
  success(message, options = {}) {
    return this.addToast({
      message,
      type: 'success',
      ...options
    });
  }
  
  /**
   * Show a warning toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   * @returns {string} Toast ID
   */
  warning(message, options = {}) {
    return this.addToast({
      message,
      type: 'warning',
      ...options
    });
  }
  
  /**
   * Show an error toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   * @returns {string} Toast ID
   */
  error(message, options = {}) {
    return this.addToast({
      message,
      type: 'error',
      duration: options.duration || 5000, // Longer duration for errors
      ...options
    });
  }
}

// Create singleton instance
const toastManager = new ToastManager();

/**
 * ToastContainer - Component to render all toast notifications
 */
export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);
  
  // Update toasts when they change
  useEffect(() => {
    const handleToastsChange = (newToasts) => {
      setToasts([...newToasts]);
    };
    
    // Add listener
    toastManager.addListener(handleToastsChange);
    
    // Initial toasts
    setToasts([...toastManager.toasts]);
    
    // Clean up
    return () => {
      toastManager.removeListener(handleToastsChange);
    };
  }, []);
  
  // Group toasts by position
  const groupedToasts = toasts.reduce((acc, toast) => {
    const position = toast.position || 'bottom-right';
    
    if (!acc[position]) {
      acc[position] = [];
    }
    
    acc[position].push(toast);
    return acc;
  }, {});
  
  // Render toasts
  return ReactDOM.createPortal(
    <>
      {Object.entries(groupedToasts).map(([position, positionToasts]) => (
        <div key={position} className={`toast-group ${position}`}>
          {positionToasts.map(toast => (
            <ToastNotification
              key={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              position={position}
              showProgress={toast.showProgress}
              action={toast.action}
              onClose={() => toastManager.removeToast(toast.id)}
            />
          ))}
        </div>
      ))}
      
      <style jsx global>{`
        .toast-group {
          position: fixed;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .toast-group.top-left {
          top: 20px;
          left: 20px;
        }
        
        .toast-group.top-center {
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .toast-group.top-right {
          top: 20px;
          right: 20px;
        }
        
        .toast-group.bottom-left {
          bottom: 20px;
          left: 20px;
        }
        
        .toast-group.bottom-center {
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
        }
        
        .toast-group.bottom-right {
          bottom: 20px;
          right: 20px;
        }
      `}</style>
    </>,
    document.getElementById(toastManager.containerId)
  );
};

export default toastManager;
