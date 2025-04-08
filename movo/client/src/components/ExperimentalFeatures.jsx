import React, { useState, useEffect } from 'react';
import './ExperimentalFeatures.css';

/**
 * Experimental Features Component
 * 
 * Provides toggles for cutting-edge experimental features that are still in development.
 * These features may be unstable or resource-intensive, so they're disabled by default.
 * 
 * @author zophlic
 */
const ExperimentalFeatures = ({ preferences, updatePreferences }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [featureToToggle, setFeatureToToggle] = useState(null);
  const [showRestartNotice, setShowRestartNotice] = useState(false);
  
  // Initialize experimental features from preferences or defaults
  const [experimentalFeatures, setExperimentalFeatures] = useState(
    preferences.experimentalFeatures || {
      extendedReality: false,
      aiGeneratedContent: false,
      nextGenFormats: false,
      quantumResistantCrypto: false,
      neuralEnhancement: false,
      spatialAudio: false,
      dynamicAdaptation: false,
      realTimeTranslation: false,
      lightFieldVideo: false,
      neuralRendering: false
    }
  );
  
  // Update parent component when features change
  useEffect(() => {
    updatePreferences({
      ...preferences,
      experimentalFeatures
    });
    
    // Check if any features were enabled that require restart
    const restartFeatures = ['quantumResistantCrypto', 'nextGenFormats', 'extendedReality'];
    const needsRestart = restartFeatures.some(feature => 
      experimentalFeatures[feature] !== (preferences.experimentalFeatures?.[feature] || false)
    );
    
    if (needsRestart) {
      setShowRestartNotice(true);
    }
  }, [experimentalFeatures]);
  
  // Handle toggle with confirmation for resource-intensive features
  const handleToggleFeature = (feature) => {
    // Features that need confirmation before enabling
    const intensiveFeatures = [
      'extendedReality', 
      'nextGenFormats', 
      'neuralRendering', 
      'lightFieldVideo'
    ];
    
    if (intensiveFeatures.includes(feature) && !experimentalFeatures[feature]) {
      setFeatureToToggle(feature);
      setShowConfirmation(true);
    } else {
      // Toggle feature directly for non-intensive features or when disabling
      setExperimentalFeatures({
        ...experimentalFeatures,
        [feature]: !experimentalFeatures[feature]
      });
    }
  };
  
  // Confirm enabling resource-intensive feature
  const confirmEnableFeature = () => {
    if (featureToToggle) {
      setExperimentalFeatures({
        ...experimentalFeatures,
        [featureToToggle]: true
      });
      setShowConfirmation(false);
      setFeatureToToggle(null);
    }
  };
  
  // Cancel enabling resource-intensive feature
  const cancelEnableFeature = () => {
    setShowConfirmation(false);
    setFeatureToToggle(null);
  };
  
  // Get feature description
  const getFeatureDescription = (feature) => {
    const descriptions = {
      extendedReality: "Enable VR cinema experience, AR content overlays, and spatial audio features. Requires compatible hardware.",
      aiGeneratedContent: "Use AI to generate personalized trailers, recaps, and content summaries based on your preferences.",
      nextGenFormats: "Support for 8K HDR, high frame rate content, and advanced color spaces. May require powerful hardware.",
      quantumResistantCrypto: "Implement future-proof cryptography designed to withstand quantum computing attacks. May affect performance.",
      neuralEnhancement: "Use neural networks to enhance video quality, upscale resolution, and improve color grading in real-time.",
      spatialAudio: "Experience 3D audio that adapts to your position and viewing environment. Works best with headphones.",
      dynamicAdaptation: "Automatically adapt content for different aspect ratios and devices using AI-powered scene analysis.",
      realTimeTranslation: "AI-powered real-time translation and voice synthesis for global content in multiple languages.",
      lightFieldVideo: "Support for volumetric video that allows changing perspective after recording. Experimental format.",
      neuralRendering: "AI-enhanced upscaling and frame interpolation for smoother playback of any content."
    };
    
    return descriptions[feature] || "No description available.";
  };
  
  // Get warning level for feature
  const getFeatureWarningLevel = (feature) => {
    const warningLevels = {
      extendedReality: "high",
      aiGeneratedContent: "medium",
      nextGenFormats: "high",
      quantumResistantCrypto: "medium",
      neuralEnhancement: "medium",
      spatialAudio: "low",
      dynamicAdaptation: "medium",
      realTimeTranslation: "low",
      lightFieldVideo: "high",
      neuralRendering: "medium"
    };
    
    return warningLevels[feature] || "low";
  };
  
  return (
    <div className="experimental-features-container">
      <div className="experimental-header">
        <h2>Experimental Features</h2>
        <div className="experimental-badge">BETA</div>
      </div>
      
      <div className="experimental-warning">
        <div className="warning-icon">⚠️</div>
        <p>
          These features are experimental and may affect stability, performance, or battery life.
          Enable only if you want to test cutting-edge functionality that is still in development.
          <span className="zophlic-signature">Curated by zophlic</span>
        </p>
      </div>
      
      {showRestartNotice && (
        <div className="restart-notice">
          <p>Some changes will take effect after restarting the application.</p>
          <button 
            className="restart-btn"
            onClick={() => window.location.reload()}
          >
            Restart Now
          </button>
          <button 
            className="dismiss-btn"
            onClick={() => setShowRestartNotice(false)}
          >
            Later
          </button>
        </div>
      )}
      
      <div className="features-grid">
        <div className="features-category">
          <h3>Extended Reality</h3>
          <div className="feature-item">
            <div className="feature-info">
              <label className="feature-toggle">
                <input
                  type="checkbox"
                  checked={experimentalFeatures.extendedReality}
                  onChange={() => handleToggleFeature('extendedReality')}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="feature-text">
                <h4>VR Cinema & AR Overlays</h4>
                <p>{getFeatureDescription('extendedReality')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('extendedReality')}`}>
              {getFeatureWarningLevel('extendedReality').toUpperCase()}
            </div>
          </div>
          
          <div className="feature-item">
            <div className="feature-info">
              <label className="feature-toggle">
                <input
                  type="checkbox"
                  checked={experimentalFeatures.spatialAudio}
                  onChange={() => handleToggleFeature('spatialAudio')}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="feature-text">
                <h4>Spatial Audio</h4>
                <p>{getFeatureDescription('spatialAudio')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('spatialAudio')}`}>
              {getFeatureWarningLevel('spatialAudio').toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="features-category">
          <h3>AI-Generated Content</h3>
          <div className="feature-item">
            <div className="feature-info">
              <label className="feature-toggle">
                <input
                  type="checkbox"
                  checked={experimentalFeatures.aiGeneratedContent}
                  onChange={() => handleToggleFeature('aiGeneratedContent')}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="feature-text">
                <h4>Personalized Content Creation</h4>
                <p>{getFeatureDescription('aiGeneratedContent')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('aiGeneratedContent')}`}>
              {getFeatureWarningLevel('aiGeneratedContent').toUpperCase()}
            </div>
          </div>
          
          <div className="feature-item">
            <div className="feature-info">
              <label className="feature-toggle">
                <input
                  type="checkbox"
                  checked={experimentalFeatures.dynamicAdaptation}
                  onChange={() => handleToggleFeature('dynamicAdaptation')}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="feature-text">
                <h4>Dynamic Content Adaptation</h4>
                <p>{getFeatureDescription('dynamicAdaptation')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('dynamicAdaptation')}`}>
              {getFeatureWarningLevel('dynamicAdaptation').toUpperCase()}
            </div>
          </div>
          
          <div className="feature-item">
            <div className="feature-info">
              <label className="feature-toggle">
                <input
                  type="checkbox"
                  checked={experimentalFeatures.realTimeTranslation}
                  onChange={() => handleToggleFeature('realTimeTranslation')}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="feature-text">
                <h4>Real-time Translation & Dubbing</h4>
                <p>{getFeatureDescription('realTimeTranslation')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('realTimeTranslation')}`}>
              {getFeatureWarningLevel('realTimeTranslation').toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="features-category">
          <h3>Next-Gen Content Formats</h3>
          <div className="feature-item">
            <div className="feature-info">
              <label className="feature-toggle">
                <input
                  type="checkbox"
                  checked={experimentalFeatures.nextGenFormats}
                  onChange={() => handleToggleFeature('nextGenFormats')}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="feature-text">
                <h4>8K HDR Support</h4>
                <p>{getFeatureDescription('nextGenFormats')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('nextGenFormats')}`}>
              {getFeatureWarningLevel('nextGenFormats').toUpperCase()}
            </div>
          </div>
          
          <div className="feature-item">
            <div className="feature-info">
              <label className="feature-toggle">
                <input
                  type="checkbox"
                  checked={experimentalFeatures.lightFieldVideo}
                  onChange={() => handleToggleFeature('lightFieldVideo')}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="feature-text">
                <h4>Light Field Video</h4>
                <p>{getFeatureDescription('lightFieldVideo')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('lightFieldVideo')}`}>
              {getFeatureWarningLevel('lightFieldVideo').toUpperCase()}
            </div>
          </div>
          
          <div className="feature-item">
            <div className="feature-info">
              <label className="feature-toggle">
                <input
                  type="checkbox"
                  checked={experimentalFeatures.neuralRendering}
                  onChange={() => handleToggleFeature('neuralRendering')}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="feature-text">
                <h4>Neural Rendering</h4>
                <p>{getFeatureDescription('neuralRendering')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('neuralRendering')}`}>
              {getFeatureWarningLevel('neuralRendering').toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="features-category">
          <h3>Advanced Security</h3>
          <div className="feature-item">
            <div className="feature-info">
              <label className="feature-toggle">
                <input
                  type="checkbox"
                  checked={experimentalFeatures.quantumResistantCrypto}
                  onChange={() => handleToggleFeature('quantumResistantCrypto')}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="feature-text">
                <h4>Quantum-Resistant Cryptography</h4>
                <p>{getFeatureDescription('quantumResistantCrypto')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('quantumResistantCrypto')}`}>
              {getFeatureWarningLevel('quantumResistantCrypto').toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="features-category">
          <h3>Neural Enhancement</h3>
          <div className="feature-item">
            <div className="feature-info">
              <label className="feature-toggle">
                <input
                  type="checkbox"
                  checked={experimentalFeatures.neuralEnhancement}
                  onChange={() => handleToggleFeature('neuralEnhancement')}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="feature-text">
                <h4>AI Video Enhancement</h4>
                <p>{getFeatureDescription('neuralEnhancement')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('neuralEnhancement')}`}>
              {getFeatureWarningLevel('neuralEnhancement').toUpperCase()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="confirmation-content">
            <h3>Enable Resource-Intensive Feature?</h3>
            <p>
              This feature may significantly impact system performance, battery life, 
              and device temperature. It requires substantial computational resources 
              and may not work well on all devices.
            </p>
            <p>
              <strong>Feature:</strong> {featureToToggle && 
                featureToToggle.replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())}
            </p>
            <div className="confirmation-actions">
              <button 
                className="cancel-btn"
                onClick={cancelEnableFeature}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn"
                onClick={confirmEnableFeature}
              >
                Enable Anyway
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="telemetry-notice">
        <p>
          Usage data for experimental features is collected to help improve them.
          You can disable this in Privacy Settings.
        </p>
      </div>
    </div>
  );
};

export default ExperimentalFeatures;
