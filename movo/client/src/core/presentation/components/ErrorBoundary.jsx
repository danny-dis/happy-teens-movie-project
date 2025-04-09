/**
 * Error Boundary Component for Movo
 * Catches JavaScript errors in child components
 * 
 * @author zophlic
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import loggingService from '../../infrastructure/logging/LoggingService';
import telemetryService from '../../infrastructure/telemetry/TelemetryService';

// Styled components
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  margin: 1rem;
  border-radius: ${props => props.theme.borderRadiusMedium};
  background-color: ${props => props.theme.surface};
  box-shadow: ${props => props.theme.elevation2};
  text-align: center;
  max-width: 800px;
  margin: 2rem auto;
`;

const ErrorTitle = styled.h2`
  color: ${props => props.theme.error};
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.p`
  color: ${props => props.theme.text};
  margin-bottom: 1.5rem;
`;

const ErrorStack = styled.pre`
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.textSecondary};
  padding: 1rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  overflow: auto;
  max-height: 300px;
  width: 100%;
  text-align: left;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
`;

const Button = styled.button`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadiusSmall};
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color ${props => props.theme.transitionFast} ease;
  
  &:hover {
    background-color: ${props => props.primary ? props.theme.primary : props.theme.secondary};
    opacity: 0.9;
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.5);
  }
`;

/**
 * Error boundary component
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }
  
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log error
    loggingService.error('Error boundary caught error', { error, errorInfo });
    
    // Track error
    telemetryService.trackEvent('error', 'react_error', {
      error: error.message,
      componentStack: errorInfo.componentStack
    });
    
    // Update state with error info
    this.setState({ errorInfo });
    
    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Call onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };
  
  handleReload = () => {
    window.location.reload();
  };
  
  render() {
    const { hasError, error, errorInfo } = this.state;
    const { fallback, children, showDetails = false } = this.props;
    
    if (hasError) {
      // Render custom fallback if provided
      if (fallback) {
        return typeof fallback === 'function'
          ? fallback(error, errorInfo, this.handleReset)
          : fallback;
      }
      
      // Render default fallback
      return (
        <ErrorContainer>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <ErrorMessage>
            {error?.message || 'An unexpected error occurred'}
          </ErrorMessage>
          
          {showDetails && errorInfo && (
            <ErrorStack>
              {error?.stack}
              {'\n\nComponent Stack:\n'}
              {errorInfo.componentStack}
            </ErrorStack>
          )}
          
          <div>
            <Button onClick={this.handleReset} style={{ marginRight: '1rem' }}>
              Try Again
            </Button>
            <Button onClick={this.handleReload}>
              Reload Page
            </Button>
          </div>
        </ErrorContainer>
      );
    }
    
    return children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  onError: PropTypes.func,
  onReset: PropTypes.func,
  showDetails: PropTypes.bool
};

export default ErrorBoundary;
