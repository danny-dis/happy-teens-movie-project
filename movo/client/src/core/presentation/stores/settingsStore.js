/**
 * Settings Store for Movo
 * Provides a Zustand store for application settings
 * 
 * @author zophlic
 */

import { createStoreWithSelectors } from '../hooks/useStore';
import configService from '../../infrastructure/config/ConfigService';
import loggingService from '../../infrastructure/logging/LoggingService';
import telemetryService from '../../infrastructure/telemetry/TelemetryService';

// Theme options
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Language options
export const LANGUAGE = {
  ENGLISH: 'en',
  SPANISH: 'es',
  FRENCH: 'fr',
  GERMAN: 'de',
  JAPANESE: 'ja',
  KOREAN: 'ko',
  CHINESE: 'zh'
};

// Quality options
export const QUALITY = {
  AUTO: 'auto',
  LOW: '480p',
  MEDIUM: '720p',
  HIGH: '1080p',
  ULTRA: '4k'
};

// Create settings store
const settingsStore = createStoreWithSelectors(
  (set, get) => ({
    // State
    theme: configService.get('ui.theme', THEME.SYSTEM),
    language: configService.get('ui.language', LANGUAGE.ENGLISH),
    chimeraMode: configService.get('features.chimeraMode', true),
    autoplay: configService.get('player.autoplay', true),
    defaultQuality: configService.get('player.defaultQuality', QUALITY.AUTO),
    subtitlesEnabled: configService.get('player.subtitles', true),
    subtitlesLanguage: configService.get('player.subtitlesLanguage', LANGUAGE.ENGLISH),
    reducedMotion: configService.get('ui.reducedMotion', false),
    developerMode: configService.get('features.developerMode', false),
    experimentalFeatures: configService.get('features.experimentalFeatures', false),
    
    // Actions
    setTheme: (theme) => {
      set({ theme });
      configService.set('ui.theme', theme);
      
      // Apply theme to document
      document.documentElement.classList.remove(...Object.values(THEME));
      
      if (theme === THEME.SYSTEM) {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 
          THEME.DARK : THEME.LIGHT;
        document.documentElement.classList.add(systemTheme);
      } else {
        document.documentElement.classList.add(theme);
      }
      
      // Track event
      telemetryService.trackEvent('settings', 'change_theme', { theme });
    },
    
    setLanguage: (language) => {
      set({ language });
      configService.set('ui.language', language);
      
      // Track event
      telemetryService.trackEvent('settings', 'change_language', { language });
    },
    
    toggleChimeraMode: () => {
      const chimeraMode = !get().chimeraMode;
      set({ chimeraMode });
      configService.set('features.chimeraMode', chimeraMode);
      
      // Track event
      telemetryService.trackEvent('settings', 'toggle_chimera_mode', { enabled: chimeraMode });
    },
    
    setAutoplay: (autoplay) => {
      set({ autoplay });
      configService.set('player.autoplay', autoplay);
      
      // Track event
      telemetryService.trackEvent('settings', 'change_autoplay', { enabled: autoplay });
    },
    
    setDefaultQuality: (quality) => {
      set({ defaultQuality: quality });
      configService.set('player.defaultQuality', quality);
      
      // Track event
      telemetryService.trackEvent('settings', 'change_default_quality', { quality });
    },
    
    toggleSubtitles: () => {
      const subtitlesEnabled = !get().subtitlesEnabled;
      set({ subtitlesEnabled });
      configService.set('player.subtitles', subtitlesEnabled);
      
      // Track event
      telemetryService.trackEvent('settings', 'toggle_subtitles', { enabled: subtitlesEnabled });
    },
    
    setSubtitlesLanguage: (language) => {
      set({ subtitlesLanguage: language });
      configService.set('player.subtitlesLanguage', language);
      
      // Track event
      telemetryService.trackEvent('settings', 'change_subtitles_language', { language });
    },
    
    toggleReducedMotion: () => {
      const reducedMotion = !get().reducedMotion;
      set({ reducedMotion });
      configService.set('ui.reducedMotion', reducedMotion);
      
      // Apply reduced motion to document
      if (reducedMotion) {
        document.documentElement.classList.add('reduced-motion');
      } else {
        document.documentElement.classList.remove('reduced-motion');
      }
      
      // Track event
      telemetryService.trackEvent('settings', 'toggle_reduced_motion', { enabled: reducedMotion });
    },
    
    toggleDeveloperMode: () => {
      const developerMode = !get().developerMode;
      set({ developerMode });
      configService.set('features.developerMode', developerMode);
      
      // Track event
      telemetryService.trackEvent('settings', 'toggle_developer_mode', { enabled: developerMode });
    },
    
    toggleExperimentalFeatures: () => {
      const experimentalFeatures = !get().experimentalFeatures;
      set({ experimentalFeatures });
      configService.set('features.experimentalFeatures', experimentalFeatures);
      
      // Track event
      telemetryService.trackEvent('settings', 'toggle_experimental_features', { enabled: experimentalFeatures });
    },
    
    resetSettings: () => {
      // Reset to defaults
      const defaults = {
        theme: THEME.SYSTEM,
        language: LANGUAGE.ENGLISH,
        chimeraMode: true,
        autoplay: true,
        defaultQuality: QUALITY.AUTO,
        subtitlesEnabled: true,
        subtitlesLanguage: LANGUAGE.ENGLISH,
        reducedMotion: false,
        developerMode: false,
        experimentalFeatures: false
      };
      
      set(defaults);
      
      // Update config
      for (const [key, value] of Object.entries(defaults)) {
        switch (key) {
          case 'theme':
            configService.set('ui.theme', value);
            break;
          case 'language':
            configService.set('ui.language', value);
            break;
          case 'chimeraMode':
            configService.set('features.chimeraMode', value);
            break;
          case 'autoplay':
            configService.set('player.autoplay', value);
            break;
          case 'defaultQuality':
            configService.set('player.defaultQuality', value);
            break;
          case 'subtitlesEnabled':
            configService.set('player.subtitles', value);
            break;
          case 'subtitlesLanguage':
            configService.set('player.subtitlesLanguage', value);
            break;
          case 'reducedMotion':
            configService.set('ui.reducedMotion', value);
            break;
          case 'developerMode':
            configService.set('features.developerMode', value);
            break;
          case 'experimentalFeatures':
            configService.set('features.experimentalFeatures', value);
            break;
        }
      }
      
      // Apply theme and reduced motion
      document.documentElement.classList.remove(...Object.values(THEME), 'reduced-motion');
      
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 
        THEME.DARK : THEME.LIGHT;
      document.documentElement.classList.add(systemTheme);
      
      // Track event
      telemetryService.trackEvent('settings', 'reset_settings');
    }
  }),
  
  // Selectors
  {
    theme: (state) => state.theme,
    language: (state) => state.language,
    chimeraMode: (state) => state.chimeraMode,
    autoplay: (state) => state.autoplay,
    defaultQuality: (state) => state.defaultQuality,
    subtitlesEnabled: (state) => state.subtitlesEnabled,
    subtitlesLanguage: (state) => state.subtitlesLanguage,
    reducedMotion: (state) => state.reducedMotion,
    developerMode: (state) => state.developerMode,
    experimentalFeatures: (state) => state.experimentalFeatures,
    activeTheme: (state) => {
      if (state.theme === THEME.SYSTEM) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 
          THEME.DARK : THEME.LIGHT;
      }
      return state.theme;
    }
  },
  
  // Options
  {
    persist: true,
    name: 'settings'
  }
);

// Initialize theme on load
const { theme, reducedMotion } = settingsStore.getState();

// Apply theme to document
document.documentElement.classList.remove(...Object.values(THEME));

if (theme === THEME.SYSTEM) {
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 
    THEME.DARK : THEME.LIGHT;
  document.documentElement.classList.add(systemTheme);
} else {
  document.documentElement.classList.add(theme);
}

// Apply reduced motion
if (reducedMotion) {
  document.documentElement.classList.add('reduced-motion');
}

// Listen for system theme changes
if (theme === THEME.SYSTEM) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    document.documentElement.classList.remove(THEME.LIGHT, THEME.DARK);
    document.documentElement.classList.add(e.matches ? THEME.DARK : THEME.LIGHT);
  });
}

export const {
  useStore,
  useTheme,
  useLanguage,
  useChimeraMode,
  useAutoplay,
  useDefaultQuality,
  useSubtitlesEnabled,
  useSubtitlesLanguage,
  useReducedMotion,
  useDeveloperMode,
  useExperimentalFeatures,
  useActiveTheme
} = settingsStore;

export default settingsStore;
