/**
 * Voice Command Indicator Component for Movo
 * Displays the voice command listening status
 * 
 * @author zophlic
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled, { keyframes } from 'styled-components';
import voiceCommandService from '../../../infrastructure/voice/VoiceCommandService';

// Animations
const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const wave = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
`;

// Styled components
const Container = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.size || '40px'};
  height: ${props => props.size || '40px'};
  border-radius: 50%;
  background-color: ${props => props.active ? props.theme.primary : props.theme.surface};
  color: ${props => props.active ? 'white' : props.theme.text};
  border: none;
  cursor: pointer;
  transition: all ${props => props.theme.transitionFast} ease;
  position: relative;
  z-index: 2;
  
  &:hover {
    background-color: ${props => props.active ? props.theme.primary : props.theme.background};
    transform: scale(1.05);
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${props => props.theme.primary}40;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
  
  ${props => props.active && `
    animation: ${pulse} 2s infinite ease-in-out;
  `}
`;

const WaveEffect = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background-color: ${props => props.theme.primary};
  opacity: 0.8;
  z-index: 1;
  animation: ${wave} 2s infinite ease-out;
  
  &:nth-child(2) {
    animation-delay: 0.5s;
  }
  
  &:nth-child(3) {
    animation-delay: 1s;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  background-color: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  padding: 0.5rem 0.75rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  font-size: ${props => props.theme.fontSizeSmall};
  white-space: nowrap;
  box-shadow: ${props => props.theme.elevation2};
  z-index: 10;
  pointer-events: none;
  opacity: 0;
  transition: opacity ${props => props.theme.transitionFast} ease;
  
  ${Container}:hover & {
    opacity: 1;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: ${props => props.theme.surface} transparent transparent transparent;
  }
`;

const RecognizedText = styled.div`
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 8px;
  background-color: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  padding: 0.5rem 0.75rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  font-size: ${props => props.theme.fontSizeSmall};
  white-space: nowrap;
  box-shadow: ${props => props.theme.elevation2};
  z-index: 10;
  max-width: 200px;
  text-overflow: ellipsis;
  overflow: hidden;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity ${props => props.theme.transitionFast} ease;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent ${props => props.theme.surface} transparent;
  }
`;

/**
 * Voice command indicator component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Voice command indicator component
 */
const VoiceCommandIndicator = ({ size, className }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [showRecognizedText, setShowRecognizedText] = useState(false);
  
  // Handle toggle
  const handleToggle = () => {
    const newState = voiceCommandService.toggle();
    setIsListening(newState);
  };
  
  // Set up event listeners
  useEffect(() => {
    const handleStart = () => {
      setIsListening(true);
    };
    
    const handleEnd = () => {
      setIsListening(false);
    };
    
    const handleResult = (event) => {
      const { transcript } = event.detail;
      setRecognizedText(transcript);
      setShowRecognizedText(true);
      
      // Hide after 3 seconds
      setTimeout(() => {
        setShowRecognizedText(false);
      }, 3000);
    };
    
    // Add event listeners
    window.addEventListener('voicecommand:start', handleStart);
    window.addEventListener('voicecommand:end', handleEnd);
    window.addEventListener('voicecommand:executed', handleResult);
    window.addEventListener('voicecommand:unrecognized', handleResult);
    
    // Initial state
    setIsListening(voiceCommandService.isListening);
    
    // Clean up
    return () => {
      window.removeEventListener('voicecommand:start', handleStart);
      window.removeEventListener('voicecommand:end', handleEnd);
      window.removeEventListener('voicecommand:executed', handleResult);
      window.removeEventListener('voicecommand:unrecognized', handleResult);
    };
  }, []);
  
  // Check if voice commands are supported
  if (!voiceCommandService.isSupported()) {
    return null;
  }
  
  return (
    <Container className={className}>
      <Button 
        onClick={handleToggle} 
        active={isListening}
        size={size}
        aria-label={isListening ? 'Stop voice commands' : 'Start voice commands'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
      </Button>
      
      {isListening && (
        <>
          <WaveEffect />
          <WaveEffect />
          <WaveEffect />
        </>
      )}
      
      <Tooltip>
        {isListening ? 'Listening for voice commands...' : 'Click to enable voice commands'}
      </Tooltip>
      
      {showRecognizedText && (
        <RecognizedText visible={showRecognizedText}>
          {recognizedText}
        </RecognizedText>
      )}
    </Container>
  );
};

VoiceCommandIndicator.propTypes = {
  size: PropTypes.string,
  className: PropTypes.string
};

VoiceCommandIndicator.defaultProps = {
  size: '40px'
};

export default VoiceCommandIndicator;
