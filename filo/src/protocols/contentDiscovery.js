/**
 * Content Discovery Protocol
 * 
 * Provides mechanisms for discovering content across the network:
 * - Content search and discovery
 * - Recommendation engine
 * - Content popularity tracking
 * 
 * @author zophlic
 */

export class ContentDiscovery {
  constructor(contentIndex) {
    this.contentIndex = contentIndex;
    this.popularContent = new Map();
    this.recentContent = [];
    this.contentCategories = new Map();
    this.searchHistory = [];
    this.initialized = false;
  }
  
  /**
   * Initialize the content discovery system
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Ensure content index is initialized
      if (!this.contentIndex.initialized) {
        await this.contentIndex.initialize();
      }
      
      this.initialized = true;
      console.log('Content discovery system initialized');
      
      // Start periodic updates
      this._startPeriodicUpdates();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize content discovery:', error);
      return false;
    }
  }
  
  /**
   * Search for content
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchContent(query, options = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      console.log('Searching for content:', query);
      
      // Record search in history
      this._recordSearch(query);
      
      // Search content index
      const results = await this.contentIndex.searchContent(query);
      
      // Apply filters if specified
      let filteredResults = results;
      
      if (options.category) {
        filteredResults = filteredResults.filter(item => 
          item.metadata.category === options.category
        );
      }
      
      if (options.minRating) {
        filteredResults = filteredResults.filter(item => 
          (item.metadata.rating || 0) >= options.minRating
        );
      }
      
      if (options.publisher) {
        filteredResults = filteredResults.filter(item => 
          item.metadata.publisher === options.publisher
        );
      }
      
      // Sort results
      if (options.sortBy) {
        filteredResults.sort((a, b) => {
          const aValue = a.metadata[options.sortBy] || 0;
          const bValue = b.metadata[options.sortBy] || 0;
          
          return options.sortDir === 'asc' ? aValue - bValue : bValue - aValue;
        });
      }
      
      // Apply limit
      if (options.limit && options.limit > 0) {
        filteredResults = filteredResults.slice(0, options.limit);
      }
      
      return filteredResults;
    } catch (error) {
      console.error('Content search failed:', error);
      return [];
    }
  }
  
  /**
   * Get popular content
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Popular content
   */
  async getPopularContent(options = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Sort popular content by popularity score
      const sortedContent = Array.from(this.popularContent.entries())
        .sort((a, b) => b[1].score - a[1].score)
        .map(([contentId, popularity]) => ({
          contentId,
          ...popularity
        }));
      
      // Apply category filter if specified
      let filteredContent = sortedContent;
      if (options.category) {
        filteredContent = filteredContent.filter(item => 
          item.metadata && item.metadata.category === options.category
        );
      }
      
      // Apply limit
      if (options.limit && options.limit > 0) {
        filteredContent = filteredContent.slice(0, options.limit);
      }
      
      // Get full content details
      const popularContent = await Promise.all(
        filteredContent.map(async item => {
          const content = await this.contentIndex.findContent(item.contentId);
          return {
            ...content,
            popularity: item.score
          };
        })
      );
      
      return popularContent.filter(Boolean);
    } catch (error) {
      console.error('Failed to get popular content:', error);
      return [];
    }
  }
  
  /**
   * Get recent content
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Recent content
   */
  async getRecentContent(options = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Apply category filter if specified
      let filteredContent = this.recentContent;
      if (options.category) {
        filteredContent = filteredContent.filter(item => 
          item.metadata && item.metadata.category === options.category
        );
      }
      
      // Apply limit
      if (options.limit && options.limit > 0) {
        filteredContent = filteredContent.slice(0, options.limit);
      }
      
      return filteredContent;
    } catch (error) {
      console.error('Failed to get recent content:', error);
      return [];
    }
  }
  
  /**
   * Get content by category
   * @param {string} category - Content category
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Categorized content
   */
  async getContentByCategory(category, options = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Get category content
      const categoryContent = this.contentCategories.get(category) || [];
      
      // Sort by specified field
      let sortedContent = [...categoryContent];
      if (options.sortBy) {
        sortedContent.sort((a, b) => {
          const aValue = a.metadata[options.sortBy] || 0;
          const bValue = b.metadata[options.sortBy] || 0;
          
          return options.sortDir === 'asc' ? aValue - bValue : bValue - aValue;
        });
      }
      
      // Apply limit
      if (options.limit && options.limit > 0) {
        sortedContent = sortedContent.slice(0, options.limit);
      }
      
      return sortedContent;
    } catch (error) {
      console.error(`Failed to get content for category ${category}:`, error);
      return [];
    }
  }
  
  /**
   * Get personalized recommendations
   * @param {Object} options - Recommendation options
   * @returns {Promise<Array>} Recommended content
   */
  async getRecommendations(options = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // In a real implementation, this would use a sophisticated recommendation algorithm
      // For now, we'll use a simple approach based on popular content and search history
      
      // Get popular content
      const popularContent = await this.getPopularContent({ limit: 20 });
      
      // Get content based on recent searches
      const searchTerms = this.searchHistory
        .slice(0, 5)
        .map(search => search.query);
      
      const searchBasedContent = [];
      for (const term of searchTerms) {
        const results = await this.searchContent(term, { limit: 5 });
        searchBasedContent.push(...results);
      }
      
      // Combine and deduplicate
      const allRecommendations = [...popularContent, ...searchBasedContent];
      const deduplicated = [];
      const contentIds = new Set();
      
      for (const item of allRecommendations) {
        if (!contentIds.has(item.id)) {
          contentIds.add(item.id);
          deduplicated.push(item);
        }
      }
      
      // Apply limit
      if (options.limit && options.limit > 0) {
        return deduplicated.slice(0, options.limit);
      }
      
      return deduplicated;
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }
  
  /**
   * Record content interaction
   * @param {string} contentId - Content identifier
   * @param {string} interactionType - Type of interaction
   * @param {Object} details - Interaction details
   * @returns {Promise<boolean>} Success status
   */
  async recordInteraction(contentId, interactionType, details = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Get content
      const content = await this.contentIndex.findContent(contentId);
      
      if (!content) {
        return false;
      }
      
      // Update popularity score
      if (!this.popularContent.has(contentId)) {
        this.popularContent.set(contentId, {
          contentId,
          metadata: content.metadata,
          score: 0,
          interactions: {}
        });
      }
      
      const popularity = this.popularContent.get(contentId);
      
      // Update interaction count
      if (!popularity.interactions[interactionType]) {
        popularity.interactions[interactionType] = 0;
      }
      popularity.interactions[interactionType]++;
      
      // Update score based on interaction type
      switch (interactionType) {
        case 'view':
          popularity.score += 1;
          break;
        case 'download':
          popularity.score += 3;
          break;
        case 'share':
          popularity.score += 5;
          break;
        case 'like':
          popularity.score += 2;
          break;
        default:
          popularity.score += 0.5;
      }
      
      // Update last interaction
      popularity.lastInteraction = Date.now();
      
      return true;
    } catch (error) {
      console.error('Failed to record interaction:', error);
      return false;
    }
  }
  
  /**
   * Get available categories
   * @returns {Array} Available categories
   */
  getCategories() {
    return Array.from(this.contentCategories.keys());
  }
  
  /**
   * Start periodic updates
   * @private
   */
  _startPeriodicUpdates() {
    // Update recent content every 5 minutes
    setInterval(() => this._updateRecentContent(), 5 * 60 * 1000);
    
    // Update categories every 10 minutes
    setInterval(() => this._updateCategories(), 10 * 60 * 1000);
    
    // Decay popularity scores every hour
    setInterval(() => this._decayPopularityScores(), 60 * 60 * 1000);
    
    // Initial updates
    this._updateRecentContent();
    this._updateCategories();
  }
  
  /**
   * Update recent content
   * @private
   */
  async _updateRecentContent() {
    try {
      // In a real implementation, this would query the DHT or other discovery mechanism
      // For now, we'll use the content index
      const recentContent = await this.contentIndex.getRecentContent(20);
      this.recentContent = recentContent;
    } catch (error) {
      console.error('Failed to update recent content:', error);
    }
  }
  
  /**
   * Update content categories
   * @private
   */
  async _updateCategories() {
    try {
      // Get all content
      const allContent = await this.contentIndex.getAllContent();
      
      // Group by category
      this.contentCategories.clear();
      
      for (const content of allContent) {
        if (content.metadata && content.metadata.category) {
          const category = content.metadata.category;
          
          if (!this.contentCategories.has(category)) {
            this.contentCategories.set(category, []);
          }
          
          this.contentCategories.get(category).push(content);
        }
      }
    } catch (error) {
      console.error('Failed to update categories:', error);
    }
  }
  
  /**
   * Decay popularity scores
   * @private
   */
  _decayPopularityScores() {
    // Apply decay factor to all popularity scores
    for (const [contentId, popularity] of this.popularContent.entries()) {
      // 5% decay per hour
      popularity.score *= 0.95;
      
      // Remove if score is too low
      if (popularity.score < 0.1) {
        this.popularContent.delete(contentId);
      }
    }
  }
  
  /**
   * Record search in history
   * @private
   * @param {string} query - Search query
   */
  _recordSearch(query) {
    // Add to search history
    this.searchHistory.unshift({
      query,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this.searchHistory.length > 50) {
      this.searchHistory.pop();
    }
  }
}
