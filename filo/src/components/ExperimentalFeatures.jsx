import React, { useState, useEffect } from 'react';
import './ExperimentalFeatures.css';

/**
 * Experimental Features Component for Filo
 * 
 * Provides toggles for cutting-edge experimental features that are still in development.
 * Focused on decentralized technologies and advanced P2P capabilities.
 * 
 * @author zophlic
 */
const ExperimentalFeatures = ({ app }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [featureToToggle, setFeatureToToggle] = useState(null);
  const [showRestartNotice, setShowRestartNotice] = useState(false);
  
  // Initialize experimental features from app state or defaults
  const [experimentalFeatures, setExperimentalFeatures] = useState(
    app.state.experimentalFeatures || {
      extendedReality: false,
      aiGeneratedContent: false,
      nextGenFormats: false,
      quantumResistantCrypto: false,
      decentralizedComputation: false,
      homomorphicEncryption: false,
      neuralEnhancement: false,
      spatialAudio: false,
      lightFieldVideo: false,
      neuralRendering: false,
      meshNetworkSupport: false,
      federatedLearning: false
    }
  );
  
  // Update app state when features change
  useEffect(() => {
    if (app && app.updateState) {
      app.updateState({
        experimentalFeatures
      });
      
      // Check if any features were enabled that require restart
      const restartFeatures = [
        'quantumResistantCrypto', 
        'nextGenFormats', 
        'extendedReality',
        'homomorphicEncryption',
        'meshNetworkSupport'
      ];
      
      const needsRestart = restartFeatures.some(feature => 
        experimentalFeatures[feature] !== (app.state.experimentalFeatures?.[feature] || false)
      );
      
      if (needsRestart) {
        setShowRestartNotice(true);
      }
    }
  }, [experimentalFeatures, app]);
  
  // Handle toggle with confirmation for resource-intensive features
  const handleToggleFeature = (feature) => {
    // Features that need confirmation before enabling
    const intensiveFeatures = [
      'extendedReality', 
      'nextGenFormats', 
      'neuralRendering', 
      'lightFieldVideo',
      'decentralizedComputation',
      'homomorphicEncryption'
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
      extendedReality: "Enable VR cinema experience, AR content overlays, and spatial audio features in a fully decentralized environment.",
      aiGeneratedContent: "Use federated AI to generate personalized trailers and recaps while preserving privacy.",
      nextGenFormats: "Support for 8K HDR, high frame rate content, and advanced color spaces through distributed processing.",
      quantumResistantCrypto: "Implement future-proof cryptography designed to withstand quantum computing attacks.",
      decentralizedComputation: "Allow peers to contribute processing power for transcoding and other intensive tasks.",
      homomorphicEncryption: "Perform operations on encrypted data without decrypting it, enhancing privacy.",
      neuralEnhancement: "Use distributed neural networks to enhance video quality and upscale resolution.",
      spatialAudio: "Experience 3D audio that adapts to your position in VR/AR environments.",
      lightFieldVideo: "Support for volumetric video that allows changing perspective after recording.",
      neuralRendering: "AI-enhanced upscaling and frame interpolation for smoother playback.",
      meshNetworkSupport: "Allow content sharing over local mesh networks when internet is unavailable.",
      federatedLearning: "Train recommendation models across the network without sharing personal data."
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
      decentralizedComputation: "high",
      homomorphicEncryption: "high",
      neuralEnhancement: "medium",
      spatialAudio: "low",
      lightFieldVideo: "high",
      neuralRendering: "medium",
      meshNetworkSupport: "medium",
      federatedLearning: "medium"
    };
    
    return warningLevels[feature] || "low";
  };
  
  return (
    <div className="experimental-features-container">
      <div className="experimental-header">
        <h2>Experimental Features</h2>
        <div className="experimental-badge">ALPHA</div>
      </div>
      
      <div className="experimental-warning">
        <div className="warning-icon">⚠️</div>
        <p>
          These features are highly experimental and may affect stability, performance, or battery life.
          They represent cutting-edge decentralized technologies that are still in active development.
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
                <h4>Decentralized VR Cinema</h4>
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
                <h4>P2P Spatial Audio</h4>
                <p>{getFeatureDescription('spatialAudio')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('spatialAudio')}`}>
              {getFeatureWarningLevel('spatialAudio').toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="features-category">
          <h3>Distributed AI</h3>
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
                <h4>Federated Content Generation</h4>
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
                  checked={experimentalFeatures.federatedLearning}
                  onChange={() => handleToggleFeature('federatedLearning')}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="feature-text">
                <h4>Federated Learning</h4>
                <p>{getFeatureDescription('federatedLearning')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('federatedLearning')}`}>
              {getFeatureWarningLevel('federatedLearning').toUpperCase()}
            </div>
          </div>
          
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
                <h4>Distributed Neural Enhancement</h4>
                <p>{getFeatureDescription('neuralEnhancement')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('neuralEnhancement')}`}>
              {getFeatureWarningLevel('neuralEnhancement').toUpperCase()}
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
                <h4>Distributed 8K HDR</h4>
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
                <h4>P2P Light Field Video</h4>
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
                <h4>Distributed Neural Rendering</h4>
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
          
          <div className="feature-item">
            <div className="feature-info">
              <label className="feature-toggle">
                <input
                  type="checkbox"
                  checked={experimentalFeatures.homomorphicEncryption}
                  onChange={() => handleToggleFeature('homomorphicEncryption')}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="feature-text">
                <h4>Homomorphic Encryption</h4>
                <p>{getFeatureDescription('homomorphicEncryption')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('homomorphicEncryption')}`}>
              {getFeatureWarningLevel('homomorphicEncryption').toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="features-category">
          <h3>Advanced P2P</h3>
          <div className="feature-item">
            <div className="feature-info">
              <label className="feature-toggle">
                <input
                  type="checkbox"
                  checked={experimentalFeatures.decentralizedComputation}
                  onChange={() => handleToggleFeature('decentralizedComputation')}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="feature-text">
                <h4>Distributed Computation</h4>
                <p>{getFeatureDescription('decentralizedComputation')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('decentralizedComputation')}`}>
              {getFeatureWarningLevel('decentralizedComputation').toUpperCase()}
            </div>
          </div>
          
          <div className="feature-item">
            <div className="feature-info">
              <label className="feature-toggle">
                <input
                  type="checkbox"
                  checked={experimentalFeatures.meshNetworkSupport}
                  onChange={() => handleToggleFeature('meshNetworkSupport')}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="feature-text">
                <h4>Mesh Network Support</h4>
                <p>{getFeatureDescription('meshNetworkSupport')}</p>
              </div>
            </div>
            <div className={`feature-warning-level ${getFeatureWarningLevel('meshNetworkSupport')}`}>
              {getFeatureWarningLevel('meshNetworkSupport').toUpperCase()}
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
          Usage data for experimental features is stored locally only and never shared with any central servers.
          You can clear this data in Privacy Settings.
        </p>
      </div>
    </div>
  );
};

export default ExperimentalFeatures;
