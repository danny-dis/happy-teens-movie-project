/**
 * Toast Store for Movo
 * Provides a Zustand store for toast notifications
 * 
 * @author zophlic
 */

import { createStoreWithSelectors } from '../hooks/useStore';
import { v4 as uuidv4 } from 'uuid';

// Create toast store
const toastStore = createStoreWithSelectors(
  (set, get) => ({
    // State
    toasts: [],
    
    // Actions
    addToast: (toast) => {
      const id = toast.id || uuidv4();
      
      set(state => ({
        toasts: [
          ...state.toasts,
          {
            id,
            type: toast.type || 'info',
            title: toast.title,
            message: toast.message,
            duration: toast.duration !== undefined ? toast.duration : 5000,
            action: toast.action,
            createdAt: Date.now()
          }
        ]
      }));
      
      return id;
    },
    
    removeToast: (id) => {
      set(state => ({
        toasts: state.toasts.filter(toast => toast.id !== id)
      }));
    },
    
    clearToasts: () => {
      set({ toasts: [] });
    },
    
    // Convenience methods
    showInfo: (title, message, options = {}) => {
      return get().addToast({
        type: 'info',
        title,
        message,
        ...options
      });
    },
    
    showSuccess: (title, message, options = {}) => {
      return get().addToast({
        type: 'success',
        title,
        message,
        ...options
      });
    },
    
    showWarning: (title, message, options = {}) => {
      return get().addToast({
        type: 'warning',
        title,
        message,
        ...options
      });
    },
    
    showError: (title, message, options = {}) => {
      return get().addToast({
        type: 'error',
        title,
        message,
        ...options
      });
    }
  }),
  
  // Selectors
  {
    toasts: (state) => state.toasts
  },
  
  // Options
  {
    persist: false,
    name: 'toast'
  }
);

export const {
  useStore,
  useToasts
} = toastStore;

export default toastStore;
