/**
 * Token System for Incentives
 * 
 * Provides incentives for network participation:
 * - Token rewards for content sharing
 * - Reputation tracking
 * - Contribution metrics
 * 
 * @author zophlic
 */

import { LocalStorage } from '../storage/localStorage';
import { createHash } from '../crypto/hash';

export class TokenSystem {
  constructor(identity) {
    this.identity = identity;
    this.storage = new LocalStorage('tokens');
    this.balance = 0;
    this.transactions = [];
    this.contributionMetrics = {
      bandwidth: 0,
      storage: 0,
      uptime: 0,
      contentQuality: 0,
      totalContributions: 0
    };
    this.reputationScore = 0;
    this.initialized = false;
    
    // Constants for reward calculation
    this.REWARD_RATES = {
      bandwidth: 0.1, // tokens per MB
      storage: 0.05, // tokens per MB per day
      uptime: 0.2, // tokens per hour
      contentQuality: 1.0 // tokens per quality content
    };
  }
  
  /**
   * Initialize the token system
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Ensure identity is initialized
      if (!this.identity.initialized) {
        await this.identity.initialize();
      }
      
      // Load token data
      const savedBalance = await this.storage.get('balance');
      if (savedBalance !== null) {
        this.balance = savedBalance;
      }
      
      const savedTransactions = await this.storage.get('transactions');
      if (savedTransactions) {
        this.transactions = savedTransactions;
      }
      
      const savedMetrics = await this.storage.get('contributionMetrics');
      if (savedMetrics) {
        this.contributionMetrics = savedMetrics;
      }
      
      const savedReputation = await this.storage.get('reputationScore');
      if (savedReputation !== null) {
        this.reputationScore = savedReputation;
      }
      
      this.initialized = true;
      console.log('Token system initialized');
      
      // Start periodic reward calculation
      this._startPeriodicRewards();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize token system:', error);
      return false;
    }
  }
  
  /**
   * Get token balance
   * @returns {number} Token balance
   */
  getBalance() {
    return this.balance;
  }
  
  /**
   * Get transaction history
   * @param {Object} options - Query options
   * @returns {Array} Transaction history
   */
  getTransactions(options = {}) {
    let filteredTransactions = [...this.transactions];
    
    // Apply type filter
    if (options.type) {
      filteredTransactions = filteredTransactions.filter(tx => 
        tx.type === options.type
      );
    }
    
    // Sort by timestamp (descending)
    filteredTransactions.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit
    if (options.limit && options.limit > 0) {
      filteredTransactions = filteredTransactions.slice(0, options.limit);
    }
    
    return filteredTransactions;
  }
  
  /**
   * Get contribution metrics
   * @returns {Object} Contribution metrics
   */
  getContributionMetrics() {
    return { ...this.contributionMetrics };
  }
  
  /**
   * Get reputation score
   * @returns {number} Reputation score
   */
  getReputationScore() {
    return this.reputationScore;
  }
  
  /**
   * Record contribution to the network
   * @param {string} type - Contribution type
   * @param {number} amount - Contribution amount
   * @param {Object} details - Additional details
   * @returns {Promise<Object>} Contribution record
   */
  async recordContribution(type, amount, details = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Validate contribution type
      if (!['bandwidth', 'storage', 'uptime', 'contentQuality'].includes(type)) {
        throw new Error(`Invalid contribution type: ${type}`);
      }
      
      // Create contribution record
      const contribution = {
        type,
        amount,
        details,
        timestamp: Date.now(),
        userId: this.identity.getPublicKey()
      };
      
      // Update metrics
      this.contributionMetrics[type] += amount;
      this.contributionMetrics.totalContributions++;
      
      // Save metrics
      await this.storage.set('contributionMetrics', this.contributionMetrics);
      
      // Calculate immediate reward if applicable
      let reward = 0;
      
      if (type === 'contentQuality' && amount > 0) {
        // Immediate reward for quality content
        reward = amount * this.REWARD_RATES.contentQuality;
        await this._addReward(reward, `Quality content reward`, { contribution });
      }
      
      return contribution;
    } catch (error) {
      console.error('Failed to record contribution:', error);
      throw error;
    }
  }
  
  /**
   * Transfer tokens to another user
   * @param {string} recipientId - Recipient's public key
   * @param {number} amount - Amount to transfer
   * @param {string} memo - Transfer memo
   * @returns {Promise<Object>} Transaction record
   */
  async transferTokens(recipientId, amount, memo = '') {
    if (!this.initialized) await this.initialize();
    
    try {
      // Validate amount
      if (amount <= 0) {
        throw new Error('Transfer amount must be positive');
      }
      
      // Check balance
      if (amount > this.balance) {
        throw new Error('Insufficient balance for transfer');
      }
      
      // Create transaction
      const transaction = {
        type: 'transfer',
        from: this.identity.getPublicKey(),
        to: recipientId,
        amount,
        memo,
        timestamp: Date.now(),
        id: await this._generateTransactionId()
      };
      
      // Sign transaction
      transaction.signature = await this.identity.signData(JSON.stringify({
        from: transaction.from,
        to: transaction.to,
        amount: transaction.amount,
        memo: transaction.memo,
        timestamp: transaction.timestamp,
        id: transaction.id
      }));
      
      // Update balance
      this.balance -= amount;
      await this.storage.set('balance', this.balance);
      
      // Add to transaction history
      this.transactions.push(transaction);
      await this.storage.set('transactions', this.transactions);
      
      return transaction;
    } catch (error) {
      console.error('Failed to transfer tokens:', error);
      throw error;
    }
  }
  
  /**
   * Start periodic reward calculations
   * @private
   */
  _startPeriodicRewards() {
    // Calculate rewards every hour
    setInterval(() => this._calculatePeriodicRewards(), 60 * 60 * 1000);
    
    // Update reputation score every day
    setInterval(() => this._updateReputationScore(), 24 * 60 * 60 * 1000);
    
    // Reset certain metrics monthly
    setInterval(() => this._resetMonthlyMetrics(), 30 * 24 * 60 * 60 * 1000);
  }
  
  /**
   * Calculate periodic rewards
   * @private
   */
  async _calculatePeriodicRewards() {
    try {
      // Calculate bandwidth reward
      const bandwidthReward = this.contributionMetrics.bandwidth * this.REWARD_RATES.bandwidth;
      
      // Calculate storage reward
      const storageReward = this.contributionMetrics.storage * this.REWARD_RATES.storage;
      
      // Calculate uptime reward
      const uptimeReward = this.contributionMetrics.uptime * this.REWARD_RATES.uptime;
      
      // Total reward
      const totalReward = bandwidthReward + storageReward + uptimeReward;
      
      if (totalReward > 0) {
        await this._addReward(totalReward, 'Periodic contribution reward', {
          bandwidth: bandwidthReward,
          storage: storageReward,
          uptime: uptimeReward
        });
      }
      
      // Reset hourly metrics
      this.contributionMetrics.bandwidth = 0;
      this.contributionMetrics.uptime = 1; // 1 hour of uptime
      
      // Save metrics
      await this.storage.set('contributionMetrics', this.contributionMetrics);
    } catch (error) {
      console.error('Failed to calculate periodic rewards:', error);
    }
  }
  
  /**
   * Update reputation score
   * @private
   */
  async _updateReputationScore() {
    try {
      // Calculate reputation based on contribution history and token balance
      const contributionFactor = Math.min(this.contributionMetrics.totalContributions / 100, 10);
      const balanceFactor = Math.min(this.balance / 1000, 5);
      const transactionFactor = Math.min(this.transactions.length / 50, 5);
      
      // New reputation score (0-100)
      const newScore = Math.min(
        contributionFactor * 5 + balanceFactor * 3 + transactionFactor * 2,
        100
      );
      
      // Smooth transition to new score (70% old, 30% new)
      this.reputationScore = this.reputationScore * 0.7 + newScore * 0.3;
      
      // Save reputation score
      await this.storage.set('reputationScore', this.reputationScore);
    } catch (error) {
      console.error('Failed to update reputation score:', error);
    }
  }
  
  /**
   * Reset monthly metrics
   * @private
   */
  async _resetMonthlyMetrics() {
    try {
      // Reset storage metric (recalculate based on actual storage)
      this.contributionMetrics.storage = 0;
      
      // Save metrics
      await this.storage.set('contributionMetrics', this.contributionMetrics);
    } catch (error) {
      console.error('Failed to reset monthly metrics:', error);
    }
  }
  
  /**
   * Add reward to balance
   * @private
   * @param {number} amount - Reward amount
   * @param {string} reason - Reward reason
   * @param {Object} details - Additional details
   * @returns {Promise<Object>} Transaction record
   */
  async _addReward(amount, reason, details = {}) {
    // Create transaction
    const transaction = {
      type: 'reward',
      to: this.identity.getPublicKey(),
      amount,
      memo: reason,
      details,
      timestamp: Date.now(),
      id: await this._generateTransactionId()
    };
    
    // Update balance
    this.balance += amount;
    await this.storage.set('balance', this.balance);
    
    // Add to transaction history
    this.transactions.push(transaction);
    await this.storage.set('transactions', this.transactions);
    
    return transaction;
  }
  
  /**
   * Generate transaction ID
   * @private
   * @returns {Promise<string>} Transaction ID
   */
  async _generateTransactionId() {
    const data = {
      user: this.identity.getPublicKey(),
      timestamp: Date.now(),
      random: Math.random().toString()
    };
    
    return await createHash(JSON.stringify(data));
  }
}
