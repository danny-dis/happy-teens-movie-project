/**
 * Decentralized Identity Management
 * 
 * Provides self-sovereign identity functionality with no central servers:
 * - Cryptographic key generation and management
 * - Profile creation and verification
 * - Reputation tracking
 * - Contact management
 * 
 * @author zophlic
 */

import { generateKeyPair, sign, verify } from '../crypto/keys';
import { LocalStorage } from '../storage/localStorage';

export class DecentralizedIdentity {
  constructor() {
    this.storage = new LocalStorage('identity');
    this.keyPair = null;
    this.profile = null;
    this.contacts = new Map();
    this.initialized = false;
  }
  
  /**
   * Initialize identity system
   * Loads existing identity or creates a new one
   */
  async initialize() {
    if (this.initialized) return;
    
    // Try to load existing identity
    const savedIdentity = await this.storage.get('keyPair');
    
    if (savedIdentity) {
      console.log('Loading existing identity');
      this.keyPair = savedIdentity;
      this.profile = await this.storage.get('profile');
      
      // Load contacts
      const savedContacts = await this.storage.get('contacts');
      if (savedContacts) {
        this.contacts = new Map(savedContacts);
      }
    } else {
      console.log('Creating new identity');
      // Create new identity
      this.keyPair = await generateKeyPair();
      
      // Generate random avatar color
      const colors = ['red', 'blue', 'green', 'purple', 'orange', 'teal'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      // Create initial profile
      this.profile = {
        publicKey: this.keyPair.publicKey,
        created: Date.now(),
        username: `user-${this.keyPair.publicKey.slice(0, 8)}`,
        avatar: {
          type: 'color',
          value: randomColor
        },
        reputation: 0,
        bio: '',
        preferences: {
          darkMode: true,
          autoDownload: false,
          maxStorageGB: 10,
          maxUploadKBps: 1000,
          maxDownloadKBps: 0 // 0 means unlimited
        }
      };
      
      // Sign the profile
      this.profile.signature = await sign(
        JSON.stringify(this._getSignableProfile(this.profile)),
        this.keyPair.privateKey
      );
      
      // Save new identity
      await this.storage.set('keyPair', this.keyPair);
      await this.storage.set('profile', this.profile);
    }
    
    this.initialized = true;
    return this.profile;
  }
  
  /**
   * Get user's public key
   * @returns {string} Public key
   */
  getPublicKey() {
    return this.keyPair.publicKey;
  }
  
  /**
   * Get user's profile
   * @returns {Object} User profile
   */
  getUserProfile() {
    return { ...this.profile };
  }
  
  /**
   * Update user profile
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(updates) {
    if (!this.initialized) await this.initialize();
    
    // Update profile
    this.profile = {
      ...this.profile,
      ...updates,
      updated: Date.now()
    };
    
    // Sign the profile
    this.profile.signature = await sign(
      JSON.stringify(this._getSignableProfile(this.profile)),
      this.keyPair.privateKey
    );
    
    // Save updated profile
    await this.storage.set('profile', this.profile);
    
    // Announce profile update to network
    await this._announceProfileUpdate();
    
    return { ...this.profile };
  }
  
  /**
   * Verify a profile's signature
   * @param {Object} profile - Profile to verify
   * @returns {Promise<boolean>} Verification result
   */
  async verifyProfile(profile) {
    if (!profile || !profile.publicKey || !profile.signature) {
      return false;
    }
    
    try {
      // Create verification object without the signature
      const signableProfile = this._getSignableProfile(profile);
      
      // Verify signature
      return await verify(
        JSON.stringify(signableProfile),
        profile.signature,
        profile.publicKey
      );
    } catch (error) {
      console.error('Profile verification error:', error);
      return false;
    }
  }
  
  /**
   * Add a contact
   * @param {Object} contact - Contact to add
   * @returns {Promise<boolean>} Success status
   */
  async addContact(contact) {
    if (!this.initialized) await this.initialize();
    
    // Verify contact profile
    const isVerified = await this.verifyProfile(contact);
    
    if (!isVerified) {
      throw new Error('Cannot add contact: Profile verification failed');
    }
    
    // Add to contacts
    this.contacts.set(contact.publicKey, {
      ...contact,
      added: Date.now()
    });
    
    // Save contacts
    await this.storage.set('contacts', Array.from(this.contacts.entries()));
    
    return true;
  }
  
  /**
   * Get a contact by public key
   * @param {string} publicKey - Contact's public key
   * @returns {Object|null} Contact or null if not found
   */
  getContact(publicKey) {
    return this.contacts.get(publicKey) || null;
  }
  
  /**
   * Get all contacts
   * @returns {Array} List of contacts
   */
  getAllContacts() {
    return Array.from(this.contacts.values());
  }
  
  /**
   * Remove a contact
   * @param {string} publicKey - Contact's public key
   * @returns {Promise<boolean>} Success status
   */
  async removeContact(publicKey) {
    if (!this.initialized) await this.initialize();
    
    // Remove from contacts
    const result = this.contacts.delete(publicKey);
    
    // Save contacts
    await this.storage.set('contacts', Array.from(this.contacts.entries()));
    
    return result;
  }
  
  /**
   * Sign data with user's private key
   * @param {*} data - Data to sign
   * @returns {Promise<string>} Signature
   */
  async signData(data) {
    if (!this.initialized) await this.initialize();
    
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return sign(dataString, this.keyPair.privateKey);
  }
  
  /**
   * Verify signed data
   * @param {*} data - Original data
   * @param {string} signature - Signature to verify
   * @param {string} publicKey - Public key to verify against
   * @returns {Promise<boolean>} Verification result
   */
  async verifyData(data, signature, publicKey) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return verify(dataString, signature, publicKey);
  }
  
  /**
   * Get a signable version of the profile (without signature)
   * @private
   * @param {Object} profile - Profile to prepare
   * @returns {Object} Signable profile
   */
  _getSignableProfile(profile) {
    // Create a copy without the signature
    const { signature, ...signableProfile } = profile;
    return signableProfile;
  }
  
  /**
   * Announce profile update to the network
   * @private
   * @returns {Promise<void>}
   */
  async _announceProfileUpdate() {
    // In a real implementation, this would publish the profile to the DHT or other discovery mechanism
    console.log('Profile update would be announced to the network');
    // This will be implemented when we have the network module
  }
}
