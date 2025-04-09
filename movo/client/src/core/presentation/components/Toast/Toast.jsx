/**
 * Toast Component for Movo
 * Displays a single toast notification
 * 
 * @author zophlic
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import styled, { keyframes, css } from 'styled-components';

// Animations
const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

// Styled components
const ToastWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme.surface};
  color: ${props => props.theme.text};
  border-radius: ${props => props.theme.borderRadiusMedium};
  box-shadow: ${props => props.theme.elevation2};
  overflow: hidden;
  pointer-events: auto;
  width: 100%;
  max-width: 350px;
  min-height: 64px;
  position: relative;
  
  animation: ${props => props.isExiting ? css`${slideOut} 0.3s ease forwards` : css`${slideIn} 0.3s ease`};
  
  ${props => {
    switch (props.type) {
      case 'success':
        return `
          border-left: 4px solid ${props.theme.success};
        `;
      case 'error':
        return `
          border-left: 4px solid ${props.theme.error};
        `;
      case 'warning':
        return `
          border-left: 4px solid ${props.theme.warning};
        `;
      case 'info':
        return `
          border-left: 4px solid ${props.theme.info};
        `;
      default:
        return `
          border-left: 4px solid ${props.theme.primary};
        `;
    }
  }}
`;

const ToastHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem 0.25rem 1rem;
`;

const ToastTitle = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSizeNormal};
  font-weight: ${props => props.theme.fontWeightMedium};
  color: ${props => props.theme.text};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color ${props => props.theme.transitionFast} ease;
  
  &:hover {
    color: ${props => props.theme.text};
  }
  
  &:focus {
    outline: none;
  }
`;

const ToastContent = styled.div`
  padding: 0.25rem 1rem 0.75rem 1rem;
  font-size: ${props => props.theme.fontSizeSmall};
  color: ${props => props.theme.textSecondary};
`;

const ToastActions = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem 1rem 0.75rem 1rem;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.primary};
  font-weight: ${props => props.theme.fontWeightMedium};
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: ${props => props.theme.fontSizeSmall};
  transition: opacity ${props => props.theme.transitionFast} ease;
  
  &:hover {
    opacity: 0.8;
  }
  
  &:focus {
    outline: none;
  }
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background-color: ${props => {
    switch (props.type) {
      case 'success':
        return props.theme.success;
      case 'error':
        return props.theme.error;
      case 'warning':
        return props.theme.warning;
      case 'info':
        return props.theme.info;
      default:
        return props.theme.primary;
    }
  }};
  width: ${props => props.progress}%;
  transition: width linear;
`;

/**
 * Toast component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Toast component
 */
const Toast = ({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onRemove,
  action
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const removeTimeoutRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(duration);
  
  // Handle toast removal
  const handleRemove = useCallback(() => {
    setIsExiting(true);
    
    // Wait for exit animation to complete
    setTimeout(() => {
      onRemove(id);
    }, 300);
  }, [id, onRemove]);
  
  // Handle action click
  const handleActionClick = useCallback(() => {
    if (action && action.onClick) {
      action.onClick();
      handleRemove();
    }
  }, [action, handleRemove]);
  
  // Set up auto-removal
  useEffect(() => {
    if (duration === 0) {
      return;
    }
    
    const startTimer = () => {
      startTimeRef.current = Date.now();
      
      removeTimeoutRef.current = setTimeout(() => {
        handleRemove();
      }, remainingTimeRef.current);
      
      // Update progress
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = remainingTimeRef.current - elapsed;
        const newProgress = Math.max(0, (remaining / duration) * 100);
        
        setProgress(newProgress);
        
        if (newProgress <= 0) {
          clearInterval(progressInterval);
        }
      }, 10);
      
      return progressInterval;
    };
    
    let progressInterval;
    
    if (!isPaused) {
      progressInterval = startTimer();
    }
    
    return () => {
      if (removeTimeoutRef.current) {
        clearTimeout(removeTimeoutRef.current);
        
        // Store remaining time
        const elapsed = Date.now() - startTimeRef.current;
        remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      }
      
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [duration, handleRemove, isPaused]);
  
  // Handle mouse events
  const handleMouseEnter = useCallback(() => {
    setIsPaused(true);
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setIsPaused(false);
  }, []);
  
  return (
    <ToastWrapper
      type={type}
      isExiting={isExiting}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <ToastHeader>
        <ToastTitle>{title}</ToastTitle>
        <CloseButton onClick={handleRemove} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </CloseButton>
      </ToastHeader>
      
      {message && (
        <ToastContent>{message}</ToastContent>
      )}
      
      {action && (
        <ToastActions>
          <ActionButton onClick={handleActionClick}>
            {action.label}
          </ActionButton>
        </ToastActions>
      )}
      
      {duration > 0 && (
        <ProgressBar type={type} progress={progress} />
      )}
    </ToastWrapper>
  );
};

Toast.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  duration: PropTypes.number,
  onRemove: PropTypes.func.isRequired,
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired
  })
};

export default Toast;
