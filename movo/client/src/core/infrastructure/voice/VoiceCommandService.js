/**
 * Voice Command Service for Movo
 * Provides voice command recognition and handling
 *
 * @author zophlic
 */

import loggingService from '../logging/LoggingService';
import telemetryService from '../telemetry/TelemetryService';
import configService from '../config/ConfigService';

// Command types
export const COMMAND_TYPE = {
  PLAYBACK: 'playback',
  NAVIGATION: 'navigation',
  SEARCH: 'search',
  SYSTEM: 'system',
  DEVICE: 'device',
  SOCIAL: 'social'
};

// Command actions
export const COMMAND_ACTION = {
  // Playback commands
  PLAY: 'play',
  PAUSE: 'pause',
  STOP: 'stop',
  SEEK_FORWARD: 'seek_forward',
  SEEK_BACKWARD: 'seek_backward',
  VOLUME_UP: 'volume_up',
  VOLUME_DOWN: 'volume_down',
  MUTE: 'mute',
  UNMUTE: 'unmute',
  NEXT: 'next',
  PREVIOUS: 'previous',
  SKIP_INTRO: 'skip_intro',
  SKIP_CREDITS: 'skip_credits',

  // Navigation commands
  GO_HOME: 'go_home',
  GO_BACK: 'go_back',
  GO_FORWARD: 'go_forward',
  GO_TO: 'go_to',

  // Search commands
  SEARCH: 'search',
  FILTER: 'filter',
  RECOMMENDATIONS: 'recommendations',

  // System commands
  TOGGLE_THEME: 'toggle_theme',
  TOGGLE_FULLSCREEN: 'toggle_fullscreen',
  TOGGLE_SUBTITLES: 'toggle_subtitles',
  HELP: 'help',
  TOGGLE_CHIMERA: 'toggle_chimera',

  // Device commands
  CAST_TO_DEVICE: 'cast_to_device',
  STOP_CASTING: 'stop_casting',
  CONNECT_DEVICE: 'connect_device',
  DISCONNECT_DEVICE: 'disconnect_device',

  // Social commands
  SHARE: 'share',
  START_WATCH_PARTY: 'start_watch_party',
  JOIN_WATCH_PARTY: 'join_watch_party',
  INVITE_FRIEND: 'invite_friend'
};

/**
 * Voice command service class
 */
export class VoiceCommandService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.commandHandlers = new Map();
    this.commandPatterns = new Map();
    this.language = configService.get('ui.language', 'en');
    this.enabled = configService.get('features.voiceCommands', true);

    // Bind methods
    this.initialize = this.initialize.bind(this);
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.toggle = this.toggle.bind(this);
    this.registerCommand = this.registerCommand.bind(this);
    this.unregisterCommand = this.unregisterCommand.bind(this);
    this.setLanguage = this.setLanguage.bind(this);
    this.enable = this.enable.bind(this);
    this.disable = this.disable.bind(this);

    // Initialize if supported
    if (this.isSupported() && this.enabled) {
      this.initialize();
    }
  }

  /**
   * Check if speech recognition is supported
   * @returns {boolean} Whether speech recognition is supported
   */
  isSupported() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  /**
   * Initialize speech recognition
   */
  initialize() {
    if (!this.isSupported()) {
      loggingService.warn('Speech recognition is not supported in this browser');
      return;
    }

    try {
      // Create speech recognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      // Configure recognition
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = this.language;

      // Set up event handlers
      this.recognition.onstart = this._handleStart.bind(this);
      this.recognition.onend = this._handleEnd.bind(this);
      this.recognition.onresult = this._handleResult.bind(this);
      this.recognition.onerror = this._handleError.bind(this);

      // Register default commands
      this._registerDefaultCommands();

      loggingService.info('Voice command service initialized');
    } catch (error) {
      loggingService.error('Failed to initialize voice command service', { error });
    }
  }

  /**
   * Start listening for voice commands
   */
  start() {
    if (!this.isSupported() || !this.enabled) {
      return;
    }

    if (this.isListening) {
      return;
    }

    try {
      this.recognition.start();
      loggingService.info('Voice command listening started');
    } catch (error) {
      loggingService.error('Failed to start voice command listening', { error });
    }
  }

  /**
   * Stop listening for voice commands
   */
  stop() {
    if (!this.isSupported() || !this.enabled) {
      return;
    }

    if (!this.isListening) {
      return;
    }

    try {
      this.recognition.stop();
      loggingService.info('Voice command listening stopped');
    } catch (error) {
      loggingService.error('Failed to stop voice command listening', { error });
    }
  }

  /**
   * Toggle listening for voice commands
   * @returns {boolean} Whether listening is active after toggle
   */
  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }

    return this.isListening;
  }

  /**
   * Register a command handler
   * @param {string} type - Command type
   * @param {string} action - Command action
   * @param {Function} handler - Command handler
   * @param {Array<string>} patterns - Command patterns
   */
  registerCommand(type, action, handler, patterns = []) {
    const commandKey = `${type}:${action}`;

    // Register handler
    this.commandHandlers.set(commandKey, handler);

    // Register patterns
    patterns.forEach(pattern => {
      this.commandPatterns.set(pattern.toLowerCase(), { type, action });
    });

    loggingService.debug(`Registered command: ${commandKey}`, { patterns });
  }

  /**
   * Unregister a command handler
   * @param {string} type - Command type
   * @param {string} action - Command action
   */
  unregisterCommand(type, action) {
    const commandKey = `${type}:${action}`;

    // Unregister handler
    this.commandHandlers.delete(commandKey);

    // Unregister patterns
    for (const [pattern, command] of this.commandPatterns.entries()) {
      if (command.type === type && command.action === action) {
        this.commandPatterns.delete(pattern);
      }
    }

    loggingService.debug(`Unregistered command: ${commandKey}`);
  }

  /**
   * Set recognition language
   * @param {string} language - Language code (e.g. 'en-US')
   */
  setLanguage(language) {
    if (!this.isSupported() || !this.recognition) {
      return;
    }

    this.language = language;
    this.recognition.lang = language;

    // Restart recognition if active
    if (this.isListening) {
      this.stop();
      this.start();
    }

    loggingService.debug(`Voice command language set to: ${language}`);
  }

  /**
   * Enable voice commands
   */
  enable() {
    this.enabled = true;
    configService.set('features.voiceCommands', true);

    if (!this.recognition && this.isSupported()) {
      this.initialize();
    }

    loggingService.info('Voice commands enabled');
  }

  /**
   * Disable voice commands
   */
  disable() {
    this.enabled = false;
    configService.set('features.voiceCommands', false);

    if (this.isListening) {
      this.stop();
    }

    loggingService.info('Voice commands disabled');
  }

  /**
   * Handle recognition start
   * @private
   */
  _handleStart() {
    this.isListening = true;

    // Dispatch event
    window.dispatchEvent(new CustomEvent('voicecommand:start'));

    loggingService.debug('Voice recognition started');
  }

  /**
   * Handle recognition end
   * @private
   */
  _handleEnd() {
    this.isListening = false;

    // Dispatch event
    window.dispatchEvent(new CustomEvent('voicecommand:end'));

    // Restart if enabled
    if (this.enabled) {
      setTimeout(() => {
        if (this.enabled && !this.isListening) {
          this.start();
        }
      }, 500);
    }

    loggingService.debug('Voice recognition ended');
  }

  /**
   * Handle recognition result
   * @private
   * @param {SpeechRecognitionEvent} event - Recognition event
   */
  _handleResult(event) {
    const result = event.results[event.resultIndex];
    const transcript = result[0].transcript.trim().toLowerCase();

    loggingService.debug('Voice recognition result', { transcript });

    // Check for command match
    let matchedCommand = null;
    let matchedPattern = null;

    for (const [pattern, command] of this.commandPatterns.entries()) {
      if (transcript.includes(pattern)) {
        matchedCommand = command;
        matchedPattern = pattern;
        break;
      }
    }

    if (matchedCommand) {
      const { type, action } = matchedCommand;
      const commandKey = `${type}:${action}`;
      const handler = this.commandHandlers.get(commandKey);

      if (handler) {
        // Extract parameters
        const params = this._extractParameters(transcript, matchedPattern);

        // Execute handler
        try {
          handler(params);

          // Track event
          telemetryService.trackEvent('voice', 'command_executed', {
            type,
            action,
            transcript
          });

          // Dispatch event
          window.dispatchEvent(new CustomEvent('voicecommand:executed', {
            detail: { type, action, params, transcript }
          }));

          loggingService.info('Voice command executed', { type, action, params });
        } catch (error) {
          loggingService.error('Failed to execute voice command', { error, type, action });
        }
      }
    } else {
      // Dispatch event for unrecognized command
      window.dispatchEvent(new CustomEvent('voicecommand:unrecognized', {
        detail: { transcript }
      }));

      loggingService.debug('Unrecognized voice command', { transcript });
    }
  }

  /**
   * Handle recognition error
   * @private
   * @param {SpeechRecognitionError} event - Error event
   */
  _handleError(event) {
    loggingService.error('Voice recognition error', { error: event.error });

    // Dispatch event
    window.dispatchEvent(new CustomEvent('voicecommand:error', {
      detail: { error: event.error }
    }));

    // Restart if not aborted
    if (event.error !== 'aborted' && this.enabled) {
      setTimeout(() => {
        if (this.enabled && !this.isListening) {
          this.start();
        }
      }, 1000);
    }
  }

  /**
   * Extract parameters from transcript
   * @private
   * @param {string} transcript - Recognition transcript
   * @param {string} pattern - Matched pattern
   * @returns {Object} Extracted parameters
   */
  _extractParameters(transcript, pattern) {
    // Simple parameter extraction
    const params = {};

    // Extract numbers
    const numbers = transcript.match(/\d+/g);
    if (numbers) {
      params.number = parseInt(numbers[0], 10);
    }

    // Extract search query
    if (transcript.includes('search for')) {
      const query = transcript.split('search for')[1].trim();
      params.query = query;
    } else if (transcript.includes('search')) {
      const query = transcript.split('search')[1].trim();
      params.query = query;
    }

    // Extract navigation target
    if (transcript.includes('go to')) {
      const target = transcript.split('go to')[1].trim();
      params.target = target;
    }

    return params;
  }

  /**
   * Register default commands
   * @private
   */
  _registerDefaultCommands() {
    // Playback commands
    this.registerCommand(
      COMMAND_TYPE.PLAYBACK,
      COMMAND_ACTION.PLAY,
      () => {
        const event = new CustomEvent('voicecommand:playback:play');
        window.dispatchEvent(event);
      },
      ['play', 'resume', 'start playing', 'continue']
    );

    this.registerCommand(
      COMMAND_TYPE.PLAYBACK,
      COMMAND_ACTION.PAUSE,
      () => {
        const event = new CustomEvent('voicecommand:playback:pause');
        window.dispatchEvent(event);
      },
      ['pause', 'stop playing', 'wait']
    );

    this.registerCommand(
      COMMAND_TYPE.PLAYBACK,
      COMMAND_ACTION.STOP,
      () => {
        const event = new CustomEvent('voicecommand:playback:stop');
        window.dispatchEvent(event);
      },
      ['stop', 'end playback', 'finish']
    );

    this.registerCommand(
      COMMAND_TYPE.PLAYBACK,
      COMMAND_ACTION.SKIP_INTRO,
      () => {
        const event = new CustomEvent('voicecommand:playback:skip_intro');
        window.dispatchEvent(event);
      },
      ['skip intro', 'skip opening', 'skip the intro']
    );

    this.registerCommand(
      COMMAND_TYPE.PLAYBACK,
      COMMAND_ACTION.SKIP_CREDITS,
      () => {
        const event = new CustomEvent('voicecommand:playback:skip_credits');
        window.dispatchEvent(event);
      },
      ['skip credits', 'skip ending', 'skip the credits']
    );

    this.registerCommand(
      COMMAND_TYPE.PLAYBACK,
      COMMAND_ACTION.SEEK_FORWARD,
      (params) => {
        const seconds = params.number || 10;
        const event = new CustomEvent('voicecommand:playback:seek_forward', {
          detail: { seconds }
        });
        window.dispatchEvent(event);
      },
      ['forward', 'skip forward', 'seek forward', 'fast forward']
    );

    this.registerCommand(
      COMMAND_TYPE.PLAYBACK,
      COMMAND_ACTION.SEEK_BACKWARD,
      (params) => {
        const seconds = params.number || 10;
        const event = new CustomEvent('voicecommand:playback:seek_backward', {
          detail: { seconds }
        });
        window.dispatchEvent(event);
      },
      ['backward', 'skip backward', 'seek backward', 'rewind']
    );

    this.registerCommand(
      COMMAND_TYPE.PLAYBACK,
      COMMAND_ACTION.VOLUME_UP,
      (params) => {
        const amount = params.number || 10;
        const event = new CustomEvent('voicecommand:playback:volume_up', {
          detail: { amount }
        });
        window.dispatchEvent(event);
      },
      ['volume up', 'increase volume', 'louder']
    );

    this.registerCommand(
      COMMAND_TYPE.PLAYBACK,
      COMMAND_ACTION.VOLUME_DOWN,
      (params) => {
        const amount = params.number || 10;
        const event = new CustomEvent('voicecommand:playback:volume_down', {
          detail: { amount }
        });
        window.dispatchEvent(event);
      },
      ['volume down', 'decrease volume', 'quieter']
    );

    this.registerCommand(
      COMMAND_TYPE.PLAYBACK,
      COMMAND_ACTION.MUTE,
      () => {
        const event = new CustomEvent('voicecommand:playback:mute');
        window.dispatchEvent(event);
      },
      ['mute', 'silence']
    );

    this.registerCommand(
      COMMAND_TYPE.PLAYBACK,
      COMMAND_ACTION.UNMUTE,
      () => {
        const event = new CustomEvent('voicecommand:playback:unmute');
        window.dispatchEvent(event);
      },
      ['unmute', 'sound on']
    );

    // Navigation commands
    this.registerCommand(
      COMMAND_TYPE.NAVIGATION,
      COMMAND_ACTION.GO_HOME,
      () => {
        const event = new CustomEvent('voicecommand:navigation:go_home');
        window.dispatchEvent(event);
      },
      ['go home', 'home page', 'main page']
    );

    this.registerCommand(
      COMMAND_TYPE.NAVIGATION,
      COMMAND_ACTION.GO_BACK,
      () => {
        const event = new CustomEvent('voicecommand:navigation:go_back');
        window.dispatchEvent(event);
      },
      ['go back', 'previous page']
    );

    this.registerCommand(
      COMMAND_TYPE.NAVIGATION,
      COMMAND_ACTION.GO_TO,
      (params) => {
        const event = new CustomEvent('voicecommand:navigation:go_to', {
          detail: { target: params.target }
        });
        window.dispatchEvent(event);
      },
      ['go to', 'navigate to', 'open']
    );

    // Search commands
    this.registerCommand(
      COMMAND_TYPE.SEARCH,
      COMMAND_ACTION.SEARCH,
      (params) => {
        const event = new CustomEvent('voicecommand:search:search', {
          detail: { query: params.query }
        });
        window.dispatchEvent(event);
      },
      ['search', 'search for', 'find', 'look for']
    );

    // System commands
    this.registerCommand(
      COMMAND_TYPE.SYSTEM,
      COMMAND_ACTION.TOGGLE_FULLSCREEN,
      () => {
        const event = new CustomEvent('voicecommand:system:toggle_fullscreen');
        window.dispatchEvent(event);
      },
      ['fullscreen', 'exit fullscreen', 'toggle fullscreen']
    );

    this.registerCommand(
      COMMAND_TYPE.SYSTEM,
      COMMAND_ACTION.TOGGLE_SUBTITLES,
      () => {
        const event = new CustomEvent('voicecommand:system:toggle_subtitles');
        window.dispatchEvent(event);
      },
      ['subtitles', 'captions', 'toggle subtitles', 'show subtitles', 'hide subtitles']
    );

    this.registerCommand(
      COMMAND_TYPE.SYSTEM,
      COMMAND_ACTION.TOGGLE_THEME,
      () => {
        const event = new CustomEvent('voicecommand:system:toggle_theme');
        window.dispatchEvent(event);
      },
      ['dark mode', 'light mode', 'toggle theme', 'change theme']
    );

    this.registerCommand(
      COMMAND_TYPE.SYSTEM,
      COMMAND_ACTION.HELP,
      () => {
        const event = new CustomEvent('voicecommand:system:help');
        window.dispatchEvent(event);
      },
      ['help', 'commands', 'what can i say', 'voice commands']
    );

    this.registerCommand(
      COMMAND_TYPE.SYSTEM,
      COMMAND_ACTION.TOGGLE_CHIMERA,
      () => {
        const event = new CustomEvent('voicecommand:system:toggle_chimera');
        window.dispatchEvent(event);
      },
      ['toggle chimera', 'switch mode', 'change mode', 'chimera mode']
    );

    // Device commands
    this.registerCommand(
      COMMAND_TYPE.DEVICE,
      COMMAND_ACTION.CAST_TO_DEVICE,
      (params) => {
        const event = new CustomEvent('voicecommand:device:cast_to_device', {
          detail: { deviceName: params.deviceName }
        });
        window.dispatchEvent(event);
      },
      ['cast to', 'cast to tv', 'cast to device', 'play on tv', 'play on device']
    );

    this.registerCommand(
      COMMAND_TYPE.DEVICE,
      COMMAND_ACTION.STOP_CASTING,
      () => {
        const event = new CustomEvent('voicecommand:device:stop_casting');
        window.dispatchEvent(event);
      },
      ['stop casting', 'stop playing on tv', 'disconnect from tv', 'play on this device']
    );

    this.registerCommand(
      COMMAND_TYPE.DEVICE,
      COMMAND_ACTION.CONNECT_DEVICE,
      (params) => {
        const event = new CustomEvent('voicecommand:device:connect_device', {
          detail: { deviceName: params.deviceName }
        });
        window.dispatchEvent(event);
      },
      ['connect to', 'pair with', 'connect device']
    );

    // Social commands
    this.registerCommand(
      COMMAND_TYPE.SOCIAL,
      COMMAND_ACTION.SHARE,
      (params) => {
        const event = new CustomEvent('voicecommand:social:share', {
          detail: { platform: params.platform }
        });
        window.dispatchEvent(event);
      },
      ['share', 'share this', 'share on', 'post to']
    );

    this.registerCommand(
      COMMAND_TYPE.SOCIAL,
      COMMAND_ACTION.START_WATCH_PARTY,
      () => {
        const event = new CustomEvent('voicecommand:social:start_watch_party');
        window.dispatchEvent(event);
      },
      ['start watch party', 'create watch party', 'host watch party', 'watch with friends']
    );

    this.registerCommand(
      COMMAND_TYPE.SOCIAL,
      COMMAND_ACTION.JOIN_WATCH_PARTY,
      (params) => {
        const event = new CustomEvent('voicecommand:social:join_watch_party', {
          detail: { code: params.code }
        });
        window.dispatchEvent(event);
      },
      ['join watch party', 'join party', 'enter party code']
    );
  }
}

// Create singleton instance
const voiceCommandService = new VoiceCommandService();

export default voiceCommandService;
