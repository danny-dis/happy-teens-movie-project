/**
 * Encryption Service for Filo
 * Provides end-to-end encryption for file sharing and messaging
 * 
 * @author zophlic
 */

// Constants
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Encryption service class
 */
class EncryptionService {
  constructor() {
    this.isInitialized = false;
    this.keyPair = null;
    this.publicKey = null;
    this.privateKey = null;
    this.symmetricKey = null;
  }
  
  /**
   * Initialize encryption service
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // Check if Web Crypto API is available
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API not supported');
      }
      
      // Generate key pair for asymmetric encryption
      this.keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256'
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      this.publicKey = this.keyPair.publicKey;
      this.privateKey = this.keyPair.privateKey;
      
      // Generate symmetric key for data encryption
      this.symmetricKey = await window.crypto.subtle.generateKey(
        {
          name: ALGORITHM,
          length: KEY_LENGTH
        },
        true,
        ['encrypt', 'decrypt']
      );
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize encryption service', error);
      return false;
    }
  }
  
  /**
   * Encrypt data
   * @param {string|ArrayBuffer} data - Data to encrypt
   * @returns {Promise<Object>} Encrypted data with metadata
   */
  async encrypt(data) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Convert string to ArrayBuffer if needed
      const dataBuffer = typeof data === 'string' 
        ? new TextEncoder().encode(data) 
        : data;
      
      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
      
      // Encrypt data
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: ALGORITHM,
          iv
        },
        this.symmetricKey,
        dataBuffer
      );
      
      // Calculate hash of original data for verification
      const hash = await this._calculateHash(dataBuffer);
      
      // Return encrypted data with metadata
      return {
        encrypted: encryptedBuffer,
        iv: this._arrayBufferToBase64(iv),
        hash,
        algorithm: ALGORITHM,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Encryption failed', error);
      throw new Error('Failed to encrypt data: ' + error.message);
    }
  }
  
  /**
   * Decrypt data
   * @param {Object} encryptedData - Encrypted data with metadata
   * @returns {Promise<ArrayBuffer>} Decrypted data
   */
  async decrypt(encryptedData) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Get encrypted data and IV
      const encryptedBuffer = encryptedData.encrypted;
      const iv = this._base64ToArrayBuffer(encryptedData.iv);
      
      // Decrypt data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: ALGORITHM,
          iv
        },
        this.symmetricKey,
        encryptedBuffer
      );
      
      // Verify hash if provided
      if (encryptedData.hash) {
        const hash = await this._calculateHash(decryptedBuffer);
        
        if (hash !== encryptedData.hash) {
          throw new Error('Data integrity check failed');
        }
      }
      
      return decryptedBuffer;
    } catch (error) {
      console.error('Decryption failed', error);
      throw new Error('Failed to decrypt data: ' + error.message);
    }
  }
  
  /**
   * Decrypt data to string
   * @param {Object} encryptedData - Encrypted data with metadata
   * @returns {Promise<string>} Decrypted string
   */
  async decryptToString(encryptedData) {
    const decryptedBuffer = await this.decrypt(encryptedData);
    return new TextDecoder().decode(decryptedBuffer);
  }
  
  /**
   * Export public key
   * @returns {Promise<string>} Base64-encoded public key
   */
  async exportPublicKey() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      const exportedKey = await window.crypto.subtle.exportKey(
        'spki',
        this.publicKey
      );
      
      return this._arrayBufferToBase64(exportedKey);
    } catch (error) {
      console.error('Failed to export public key', error);
      throw new Error('Failed to export public key: ' + error.message);
    }
  }
  
  /**
   * Import public key
   * @param {string} publicKeyBase64 - Base64-encoded public key
   * @returns {Promise<CryptoKey>} Imported public key
   */
  async importPublicKey(publicKeyBase64) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      const publicKeyBuffer = this._base64ToArrayBuffer(publicKeyBase64);
      
      return await window.crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256'
        },
        true,
        ['encrypt']
      );
    } catch (error) {
      console.error('Failed to import public key', error);
      throw new Error('Failed to import public key: ' + error.message);
    }
  }
  
  /**
   * Encrypt data with a public key
   * @param {string|ArrayBuffer} data - Data to encrypt
   * @param {CryptoKey} publicKey - Public key to encrypt with
   * @returns {Promise<Object>} Encrypted data with metadata
   */
  async encryptWithPublicKey(data, publicKey) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Convert string to ArrayBuffer if needed
      const dataBuffer = typeof data === 'string' 
        ? new TextEncoder().encode(data) 
        : data;
      
      // Encrypt data
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP'
        },
        publicKey,
        dataBuffer
      );
      
      // Calculate hash of original data for verification
      const hash = await this._calculateHash(dataBuffer);
      
      // Return encrypted data with metadata
      return {
        encrypted: encryptedBuffer,
        hash,
        algorithm: 'RSA-OAEP',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Public key encryption failed', error);
      throw new Error('Failed to encrypt data with public key: ' + error.message);
    }
  }
  
  /**
   * Decrypt data with private key
   * @param {Object} encryptedData - Encrypted data with metadata
   * @returns {Promise<ArrayBuffer>} Decrypted data
   */
  async decryptWithPrivateKey(encryptedData) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      // Get encrypted data
      const encryptedBuffer = encryptedData.encrypted;
      
      // Decrypt data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP'
        },
        this.privateKey,
        encryptedBuffer
      );
      
      // Verify hash if provided
      if (encryptedData.hash) {
        const hash = await this._calculateHash(decryptedBuffer);
        
        if (hash !== encryptedData.hash) {
          throw new Error('Data integrity check failed');
        }
      }
      
      return decryptedBuffer;
    } catch (error) {
      console.error('Private key decryption failed', error);
      throw new Error('Failed to decrypt data with private key: ' + error.message);
    }
  }
  
  /**
   * Calculate hash of data
   * @param {ArrayBuffer} data - Data to hash
   * @returns {Promise<string>} Base64-encoded hash
   * @private
   */
  async _calculateHash(data) {
    try {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      return this._arrayBufferToBase64(hashBuffer);
    } catch (error) {
      console.error('Hash calculation failed', error);
      throw new Error('Failed to calculate hash: ' + error.message);
    }
  }
  
  /**
   * Convert ArrayBuffer to Base64 string
   * @param {ArrayBuffer} buffer - ArrayBuffer to convert
   * @returns {string} Base64 string
   * @private
   */
  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }
  
  /**
   * Convert Base64 string to ArrayBuffer
   * @param {string} base64 - Base64 string to convert
   * @returns {ArrayBuffer} ArrayBuffer
   * @private
   */
  _base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes.buffer;
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

export default encryptionService;
