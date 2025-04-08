/**
 * Reactive State Manager
 * 
 * Provides a simple reactive state management system:
 * - State updates with subscriptions
 * - Immutable state updates
 * - Selective update notifications
 * 
 * @author zophlic
 */

export class ReactiveState {
  constructor() {
    this.state = {};
    this.subscribers = [];
    this.initialized = false;
  }
  
  /**
   * Initialize state with initial values
   * @param {Object} initialState - Initial state values
   */
  initialize(initialState) {
    this.state = { ...initialState };
    this.initialized = true;
    this._notifySubscribers(this.state);
  }
  
  /**
   * Update state with new values
   * @param {Object} updates - State updates
   */
  update(updates) {
    // Create new state with updates
    this.state = {
      ...this.state,
      ...updates
    };
    
    // Notify subscribers
    this._notifySubscribers(updates);
  }
  
  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }
  
  /**
   * Subscribe to state changes
   * @param {Function} callback - Subscriber callback
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    
    // Immediately notify with current state if initialized
    if (this.initialized) {
      callback(this.state);
    }
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index !== -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }
  
  /**
   * Notify subscribers of state changes
   * @private
   * @param {Object} updates - State updates
   */
  _notifySubscribers(updates) {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(this.state, updates);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    }
  }
}
