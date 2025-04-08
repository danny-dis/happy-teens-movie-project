/**
 * Filo - Fully decentralized streaming platform
 * 
 * Core principles:
 * 1. No central servers - all functionality is P2P
 * 2. Local-first data storage with network sync
 * 3. Cryptographic identity and content verification
 * 4. Multi-protocol content distribution
 * 5. Incentivized participation
 * 
 * @author zophlic
 */

import { DecentralizedIdentity } from './identity';
import { DistributedContentIndex } from './contentIndex';
import { LocalFirstStorage } from '../storage/localStorage';
import { P2PNetwork } from '../network/p2pNetwork';
import { ContentDistribution } from '../protocols/contentDistribution';
import { ContentDiscovery } from '../protocols/contentDiscovery';
import { SecurityManager } from '../crypto/securityManager';
import { TokenSystem } from '../protocols/tokenSystem';
import { CommunityModeration } from '../protocols/communityModeration';
import { ReactiveState } from './reactiveState';

export class FiloApp {
  constructor() {
    // Core systems
    this.identity = new DecentralizedIdentity();
    this.contentIndex = new DistributedContentIndex();
    this.storage = new LocalFirstStorage();
    this.network = new P2PNetwork();
    
    // Feature modules
    this.contentSharing = new ContentDistribution(this.network);
    this.discovery = new ContentDiscovery(this.contentIndex);
    this.security = new SecurityManager(this.identity);
    this.incentives = new TokenSystem(this.identity);
    this.moderation = new CommunityModeration(this.identity);
    
    // UI state
    this.uiState = new ReactiveState();
    
    // App state
    this.initialized = false;
  }
  
  /**
   * Initialize the Filo application
   * Sets up all core systems and connects to the P2P network
   */
  async initialize() {
    if (this.initialized) return;
    
    console.log('Initializing Filo application...');
    
    try {
      // Load or create user identity
      await this.identity.initialize();
      console.log('Identity initialized:', this.identity.getUserProfile().username);
      
      // Initialize local storage
      await this.storage.initialize();
      console.log('Local storage initialized');
      
      // Initialize content index
      await this.contentIndex.initialize();
      console.log('Content index initialized');
      
      // Connect to P2P network
      await this.network.initialize();
      console.log('P2P network initialized');
      
      // Initialize feature modules
      await this.contentSharing.initialize();
      await this.discovery.initialize();
      await this.security.initialize();
      await this.incentives.initialize();
      await this.moderation.initialize();
      
      // Sync with network if online
      if (navigator.onLine) {
        this.syncWithNetwork();
      }
      
      // Set up network status listeners
      window.addEventListener('online', () => this.syncWithNetwork());
      window.addEventListener('offline', () => this.handleOffline());
      
      // Initialize UI state
      this.uiState.initialize({
        currentUser: this.identity.getUserProfile(),
        isOnline: navigator.onLine,
        contentLibrary: await this.storage.getLocalContent(),
        networkStats: this.network.getStats()
      });
      
      this.initialized = true;
      console.log('Filo application initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Filo application:', error);
      throw error;
    }
  }
  
  /**
   * Synchronize with the P2P network
   * Announces presence and syncs content index
   */
  async syncWithNetwork() {
    if (!this.initialized) return;
    
    console.log('Syncing with P2P network...');
    
    try {
      // Announce presence to network
      await this.network.announce(this.identity.getPublicKey());
      
      // Sync content index
      await this.contentIndex.sync();
      
      // Update UI state
      this.uiState.update({
        isOnline: true,
        networkStats: this.network.getStats()
      });
      
      console.log('Network sync complete');
    } catch (error) {
      console.error('Network sync failed:', error);
    }
  }
  
  /**
   * Handle offline mode
   */
  handleOffline() {
    console.log('Switched to offline mode');
    
    // Update UI state
    this.uiState.update({
      isOnline: false
    });
  }
  
  /**
   * Search for content across the network and local storage
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Search results
   */
  async searchContent(query) {
    if (!this.initialized) await this.initialize();
    
    console.log('Searching for content:', query);
    
    // Search local content first (always works, even offline)
    const localResults = await this.storage.searchContent(query);
    
    // If offline, return only local results
    if (!navigator.onLine) {
      console.log('Offline search, returning local results only');
      return localResults;
    }
    
    // Search network content
    const networkResults = await this.contentIndex.searchContent(query);
    
    // Merge results, prioritizing local content
    const mergedResults = this._mergeSearchResults(localResults, networkResults);
    
    console.log(`Search complete, found ${mergedResults.length} results`);
    return mergedResults;
  }
  
  /**
   * Share content with the network
   * @param {File} file - File to share
   * @param {Object} metadata - Content metadata
   * @returns {Promise<Object>} - Shared content info
   */
  async shareContent(file, metadata) {
    if (!this.initialized) await this.initialize();
    
    console.log('Sharing content:', metadata.title || file.name);
    
    try {
      // Add security metadata
      const secureMetadata = await this.security.signMetadata({
        ...metadata,
        publisher: this.identity.getPublicKey(),
        publishedAt: Date.now()
      });
      
      // Store locally first
      const localContent = await this.storage.storeContent(file, secureMetadata);
      
      // Share with network if online
      if (navigator.onLine) {
        const sharedContent = await this.contentSharing.shareContent(file, secureMetadata);
        
        // Publish to content index
        await this.contentIndex.publishContent(sharedContent.contentId, secureMetadata);
        
        // Update reputation/tokens for sharing
        await this.incentives.recordContribution('sharing', file.size);
        
        console.log('Content shared successfully:', sharedContent.contentId);
        return sharedContent;
      } else {
        console.log('Content stored locally (offline mode)');
        return localContent;
      }
    } catch (error) {
      console.error('Failed to share content:', error);
      throw error;
    }
  }
  
  /**
   * Play content from the network or local storage
   * @param {string} contentId - Content identifier
   * @returns {Promise<Object>} - Playable content
   */
  async playContent(contentId) {
    if (!this.initialized) await this.initialize();
    
    console.log('Playing content:', contentId);
    
    try {
      // Check if content is available locally
      const localContent = await this.storage.getContent(contentId);
      
      if (localContent) {
        console.log('Playing local content');
        
        // Record play for recommendations
        await this.storage.recordContentPlay(contentId);
        
        return {
          source: 'local',
          content: localContent,
          playbackInfo: {
            type: localContent.type,
            url: URL.createObjectURL(localContent.file),
            metadata: localContent.metadata
          }
        };
      }
      
      // Not available locally, try to stream from network
      if (navigator.onLine) {
        console.log('Streaming content from network');
        
        // Get content info from index
        const contentInfo = await this.contentIndex.findContent(contentId);
        
        if (!contentInfo) {
          throw new Error('Content not found in network');
        }
        
        // Verify content authenticity
        const isVerified = await this.security.verifyMetadata(contentInfo.metadata);
        
        if (!isVerified) {
          throw new Error('Content verification failed');
        }
        
        // Stream from network
        const streamInfo = await this.contentSharing.streamContent(contentId);
        
        // Start downloading for future offline playback
        this.contentSharing.downloadContent(contentId, contentInfo.metadata);
        
        return {
          source: 'network',
          content: contentInfo,
          playbackInfo: {
            type: contentInfo.metadata.type,
            url: streamInfo.url,
            metadata: contentInfo.metadata
          }
        };
      }
      
      throw new Error('Content not available locally and you are offline');
    } catch (error) {
      console.error('Failed to play content:', error);
      throw error;
    }
  }
  
  /**
   * Get user's content library
   * @returns {Promise<Array>} - User's content library
   */
  async getContentLibrary() {
    if (!this.initialized) await this.initialize();
    
    return this.storage.getLocalContent();
  }
  
  /**
   * Get network statistics
   * @returns {Object} - Network statistics
   */
  getNetworkStats() {
    return this.network.getStats();
  }
  
  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} - Updated profile
   */
  async updateUserProfile(updates) {
    if (!this.initialized) await this.initialize();
    
    const updatedProfile = await this.identity.updateProfile(updates);
    
    // Update UI state
    this.uiState.update({
      currentUser: updatedProfile
    });
    
    return updatedProfile;
  }
  
  /**
   * Subscribe to UI state changes
   * @param {Function} callback - State change callback
   * @returns {Function} - Unsubscribe function
   */
  subscribeToState(callback) {
    return this.uiState.subscribe(callback);
  }
  
  /**
   * Merge search results from local and network sources
   * @private
   * @param {Array} localResults - Local search results
   * @param {Array} networkResults - Network search results
   * @returns {Array} - Merged results
   */
  _mergeSearchResults(localResults, networkResults) {
    // Create a map of local content by ID for quick lookup
    const localContentMap = new Map();
    localResults.forEach(item => {
      localContentMap.set(item.id, item);
    });
    
    // Merge results, prioritizing local content
    const mergedResults = [...localResults];
    
    // Add network results that aren't already in local results
    networkResults.forEach(item => {
      if (!localContentMap.has(item.id)) {
        mergedResults.push({
          ...item,
          isLocal: false
        });
      }
    });
    
    // Sort by relevance and recency
    return mergedResults.sort((a, b) => {
      // Local content first
      if (a.isLocal && !b.isLocal) return -1;
      if (!a.isLocal && b.isLocal) return 1;
      
      // Then by relevance if available
      if (a.relevance && b.relevance) {
        return b.relevance - a.relevance;
      }
      
      // Then by recency
      return (b.metadata?.publishedAt || 0) - (a.metadata?.publishedAt || 0);
    });
  }
}
