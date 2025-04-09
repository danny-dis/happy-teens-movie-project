/**
 * Toast Hook for Movo
 * Provides a React hook for using toast notifications
 * 
 * @author zophlic
 */

import { useCallback } from 'react';
import toastStore from '../stores/toastStore';

/**
 * Toast hook
 * @returns {Object} Toast hook methods
 */
export function useToast() {
  const {
    addToast,
    removeToast,
    clearToasts,
    showInfo,
    showSuccess,
    showWarning,
    showError
  } = toastStore.getState();
  
  // Show info toast
  const info = useCallback((title, message, options = {}) => {
    return showInfo(title, message, options);
  }, [showInfo]);
  
  // Show success toast
  const success = useCallback((title, message, options = {}) => {
    return showSuccess(title, message, options);
  }, [showSuccess]);
  
  // Show warning toast
  const warning = useCallback((title, message, options = {}) => {
    return showWarning(title, message, options);
  }, [showWarning]);
  
  // Show error toast
  const error = useCallback((title, message, options = {}) => {
    return showError(title, message, options);
  }, [showError]);
  
  // Show toast with custom type
  const show = useCallback((type, title, message, options = {}) => {
    return addToast({
      type,
      title,
      message,
      ...options
    });
  }, [addToast]);
  
  // Remove toast
  const remove = useCallback((id) => {
    removeToast(id);
  }, [removeToast]);
  
  // Clear all toasts
  const clear = useCallback(() => {
    clearToasts();
  }, [clearToasts]);
  
  // Promise toast
  const promise = useCallback((
    promise,
    {
      loading = 'Loading...',
      success = 'Success!',
      error = 'Error!'
    },
    options = {}
  ) => {
    const toastId = showInfo(
      typeof loading === 'string' ? loading : loading.title,
      typeof loading === 'string' ? '' : loading.message,
      { duration: 0, ...options }
    );
    
    promise
      .then((result) => {
        removeToast(toastId);
        showSuccess(
          typeof success === 'string' ? success : success.title,
          typeof success === 'string' ? '' : success.message,
          options
        );
        return result;
      })
      .catch((err) => {
        removeToast(toastId);
        showError(
          typeof error === 'string' ? error : error.title,
          typeof error === 'string' ? err.message : error.message,
          options
        );
        throw err;
      });
    
    return promise;
  }, [showInfo, showSuccess, showError, removeToast]);
  
  return {
    info,
    success,
    warning,
    error,
    show,
    remove,
    clear,
    promise
  };
}

export default useToast;
