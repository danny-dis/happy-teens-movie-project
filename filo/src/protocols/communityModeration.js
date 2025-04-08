/**
 * Community Moderation System
 * 
 * Provides decentralized content moderation:
 * - Community-based content reporting
 * - Reputation-weighted voting
 * - Consensus-based decisions
 * 
 * @author zophlic
 */

import { LocalStorage } from '../storage/localStorage';
import { createHash } from '../crypto/hash';

export class CommunityModeration {
  constructor(identity) {
    this.identity = identity;
    this.storage = new LocalStorage('moderation');
    this.reports = new Map();
    this.votes = new Map();
    this.moderationResults = new Map();
    this.initialized = false;
    
    // Constants
    this.MINIMUM_VOTES_REQUIRED = 5;
    this.CONSENSUS_THRESHOLD = 0.7; // 70% agreement needed
  }
  
  /**
   * Initialize the moderation system
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Ensure identity is initialized
      if (!this.identity.initialized) {
        await this.identity.initialize();
      }
      
      // Load moderation data
      const savedReports = await this.storage.get('reports');
      if (savedReports) {
        this.reports = new Map(savedReports);
      }
      
      const savedVotes = await this.storage.get('votes');
      if (savedVotes) {
        this.votes = new Map(savedVotes);
      }
      
      const savedResults = await this.storage.get('moderationResults');
      if (savedResults) {
        this.moderationResults = new Map(savedResults);
      }
      
      this.initialized = true;
      console.log('Community moderation system initialized');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize moderation system:', error);
      return false;
    }
  }
  
  /**
   * Report problematic content
   * @param {string} contentId - Content identifier
   * @param {string} reason - Reason for report
   * @param {Object} evidence - Evidence supporting the report
   * @returns {Promise<Object>} Report record
   */
  async reportContent(contentId, reason, evidence = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      console.log('Reporting content:', contentId);
      
      // Create report ID
      const reportId = await this._generateReportId(contentId);
      
      // Create report record
      const report = {
        id: reportId,
        contentId,
        reason,
        evidence,
        reporter: this.identity.getPublicKey(),
        timestamp: Date.now(),
        status: 'pending'
      };
      
      // Sign the report
      report.signature = await this.identity.signData(JSON.stringify({
        contentId: report.contentId,
        reason: report.reason,
        reporter: report.reporter,
        timestamp: report.timestamp
      }));
      
      // Store report
      this.reports.set(reportId, report);
      await this.storage.set('reports', Array.from(this.reports.entries()));
      
      // Automatically cast first vote (from reporter)
      await this.voteOnReport(reportId, 'block');
      
      return report;
    } catch (error) {
      console.error('Failed to report content:', error);
      throw error;
    }
  }
  
  /**
   * Vote on a content report
   * @param {string} reportId - Report identifier
   * @param {string} decision - Voting decision ('allow' or 'block')
   * @returns {Promise<Object>} Vote record
   */
  async voteOnReport(reportId, decision) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Validate decision
      if (!['allow', 'block'].includes(decision)) {
        throw new Error(`Invalid decision: ${decision}`);
      }
      
      // Check if report exists
      if (!this.reports.has(reportId)) {
        throw new Error(`Report not found: ${reportId}`);
      }
      
      const report = this.reports.get(reportId);
      
      // Check if already decided
      if (report.status !== 'pending') {
        throw new Error(`Report already ${report.status}`);
      }
      
      // Get user reputation
      const reputation = await this._getUserReputation();
      
      // Create vote ID
      const voteId = await this._generateVoteId(reportId);
      
      // Create vote record
      const vote = {
        id: voteId,
        reportId,
        decision,
        voter: this.identity.getPublicKey(),
        reputation,
        timestamp: Date.now()
      };
      
      // Sign the vote
      vote.signature = await this.identity.signData(JSON.stringify({
        reportId: vote.reportId,
        decision: vote.decision,
        voter: vote.voter,
        timestamp: vote.timestamp
      }));
      
      // Store vote
      if (!this.votes.has(reportId)) {
        this.votes.set(reportId, []);
      }
      this.votes.get(reportId).push(vote);
      await this.storage.set('votes', Array.from(this.votes.entries()));
      
      // Check if consensus has been reached
      const consensus = await this._checkConsensus(reportId);
      
      if (consensus.status === 'decided') {
        // Update report status
        report.status = consensus.decision;
        report.decidedAt = Date.now();
        this.reports.set(reportId, report);
        await this.storage.set('reports', Array.from(this.reports.entries()));
        
        // Store moderation result
        this.moderationResults.set(report.contentId, {
          contentId: report.contentId,
          decision: consensus.decision,
          confidence: consensus.confidence,
          reportId,
          timestamp: Date.now()
        });
        await this.storage.set('moderationResults', Array.from(this.moderationResults.entries()));
      }
      
      return {
        vote,
        consensus
      };
    } catch (error) {
      console.error('Failed to vote on report:', error);
      throw error;
    }
  }
  
  /**
   * Get content moderation status
   * @param {string} contentId - Content identifier
   * @returns {Object|null} Moderation status
   */
  getModerationStatus(contentId) {
    return this.moderationResults.get(contentId) || null;
  }
  
  /**
   * Check if content is allowed
   * @param {string} contentId - Content identifier
   * @returns {boolean} True if content is allowed or not moderated
   */
  isContentAllowed(contentId) {
    const status = this.getModerationStatus(contentId);
    
    // If no moderation decision, content is allowed
    if (!status) return true;
    
    // Content is allowed if decision is 'allow'
    return status.decision === 'allow';
  }
  
  /**
   * Get all reports
   * @param {Object} options - Query options
   * @returns {Array} Reports
   */
  getReports(options = {}) {
    let reports = Array.from(this.reports.values());
    
    // Filter by status
    if (options.status) {
      reports = reports.filter(report => report.status === options.status);
    }
    
    // Filter by content ID
    if (options.contentId) {
      reports = reports.filter(report => report.contentId === options.contentId);
    }
    
    // Sort by timestamp (descending)
    reports.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit
    if (options.limit && options.limit > 0) {
      reports = reports.slice(0, options.limit);
    }
    
    return reports;
  }
  
  /**
   * Get votes for a report
   * @param {string} reportId - Report identifier
   * @returns {Array} Votes
   */
  getVotes(reportId) {
    return this.votes.get(reportId) || [];
  }
  
  /**
   * Check consensus on a report
   * @private
   * @param {string} reportId - Report identifier
   * @returns {Promise<Object>} Consensus status
   */
  async _checkConsensus(reportId) {
    const votes = this.votes.get(reportId) || [];
    
    // Not enough votes yet
    if (votes.length < this.MINIMUM_VOTES_REQUIRED) {
      return {
        status: 'pending',
        votesNeeded: this.MINIMUM_VOTES_REQUIRED - votes.length
      };
    }
    
    // Calculate weighted votes
    let allowScore = 0;
    let blockScore = 0;
    
    for (const vote of votes) {
      if (vote.decision === 'allow') {
        allowScore += vote.reputation;
      } else {
        blockScore += vote.reputation;
      }
    }
    
    const totalScore = allowScore + blockScore;
    const confidence = Math.abs(allowScore - blockScore) / totalScore;
    
    // Check if consensus threshold is reached
    if (confidence >= this.CONSENSUS_THRESHOLD) {
      return {
        status: 'decided',
        decision: allowScore > blockScore ? 'allow' : 'block',
        confidence,
        allowScore,
        blockScore,
        totalVotes: votes.length
      };
    }
    
    // No consensus yet
    return {
      status: 'pending',
      confidence,
      allowScore,
      blockScore,
      totalVotes: votes.length
    };
  }
  
  /**
   * Get user reputation
   * @private
   * @returns {Promise<number>} User reputation
   */
  async _getUserReputation() {
    // In a real implementation, this would query a reputation system
    // For now, we'll use a simple approach
    
    // Default reputation
    let reputation = 1;
    
    // If identity has a reputation score, use it
    if (this.identity.profile && this.identity.profile.reputation) {
      reputation = this.identity.profile.reputation;
    }
    
    return reputation;
  }
  
  /**
   * Generate report ID
   * @private
   * @param {string} contentId - Content identifier
   * @returns {Promise<string>} Report ID
   */
  async _generateReportId(contentId) {
    const data = {
      contentId,
      reporter: this.identity.getPublicKey(),
      timestamp: Date.now()
    };
    
    return await createHash(JSON.stringify(data));
  }
  
  /**
   * Generate vote ID
   * @private
   * @param {string} reportId - Report identifier
   * @returns {Promise<string>} Vote ID
   */
  async _generateVoteId(reportId) {
    const data = {
      reportId,
      voter: this.identity.getPublicKey(),
      timestamp: Date.now()
    };
    
    return await createHash(JSON.stringify(data));
  }
}
