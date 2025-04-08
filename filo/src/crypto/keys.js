/**
 * Cryptographic Key Management
 * 
 * Provides cryptographic functions for:
 * - Key generation
 * - Signing and verification
 * - Encryption and decryption
 * 
 * Uses Web Crypto API for secure cryptographic operations
 * 
 * @author zophlic
 */

// Convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert string to ArrayBuffer
function stringToArrayBuffer(str) {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to string
function arrayBufferToString(buffer) {
  return new TextDecoder().decode(buffer);
}

/**
 * Generate a new key pair
 * @returns {Promise<Object>} Key pair with public and private keys
 */
export async function generateKeyPair() {
  try {
    // Generate RSA key pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true, // extractable
      ['encrypt', 'decrypt'] // key usages
    );
    
    // Generate signing key pair
    const signingKeyPair = await window.crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      true, // extractable
      ['sign', 'verify'] // key usages
    );
    
    // Export public keys
    const publicKeyBuffer = await window.crypto.subtle.exportKey(
      'spki',
      keyPair.publicKey
    );
    
    const signingPublicKeyBuffer = await window.crypto.subtle.exportKey(
      'spki',
      signingKeyPair.publicKey
    );
    
    // Export private keys
    const privateKeyBuffer = await window.crypto.subtle.exportKey(
      'pkcs8',
      keyPair.privateKey
    );
    
    const signingPrivateKeyBuffer = await window.crypto.subtle.exportKey(
      'pkcs8',
      signingKeyPair.privateKey
    );
    
    // Convert to Base64
    const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);
    const privateKeyBase64 = arrayBufferToBase64(privateKeyBuffer);
    const signingPublicKeyBase64 = arrayBufferToBase64(signingPublicKeyBuffer);
    const signingPrivateKeyBase64 = arrayBufferToBase64(signingPrivateKeyBuffer);
    
    return {
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
      signingPublicKey: signingPublicKeyBase64,
      signingPrivateKey: signingPrivateKeyBase64
    };
  } catch (error) {
    console.error('Failed to generate key pair:', error);
    throw error;
  }
}

/**
 * Sign data with a private key
 * @param {string} data - Data to sign
 * @param {string} privateKeyBase64 - Private key in Base64 format
 * @returns {Promise<string>} Signature in Base64 format
 */
export async function sign(data, privateKeyBase64) {
  try {
    // Import signing private key
    const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
    const privateKey = await window.crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false, // not extractable
      ['sign'] // key usage
    );
    
    // Sign data
    const dataBuffer = stringToArrayBuffer(data);
    const signatureBuffer = await window.crypto.subtle.sign(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      privateKey,
      dataBuffer
    );
    
    // Convert to Base64
    return arrayBufferToBase64(signatureBuffer);
  } catch (error) {
    console.error('Failed to sign data:', error);
    throw error;
  }
}

/**
 * Verify a signature
 * @param {string} data - Original data
 * @param {string} signatureBase64 - Signature in Base64 format
 * @param {string} publicKeyBase64 - Public key in Base64 format
 * @returns {Promise<boolean>} Verification result
 */
export async function verify(data, signatureBase64, publicKeyBase64) {
  try {
    // Import signing public key
    const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: 'ECDSA',
        namedCurve: 'P-256'
      },
      false, // not extractable
      ['verify'] // key usage
    );
    
    // Verify signature
    const dataBuffer = stringToArrayBuffer(data);
    const signatureBuffer = base64ToArrayBuffer(signatureBase64);
    
    return await window.crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: { name: 'SHA-256' }
      },
      publicKey,
      signatureBuffer,
      dataBuffer
    );
  } catch (error) {
    console.error('Failed to verify signature:', error);
    return false;
  }
}

/**
 * Encrypt data with a public key
 * @param {string} data - Data to encrypt
 * @param {string} publicKeyBase64 - Public key in Base64 format
 * @returns {Promise<string>} Encrypted data in Base64 format
 */
export async function encrypt(data, publicKeyBase64) {
  try {
    // Import public key
    const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      false, // not extractable
      ['encrypt'] // key usage
    );
    
    // Encrypt data
    const dataBuffer = stringToArrayBuffer(data);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      publicKey,
      dataBuffer
    );
    
    // Convert to Base64
    return arrayBufferToBase64(encryptedBuffer);
  } catch (error) {
    console.error('Failed to encrypt data:', error);
    throw error;
  }
}

/**
 * Decrypt data with a private key
 * @param {string} encryptedBase64 - Encrypted data in Base64 format
 * @param {string} privateKeyBase64 - Private key in Base64 format
 * @returns {Promise<string>} Decrypted data
 */
export async function decrypt(encryptedBase64, privateKeyBase64) {
  try {
    // Import private key
    const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
    const privateKey = await window.crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      false, // not extractable
      ['decrypt'] // key usage
    );
    
    // Decrypt data
    const encryptedBuffer = base64ToArrayBuffer(encryptedBase64);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP'
      },
      privateKey,
      encryptedBuffer
    );
    
    // Convert to string
    return arrayBufferToString(decryptedBuffer);
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    throw error;
  }
}
