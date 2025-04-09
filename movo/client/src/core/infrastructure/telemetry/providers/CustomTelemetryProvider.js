/**
 * Custom Telemetry Provider for Movo
 * Provides custom telemetry collection and reporting
 * 
 * @author zophlic
 */

import loggingService from '../../logging/LoggingService';
import configService from '../../config/ConfigService';
import { fetchWithErrorHandling } from '../../errors/ErrorHandlingService';

/**
 * Custom telemetry provider class
 */
export class CustomTelemetryProvider {
  /**
   * @param {Object} options - Provider options
   * @param {string} options.endpoint - Telemetry endpoint URL
   * @param {string} options.apiKey - API key
   * @param {boolean} options.enabled - Whether provider is enabled
   */
  constructor(options = {}) {
    this.endpoint = options.endpoint || configService.get('analytics.custom.endpoint');
    this.apiKey = options.apiKey || configService.get('analytics.custom.apiKey');
    this.enabled = options.enabled !== undefined ? options.enabled : configService.get('analytics.custom.enabled', true);
    this.batchSize = options.batchSize || configService.get('analytics.custom.batchSize', 20);
    this.beaconUrl = this.endpoint;
    
    // Bind methods
    this.sendEvents = this.sendEvents.bind(this);
    this.enable = this.enable.bind(this);
    this.disable = this.disable.bind(this);
  }
  
  /**
   * Send events to custom endpoint
   * @param {Array<Object>} events - Events to send
   * @returns {Promise<boolean>} Whether sending was successful
   */
  async sendEvents(events) {
    if (!this.enabled || !this.endpoint) {
      return false;
    }
    
    try {
      // Split events into batches
      const batches = [];
      for (let i = 0; i < events.length; i += this.batchSize) {
        batches.push(events.slice(i, i + this.batchSize));
      }
      
      // Send batches
      const results = await Promise.all(
        batches.map(batch => this._sendBatch(batch))
      );
      
      // Check if all batches were sent successfully
      return results.every(result => result);
    } catch (error) {
      loggingService.error('Failed to send events to custom endpoint', { error });
      return false;
    }
  }
  
  /**
   * Enable provider
   */
  enable() {
    this.enabled = true;
    configService.set('analytics.custom.enabled', true);
  }
  
  /**
   * Disable provider
   */
  disable() {
    this.enabled = false;
    configService.set('analytics.custom.enabled', false);
  }
  
  /**
   * Send batch of events
   * @private
   * @param {Array<Object>} batch - Batch of events
   * @returns {Promise<boolean>} Whether sending was successful
   */
  async _sendBatch(batch) {
    try {
      // Prepare payload
      const payload = {
        events: batch,
        app: configService.get('app.name', 'Movo'),
        version: configService.get('app.version', '1.0.0'),
        environment: configService.get('app.environment', 'development'),
        timestamp: new Date().toISOString()
      };
      
      // Send payload
      await fetchWithErrorHandling(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(payload)
      });
      
      return true;
    } catch (error) {
      loggingService.error('Failed to send batch to custom endpoint', { error });
      return false;
    }
  }
}

// Create singleton instance
const customTelemetryProvider = new CustomTelemetryProvider();

export default customTelemetryProvider;
