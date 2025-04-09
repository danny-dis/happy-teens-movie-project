/**
 * Dependency Injection Container for Movo
 * Provides a simple DI container for managing dependencies
 * 
 * @author zophlic
 */

/**
 * Dependency injection container class
 */
export class Container {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
    this.singletons = new Map();
  }
  
  /**
   * Register a service
   * @param {string} name - Service name
   * @param {any} service - Service instance
   */
  register(name, service) {
    this.services.set(name, service);
  }
  
  /**
   * Register a factory function
   * @param {string} name - Factory name
   * @param {Function} factory - Factory function
   */
  registerFactory(name, factory) {
    if (typeof factory !== 'function') {
      throw new Error(`Factory for ${name} must be a function`);
    }
    
    this.factories.set(name, factory);
  }
  
  /**
   * Register a singleton factory
   * @param {string} name - Singleton name
   * @param {Function} factory - Factory function
   */
  registerSingleton(name, factory) {
    if (typeof factory !== 'function') {
      throw new Error(`Factory for ${name} must be a function`);
    }
    
    this.factories.set(name, factory);
    this.singletons.set(name, null);
  }
  
  /**
   * Get a service
   * @param {string} name - Service name
   * @returns {any} Service instance
   */
  get(name) {
    // Check if service exists
    if (this.services.has(name)) {
      return this.services.get(name);
    }
    
    // Check if factory exists
    if (this.factories.has(name)) {
      // Check if singleton
      if (this.singletons.has(name)) {
        // Check if singleton instance exists
        if (this.singletons.get(name) !== null) {
          return this.singletons.get(name);
        }
        
        // Create singleton instance
        const instance = this.factories.get(name)(this);
        this.singletons.set(name, instance);
        return instance;
      }
      
      // Create new instance
      return this.factories.get(name)(this);
    }
    
    throw new Error(`Service not found: ${name}`);
  }
  
  /**
   * Check if a service exists
   * @param {string} name - Service name
   * @returns {boolean} Whether service exists
   */
  has(name) {
    return this.services.has(name) || this.factories.has(name);
  }
  
  /**
   * Remove a service
   * @param {string} name - Service name
   */
  remove(name) {
    this.services.delete(name);
    this.factories.delete(name);
    this.singletons.delete(name);
  }
  
  /**
   * Clear all services
   */
  clear() {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }
}

// Create singleton instance
const container = new Container();

export default container;
