/**
 * Store Hook for Movo
 * Provides a React hook for using Zustand stores
 * 
 * @author zophlic
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import loggingService from '../../infrastructure/logging/LoggingService';

/**
 * Create a store with middleware
 * @param {Function} initializer - Store initializer
 * @param {Object} options - Store options
 * @param {boolean} options.persist - Whether to persist store
 * @param {string} options.name - Store name
 * @param {boolean} options.immer - Whether to use immer
 * @returns {Function} Store hook
 */
export function createStore(initializer, options = {}) {
  try {
    const { 
      persist: shouldPersist = false, 
      name = 'store', 
      immerEnabled = true 
    } = options;
    
    // Create store with middleware
    let storeCreator = initializer;
    
    // Add immer middleware
    if (immerEnabled) {
      storeCreator = immer(storeCreator);
    }
    
    // Add persist middleware
    if (shouldPersist) {
      storeCreator = persist(storeCreator, {
        name: `movo_${name}`,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => {
          // Filter out functions and non-serializable values
          const serializable = {};
          
          for (const key in state) {
            if (
              typeof state[key] !== 'function' && 
              typeof state[key] !== 'symbol' &&
              !(state[key] instanceof Promise)
            ) {
              serializable[key] = state[key];
            }
          }
          
          return serializable;
        }
      });
    }
    
    // Create store
    return create(storeCreator);
  } catch (error) {
    loggingService.error('Failed to create store', { error, options });
    throw error;
  }
}

/**
 * Create a store with selectors
 * @param {Function} initializer - Store initializer
 * @param {Object} selectors - Store selectors
 * @param {Object} options - Store options
 * @returns {Object} Store with selectors
 */
export function createStoreWithSelectors(initializer, selectors = {}, options = {}) {
  const store = createStore(initializer, options);
  const storeWithSelectors = { useStore: store };
  
  // Add selectors
  for (const key in selectors) {
    storeWithSelectors[`use${key.charAt(0).toUpperCase() + key.slice(1)}`] = () => 
      store(selectors[key]);
  }
  
  return storeWithSelectors;
}

export default createStore;
