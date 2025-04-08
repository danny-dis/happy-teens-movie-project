/**
 * Security Manager
 * 
 * Provides security services for the application:
 * - Content encryption and decryption
 * - Metadata signing and verification
 * - Access control management
 * - Privacy protection
 * 
 * @author zophlic
 */

import { sign, verify, encrypt, decrypt } from './keys';
import { createHash, verifyHash } from './hash';

export class SecurityManager {
  constructor(identity) {
    this.identity = identity;
    this.verifiedContent = new Map();
    this.contentKeys = new Map();
    this.accessControl = new Map();
    this.initialized = false;
  }
  
  /**
   * Initialize the security manager
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Ensure identity is initialized
      if (!this.identity.initialized) {
        await this.identity.initialize();
      }
      
      this.initialized = true;
      console.log('Security manager initialized');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize security manager:', error);
      return false;
    }
  }
  
  /**
   * Sign metadata with user's identity
   * @param {Object} metadata - Metadata to sign
   * @returns {Promise<Object>} Signed metadata
   */
  async signMetadata(metadata) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Add publisher info if not present
      const metadataToSign = {
        ...metadata,
        publisher: metadata.publisher || this.identity.getPublicKey(),
        publishedAt: metadata.publishedAt || Date.now()
      };
      
      // Create signature
      const signature = await this.identity.signData(JSON.stringify(metadataToSign));
      
      // Return signed metadata
      return {
        ...metadataToSign,
        signature,
        signedBy: this.identity.getPublicKey()
      };
    } catch (error) {
      console.error('Failed to sign metadata:', error);
      throw error;
    }
  }
  
  /**
   * Verify metadata signature
   * @param {Object} metadata - Metadata to verify
   * @returns {Promise<boolean>} Verification result
   */
  async verifyMetadata(metadata) {
    if (!metadata || !metadata.signature || !metadata.signedBy) {
      return false;
    }
    
    try {
      // Extract signature and signer
      const { signature, signedBy, ...metadataToVerify } = metadata;
      
      // Verify signature
      return await this.identity.verifyData(
        JSON.stringify(metadataToVerify),
        signature,
        signedBy
      );
    } catch (error) {
      console.error('Metadata verification error:', error);
      return false;
    }
  }
  
  /**
   * Encrypt content for secure sharing
   * @param {File|Blob|ArrayBuffer} content - Content to encrypt
   * @param {Object} options - Encryption options
   * @returns {Promise<Object>} Encrypted content
   */
  async encryptContent(content, options = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Generate random content key
      const contentKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Convert content to ArrayBuffer if needed
      let contentBuffer;
      if (content instanceof File || content instanceof Blob) {
        contentBuffer = await content.arrayBuffer();
      } else if (content instanceof ArrayBuffer) {
        contentBuffer = content;
      } else {
        throw new Error('Unsupported content type for encryption');
      }
      
      // Convert to string for encryption
      const contentString = Array.from(new Uint8Array(contentBuffer))
        .map(b => String.fromCharCode(b))
        .join('');
      
      // Encrypt content with content key
      const encryptedContent = await encrypt(contentString, contentKey);
      
      // Determine authorized users
      const authorizedUsers = options.authorizedUsers || [];
      if (!authorizedUsers.includes(this.identity.getPublicKey())) {
        authorizedUsers.push(this.identity.getPublicKey());
      }
      
      // Encrypt content key for each authorized user
      const encryptedKeys = {};
      for (const userId of authorizedUsers) {
        encryptedKeys[userId] = await encrypt(contentKey, userId);
      }
      
      // Store content key
      const contentId = await createHash(contentBuffer);
      this.contentKeys.set(contentId, contentKey);
      
      // Create access control entry
      this.accessControl.set(contentId, {
        contentId,
        authorizedUsers,
        owner: this.identity.getPublicKey(),
        created: Date.now()
      });
      
      return {
        contentId,
        encryptedContent,
        encryptedKeys,
        accessControl: this.accessControl.get(contentId)
      };
    } catch (error) {
      console.error('Content encryption error:', error);
      throw error;
    }
  }
  
  /**
   * Decrypt content
   * @param {Object} encryptedData - Encrypted content data
   * @returns {Promise<ArrayBuffer>} Decrypted content
   */
  async decryptContent(encryptedData) {
    if (!this.initialized) await this.initialize();
    
    try {
      const { contentId, encryptedContent, encryptedKeys } = encryptedData;
      
      // Get content key
      let contentKey;
      
      // Check if we already have the key
      if (this.contentKeys.has(contentId)) {
        contentKey = this.contentKeys.get(contentId);
      } else {
        // Try to decrypt the content key
        const encryptedKey = encryptedKeys[this.identity.getPublicKey()];
        
        if (!encryptedKey) {
          throw new Error('No access to content key');
        }
        
        contentKey = await decrypt(encryptedKey, this.identity.keyPair.privateKey);
        
        // Store for future use
        this.contentKeys.set(contentId, contentKey);
      }
      
      // Decrypt content
      const decryptedString = await decrypt(encryptedContent, contentKey);
      
      // Convert back to ArrayBuffer
      const decryptedBuffer = new ArrayBuffer(decryptedString.length);
      const view = new Uint8Array(decryptedBuffer);
      for (let i = 0; i < decryptedString.length; i++) {
        view[i] = decryptedString.charCodeAt(i);
      }
      
      return decryptedBuffer;
    } catch (error) {
      console.error('Content decryption error:', error);
      throw error;
    }
  }
  
  /**
   * Verify content integrity
   * @param {string} contentId - Content identifier
   * @param {File|Blob|ArrayBuffer} content - Content to verify
   * @returns {Promise<boolean>} Verification result
   */
  async verifyContent(contentId, content) {
    try {
      // Check if already verified
      if (this.verifiedContent.has(contentId)) {
        return this.verifiedContent.get(contentId);
      }
      
      // Verify hash
      const isVerified = await verifyHash(content, contentId);
      
      // Cache result
      this.verifiedContent.set(contentId, isVerified);
      
      return isVerified;
    } catch (error) {
      console.error('Content verification error:', error);
      return false;
    }
  }
  
  /**
   * Update content access control
   * @param {string} contentId - Content identifier
   * @param {Object} accessChanges - Access control changes
   * @returns {Promise<Object>} Updated access control
   */
  async updateAccessControl(contentId, accessChanges) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Get current access control
      const currentAccess = this.accessControl.get(contentId);
      
      if (!currentAccess) {
        throw new Error('No access control found for content');
      }
      
      // Check ownership
      if (currentAccess.owner !== this.identity.getPublicKey()) {
        throw new Error('Only the owner can update access control');
      }
      
      // Apply changes
      const updatedAccess = {
        ...currentAccess,
        ...accessChanges,
        updated: Date.now()
      };
      
      // Update access control
      this.accessControl.set(contentId, updatedAccess);
      
      return updatedAccess;
    } catch (error) {
      console.error('Failed to update access control:', error);
      throw error;
    }
  }
  
  /**
   * Check if user has access to content
   * @param {string} contentId - Content identifier
   * @param {string} userId - User identifier
   * @returns {boolean} Access status
   */
  hasAccess(contentId, userId) {
    const access = this.accessControl.get(contentId);
    
    if (!access) {
      return false;
    }
    
    return access.authorizedUsers.includes(userId);
  }
  
  /**
   * Get content access control
   * @param {string} contentId - Content identifier
   * @returns {Object|null} Access control info
   */
  getAccessControl(contentId) {
    return this.accessControl.get(contentId) || null;
  }
}
