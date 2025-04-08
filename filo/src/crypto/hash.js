/**
 * Cryptographic Hashing Functions
 * 
 * Provides secure hashing functionality for:
 * - Content identification
 * - Data integrity verification
 * - Merkle tree construction
 * 
 * @author zophlic
 */

/**
 * Create a hash of data
 * @param {string|File|Blob|ArrayBuffer} data - Data to hash
 * @returns {Promise<string>} Hash in hex format
 */
export async function createHash(data) {
  try {
    let buffer;
    
    if (data instanceof File || data instanceof Blob) {
      buffer = await data.arrayBuffer();
    } else if (data instanceof ArrayBuffer) {
      buffer = data;
    } else if (typeof data === 'string') {
      buffer = new TextEncoder().encode(data);
    } else {
      throw new Error('Unsupported data type for hashing');
    }
    
    // Create SHA-256 hash
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
    
    // Convert to hex string
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    console.error('Failed to create hash:', error);
    throw error;
  }
}

/**
 * Verify data integrity using a hash
 * @param {string|File|Blob|ArrayBuffer} data - Data to verify
 * @param {string} expectedHash - Expected hash in hex format
 * @returns {Promise<boolean>} Verification result
 */
export async function verifyHash(data, expectedHash) {
  try {
    const actualHash = await createHash(data);
    return actualHash === expectedHash;
  } catch (error) {
    console.error('Failed to verify hash:', error);
    return false;
  }
}

/**
 * Create a Merkle tree from a list of items
 * @param {Array<string|File|Blob|ArrayBuffer>} items - Items to include in the tree
 * @returns {Promise<Object>} Merkle tree with root hash and proof functions
 */
export async function createMerkleTree(items) {
  try {
    // Hash all items
    const leaves = await Promise.all(items.map(item => createHash(item)));
    
    // Build tree
    const tree = [leaves];
    
    // Build each level of the tree
    let currentLevel = leaves;
    while (currentLevel.length > 1) {
      const nextLevel = [];
      
      // Combine pairs of nodes
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          // Hash the pair
          const combined = currentLevel[i] + currentLevel[i + 1];
          const hash = await createHash(combined);
          nextLevel.push(hash);
        } else {
          // Odd number of nodes, promote the last one
          nextLevel.push(currentLevel[i]);
        }
      }
      
      tree.push(nextLevel);
      currentLevel = nextLevel;
    }
    
    // Root is the last hash in the tree
    const root = tree[tree.length - 1][0];
    
    return {
      root,
      tree,
      
      // Generate proof for a specific item
      async getProof(item) {
        const itemHash = await createHash(item);
        let index = leaves.indexOf(itemHash);
        
        if (index === -1) {
          throw new Error('Item not found in Merkle tree');
        }
        
        const proof = [];
        
        // Build proof by traversing the tree
        for (let i = 0; i < tree.length - 1; i++) {
          const isRight = index % 2 === 0;
          const siblingIndex = isRight ? index + 1 : index - 1;
          
          if (siblingIndex < tree[i].length) {
            proof.push({
              position: isRight ? 'right' : 'left',
              hash: tree[i][siblingIndex]
            });
          }
          
          // Move to parent index
          index = Math.floor(index / 2);
        }
        
        return proof;
      },
      
      // Verify a proof
      async verifyProof(item, proof) {
        let itemHash = await createHash(item);
        
        // Apply each step in the proof
        for (const step of proof) {
          if (step.position === 'right') {
            // Item hash is on the left
            const combined = itemHash + step.hash;
            itemHash = await createHash(combined);
          } else {
            // Item hash is on the right
            const combined = step.hash + itemHash;
            itemHash = await createHash(combined);
          }
        }
        
        // Final hash should match the root
        return itemHash === root;
      }
    };
  } catch (error) {
    console.error('Failed to create Merkle tree:', error);
    throw error;
  }
}
