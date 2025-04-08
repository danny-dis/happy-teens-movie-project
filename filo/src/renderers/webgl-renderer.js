/**
 * WebGL Renderer for Light Field Video
 * 
 * Provides hardware-accelerated rendering for light field video content.
 * Falls back to Canvas 2D when WebGL is not available.
 * 
 * @author zophlic
 */

// Vertex shader source
const VERTEX_SHADER_SOURCE = `
  attribute vec4 aVertexPosition;
  attribute vec2 aTextureCoord;
  
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  
  varying highp vec2 vTextureCoord;
  
  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
  }
`;

// Fragment shader source
const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  
  varying highp vec2 vTextureCoord;
  
  uniform sampler2D uSampler;
  uniform float uTime;
  uniform vec3 uViewpoint;
  
  void main() {
    // Calculate offset based on viewpoint
    vec2 offset = vec2(uViewpoint.x * 0.01, uViewpoint.y * 0.01);
    
    // Sample texture with offset
    vec2 texCoord = vTextureCoord + offset;
    
    // Ensure texture coordinates are in valid range
    texCoord = clamp(texCoord, 0.0, 1.0);
    
    // Apply time-based effect
    float timeEffect = sin(uTime * 0.01) * 0.1 + 0.9;
    
    // Get base color
    vec4 baseColor = texture2D(uSampler, texCoord);
    
    // Apply depth effect based on viewpoint.z
    float depthEffect = 1.0 + uViewpoint.z * 0.05;
    
    // Final color
    gl_FragColor = baseColor * timeEffect * depthEffect;
  }
`;

// Shader for depth visualization
const DEPTH_FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  
  varying highp vec2 vTextureCoord;
  
  uniform sampler2D uDepthSampler;
  
  void main() {
    // Sample depth texture
    float depth = texture2D(uDepthSampler, vTextureCoord).r;
    
    // Visualize depth (white = close, black = far)
    gl_FragColor = vec4(vec3(1.0 - depth), 1.0);
  }
`;

/**
 * Create and compile a shader
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {number} type - Shader type (gl.VERTEX_SHADER or gl.FRAGMENT_SHADER)
 * @param {string} source - Shader source code
 * @returns {WebGLShader} Compiled shader
 */
function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  // Check if compilation was successful
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  
  return shader;
}

/**
 * Create a shader program
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {WebGLShader} vertexShader - Vertex shader
 * @param {WebGLShader} fragmentShader - Fragment shader
 * @returns {WebGLProgram} Shader program
 */
function createShaderProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  // Check if linking was successful
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Shader program linking error:', gl.getProgramInfoLog(program));
    return null;
  }
  
  return program;
}

/**
 * Create buffer for geometry
 * @param {WebGLRenderingContext} gl - WebGL context
 * @returns {Object} Buffer objects
 */
function createBuffers(gl) {
  // Create position buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
  // Quad positions (2 triangles forming a rectangle)
  const positions = [
    -1.0, -1.0,  // Bottom left
     1.0, -1.0,  // Bottom right
     1.0,  1.0,  // Top right
    -1.0,  1.0,  // Top left
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
  // Create texture coordinate buffer
  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  
  // Texture coordinates
  const textureCoordinates = [
    0.0, 1.0,  // Bottom left
    1.0, 1.0,  // Bottom right
    1.0, 0.0,  // Top right
    0.0, 0.0,  // Top left
  ];
  
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
  
  // Create index buffer
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  
  // Indices for two triangles
  const indices = [
    0, 1, 2,  // First triangle
    0, 2, 3,  // Second triangle
  ];
  
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  
  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
  };
}

/**
 * Create and configure a texture
 * @param {WebGLRenderingContext} gl - WebGL context
 * @returns {WebGLTexture} Texture object
 */
function createTexture(gl) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // Fill with a single pixel until we load an image
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 255])
  );
  
  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
  return texture;
}

/**
 * Create a framebuffer for offscreen rendering
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {number} width - Framebuffer width
 * @param {number} height - Framebuffer height
 * @returns {Object} Framebuffer and texture
 */
function createFramebuffer(gl, width, height) {
  // Create and bind framebuffer
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  
  // Create texture to render to
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null
  );
  
  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  
  // Attach texture to framebuffer
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0
  );
  
  // Check if framebuffer is complete
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    console.error('Framebuffer is not complete');
    return null;
  }
  
  // Unbind framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  
  return {
    framebuffer,
    texture
  };
}

/**
 * WebGL Renderer class
 */
export class WebGLRenderer {
  /**
   * Create a WebGL renderer
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.programInfo = null;
    this.depthProgramInfo = null;
    this.buffers = null;
    this.texture = null;
    this.depthTexture = null;
    this.framebuffer = null;
    this.isInitialized = false;
    
    // Performance monitoring
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.frameTimeHistory = new Array(60).fill(16.67);
    this.frameTimeIndex = 0;
    
    // Initialize WebGL
    this._initWebGL();
  }
  
  /**
   * Initialize WebGL
   * @private
   */
  _initWebGL() {
    try {
      // Try to get WebGL 2 context first, then fall back to WebGL 1
      this.gl = this.canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: 'high-performance'
      });
      
      if (!this.gl) {
        this.gl = this.canvas.getContext('webgl', {
          alpha: false,
          antialias: false,
          depth: false,
          stencil: false,
          preserveDrawingBuffer: false,
          powerPreference: 'high-performance'
        });
      }
      
      if (!this.gl) {
        console.error('WebGL not supported');
        return false;
      }
      
      // Compile shaders
      const vertexShader = compileShader(this.gl, this.gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
      const fragmentShader = compileShader(this.gl, this.gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
      const depthFragmentShader = compileShader(this.gl, this.gl.FRAGMENT_SHADER, DEPTH_FRAGMENT_SHADER_SOURCE);
      
      if (!vertexShader || !fragmentShader || !depthFragmentShader) {
        return false;
      }
      
      // Create shader programs
      const shaderProgram = createShaderProgram(this.gl, vertexShader, fragmentShader);
      const depthShaderProgram = createShaderProgram(this.gl, vertexShader, depthFragmentShader);
      
      if (!shaderProgram || !depthShaderProgram) {
        return false;
      }
      
      // Get shader program info
      this.programInfo = {
        program: shaderProgram,
        attribLocations: {
          vertexPosition: this.gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
          textureCoord: this.gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
        },
        uniformLocations: {
          projectionMatrix: this.gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
          modelViewMatrix: this.gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
          sampler: this.gl.getUniformLocation(shaderProgram, 'uSampler'),
          time: this.gl.getUniformLocation(shaderProgram, 'uTime'),
          viewpoint: this.gl.getUniformLocation(shaderProgram, 'uViewpoint'),
        },
      };
      
      this.depthProgramInfo = {
        program: depthShaderProgram,
        attribLocations: {
          vertexPosition: this.gl.getAttribLocation(depthShaderProgram, 'aVertexPosition'),
          textureCoord: this.gl.getAttribLocation(depthShaderProgram, 'aTextureCoord'),
        },
        uniformLocations: {
          projectionMatrix: this.gl.getUniformLocation(depthShaderProgram, 'uProjectionMatrix'),
          modelViewMatrix: this.gl.getUniformLocation(depthShaderProgram, 'uModelViewMatrix'),
          depthSampler: this.gl.getUniformLocation(depthShaderProgram, 'uDepthSampler'),
        },
      };
      
      // Create buffers
      this.buffers = createBuffers(this.gl);
      
      // Create textures
      this.texture = createTexture(this.gl);
      this.depthTexture = createTexture(this.gl);
      
      // Create framebuffer for offscreen rendering
      const fbInfo = createFramebuffer(this.gl, this.canvas.width, this.canvas.height);
      if (fbInfo) {
        this.framebuffer = fbInfo.framebuffer;
        this.framebufferTexture = fbInfo.texture;
      }
      
      // Set clear color
      this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
      
      // Enable alpha blending
      this.gl.enable(this.gl.BLEND);
      this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize WebGL:', error);
      return false;
    }
  }
  
  /**
   * Resize the renderer
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    if (!this.isInitialized) return;
    
    // Update canvas size
    this.canvas.width = width;
    this.canvas.height = height;
    
    // Update viewport
    this.gl.viewport(0, 0, width, height);
    
    // Recreate framebuffer with new size
    if (this.framebuffer) {
      this.gl.deleteFramebuffer(this.framebuffer);
      this.gl.deleteTexture(this.framebufferTexture);
      
      const fbInfo = createFramebuffer(this.gl, width, height);
      if (fbInfo) {
        this.framebuffer = fbInfo.framebuffer;
        this.framebufferTexture = fbInfo.texture;
      }
    }
  }
  
  /**
   * Update texture with new image data
   * @param {ImageData|HTMLCanvasElement|HTMLImageElement} source - Image source
   */
  updateTexture(source) {
    if (!this.isInitialized) return;
    
    // Bind texture
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    
    // Update texture with new image data
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, source);
  }
  
  /**
   * Update depth texture with depth map data
   * @param {Object} depthMap - Depth map object
   */
  updateDepthTexture(depthMap) {
    if (!this.isInitialized || !depthMap) return;
    
    // Bind texture
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTexture);
    
    // Create temporary canvas to convert depth data to image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = depthMap.width;
    tempCanvas.height = depthMap.height;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Create image data from depth map
    const imageData = tempCtx.createImageData(depthMap.width, depthMap.height);
    
    // Fill image data with depth values
    for (let i = 0; i < depthMap.data.length; i++) {
      const value = Math.floor(255 * (1 - depthMap.data[i]));
      imageData.data[i * 4] = value;     // R
      imageData.data[i * 4 + 1] = value; // G
      imageData.data[i * 4 + 2] = value; // B
      imageData.data[i * 4 + 3] = 255;   // A
    }
    
    // Put image data on canvas
    tempCtx.putImageData(imageData, 0, 0);
    
    // Update texture with canvas
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, tempCanvas);
  }
  
  /**
   * Render a frame
   * @param {Object} frameData - Frame data
   * @param {Object} viewpoint - Viewpoint coordinates
   * @param {Object} depthMap - Depth map
   * @returns {number} Render time in milliseconds
   */
  renderFrame(frameData, viewpoint, depthMap) {
    if (!this.isInitialized) return 0;
    
    const startTime = performance.now();
    
    // Clear the canvas
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // Create projection matrix (identity for 2D)
    const projectionMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
    
    // Create model-view matrix (identity)
    const modelViewMatrix = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
    
    // Render main content
    this._renderContent(projectionMatrix, modelViewMatrix, frameData, viewpoint);
    
    // Render depth visualization if available
    if (depthMap && this.depthTexture) {
      this._renderDepthVisualization(projectionMatrix, modelViewMatrix, depthMap);
    }
    
    // Calculate render time
    const renderTime = performance.now() - startTime;
    
    // Update performance metrics
    this._updatePerformanceMetrics(renderTime);
    
    return renderTime;
  }
  
  /**
   * Render main content
   * @private
   * @param {Array} projectionMatrix - Projection matrix
   * @param {Array} modelViewMatrix - Model-view matrix
   * @param {Object} frameData - Frame data
   * @param {Object} viewpoint - Viewpoint coordinates
   */
  _renderContent(projectionMatrix, modelViewMatrix, frameData, viewpoint) {
    // Use the shader program
    this.gl.useProgram(this.programInfo.program);
    
    // Set up vertex position attribute
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    this.gl.vertexAttribPointer(
      this.programInfo.attribLocations.vertexPosition,
      2, // 2 components per vertex
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);
    
    // Set up texture coordinate attribute
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.textureCoord);
    this.gl.vertexAttribPointer(
      this.programInfo.attribLocations.textureCoord,
      2, // 2 components per texture coord
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.enableVertexAttribArray(this.programInfo.attribLocations.textureCoord);
    
    // Set up index buffer
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
    
    // Set uniforms
    this.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix
    );
    this.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix
    );
    
    // Set time uniform
    this.gl.uniform1f(
      this.programInfo.uniformLocations.time,
      frameData.index
    );
    
    // Set viewpoint uniform
    this.gl.uniform3f(
      this.programInfo.uniformLocations.viewpoint,
      viewpoint.x,
      viewpoint.y,
      viewpoint.z
    );
    
    // Set texture
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.uniform1i(this.programInfo.uniformLocations.sampler, 0);
    
    // Draw the triangles
    this.gl.drawElements(
      this.gl.TRIANGLES,
      6, // 6 vertices (2 triangles)
      this.gl.UNSIGNED_SHORT,
      0
    );
  }
  
  /**
   * Render depth visualization
   * @private
   * @param {Array} projectionMatrix - Projection matrix
   * @param {Array} modelViewMatrix - Model-view matrix
   * @param {Object} depthMap - Depth map
   */
  _renderDepthVisualization(projectionMatrix, modelViewMatrix, depthMap) {
    // Update depth texture if needed
    if (depthMap) {
      this.updateDepthTexture(depthMap);
    }
    
    // Use the depth shader program
    this.gl.useProgram(this.depthProgramInfo.program);
    
    // Set up vertex position attribute
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.position);
    this.gl.vertexAttribPointer(
      this.depthProgramInfo.attribLocations.vertexPosition,
      2, // 2 components per vertex
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.enableVertexAttribArray(this.depthProgramInfo.attribLocations.vertexPosition);
    
    // Set up texture coordinate attribute
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.textureCoord);
    this.gl.vertexAttribPointer(
      this.depthProgramInfo.attribLocations.textureCoord,
      2, // 2 components per texture coord
      this.gl.FLOAT,
      false,
      0,
      0
    );
    this.gl.enableVertexAttribArray(this.depthProgramInfo.attribLocations.textureCoord);
    
    // Set up index buffer
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
    
    // Set uniforms
    this.gl.uniformMatrix4fv(
      this.depthProgramInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix
    );
    this.gl.uniformMatrix4fv(
      this.depthProgramInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix
    );
    
    // Set depth texture
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTexture);
    this.gl.uniform1i(this.depthProgramInfo.uniformLocations.depthSampler, 1);
    
    // Enable scissor test to only render in a small area
    this.gl.enable(this.gl.SCISSOR_TEST);
    
    // Set scissor rectangle (bottom-right corner, 1/4 of the canvas size)
    const width = this.canvas.width / 4;
    const height = this.canvas.height / 4;
    this.gl.scissor(
      this.canvas.width - width - 10,
      10,
      width,
      height
    );
    
    // Draw the triangles
    this.gl.drawElements(
      this.gl.TRIANGLES,
      6, // 6 vertices (2 triangles)
      this.gl.UNSIGNED_SHORT,
      0
    );
    
    // Disable scissor test
    this.gl.disable(this.gl.SCISSOR_TEST);
  }
  
  /**
   * Update performance metrics
   * @private
   * @param {number} renderTime - Render time in milliseconds
   */
  _updatePerformanceMetrics(renderTime) {
    // Update frame count
    this.frameCount++;
    
    // Update frame time history
    this.frameTimeHistory[this.frameTimeIndex] = renderTime;
    this.frameTimeIndex = (this.frameTimeIndex + 1) % this.frameTimeHistory.length;
    
    // Calculate average frame time every 60 frames
    if (this.frameCount % 60 === 0) {
      const avgFrameTime = this.frameTimeHistory.reduce((sum, time) => sum + time, 0) / 
                          this.frameTimeHistory.length;
      
      console.log(`WebGL Renderer: Average frame time: ${avgFrameTime.toFixed(2)}ms (${(1000 / avgFrameTime).toFixed(1)} FPS)`);
    }
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    if (!this.isInitialized) return;
    
    const gl = this.gl;
    
    // Delete buffers
    gl.deleteBuffer(this.buffers.position);
    gl.deleteBuffer(this.buffers.textureCoord);
    gl.deleteBuffer(this.buffers.indices);
    
    // Delete textures
    gl.deleteTexture(this.texture);
    gl.deleteTexture(this.depthTexture);
    
    // Delete framebuffer
    if (this.framebuffer) {
      gl.deleteFramebuffer(this.framebuffer);
      gl.deleteTexture(this.framebufferTexture);
    }
    
    // Delete shader programs
    gl.deleteProgram(this.programInfo.program);
    gl.deleteProgram(this.depthProgramInfo.program);
    
    // Lose context
    const loseContext = gl.getExtension('WEBGL_lose_context');
    if (loseContext) {
      loseContext.loseContext();
    }
    
    this.isInitialized = false;
  }
}

/**
 * Create a WebGL renderer
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {WebGLRenderer|null} WebGL renderer or null if WebGL is not supported
 */
export function createWebGLRenderer(canvas) {
  try {
    const renderer = new WebGLRenderer(canvas);
    
    if (renderer.isInitialized) {
      console.log('WebGL renderer created successfully');
      return renderer;
    } else {
      console.warn('WebGL initialization failed, falling back to Canvas 2D');
      return null;
    }
  } catch (error) {
    console.error('Failed to create WebGL renderer:', error);
    return null;
  }
}
