/**
 * Offline Storage Service for Filo
 * Manages offline caching of media and data using IndexedDB
 * 
 * @author zophlic
 */

// Constants
const DB_NAME = 'filo_offline_storage';
const DB_VERSION = 1;
const STORES = {
  MEDIA: 'media',
  METADATA: 'metadata',
  FILES: 'files',
  SETTINGS: 'settings'
};

/**
 * Offline storage service class
 */
class OfflineStorageService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.initPromise = null;
    this.storageQuota = null;
    this.storageUsage = null;
  }
  
  /**
   * Initialize offline storage
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    // Return existing promise if already initializing
    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }
    
    // Return true if already initialized
    if (this.isInitialized) {
      return true;
    }
    
    this.isInitializing = true;
    
    this.initPromise = new Promise((resolve, reject) => {
      try {
        // Check if IndexedDB is available
        if (!window.indexedDB) {
          throw new Error('IndexedDB not supported');
        }
        
        // Open database
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        
        // Handle database upgrade
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains(STORES.MEDIA)) {
            const mediaStore = db.createObjectStore(STORES.MEDIA, { keyPath: 'id' });
            mediaStore.createIndex('type', 'type', { unique: false });
            mediaStore.createIndex('dateAdded', 'dateAdded', { unique: false });
          }
          
          if (!db.objectStoreNames.contains(STORES.METADATA)) {
            const metadataStore = db.createObjectStore(STORES.METADATA, { keyPath: 'id' });
            metadataStore.createIndex('type', 'type', { unique: false });
          }
          
          if (!db.objectStoreNames.contains(STORES.FILES)) {
            const filesStore = db.createObjectStore(STORES.FILES, { keyPath: 'id' });
            filesStore.createIndex('type', 'type', { unique: false });
            filesStore.createIndex('size', 'size', { unique: false });
          }
          
          if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
            db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
          }
        };
        
        // Handle success
        request.onsuccess = (event) => {
          this.db = event.target.result;
          this.isInitialized = true;
          this.isInitializing = false;
          
          // Check storage quota
          this._checkStorageQuota().then(() => {
            resolve(true);
          }).catch(error => {
            console.warn('Failed to check storage quota', error);
            resolve(true); // Still consider initialization successful
          });
        };
        
        // Handle error
        request.onerror = (event) => {
          console.error('Failed to open IndexedDB', event.target.error);
          this.isInitializing = false;
          reject(new Error('Failed to open IndexedDB: ' + event.target.error.message));
        };
      } catch (error) {
        this.isInitializing = false;
        reject(error);
      }
    });
    
    return this.initPromise;
  }
  
  /**
   * Store media for offline use
   * @param {string} id - Media ID
   * @param {Blob|File} data - Media data
   * @param {Object} metadata - Media metadata
   * @returns {Promise<boolean>} Whether storage was successful
   */
  async storeMedia(id, data, metadata = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Check if we have enough storage space
      if (this.storageQuota && this.storageUsage) {
        const availableSpace = this.storageQuota - this.storageUsage;
        
        if (data.size > availableSpace) {
          throw new Error('Not enough storage space');
        }
      }
      
      // Store media data
      const mediaItem = {
        id,
        data,
        type: data.type,
        size: data.size,
        dateAdded: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      };
      
      await this._putInStore(STORES.MEDIA, mediaItem);
      
      // Store metadata
      const metadataItem = {
        id,
        ...metadata,
        type: metadata.type || 'unknown',
        dateAdded: new Date().toISOString()
      };
      
      await this._putInStore(STORES.METADATA, metadataItem);
      
      // Update storage usage
      await this._checkStorageQuota();
      
      return true;
    } catch (error) {
      console.error('Failed to store media', error);
      throw error;
    }
  }
  
  /**
   * Get media by ID
   * @param {string} id - Media ID
   * @returns {Promise<Object>} Media object with data and metadata
   */
  async getMedia(id) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Get media data
      const mediaItem = await this._getFromStore(STORES.MEDIA, id);
      
      if (!mediaItem) {
        throw new Error(`Media not found: ${id}`);
      }
      
      // Get metadata
      const metadata = await this._getFromStore(STORES.METADATA, id);
      
      // Update last accessed timestamp
      mediaItem.lastAccessed = new Date().toISOString();
      await this._putInStore(STORES.MEDIA, mediaItem);
      
      return {
        ...mediaItem,
        metadata: metadata || {}
      };
    } catch (error) {
      console.error(`Failed to get media ${id}`, error);
      throw error;
    }
  }
  
  /**
   * Delete media by ID
   * @param {string} id - Media ID
   * @returns {Promise<boolean>} Whether deletion was successful
   */
  async deleteMedia(id) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Delete media data
      await this._deleteFromStore(STORES.MEDIA, id);
      
      // Delete metadata
      await this._deleteFromStore(STORES.METADATA, id);
      
      // Update storage usage
      await this._checkStorageQuota();
      
      return true;
    } catch (error) {
      console.error(`Failed to delete media ${id}`, error);
      throw error;
    }
  }
  
  /**
   * List all stored media
   * @param {Object} options - List options
   * @returns {Promise<Array>} List of media items
   */
  async listMedia(options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Get all media items
      const mediaItems = await this._getAllFromStore(STORES.MEDIA);
      
      // Get all metadata
      const metadataItems = await this._getAllFromStore(STORES.METADATA);
      
      // Create a map of metadata by ID
      const metadataMap = new Map();
      metadataItems.forEach(item => {
        metadataMap.set(item.id, item);
      });
      
      // Combine media with metadata
      const combinedItems = mediaItems.map(item => ({
        ...item,
        metadata: metadataMap.get(item.id) || {}
      }));
      
      // Apply filters
      let filteredItems = combinedItems;
      
      if (options.type) {
        filteredItems = filteredItems.filter(item => item.type === options.type);
      }
      
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        filteredItems = filteredItems.filter(item => 
          item.id.toLowerCase().includes(searchLower) || 
          (item.metadata.title && item.metadata.title.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply sorting
      if (options.sortBy) {
        const sortField = options.sortBy;
        const sortDirection = options.sortDirection === 'desc' ? -1 : 1;
        
        filteredItems.sort((a, b) => {
          let valueA, valueB;
          
          if (sortField.startsWith('metadata.')) {
            const metadataField = sortField.substring(9);
            valueA = a.metadata[metadataField];
            valueB = b.metadata[metadataField];
          } else {
            valueA = a[sortField];
            valueB = b[sortField];
          }
          
          if (valueA < valueB) return -1 * sortDirection;
          if (valueA > valueB) return 1 * sortDirection;
          return 0;
        });
      }
      
      // Apply pagination
      if (options.limit) {
        const start = options.offset || 0;
        const end = start + options.limit;
        filteredItems = filteredItems.slice(start, end);
      }
      
      return filteredItems;
    } catch (error) {
      console.error('Failed to list media', error);
      throw error;
    }
  }
  
  /**
   * Store a file
   * @param {string} id - File ID
   * @param {Blob|File} data - File data
   * @param {Object} metadata - File metadata
   * @returns {Promise<boolean>} Whether storage was successful
   */
  async storeFile(id, data, metadata = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Check if we have enough storage space
      if (this.storageQuota && this.storageUsage) {
        const availableSpace = this.storageQuota - this.storageUsage;
        
        if (data.size > availableSpace) {
          throw new Error('Not enough storage space');
        }
      }
      
      // Store file data
      const fileItem = {
        id,
        data,
        type: data.type,
        size: data.size,
        name: metadata.name || id,
        dateAdded: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      };
      
      await this._putInStore(STORES.FILES, fileItem);
      
      // Update storage usage
      await this._checkStorageQuota();
      
      return true;
    } catch (error) {
      console.error('Failed to store file', error);
      throw error;
    }
  }
  
  /**
   * Get file by ID
   * @param {string} id - File ID
   * @returns {Promise<Object>} File object
   */
  async getFile(id) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Get file data
      const fileItem = await this._getFromStore(STORES.FILES, id);
      
      if (!fileItem) {
        throw new Error(`File not found: ${id}`);
      }
      
      // Update last accessed timestamp
      fileItem.lastAccessed = new Date().toISOString();
      await this._putInStore(STORES.FILES, fileItem);
      
      return fileItem;
    } catch (error) {
      console.error(`Failed to get file ${id}`, error);
      throw error;
    }
  }
  
  /**
   * Delete file by ID
   * @param {string} id - File ID
   * @returns {Promise<boolean>} Whether deletion was successful
   */
  async deleteFile(id) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Delete file data
      await this._deleteFromStore(STORES.FILES, id);
      
      // Update storage usage
      await this._checkStorageQuota();
      
      return true;
    } catch (error) {
      console.error(`Failed to delete file ${id}`, error);
      throw error;
    }
  }
  
  /**
   * Get storage usage information
   * @returns {Promise<Object>} Storage usage information
   */
  async getStorageInfo() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      await this._checkStorageQuota();
      
      return {
        usage: this.storageUsage,
        quota: this.storageQuota,
        available: this.storageQuota ? this.storageQuota - this.storageUsage : null,
        percentUsed: this.storageQuota ? (this.storageUsage / this.storageQuota) * 100 : null
      };
    } catch (error) {
      console.error('Failed to get storage info', error);
      throw error;
    }
  }
  
  /**
   * Clear all stored data
   * @returns {Promise<boolean>} Whether clear was successful
   */
  async clearAll() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Clear all stores
      await this._clearStore(STORES.MEDIA);
      await this._clearStore(STORES.METADATA);
      await this._clearStore(STORES.FILES);
      
      // Update storage usage
      await this._checkStorageQuota();
      
      return true;
    } catch (error) {
      console.error('Failed to clear all data', error);
      throw error;
    }
  }
  
  /**
   * Check storage quota
   * @private
   * @returns {Promise<void>}
   */
  async _checkStorageQuota() {
    try {
      // Check if StorageManager API is available
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        this.storageQuota = estimate.quota;
        this.storageUsage = estimate.usage;
      }
    } catch (error) {
      console.warn('Failed to check storage quota', error);
    }
  }
  
  /**
   * Put an item in a store
   * @private
   * @param {string} storeName - Store name
   * @param {Object} item - Item to store
   * @returns {Promise<void>}
   */
  _putInStore(storeName, item) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(item);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Get an item from a store
   * @private
   * @param {string} storeName - Store name
   * @param {string} key - Item key
   * @returns {Promise<Object>} Item
   */
  _getFromStore(storeName, key) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Get all items from a store
   * @private
   * @param {string} storeName - Store name
   * @returns {Promise<Array>} Items
   */
  _getAllFromStore(storeName) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Delete an item from a store
   * @private
   * @param {string} storeName - Store name
   * @param {string} key - Item key
   * @returns {Promise<void>}
   */
  _deleteFromStore(storeName, key) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * Clear a store
   * @private
   * @param {string} storeName - Store name
   * @returns {Promise<void>}
   */
  _clearStore(storeName) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Create singleton instance
const offlineStorageService = new OfflineStorageService();

export default offlineStorageService;
