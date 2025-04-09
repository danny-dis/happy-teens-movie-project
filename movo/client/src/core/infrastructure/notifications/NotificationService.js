/**
 * Notification Service for Movo
 * Provides push notification functionality
 *
 * @author zophlic
 */

import loggingService from '../logging/LoggingService';
import telemetryService from '../telemetry/TelemetryService';
import configService from '../config/ConfigService';
import { serviceWorkerRegistration } from '../../../serviceWorkerRegistration';

// Notification types
export const NOTIFICATION_TYPE = {
  CONTENT_UPDATE: 'content_update',
  RECOMMENDATION: 'recommendation',
  WATCHLIST: 'watchlist',
  WATCH_LATER_REMINDER: 'watch_later_reminder',
  SYSTEM: 'system',
  SOCIAL: 'social',
  DOWNLOAD_COMPLETE: 'download_complete',
  WATCH_PARTY: 'watch_party'
};

/**
 * Notification service class
 */
export class NotificationService {
  constructor() {
    this.enabled = configService.get('notifications.enabled', true);
    this.subscription = null;
    this.applicationServerKey = configService.get('notifications.applicationServerKey', '');

    // Notification preferences
    this.preferences = {
      [NOTIFICATION_TYPE.CONTENT_UPDATE]: configService.get('notifications.contentUpdates', true),
      [NOTIFICATION_TYPE.RECOMMENDATION]: configService.get('notifications.recommendations', true),
      [NOTIFICATION_TYPE.WATCHLIST]: configService.get('notifications.watchlist', true),
      [NOTIFICATION_TYPE.WATCH_LATER_REMINDER]: configService.get('notifications.watchLaterReminders', true),
      [NOTIFICATION_TYPE.SYSTEM]: configService.get('notifications.system', true),
      [NOTIFICATION_TYPE.SOCIAL]: configService.get('notifications.social', true),
      [NOTIFICATION_TYPE.DOWNLOAD_COMPLETE]: configService.get('notifications.downloadComplete', true),
      [NOTIFICATION_TYPE.WATCH_PARTY]: configService.get('notifications.watchParty', true)
    };

    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.requestPermission = this.requestPermission.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
    this.sendNotification = this.sendNotification.bind(this);
    this.sendTypedNotification = this.sendTypedNotification.bind(this);
    this.enable = this.enable.bind(this);
    this.disable = this.disable.bind(this);
    this.setTypePreference = this.setTypePreference.bind(this);
    this.getStatus = this.getStatus.bind(this);

    // Initialize if supported and enabled
    if (this.isSupported() && this.enabled) {
      this.initialize();
    }
  }

  /**
   * Check if notifications are supported
   * @returns {boolean} Whether notifications are supported
   */
  isSupported() {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    if (!this.isSupported()) {
      loggingService.warn('Push notifications are not supported in this browser');
      return;
    }

    try {
      // Check permission
      const permission = Notification.permission;

      if (permission === 'granted') {
        // Get existing subscription
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          this.subscription = subscription;
          loggingService.info('Push notification subscription found');
        }
      }

      loggingService.info('Notification service initialized');
    } catch (error) {
      loggingService.error('Failed to initialize notification service', { error });
    }
  }

  /**
   * Request notification permission
   * @returns {Promise<string>} Permission status
   */
  async requestPermission() {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();

      // Track event
      telemetryService.trackEvent('notifications', 'permission_request', {
        status: permission
      });

      loggingService.info('Notification permission request result:', { permission });

      return permission;
    } catch (error) {
      loggingService.error('Failed to request notification permission', { error });
      return 'denied';
    }
  }

  /**
   * Subscribe to push notifications
   * @returns {Promise<PushSubscription|null>} Push subscription
   */
  async subscribe() {
    if (!this.isSupported() || !this.enabled) {
      return null;
    }

    try {
      // Request permission if needed
      if (Notification.permission !== 'granted') {
        const permission = await this.requestPermission();

        if (permission !== 'granted') {
          return null;
        }
      }

      // Subscribe to push notifications
      const subscription = await serviceWorkerRegistration.subscribeToPushNotifications({
        applicationServerKey: this.applicationServerKey
      });

      this.subscription = subscription;

      // Save subscription to server
      await this._saveSubscription(subscription);

      // Track event
      telemetryService.trackEvent('notifications', 'subscribe', {
        success: true
      });

      loggingService.info('Subscribed to push notifications');

      return subscription;
    } catch (error) {
      loggingService.error('Failed to subscribe to push notifications', { error });

      // Track event
      telemetryService.trackEvent('notifications', 'subscribe', {
        success: false,
        error: error.message
      });

      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   * @returns {Promise<boolean>} Whether unsubscription was successful
   */
  async unsubscribe() {
    if (!this.isSupported() || !this.subscription) {
      return false;
    }

    try {
      // Unsubscribe from push notifications
      const success = await serviceWorkerRegistration.unsubscribeFromPushNotifications();

      if (success) {
        // Delete subscription from server
        await this._deleteSubscription(this.subscription);

        this.subscription = null;

        // Track event
        telemetryService.trackEvent('notifications', 'unsubscribe', {
          success: true
        });

        loggingService.info('Unsubscribed from push notifications');
      }

      return success;
    } catch (error) {
      loggingService.error('Failed to unsubscribe from push notifications', { error });

      // Track event
      telemetryService.trackEvent('notifications', 'unsubscribe', {
        success: false,
        error: error.message
      });

      return false;
    }
  }

  /**
   * Send a local notification
   * @param {Object} options - Notification options
   * @param {string} options.title - Notification title
   * @param {string} options.body - Notification body
   * @param {string} options.icon - Notification icon
   * @param {string} options.tag - Notification tag
   * @param {Object} options.data - Notification data
   * @param {Array} options.actions - Notification actions
   * @returns {Promise<Notification|null>} Notification object
   */
  async sendNotification(options) {
    if (!this.isSupported() || !this.enabled) {
      return null;
    }

    try {
      // Request permission if needed
      if (Notification.permission !== 'granted') {
        const permission = await this.requestPermission();

        if (permission !== 'granted') {
          return null;
        }
      }

      // Create notification
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/logo192.png',
        badge: '/badge.png',
        tag: options.tag,
        data: options.data,
        actions: options.actions
      });

      // Set up event handlers
      notification.onclick = (event) => {
        event.preventDefault();

        // Handle click
        if (options.onClick) {
          options.onClick(event);
        }

        // Focus window
        if (window.parent) {
          window.parent.focus();
        }
        window.focus();

        // Close notification
        notification.close();

        // Track event
        telemetryService.trackEvent('notifications', 'click', {
          title: options.title,
          tag: options.tag
        });
      };

      notification.onclose = () => {
        // Track event
        telemetryService.trackEvent('notifications', 'close', {
          title: options.title,
          tag: options.tag
        });
      };

      // Track event
      telemetryService.trackEvent('notifications', 'show', {
        title: options.title,
        tag: options.tag
      });

      loggingService.info('Notification sent', { title: options.title });

      return notification;
    } catch (error) {
      loggingService.error('Failed to send notification', { error, options });
      return null;
    }
  }

  /**
   * Send a typed notification
   * @param {string} type - Notification type
   * @param {Object} options - Notification options
   * @returns {Promise<Notification|null>} Notification object
   */
  async sendTypedNotification(type, options) {
    // Check if this notification type is enabled
    if (!this.preferences[type]) {
      loggingService.debug(`Notification type ${type} is disabled`);
      return null;
    }

    // Add type to data
    const data = options.data || {};
    data.type = type;

    // Set default icon based on type
    let icon = options.icon;
    if (!icon) {
      switch (type) {
        case NOTIFICATION_TYPE.CONTENT_UPDATE:
          icon = '/icons/content-update.png';
          break;
        case NOTIFICATION_TYPE.RECOMMENDATION:
          icon = '/icons/recommendation.png';
          break;
        case NOTIFICATION_TYPE.WATCHLIST:
          icon = '/icons/watchlist.png';
          break;
        case NOTIFICATION_TYPE.WATCH_LATER_REMINDER:
          icon = '/icons/reminder.png';
          break;
        case NOTIFICATION_TYPE.SOCIAL:
          icon = '/icons/social.png';
          break;
        case NOTIFICATION_TYPE.DOWNLOAD_COMPLETE:
          icon = '/icons/download.png';
          break;
        case NOTIFICATION_TYPE.WATCH_PARTY:
          icon = '/icons/watch-party.png';
          break;
        default:
          icon = '/logo192.png';
      }
    }

    // Send notification with updated options
    return this.sendNotification({
      ...options,
      icon,
      data,
      tag: options.tag || `movo-${type}-${Date.now()}`
    });
  }

  /**
   * Enable notifications
   */
  enable() {
    this.enabled = true;
    configService.set('notifications.enabled', true);

    // Initialize if not already
    if (!this.subscription && this.isSupported()) {
      this.initialize();
    }

    loggingService.info('Notifications enabled');
  }

  /**
   * Disable notifications
   */
  disable() {
    this.enabled = false;
    configService.set('notifications.enabled', false);

    // Unsubscribe if subscribed
    if (this.subscription) {
      this.unsubscribe();
    }

    loggingService.info('Notifications disabled');
  }

  /**
   * Set notification type preference
   * @param {string} type - Notification type
   * @param {boolean} enabled - Whether the notification type is enabled
   */
  setTypePreference(type, enabled) {
    if (this.preferences[type] !== undefined) {
      this.preferences[type] = enabled;
      configService.set(`notifications.${type}`, enabled);

      loggingService.info(`Notification type ${type} ${enabled ? 'enabled' : 'disabled'}`);

      // Track event
      telemetryService.trackEvent('notifications', 'set_preference', {
        type,
        enabled
      });
    }
  }

  /**
   * Get notification status
   * @returns {Object} Notification status
   */
  getStatus() {
    return {
      supported: this.isSupported(),
      enabled: this.enabled,
      permission: Notification.permission,
      subscribed: !!this.subscription,
      preferences: { ...this.preferences }
    };
  }

  /**
   * Get subscription status
   * @returns {Object} Subscription status
   */
  getStatus() {
    return {
      supported: this.isSupported(),
      enabled: this.enabled,
      permission: Notification.permission,
      subscribed: !!this.subscription
    };
  }

  /**
   * Save subscription to server
   * @private
   * @param {PushSubscription} subscription - Push subscription
   * @returns {Promise<boolean>} Whether save was successful
   */
  async _saveSubscription(subscription) {
    try {
      // In a real implementation, this would send the subscription to a server
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 500));

      loggingService.debug('Saved push subscription to server');
      return true;
    } catch (error) {
      loggingService.error('Failed to save push subscription', { error });
      return false;
    }
  }

  /**
   * Delete subscription from server
   * @private
   * @param {PushSubscription} subscription - Push subscription
   * @returns {Promise<boolean>} Whether deletion was successful
   */
  async _deleteSubscription(subscription) {
    try {
      // In a real implementation, this would delete the subscription from a server
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 500));

      loggingService.debug('Deleted push subscription from server');
      return true;
    } catch (error) {
      loggingService.error('Failed to delete push subscription', { error });
      return false;
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
