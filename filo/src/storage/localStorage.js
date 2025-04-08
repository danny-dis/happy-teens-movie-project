/**
 * Local-First Storage System
 * 
 * Provides persistent storage for the application with:
 * - IndexedDB for content and metadata storage
 * - Efficient search indexing
 * - Automatic sync with network when online
 * 
 * @author zophlic
 */

import { openDB } from 'idb';
import { createHash } from '../crypto/hash';

export class LocalStorage {
  constructor(namespace = 'filo') {
    this.namespace = namespace;
    this.db = null;
    this.initialized = false;
  }
  
  /**
   * Initialize the storage system
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      this.db = await openDB(`filo-${this.namespace}`, 1, {
        upgrade(db) {
          // Create object stores
          if (!db.objectStoreNames.contains('keyval')) {
            db.createObjectStore('keyval');
          }
          
          if (!db.objectStoreNames.contains('content')) {
            const contentStore = db.createObjectStore('content', { keyPath: 'id' });
            contentStore.createIndex('type', 'metadata.type');
            contentStore.createIndex('added', 'added');
          }
          
          if (!db.objectStoreNames.contains('searchIndex')) {
            const searchStore = db.createObjectStore('searchIndex', { keyPath: 'id' });
            searchStore.createIndex('term', 'term');
            searchStore.createIndex('contentId', 'contentId');
          }
          
          if (!db.objectStoreNames.contains('playHistory')) {
            const historyStore = db.createObjectStore('playHistory', { keyPath: 'id' });
            historyStore.createIndex('contentId', 'contentId');
            historyStore.createIndex('timestamp', 'timestamp');
          }
        }
      });
      
      this.initialized = true;
      console.log(`LocalStorage initialized: filo-${this.namespace}`);
    } catch (error) {
      console.error('Failed to initialize local storage:', error);
      throw error;
    }
  }
  
  /**
   * Store a key-value pair
   * @param {string} key - Key to store
   * @param {*} value - Value to store
   * @returns {Promise<void>}
   */
  async set(key, value) {
    if (!this.initialized) await this.initialize();
    
    await this.db.put('keyval', value, key);
  }
  
  /**
   * Get a value by key
   * @param {string} key - Key to retrieve
   * @returns {Promise<*>} Retrieved value
   */
  async get(key) {
    if (!this.initialized) await this.initialize();
    
    return this.db.get('keyval', key);
  }
  
  /**
   * Delete a key-value pair
   * @param {string} key - Key to delete
   * @returns {Promise<void>}
   */
  async delete(key) {
    if (!this.initialized) await this.initialize();
    
    await this.db.delete('keyval', key);
  }
  
  /**
   * Store content in local storage
   * @param {File|Blob} file - Content file
   * @param {Object} metadata - Content metadata
   * @returns {Promise<Object>} Stored content info
   */
  async storeContent(file, metadata) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Generate content ID from file hash if not provided
      const contentId = metadata.id || await createHash(file);
      
      // Create content record
      const contentRecord = {
        id: contentId,
        file,
        metadata,
        added: Date.now(),
        size: file.size,
        type: file.type
      };
      
      // Store content
      await this.db.put('content', contentRecord);
      
      // Index for search
      await this._indexContentForSearch(contentId, metadata);
      
      console.log(`Content stored locally: ${contentId}`);
      return contentRecord;
    } catch (error) {
      console.error('Failed to store content:', error);
      throw error;
    }
  }
  
  /**
   * Get content by ID
   * @param {string} contentId - Content ID
   * @returns {Promise<Object>} Content record
   */
  async getContent(contentId) {
    if (!this.initialized) await this.initialize();
    
    return this.db.get('content', contentId);
  }
  
  /**
   * Get all locally stored content
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Content records
   */
  async getLocalContent(options = {}) {
    if (!this.initialized) await this.initialize();
    
    const { type, limit, sortBy = 'added', sortDir = 'desc' } = options;
    
    // Get all content
    let content = await this.db.getAll('content');
    
    // Filter by type if specified
    if (type) {
      content = content.filter(item => 
        item.metadata.type === type || item.type === type
      );
    }
    
    // Sort content
    content.sort((a, b) => {
      const aValue = sortBy === 'added' ? a.added : a.metadata[sortBy];
      const bValue = sortBy === 'added' ? b.added : b.metadata[sortBy];
      
      if (sortDir === 'desc') {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
    
    // Apply limit if specified
    if (limit && limit > 0) {
      content = content.slice(0, limit);
    }
    
    return content;
  }
  
  /**
   * Delete content by ID
   * @param {string} contentId - Content ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteContent(contentId) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Delete content
      await this.db.delete('content', contentId);
      
      // Delete search index entries
      const searchEntries = await this.db.getAllFromIndex('searchIndex', 'contentId', contentId);
      for (const entry of searchEntries) {
        await this.db.delete('searchIndex', entry.id);
      }
      
      console.log(`Content deleted: ${contentId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete content:', error);
      return false;
    }
  }
  
  /**
   * Search local content
   * @param {string} query - Search query
   * @returns {Promise<Array>} Search results
   */
  async searchContent(query) {
    if (!this.initialized) await this.initialize();
    
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    
    if (terms.length === 0) {
      return [];
    }
    
    try {
      // Get matching search index entries for each term
      const termResults = await Promise.all(
        terms.map(async term => {
          const entries = await this.db.getAllFromIndex('searchIndex', 'term', term);
          return entries;
        })
      );
      
      // Flatten and group by content ID
      const contentScores = new Map();
      
      termResults.flat().forEach(entry => {
        const { contentId, relevance } = entry;
        
        if (!contentScores.has(contentId)) {
          contentScores.set(contentId, { score: 0, matches: 0 });
        }
        
        const contentScore = contentScores.get(contentId);
        contentScore.score += relevance;
        contentScore.matches += 1;
      });
      
      // Sort by score and number of matching terms
      const sortedContentIds = Array.from(contentScores.entries())
        .sort(([, a], [, b]) => {
          // More matching terms is better
          if (a.matches !== b.matches) {
            return b.matches - a.matches;
          }
          // Higher relevance is better
          return b.score - a.score;
        })
        .map(([contentId]) => contentId);
      
      // Get content records
      const results = await Promise.all(
        sortedContentIds.map(async contentId => {
          const content = await this.getContent(contentId);
          if (content) {
            return {
              ...content,
              isLocal: true,
              relevance: contentScores.get(contentId).score,
              matches: contentScores.get(contentId).matches
            };
          }
          return null;
        })
      );
      
      return results.filter(Boolean);
    } catch (error) {
      console.error('Local search failed:', error);
      return [];
    }
  }
  
  /**
   * Record content play
   * @param {string} contentId - Content ID
   * @returns {Promise<Object>} Play record
   */
  async recordContentPlay(contentId) {
    if (!this.initialized) await this.initialize();
    
    try {
      const timestamp = Date.now();
      const playRecord = {
        id: `${contentId}-${timestamp}`,
        contentId,
        timestamp,
        position: 0
      };
      
      await this.db.put('playHistory', playRecord);
      
      return playRecord;
    } catch (error) {
      console.error('Failed to record content play:', error);
      throw error;
    }
  }
  
  /**
   * Update play position
   * @param {string} contentId - Content ID
   * @param {number} position - Playback position in seconds
   * @returns {Promise<Object>} Updated play record
   */
  async updatePlayPosition(contentId, position) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Get most recent play record
      const playRecords = await this.db.getAllFromIndex('playHistory', 'contentId', contentId);
      
      if (playRecords.length === 0) {
        // Create new play record
        return this.recordContentPlay(contentId);
      }
      
      // Sort by timestamp (descending)
      playRecords.sort((a, b) => b.timestamp - a.timestamp);
      
      const latestRecord = playRecords[0];
      latestRecord.position = position;
      latestRecord.updated = Date.now();
      
      await this.db.put('playHistory', latestRecord);
      
      return latestRecord;
    } catch (error) {
      console.error('Failed to update play position:', error);
      throw error;
    }
  }
  
  /**
   * Get play history
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Play history
   */
  async getPlayHistory(options = {}) {
    if (!this.initialized) await this.initialize();
    
    const { limit = 20, contentId } = options;
    
    try {
      let playRecords;
      
      if (contentId) {
        // Get play records for specific content
        playRecords = await this.db.getAllFromIndex('playHistory', 'contentId', contentId);
      } else {
        // Get all play records
        playRecords = await this.db.getAllFromIndex('playHistory', 'timestamp');
      }
      
      // Sort by timestamp (descending)
      playRecords.sort((a, b) => b.timestamp - a.timestamp);
      
      // Apply limit
      if (limit > 0) {
        playRecords = playRecords.slice(0, limit);
      }
      
      // Get content details for each record
      const historyWithContent = await Promise.all(
        playRecords.map(async record => {
          const content = await this.getContent(record.contentId);
          return {
            ...record,
            content: content || { id: record.contentId }
          };
        })
      );
      
      return historyWithContent;
    } catch (error) {
      console.error('Failed to get play history:', error);
      return [];
    }
  }
  
  /**
   * Index content for search
   * @private
   * @param {string} contentId - Content ID
   * @param {Object} metadata - Content metadata
   * @returns {Promise<void>}
   */
  async _indexContentForSearch(contentId, metadata) {
    // Extract searchable terms with relevance scores
    const terms = this._extractSearchTerms(metadata);
    
    // Store each term in the search index
    for (const [term, relevance] of terms) {
      const indexEntry = {
        id: `${contentId}-${term}`,
        contentId,
        term,
        relevance
      };
      
      await this.db.put('searchIndex', indexEntry);
    }
  }
  
  /**
   * Extract searchable terms from metadata
   * @private
   * @param {Object} metadata - Content metadata
   * @returns {Map<string, number>} Map of terms to relevance scores
   */
  _extractSearchTerms(metadata) {
    const terms = new Map();
    
    // Process title (high relevance)
    if (metadata.title) {
      const titleTerms = metadata.title.toLowerCase().split(/\W+/).filter(Boolean);
      for (const term of titleTerms) {
        terms.set(term, (terms.get(term) || 0) + 10);
      }
    }
    
    // Process description (medium relevance)
    if (metadata.description) {
      const descTerms = metadata.description.toLowerCase().split(/\W+/).filter(Boolean);
      for (const term of descTerms) {
        terms.set(term, (terms.get(term) || 0) + 5);
      }
    }
    
    // Process tags (high relevance)
    if (metadata.tags && Array.isArray(metadata.tags)) {
      for (const tag of metadata.tags) {
        const tagTerms = tag.toLowerCase().split(/\W+/).filter(Boolean);
        for (const term of tagTerms) {
          terms.set(term, (terms.get(term) || 0) + 8);
        }
      }
    }
    
    // Process other fields
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string' && !['title', 'description'].includes(key)) {
        const fieldTerms = value.toLowerCase().split(/\W+/).filter(Boolean);
        for (const term of fieldTerms) {
          terms.set(term, (terms.get(term) || 0) + 3);
        }
      }
    }
    
    return terms;
  }
}
