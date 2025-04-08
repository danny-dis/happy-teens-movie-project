/**
 * Crypto Utilities for Movo
 * Provides encryption and decryption functions for secure storage
 * 
 * @author zophlic
 */

// Constants
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATION_COUNT = 100000;

/**
 * Generate a key from a password and salt
 * @private
 * @param {string} password - Password
 * @param {Uint8Array} salt - Salt
 * @returns {Promise<CryptoKey>} Derived key
 */
const deriveKey = async (password, salt) => {
  // Convert password to buffer
  const passwordBuffer = new TextEncoder().encode(password);
  
  // Import password as key material
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derive key
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATION_COUNT,
      hash: 'SHA-256'
    },
    keyMaterial,
    {
      name: ALGORITHM,
      length: KEY_LENGTH
    },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Get device-specific encryption key
 * @private
 * @returns {Promise<string>} Encryption key
 */
const getDeviceKey = async () => {
  // Try to get existing device key
  let deviceKey = localStorage.getItem('movo_device_key');
  
  if (!deviceKey) {
    // Generate a new device key
    const randomBytes = window.crypto.getRandomValues(new Uint8Array(32));
    deviceKey = Array.from(randomBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
    
    // Save device key
    localStorage.setItem('movo_device_key', deviceKey);
  }
  
  // Combine with a constant app key for additional security
  const appKey = 'movo-app-zophlic-secure-key';
  
  return deviceKey + appKey;
};

/**
 * Encrypt data
 * @param {string} data - Data to encrypt
 * @returns {Promise<string>} Encrypted data (base64 encoded)
 */
const encrypt = async (data) => {
  try {
    // Get device key
    const password = await getDeviceKey();
    
    // Generate salt and IV
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    // Derive key
    const key = await deriveKey(password, salt);
    
    // Encrypt data
    const dataBuffer = new TextEncoder().encode(data);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv
      },
      key,
      dataBuffer
    );
    
    // Combine salt, IV, and encrypted data
    const result = new Uint8Array(salt.length + iv.length + encryptedBuffer.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode.apply(null, result));
  } catch (error) {
    console.error('Encryption failed', error);
    throw error;
  }
};

/**
 * Decrypt data
 * @param {string} encryptedData - Encrypted data (base64 encoded)
 * @returns {Promise<string>} Decrypted data
 */
const decrypt = async (encryptedData) => {
  try {
    // Get device key
    const password = await getDeviceKey();
    
    // Convert from base64
    const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract salt, IV, and encrypted data
    const salt = encryptedBytes.slice(0, SALT_LENGTH);
    const iv = encryptedBytes.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const data = encryptedBytes.slice(SALT_LENGTH + IV_LENGTH);
    
    // Derive key
    const key = await deriveKey(password, salt);
    
    // Decrypt data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv
      },
      key,
      data
    );
    
    // Convert to string
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed', error);
    throw error;
  }
};

/**
 * Generate a secure random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  const randomBytes = window.crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomBytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
};

/**
 * Hash a string using SHA-256
 * @param {string} data - Data to hash
 * @returns {Promise<string>} Hashed data (hex encoded)
 */
const hash = async (data) => {
  try {
    const dataBuffer = new TextEncoder().encode(data);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    
    // Convert to hex
    return Array.from(new Uint8Array(hashBuffer))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.error('Hashing failed', error);
    throw error;
  }
};

/**
 * Generate a secure token for peer connections
 * @returns {string} Secure token
 */
const generatePeerToken = () => {
  // Generate a random string
  const randomPart = generateRandomString(16);
  
  // Add timestamp
  const timestamp = Date.now().toString(36);
  
  // Combine with a unique identifier
  return `movo-${timestamp}-${randomPart}`;
};

// Export functions
const cryptoUtils = {
  encrypt,
  decrypt,
  generateRandomString,
  hash,
  generatePeerToken
};

export default cryptoUtils;
