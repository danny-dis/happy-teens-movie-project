import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useP2P } from '../context/P2PContext';

/**
 * OnboardingTutorial - Interactive tutorial for first-time users
 * Highlights key features and explains how to use the app
 * Focuses on P2P functionality and decentralized features
 * 
 * @author zophlic
 */
const OnboardingTutorial = ({ onComplete }) => {
  const { connectToPeer } = useP2P();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [highlightedElement, setHighlightedElement] = useState(null);
  
  // Tutorial steps
  const steps = [
    {
      title: 'Welcome to Filo',
      description: 'Your fully decentralized peer-to-peer content platform. Let\'s explore how it works.',
      target: null,
      position: 'center'
    },
    {
      title: 'Peer Connections',
      description: 'Connect directly with other users to share and discover content without any central servers.',
      target: '.peer-connection-panel',
      position: 'bottom',
      action: {
        label: 'Connect to Peers',
        handler: () => connectToPeer('demo-peer-123')
      }
    },
    {
      title: 'End-to-End Encryption',
      description: 'All your content is encrypted. Only you and your intended recipients can access it.',
      target: '.encryption-status',
      position: 'right'
    },
    {
      title: 'Offline Library',
      description: 'Access your downloaded content even when you\'re offline. No internet required.',
      target: '.offline-library',
      position: 'left'
    },
    {
      title: 'Content Discovery',
      description: 'Search and browse content shared by your peers. Everything stays private and secure.',
      target: '.global-search',
      position: 'bottom'
    },
    {
      title: 'You\'re Ready!',
      description: 'Start sharing and discovering content in a truly decentralized way. You can revisit this tutorial from the settings menu.',
      target: null,
      position: 'center'
    }
  ];
  
  // Find and highlight target element
  useEffect(() => {
    const step = steps[currentStep];
    
    if (step.target) {
      const element = document.querySelector(step.target);
      
      if (element) {
        setHighlightedElement(element);
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setHighlightedElement(null);
      }
    } else {
      setHighlightedElement(null);
    }
    
    // Track step view (in a real implementation, this would use analytics)
    console.log('Onboarding step view:', {
      step: currentStep + 1,
      stepTitle: step.title,
      totalSteps: steps.length
    });
  }, [currentStep, steps]);
  
  // Handle next step
  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      
      // Track step completion (in a real implementation, this would use analytics)
      console.log('Onboarding step complete:', {
        step: currentStep + 1,
        stepTitle: steps[currentStep].title,
        totalSteps: steps.length
      });
    } else {
      handleComplete();
    }
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle tutorial completion
  const handleComplete = () => {
    setIsVisible(false);
    
    // Save completion status to localStorage
    localStorage.setItem('filo_onboarding_completed', 'true');
    
    // Track tutorial completion (in a real implementation, this would use analytics)
    console.log('Onboarding complete:', {
      totalSteps: steps.length
    });
    
    // Call completion callback
    if (onComplete) {
      onComplete();
    }
  };
  
  // Handle skip tutorial
  const handleSkip = () => {
    setIsVisible(false);
    
    // Save completion status to localStorage
    localStorage.setItem('filo_onboarding_completed', 'true');
    
    // Track tutorial skip (in a real implementation, this would use analytics)
    console.log('Onboarding skip:', {
      skippedAtStep: currentStep + 1,
      totalSteps: steps.length
    });
    
    // Call completion callback
    if (onComplete) {
      onComplete();
    }
  };
  
  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!highlightedElement) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }
    
    const rect = highlightedElement.getBoundingClientRect();
    const position = steps[currentStep].position;
    
    switch (position) {
      case 'top':
        return {
          bottom: `${window.innerHeight - rect.top + 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)'
        };
      case 'bottom':
        return {
          top: `${rect.bottom + 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)'
        };
      case 'left':
        return {
          top: `${rect.top + rect.height / 2}px`,
          right: `${window.innerWidth - rect.left + 20}px`,
          transform: 'translateY(-50%)'
        };
      case 'right':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 20}px`,
          transform: 'translateY(-50%)'
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };
  
  // Calculate highlight position
  const getHighlightPosition = () => {
    if (!highlightedElement) {
      return null;
    }
    
    const rect = highlightedElement.getBoundingClientRect();
    
    return {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    };
  };
  
  // If tutorial is not visible, don't render anything
  if (!isVisible) {
    return null;
  }
  
  const currentStepData = steps[currentStep];
  const tooltipPosition = getTooltipPosition();
  const highlightPosition = getHighlightPosition();
  
  return (
    <div className="onboarding-overlay">
      {/* Highlight element */}
      {highlightPosition && (
        <div 
          className="highlight-element"
          style={highlightPosition}
        ></div>
      )}
      
      {/* Tooltip */}
      <div 
        className={`tutorial-tooltip ${currentStepData.position || 'center'}`}
        style={tooltipPosition}
      >
        <div className="tooltip-content">
          <h3>{currentStepData.title}</h3>
          <p>{currentStepData.description}</p>
          
          {currentStepData.action && (
            <button 
              className="action-button"
              onClick={currentStepData.action.handler}
            >
              {currentStepData.action.label}
            </button>
          )}
          
          <div className="tooltip-footer">
            <div className="step-indicators">
              {steps.map((_, index) => (
                <div 
                  key={index}
                  className={`step-indicator ${index === currentStep ? 'active' : ''}`}
                  onClick={() => setCurrentStep(index)}
                ></div>
              ))}
            </div>
            
            <div className="tooltip-buttons">
              {currentStep > 0 && (
                <button 
                  className="prev-button"
                  onClick={handlePrevStep}
                >
                  Previous
                </button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <button 
                  className="next-button"
                  onClick={handleNextStep}
                >
                  Next
                </button>
              ) : (
                <button 
                  className="finish-button"
                  onClick={handleComplete}
                >
                  Finish
                </button>
              )}
            </div>
          </div>
        </div>
        
        {currentStep === 0 && (
          <button 
            className="skip-button"
            onClick={handleSkip}
          >
            Skip Tutorial
          </button>
        )}
      </div>
      
      <style jsx>{`
        .onboarding-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 1000;
          pointer-events: auto;
        }
        
        .highlight-element {
          position: fixed;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
          border-radius: 4px;
          z-index: 1001;
          pointer-events: none;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 0 rgba(52, 152, 219, 0.7); }
          70% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 10px rgba(52, 152, 219, 0); }
          100% { box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7), 0 0 0 0 rgba(52, 152, 219, 0); }
        }
        
        .tutorial-tooltip {
          position: fixed;
          z-index: 1002;
          background-color: #2c3e50;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          width: 320px;
          pointer-events: auto;
        }
        
        .tutorial-tooltip.center {
          max-width: 400px;
        }
        
        .tutorial-tooltip.top::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 10px;
          border-style: solid;
          border-color: #2c3e50 transparent transparent transparent;
        }
        
        .tutorial-tooltip.bottom::after {
          content: '';
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 10px;
          border-style: solid;
          border-color: transparent transparent #2c3e50 transparent;
        }
        
        .tutorial-tooltip.left::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 100%;
          transform: translateY(-50%);
          border-width: 10px;
          border-style: solid;
          border-color: transparent transparent transparent #2c3e50;
        }
        
        .tutorial-tooltip.right::after {
          content: '';
          position: absolute;
          top: 50%;
          right: 100%;
          transform: translateY(-50%);
          border-width: 10px;
          border-style: solid;
          border-color: transparent #2c3e50 transparent transparent;
        }
        
        .tooltip-content {
          padding: 20px;
        }
        
        .tooltip-content h3 {
          margin: 0 0 10px 0;
          font-size: 18px;
          color: #3498db;
        }
        
        .tooltip-content p {
          margin: 0 0 20px 0;
          font-size: 14px;
          line-height: 1.5;
          color: #ecf0f1;
        }
        
        .action-button {
          display: block;
          width: 100%;
          padding: 10px;
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 20px;
          transition: background-color 0.2s ease;
        }
        
        .action-button:hover {
          background-color: #2980b9;
        }
        
        .tooltip-footer {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .step-indicators {
          display: flex;
          justify-content: center;
          gap: 8px;
        }
        
        .step-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #7f8c8d;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.2s ease;
        }
        
        .step-indicator.active {
          background-color: #3498db;
          transform: scale(1.2);
        }
        
        .tooltip-buttons {
          display: flex;
          justify-content: space-between;
        }
        
        .prev-button, .next-button, .finish-button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .prev-button {
          background-color: transparent;
          color: #95a5a6;
          border: 1px solid #95a5a6;
        }
        
        .prev-button:hover {
          background-color: rgba(149, 165, 166, 0.1);
        }
        
        .next-button, .finish-button {
          background-color: #3498db;
          color: white;
        }
        
        .next-button:hover, .finish-button:hover {
          background-color: #2980b9;
        }
        
        .finish-button {
          background-color: #2ecc71;
        }
        
        .finish-button:hover {
          background-color: #27ae60;
        }
        
        .skip-button {
          position: absolute;
          bottom: -40px;
          left: 50%;
          transform: translateX(-50%);
          background-color: transparent;
          border: none;
          color: #95a5a6;
          font-size: 14px;
          cursor: pointer;
          text-decoration: underline;
          padding: 8px;
        }
        
        .skip-button:hover {
          color: white;
        }
      `}</style>
    </div>
  );
};

OnboardingTutorial.propTypes = {
  onComplete: PropTypes.func
};

export default OnboardingTutorial;
