/**
 * Decentralized Computation Service
 *
 * Distributed processing framework that harnesses the collective computational power
 * of the peer network. Enables complex processing tasks to be distributed across
 * multiple devices.
 *
 * Core capabilities:
 * - Task distribution across peer network
 * - Resource management and scheduling
 * - Fault tolerance and result verification
 * - Privacy-preserving computation
 *
 * @author zophlic
 */

import { createHash } from '../crypto/hash';
import homomorphicEncryption from '../crypto/homomorphicEncryption';

class DecentralizedComputationService {
  constructor() {
    this.initialized = false;
    this.isActive = false;
    this.deviceId = null;
    this.tasks = new Map();
    this.workers = new Map();
    this.results = new Map();
    this.resourceMonitor = null;
    this.settings = {
      maxConcurrentTasks: 2,
      maxResourceUsage: 0.7, // 70% of available resources
      minTaskReward: 10,
      verificationLevel: 'medium', // 'low', 'medium', 'high'
      enablePrivacyPreservation: true,
      taskTimeout: 60000 // 60 seconds
    };
    this.stats = {
      tasksSubmitted: 0,
      tasksCompleted: 0,
      tasksReceived: 0,
      computationTime: 0,
      resourcesContributed: 0,
      rewardsEarned: 0
    };
    this.eventListeners = {};
  }

  /**
   * Initialize the Decentralized Computation service
   * @param {Object} options - Initialization options
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(options = {}) {
    if (this.initialized) return true;

    try {
      console.log('Initializing Decentralized Computation service...');

      // Override default settings
      if (options.settings) {
        this.settings = {
          ...this.settings,
          ...options.settings
        };
      }

      // Generate device ID if not already set
      this.deviceId = localStorage.getItem('computation_device_id');
      if (!this.deviceId) {
        this.deviceId = await this._generateDeviceId();
        localStorage.setItem('computation_device_id', this.deviceId);
      }

      // Initialize homomorphic encryption if privacy preservation is enabled
      if (this.settings.enablePrivacyPreservation) {
        await homomorphicEncryption.initialize();
      }

      // Start resource monitoring
      this._startResourceMonitoring();

      // Load stats from local storage
      this._loadStats();

      this.initialized = true;
      console.log('Decentralized Computation service initialized with device ID:', this.deviceId);

      return true;
    } catch (error) {
      console.error('Failed to initialize Decentralized Computation service:', error);
      return false;
    }
  }

  /**
   * Start the computation service
   * @returns {Promise<boolean>} Success status
   */
  async start() {
    if (!this.initialized) await this.initialize();

    if (this.isActive) {
      console.log('Decentralized Computation service is already active');
      return true;
    }

    try {
      console.log('Starting Decentralized Computation service...');

      // Register as a worker
      await this._registerAsWorker();

      this.isActive = true;
      this._triggerEvent('serviceStarted', { deviceId: this.deviceId });

      return true;
    } catch (error) {
      console.error('Failed to start Decentralized Computation service:', error);
      return false;
    }
  }

  /**
   * Stop the computation service
   * @returns {Promise<boolean>} Success status
   */
  async stop() {
    if (!this.isActive) {
      console.log('Decentralized Computation service is not active');
      return true;
    }

    try {
      console.log('Stopping Decentralized Computation service...');

      // Unregister as a worker
      await this._unregisterAsWorker();

      // Cancel all running tasks
      await this._cancelAllTasks();

      this.isActive = false;
      this._triggerEvent('serviceStopped', { deviceId: this.deviceId });

      return true;
    } catch (error) {
      console.error('Failed to stop Decentralized Computation service:', error);
      return false;
    }
  }

  /**
   * Submit a task for distributed computation
   * @param {Object} task - Task to submit
   * @returns {Promise<string>} Task ID
   */
  async submitTask(task) {
    if (!this.initialized) await this.initialize();

    try {
      console.log('Submitting task for distributed computation...');

      // Validate task
      if (!task || typeof task !== 'object') {
        throw new Error('Invalid task');
      }

      if (!task.type || !task.data) {
        throw new Error('Task must have type and data');
      }

      // Generate task ID
      const taskId = await this._generateTaskId(task);

      // Apply privacy preservation if enabled
      let processedTask = task;
      if (this.settings.enablePrivacyPreservation && task.privacy === 'preserve') {
        processedTask = await this._applyPrivacyPreservation(task);
      }

      // Create task record
      const taskRecord = {
        id: taskId,
        type: processedTask.type,
        data: processedTask.data,
        submitter: this.deviceId,
        status: 'pending',
        priority: processedTask.priority || 'normal',
        reward: processedTask.reward || this.settings.minTaskReward,
        privacy: processedTask.privacy || 'none',
        verification: processedTask.verification || this.settings.verificationLevel,
        submittedAt: Date.now(),
        timeout: processedTask.timeout || this.settings.taskTimeout
      };

      // Store task
      this.tasks.set(taskId, taskRecord);

      // Update stats
      this.stats.tasksSubmitted++;
      this._saveStats();

      // Trigger event
      this._triggerEvent('taskSubmitted', { taskId, task: taskRecord });

      // Distribute the task
      this._distributeTask(taskId);

      return taskId;
    } catch (error) {
      console.error('Failed to submit task:', error);
      throw error;
    }
  }

  /**
   * Get task status
   * @param {string} taskId - Task ID
   * @returns {Promise<Object>} Task status
   */
  async getTaskStatus(taskId) {
    if (!this.initialized) await this.initialize();

    try {
      // Check if task exists
      if (!this.tasks.has(taskId)) {
        throw new Error(`Task ${taskId} not found`);
      }

      const task = this.tasks.get(taskId);

      // Get result if available
      let result = null;
      if (task.status === 'completed' && this.results.has(taskId)) {
        result = this.results.get(taskId);

        // Remove privacy preservation if needed
        if (task.privacy === 'preserve' && this.settings.enablePrivacyPreservation) {
          result = await this._removePrivacyPreservation(result);
        }
      }

      return {
        id: taskId,
        status: task.status,
        submittedAt: task.submittedAt,
        completedAt: task.completedAt,
        worker: task.worker,
        result,
        error: task.error
      };
    } catch (error) {
      console.error(`Failed to get status for task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a task
   * @param {string} taskId - Task ID
   * @returns {Promise<boolean>} Success status
   */
  async cancelTask(taskId) {
    if (!this.initialized) await this.initialize();

    try {
      // Check if task exists
      if (!this.tasks.has(taskId)) {
        throw new Error(`Task ${taskId} not found`);
      }

      const task = this.tasks.get(taskId);

      // Check if task can be cancelled
      if (task.status === 'completed' || task.status === 'failed') {
        throw new Error(`Task ${taskId} is already ${task.status}`);
      }

      // Update task status
      task.status = 'cancelled';
      task.cancelledAt = Date.now();

      // Trigger event
      this._triggerEvent('taskCancelled', { taskId, task });

      return true;
    } catch (error) {
      console.error(`Failed to cancel task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get service statistics
   * @returns {Object} Service statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      isActive: this.isActive,
      deviceId: this.deviceId,
      taskCount: this.tasks.size,
      workerCount: this.workers.size,
      settings: { ...this.settings }
    };
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  addEventListener(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }

    this.eventListeners[event].push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  removeEventListener(event, callback) {
    if (!this.eventListeners[event]) return;

    this.eventListeners[event] = this.eventListeners[event].filter(
      cb => cb !== callback
    );
  }

  /**
   * Generate a device ID
   * @private
   * @returns {Promise<string>} Device ID
   */
  async _generateDeviceId() {
    // Generate a unique device ID
    const randomPart = Math.random().toString(36).substring(2, 10);
    const timePart = Date.now().toString(36);

    // Create a hash
    const deviceData = {
      random: randomPart,
      time: timePart,
      userAgent: navigator.userAgent
    };

    const hash = await createHash(JSON.stringify(deviceData));
    return `compute-${hash.substring(0, 12)}`;
  }

  /**
   * Generate a task ID
   * @private
   * @param {Object} task - Task object
   * @returns {Promise<string>} Task ID
   */
  async _generateTaskId(task) {
    // Create a hash of the task
    const taskData = {
      type: task.type,
      data: task.data,
      submitter: this.deviceId,
      timestamp: Date.now()
    };

    const hash = await createHash(JSON.stringify(taskData));
    return `task-${hash.substring(0, 12)}`;
  }

  /**
   * Start resource monitoring - optimized for lower resource usage
   * @private
   */
  _startResourceMonitoring() {
    console.log('Starting resource monitoring...');

    // In a real implementation, this would monitor CPU, memory, and network usage
    // For now, we'll simulate it with optimized resource usage

    this.resourceMonitor = {
      cpu: 0.2, // Start with reasonable defaults
      memory: 0.15,
      network: 0.1,
      battery: 1.0,
      available: true,
      lastUpdate: Date.now()
    };

    // Use requestAnimationFrame for more efficient updates when tab is active
    // and reduce update frequency when tab is inactive
    const updateResources = () => {
      const now = Date.now();
      const timeSinceLastUpdate = now - this.resourceMonitor.lastUpdate;

      // Only update every 10 seconds to reduce resource usage
      if (timeSinceLastUpdate >= 10000) {
        // Use more deterministic values instead of random for better performance
        // and more predictable behavior
        const cpuTrend = Math.sin(now / 10000) * 0.1 + 0.2; // 10-30% with sinusoidal pattern
        const memoryTrend = Math.sin(now / 15000) * 0.1 + 0.15; // 5-25% with sinusoidal pattern

        this.resourceMonitor.cpu = Math.max(0.1, Math.min(0.5, cpuTrend));
        this.resourceMonitor.memory = Math.max(0.1, Math.min(0.4, memoryTrend));
        this.resourceMonitor.network = 0.1 + (this.isActive ? 0.1 : 0); // Higher when active

        // Simulate battery level (decreasing very slowly)
        this.resourceMonitor.battery = Math.max(0.2, this.resourceMonitor.battery - 0.001);

        // Check if resources are available
        this.resourceMonitor.available =
          this.resourceMonitor.cpu < this.settings.maxResourceUsage &&
          this.resourceMonitor.memory < this.settings.maxResourceUsage &&
          this.resourceMonitor.battery > 0.2;

        // Update timestamp
        this.resourceMonitor.lastUpdate = now;

        // Only trigger event when there's a significant change
        this._triggerEvent('resourceUpdate', {
          cpu: this.resourceMonitor.cpu,
          memory: this.resourceMonitor.memory,
          network: this.resourceMonitor.network,
          battery: this.resourceMonitor.battery,
          available: this.resourceMonitor.available
        });
      }

      // Schedule next update
      requestAnimationFrame(updateResources);
    };

    // Start the update loop
    requestAnimationFrame(updateResources);
  }

  /**
   * Register as a worker
   * @private
   * @returns {Promise<void>}
   */
  async _registerAsWorker() {
    console.log('Registering as a worker...');

    // In a real implementation, this would register with the P2P network
    // For now, we'll simulate it

    // Create worker info
    const worker = {
      id: this.deviceId,
      capabilities: {
        cpu: navigator.hardwareConcurrency || 4,
        memory: 4 * 1024 * 1024 * 1024, // 4GB (simulated)
        taskTypes: ['transcode', 'analyze', 'render', 'compute']
      },
      availability: {
        cpu: 1 - this.resourceMonitor.cpu,
        memory: 1 - this.resourceMonitor.memory,
        battery: this.resourceMonitor.battery
      },
      reputation: 0.8 + Math.random() * 0.2, // 0.8-1.0
      registeredAt: Date.now()
    };

    // Add to workers
    this.workers.set(this.deviceId, worker);

    // Simulate other workers
    for (let i = 0; i < 5; i++) {
      const workerId = `compute-${Math.random().toString(36).substring(2, 14)}`;

      const otherWorker = {
        id: workerId,
        capabilities: {
          cpu: Math.floor(Math.random() * 8) + 2,
          memory: (Math.floor(Math.random() * 8) + 2) * 1024 * 1024 * 1024,
          taskTypes: ['transcode', 'analyze', 'render', 'compute'].filter(() => Math.random() > 0.3)
        },
        availability: {
          cpu: Math.random() * 0.8,
          memory: Math.random() * 0.8,
          battery: Math.random() * 0.8 + 0.2
        },
        reputation: 0.5 + Math.random() * 0.5,
        registeredAt: Date.now() - Math.floor(Math.random() * 3600000)
      };

      this.workers.set(workerId, otherWorker);
    }
  }

  /**
   * Unregister as a worker
   * @private
   * @returns {Promise<void>}
   */
  async _unregisterAsWorker() {
    console.log('Unregistering as a worker...');

    // In a real implementation, this would unregister from the P2P network
    // For now, we'll simulate it

    // Remove from workers
    this.workers.delete(this.deviceId);

    // Clear other workers
    this.workers.clear();
  }

  /**
   * Cancel all tasks
   * @private
   * @returns {Promise<void>}
   */
  async _cancelAllTasks() {
    console.log(`Cancelling ${this.tasks.size} tasks...`);

    // Cancel each task
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.status === 'pending' || task.status === 'processing') {
        task.status = 'cancelled';
        task.cancelledAt = Date.now();

        // Trigger event
        this._triggerEvent('taskCancelled', { taskId, task });
      }
    }
  }

  /**
   * Distribute a task
   * @private
   * @param {string} taskId - Task ID
   * @returns {Promise<void>}
   */
  async _distributeTask(taskId) {
    const task = this.tasks.get(taskId);

    if (!task) return;

    console.log(`Distributing task ${taskId}...`);

    // Find suitable workers
    const suitableWorkers = Array.from(this.workers.values())
      .filter(worker =>
        worker.capabilities.taskTypes.includes(task.type) &&
        worker.availability.cpu > 0.3 &&
        worker.availability.memory > 0.3
      )
      .sort((a, b) =>
        (b.reputation * b.availability.cpu) - (a.reputation * a.availability.cpu)
      );

    if (suitableWorkers.length === 0) {
      console.log(`No suitable workers found for task ${taskId}`);

      // Process locally if no workers available
      this._processTaskLocally(taskId);
      return;
    }

    // Select a worker
    const selectedWorker = suitableWorkers[0];

    console.log(`Selected worker ${selectedWorker.id} for task ${taskId}`);

    // Assign task to worker
    task.worker = selectedWorker.id;
    task.status = 'assigned';
    task.assignedAt = Date.now();

    // Trigger event
    this._triggerEvent('taskAssigned', { taskId, workerId: selectedWorker.id });

    // Simulate task processing
    if (selectedWorker.id === this.deviceId) {
      // Process locally
      this._processTaskLocally(taskId);
    } else {
      // Simulate remote processing
      this._simulateRemoteProcessing(taskId);
    }
  }

  /**
   * Process a task locally
   * @private
   * @param {string} taskId - Task ID
   * @returns {Promise<void>}
   */
  async _processTaskLocally(taskId) {
    const task = this.tasks.get(taskId);

    if (!task) return;

    console.log(`Processing task ${taskId} locally...`);

    // Update task status
    task.status = 'processing';
    task.startedAt = Date.now();

    // Trigger event
    this._triggerEvent('taskStarted', { taskId, task });

    // Simulate processing time based on task type
    let processingTime;
    switch (task.type) {
      case 'transcode':
        processingTime = 5000 + Math.random() * 5000;
        break;
      case 'analyze':
        processingTime = 2000 + Math.random() * 3000;
        break;
      case 'render':
        processingTime = 8000 + Math.random() * 7000;
        break;
      case 'compute':
        processingTime = 3000 + Math.random() * 4000;
        break;
      default:
        processingTime = 4000 + Math.random() * 4000;
    }

    // Process the task
    setTimeout(async () => {
      try {
        // Simulate task result
        const result = await this._simulateTaskResult(task);

        // Verify result
        const isValid = await this._verifyResult(taskId, result);

        if (isValid) {
          // Update task status
          task.status = 'completed';
          task.completedAt = Date.now();

          // Store result
          this.results.set(taskId, result);

          // Update stats
          this.stats.tasksCompleted++;
          this.stats.computationTime += (task.completedAt - task.startedAt);
          this._saveStats();

          // Trigger event
          this._triggerEvent('taskCompleted', { taskId, result });

          console.log(`Task ${taskId} completed successfully`);
        } else {
          // Update task status
          task.status = 'failed';
          task.error = 'Result verification failed';

          // Trigger event
          this._triggerEvent('taskFailed', { taskId, error: task.error });

          console.log(`Task ${taskId} failed: ${task.error}`);
        }
      } catch (error) {
        // Update task status
        task.status = 'failed';
        task.error = error.message;

        // Trigger event
        this._triggerEvent('taskFailed', { taskId, error: task.error });

        console.error(`Task ${taskId} failed:`, error);
      }
    }, processingTime);
  }

  /**
   * Simulate remote processing
   * @private
   * @param {string} taskId - Task ID
   * @returns {Promise<void>}
   */
  async _simulateRemoteProcessing(taskId) {
    const task = this.tasks.get(taskId);

    if (!task) return;

    console.log(`Simulating remote processing for task ${taskId}...`);

    // Update task status
    task.status = 'processing';
    task.startedAt = Date.now();

    // Trigger event
    this._triggerEvent('taskStarted', { taskId, task });

    // Simulate processing time
    const processingTime = 5000 + Math.random() * 10000;

    // Simulate remote processing
    setTimeout(async () => {
      try {
        // 90% chance of success
        if (Math.random() > 0.1) {
          // Simulate task result
          const result = await this._simulateTaskResult(task);

          // Update task status
          task.status = 'completed';
          task.completedAt = Date.now();

          // Store result
          this.results.set(taskId, result);

          // Trigger event
          this._triggerEvent('taskCompleted', { taskId, result });

          console.log(`Task ${taskId} completed successfully`);
        } else {
          // Simulate failure
          throw new Error('Remote processing failed');
        }
      } catch (error) {
        // Update task status
        task.status = 'failed';
        task.error = error.message;

        // Trigger event
        this._triggerEvent('taskFailed', { taskId, error: task.error });

        console.error(`Task ${taskId} failed:`, error);
      }
    }, processingTime);
  }

  /**
   * Simulate task result - optimized for lower resource usage
   * @private
   * @param {Object} task - Task object
   * @returns {Promise<Object>} Task result
   */
  async _simulateTaskResult(task) {
    // Use task ID as a seed for deterministic results instead of random
    const taskIdSum = task.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

    // Simulate different results based on task type
    switch (task.type) {
      case 'transcode':
        return {
          url: `https://example.com/transcoded/${task.data.fileId || 'default'}`,
          format: task.data.targetFormat || 'mp4',
          duration: 1800 + (taskIdSum % 1800), // 30-60 minutes
          size: 50000000 + (taskIdSum * 1000000) % 950000000, // 50-1000 MB
          quality: 'high'
        };

      case 'analyze':
        // Use deterministic values based on contentId
        const contentId = task.data.contentId || 'unknown';
        const contentIdSum = contentId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

        return {
          contentId,
          analysis: {
            duration: 3600 + (contentIdSum % 3600), // 1-2 hours
            scenes: 20 + (contentIdSum % 80), // 20-100 scenes
            keyframes: 200 + (contentIdSum % 800), // 200-1000 keyframes
            metadata: {
              title: `Content ${contentId}`,
              description: 'Automatically analyzed content',
              // Deterministic tags based on contentId
              tags: [
                contentIdSum % 2 === 0 ? 'movie' : 'show',
                contentIdSum % 3 === 0 ? 'drama' : 'comedy',
                contentIdSum % 5 === 0 ? 'action' : 'documentary'
              ].filter(Boolean)
            }
          }
        };

      case 'render':
        return {
          renderId: `render-${task.id.substring(5, 13)}`, // Deterministic ID based on task ID
          resolution: task.data.resolution || '1080p',
          frames: 2000 + (taskIdSum % 8000), // 2000-10000 frames
          renderTime: 600 + (taskIdSum % 3000), // 10-60 minutes
          url: `https://example.com/rendered/${task.id}`
        };

      case 'compute':
        // Generate deterministic computation result
        const result = {};

        if (task.data.operation === 'matrix') {
          const size = task.data.size || 4;
          result.matrix = Array(size);

          // Pre-allocate arrays for better performance
          for (let i = 0; i < size; i++) {
            result.matrix[i] = Array(size);
            for (let j = 0; j < size; j++) {
              // Deterministic values based on task ID, i, and j
              result.matrix[i][j] = ((taskIdSum + i * size + j) % 100) + 1;
            }
          }
        } else if (task.data.operation === 'hash') {
          // Generate a deterministic hash based on task ID
          result.hash = task.id.split('').map(c =>
            (c.charCodeAt(0) + taskIdSum).toString(16)
          ).join('').substring(0, 32);
        } else {
          // Deterministic value based on task ID
          result.value = 100 + (taskIdSum % 900);
        }

        return result;

      default:
        return {
          taskId: task.id,
          timestamp: Date.now(),
          result: 'Completed'
        };
    }
  }

  /**
   * Verify task result
   * @private
   * @param {string} taskId - Task ID
   * @param {Object} result - Task result
   * @returns {Promise<boolean>} Whether the result is valid
   */
  async _verifyResult(taskId, result) {
    const task = this.tasks.get(taskId);

    if (!task) return false;

    console.log(`Verifying result for task ${taskId}...`);

    // In a real implementation, this would perform actual verification
    // For now, we'll simulate it based on verification level

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verification probability based on level
    let verificationProbability;
    switch (task.verification) {
      case 'low':
        verificationProbability = 0.95;
        break;
      case 'medium':
        verificationProbability = 0.98;
        break;
      case 'high':
        verificationProbability = 0.995;
        break;
      default:
        verificationProbability = 0.98;
    }

    // Simulate verification result
    return Math.random() < verificationProbability;
  }

  /**
   * Apply privacy preservation
   * @private
   * @param {Object} task - Task object
   * @returns {Promise<Object>} Privacy-preserved task
   */
  async _applyPrivacyPreservation(task) {
    console.log(`Applying privacy preservation to task...`);

    // In a real implementation, this would use homomorphic encryption
    // For now, we'll simulate it

    // Clone the task
    const preservedTask = { ...task };

    // Encrypt sensitive data
    if (typeof task.data === 'object') {
      preservedTask.data = {};

      for (const [key, value] of Object.entries(task.data)) {
        if (typeof value === 'number') {
          // Encrypt numbers with homomorphic encryption
          preservedTask.data[key] = await homomorphicEncryption.encrypt(value);
        } else {
          // Keep non-numeric values as is
          preservedTask.data[key] = value;
        }
      }
    }

    return preservedTask;
  }

  /**
   * Remove privacy preservation
   * @private
   * @param {Object} result - Task result
   * @returns {Promise<Object>} Decrypted result
   */
  async _removePrivacyPreservation(result) {
    console.log(`Removing privacy preservation from result...`);

    // In a real implementation, this would use homomorphic encryption
    // For now, we'll simulate it

    // Clone the result
    const decryptedResult = { ...result };

    // Decrypt values recursively
    const decryptObject = async (obj) => {
      const result = {};

      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object' && value.metadata && value.value) {
          // This looks like an encrypted value
          result[key] = await homomorphicEncryption.decrypt(value);
        } else if (value && typeof value === 'object') {
          // Recurse into nested objects
          result[key] = await decryptObject(value);
        } else {
          // Keep other values as is
          result[key] = value;
        }
      }

      return result;
    };

    // Decrypt the result
    return await decryptObject(decryptedResult);
  }

  /**
   * Load stats from local storage
   * @private
   */
  _loadStats() {
    try {
      const storedStats = localStorage.getItem('computation_stats');
      if (storedStats) {
        this.stats = JSON.parse(storedStats);
      }
    } catch (error) {
      console.warn('Failed to load computation stats:', error);
    }
  }

  /**
   * Save stats to local storage
   * @private
   */
  _saveStats() {
    try {
      localStorage.setItem('computation_stats', JSON.stringify(this.stats));
    } catch (error) {
      console.warn('Failed to save computation stats:', error);
    }
  }

  /**
   * Trigger an event
   * @private
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  _triggerEvent(event, data) {
    if (!this.eventListeners[event]) return;

    for (const callback of this.eventListeners[event]) {
      callback(data);
    }
  }
}

export default new DecentralizedComputationService();
