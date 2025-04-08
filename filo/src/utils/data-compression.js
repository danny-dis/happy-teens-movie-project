/**
 * Data Compression Utilities
 * 
 * Provides efficient data compression and decompression for various data types.
 * Optimized for memory usage and performance.
 * 
 * @author zophlic
 */

/**
 * Compress a depth map using run-length encoding
 * @param {Object} depthMap - Depth map object
 * @returns {Object} Compressed depth map
 */
export function compressDepthMap(depthMap) {
  if (!depthMap || !depthMap.data) {
    return null;
  }
  
  // Use run-length encoding for depth maps
  const compressed = [];
  let currentValue = depthMap.data[0];
  let count = 1;
  
  // Process in chunks for better performance
  const chunkSize = 1000;
  const totalLength = depthMap.data.length;
  
  for (let i = 1; i < totalLength; i++) {
    if (depthMap.data[i] === currentValue) {
      count++;
    } else {
      compressed.push([currentValue, count]);
      currentValue = depthMap.data[i];
      count = 1;
    }
    
    // Process in chunks to avoid blocking the main thread
    if (i % chunkSize === 0 && i < totalLength - 1) {
      // Allow other operations to execute
      if (i + chunkSize < totalLength) {
        setTimeout(() => {
          // Continue processing in the next chunk
        }, 0);
      }
    }
  }
  
  // Add the last run
  compressed.push([currentValue, count]);
  
  // Calculate compression ratio
  const originalSize = depthMap.data.length * 4; // 4 bytes per float
  const compressedSize = compressed.length * 8; // 8 bytes per entry (float + int)
  const compressionRatio = originalSize / compressedSize;
  
  console.log(`Depth map compressed: ${originalSize} bytes -> ${compressedSize} bytes (${compressionRatio.toFixed(2)}x)`);
  
  return {
    width: depthMap.width,
    height: depthMap.height,
    compressed,
    originalSize,
    compressedSize,
    compressionRatio
  };
}

/**
 * Decompress a compressed depth map
 * @param {Object} compressedMap - Compressed depth map
 * @returns {Object} Decompressed depth map
 */
export function decompressDepthMap(compressedMap) {
  if (!compressedMap || !compressedMap.compressed) {
    return null;
  }
  
  // Create data array
  const data = new Float32Array(compressedMap.width * compressedMap.height);
  let index = 0;
  
  // Process each run
  for (const [value, count] of compressedMap.compressed) {
    for (let i = 0; i < count; i++) {
      data[index++] = value;
    }
  }
  
  return {
    width: compressedMap.width,
    height: compressedMap.height,
    data
  };
}

/**
 * Quantize a depth map to reduce memory usage
 * @param {Object} depthMap - Depth map object
 * @param {number} levels - Number of quantization levels (default: 256)
 * @returns {Object} Quantized depth map
 */
export function quantizeDepthMap(depthMap, levels = 256) {
  if (!depthMap || !depthMap.data) {
    return null;
  }
  
  // Create quantized data array
  const quantized = new Uint8Array(depthMap.data.length);
  
  // Quantize each value
  for (let i = 0; i < depthMap.data.length; i++) {
    // Map from [0,1] to [0,levels-1]
    quantized[i] = Math.floor(depthMap.data[i] * (levels - 1));
  }
  
  // Calculate memory savings
  const originalSize = depthMap.data.length * 4; // 4 bytes per float
  const quantizedSize = depthMap.data.length; // 1 byte per uint8
  
  console.log(`Depth map quantized: ${originalSize} bytes -> ${quantizedSize} bytes (${(originalSize / quantizedSize).toFixed(2)}x)`);
  
  return {
    width: depthMap.width,
    height: depthMap.height,
    data: quantized,
    levels
  };
}

/**
 * Dequantize a quantized depth map
 * @param {Object} quantizedMap - Quantized depth map
 * @returns {Object} Dequantized depth map
 */
export function dequantizeDepthMap(quantizedMap) {
  if (!quantizedMap || !quantizedMap.data) {
    return null;
  }
  
  // Create dequantized data array
  const data = new Float32Array(quantizedMap.data.length);
  const levels = quantizedMap.levels || 256;
  
  // Dequantize each value
  for (let i = 0; i < quantizedMap.data.length; i++) {
    // Map from [0,levels-1] to [0,1]
    data[i] = quantizedMap.data[i] / (levels - 1);
  }
  
  return {
    width: quantizedMap.width,
    height: quantizedMap.height,
    data
  };
}

/**
 * Downsample a depth map to reduce memory usage
 * @param {Object} depthMap - Depth map object
 * @param {number} factor - Downsampling factor (default: 2)
 * @returns {Object} Downsampled depth map
 */
export function downsampleDepthMap(depthMap, factor = 2) {
  if (!depthMap || !depthMap.data) {
    return null;
  }
  
  // Calculate new dimensions
  const newWidth = Math.floor(depthMap.width / factor);
  const newHeight = Math.floor(depthMap.height / factor);
  
  // Create downsampled data array
  const downsampled = new Float32Array(newWidth * newHeight);
  
  // Downsample using area averaging
  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      let sum = 0;
      let count = 0;
      
      // Average the values in the factor x factor area
      for (let dy = 0; dy < factor; dy++) {
        for (let dx = 0; dx < factor; dx++) {
          const srcX = x * factor + dx;
          const srcY = y * factor + dy;
          
          if (srcX < depthMap.width && srcY < depthMap.height) {
            sum += depthMap.data[srcY * depthMap.width + srcX];
            count++;
          }
        }
      }
      
      // Store the average
      downsampled[y * newWidth + x] = sum / count;
    }
  }
  
  // Calculate memory savings
  const originalSize = depthMap.data.length * 4; // 4 bytes per float
  const downsampledSize = downsampled.length * 4; // 4 bytes per float
  
  console.log(`Depth map downsampled: ${originalSize} bytes -> ${downsampledSize} bytes (${(originalSize / downsampledSize).toFixed(2)}x)`);
  
  return {
    width: newWidth,
    height: newHeight,
    data: downsampled,
    factor
  };
}

/**
 * Upsample a depth map to original size
 * @param {Object} downsampledMap - Downsampled depth map
 * @param {number} originalWidth - Original width
 * @param {number} originalHeight - Original height
 * @returns {Object} Upsampled depth map
 */
export function upsampleDepthMap(downsampledMap, originalWidth, originalHeight) {
  if (!downsampledMap || !downsampledMap.data) {
    return null;
  }
  
  // Create upsampled data array
  const upsampled = new Float32Array(originalWidth * originalHeight);
  
  // Calculate scaling factors
  const scaleX = downsampledMap.width / originalWidth;
  const scaleY = downsampledMap.height / originalHeight;
  
  // Upsample using bilinear interpolation
  for (let y = 0; y < originalHeight; y++) {
    for (let x = 0; x < originalWidth; x++) {
      // Calculate source coordinates
      const srcX = x * scaleX;
      const srcY = y * scaleY;
      
      // Calculate integer and fractional parts
      const srcX0 = Math.floor(srcX);
      const srcY0 = Math.floor(srcY);
      const srcX1 = Math.min(srcX0 + 1, downsampledMap.width - 1);
      const srcY1 = Math.min(srcY0 + 1, downsampledMap.height - 1);
      
      const fracX = srcX - srcX0;
      const fracY = srcY - srcY0;
      
      // Get the four nearest values
      const v00 = downsampledMap.data[srcY0 * downsampledMap.width + srcX0];
      const v01 = downsampledMap.data[srcY0 * downsampledMap.width + srcX1];
      const v10 = downsampledMap.data[srcY1 * downsampledMap.width + srcX0];
      const v11 = downsampledMap.data[srcY1 * downsampledMap.width + srcX1];
      
      // Bilinear interpolation
      const v0 = v00 * (1 - fracX) + v01 * fracX;
      const v1 = v10 * (1 - fracX) + v11 * fracX;
      const v = v0 * (1 - fracY) + v1 * fracY;
      
      // Store the interpolated value
      upsampled[y * originalWidth + x] = v;
    }
  }
  
  return {
    width: originalWidth,
    height: originalHeight,
    data: upsampled
  };
}

/**
 * Optimize a depth map for memory and performance
 * @param {Object} depthMap - Depth map object
 * @param {Object} options - Optimization options
 * @returns {Object} Optimized depth map
 */
export function optimizeDepthMap(depthMap, options = {}) {
  if (!depthMap || !depthMap.data) {
    return null;
  }
  
  // Default options
  const defaultOptions = {
    downsample: true,
    downsampleFactor: 2,
    quantize: true,
    quantizeLevels: 256,
    compress: true
  };
  
  // Merge options
  const opts = { ...defaultOptions, ...options };
  
  // Start with the original depth map
  let optimized = { ...depthMap };
  
  // Apply optimizations
  if (opts.downsample) {
    optimized = downsampleDepthMap(optimized, opts.downsampleFactor);
  }
  
  if (opts.quantize) {
    optimized = quantizeDepthMap(optimized, opts.quantizeLevels);
  }
  
  if (opts.compress) {
    optimized = compressDepthMap(optimized);
  }
  
  // Add metadata
  optimized.optimized = true;
  optimized.originalWidth = depthMap.width;
  optimized.originalHeight = depthMap.height;
  optimized.optimizationOptions = opts;
  
  return optimized;
}

/**
 * Restore an optimized depth map to usable form
 * @param {Object} optimizedMap - Optimized depth map
 * @returns {Object} Restored depth map
 */
export function restoreDepthMap(optimizedMap) {
  if (!optimizedMap || !optimizedMap.optimized) {
    return optimizedMap; // Already in usable form
  }
  
  // Start with the optimized map
  let restored = { ...optimizedMap };
  
  // Apply reverse optimizations in reverse order
  if (optimizedMap.compressed) {
    restored = decompressDepthMap(restored);
  }
  
  if (optimizedMap.levels) {
    restored = dequantizeDepthMap(restored);
  }
  
  if (optimizedMap.factor) {
    restored = upsampleDepthMap(restored, optimizedMap.originalWidth, optimizedMap.originalHeight);
  }
  
  return restored;
}
