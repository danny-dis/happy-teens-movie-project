/**
 * Toast Container Component for Movo
 * Manages and displays toast notifications
 * 
 * @author zophlic
 */

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { createPortal } from 'react-dom';
import Toast from './Toast';
import { useToastStore } from '../../stores/toastStore';

// Styled components
const Container = styled.div`
  position: fixed;
  z-index: ${props => props.theme.zIndexToast};
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 100%;
  width: 350px;
  pointer-events: none;
  
  ${props => {
    switch (props.position) {
      case 'top-left':
        return `
          top: 1rem;
          left: 1rem;
        `;
      case 'top-right':
        return `
          top: 1rem;
          right: 1rem;
        `;
      case 'bottom-left':
        return `
          bottom: 1rem;
          left: 1rem;
          flex-direction: column-reverse;
        `;
      case 'bottom-right':
        return `
          bottom: 1rem;
          right: 1rem;
          flex-direction: column-reverse;
        `;
      case 'top-center':
        return `
          top: 1rem;
          left: 50%;
          transform: translateX(-50%);
        `;
      case 'bottom-center':
        return `
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          flex-direction: column-reverse;
        `;
      default:
        return `
          top: 1rem;
          right: 1rem;
        `;
    }
  }}
`;

/**
 * Toast container component
 * @param {Object} props - Component props
 * @param {string} props.position - Toast position
 * @returns {JSX.Element|null} Toast container component
 */
const ToastContainer = ({ position = 'top-right' }) => {
  const { toasts, removeToast } = useToastStore();
  const [portalElement, setPortalElement] = useState(null);
  
  // Create portal element
  useEffect(() => {
    // Check if portal element already exists
    let element = document.getElementById('toast-portal');
    
    if (!element) {
      element = document.createElement('div');
      element.id = 'toast-portal';
      document.body.appendChild(element);
    }
    
    setPortalElement(element);
    
    // Clean up
    return () => {
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, []);
  
  // Handle toast removal
  const handleRemove = useCallback((id) => {
    removeToast(id);
  }, [removeToast]);
  
  // Render nothing if no portal element
  if (!portalElement) {
    return null;
  }
  
  return createPortal(
    <Container position={position}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onRemove={handleRemove}
          action={toast.action}
        />
      ))}
    </Container>,
    portalElement
  );
};

export default ToastContainer;
