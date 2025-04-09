/**
 * Lazy Component for Movo
 * Provides a wrapper for lazy-loaded components
 * 
 * @author zophlic
 */

import React, { Suspense, lazy } from 'react';
import PropTypes from 'prop-types';
import styled, { keyframes } from 'styled-components';

// Animations
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

// Styled components
const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: ${props => props.minHeight || '200px'};
  width: 100%;
  animation: ${fadeIn} 0.3s ease;
`;

const Spinner = styled.div`
  width: ${props => props.size || '40px'};
  height: ${props => props.size || '40px'};
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: ${props => props.theme.primary};
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: ${props => props.minHeight || '200px'};
  width: 100%;
  padding: 1rem;
  text-align: center;
  animation: ${fadeIn} 0.3s ease;
`;

const ErrorMessage = styled.p`
  color: ${props => props.theme.error};
  margin-bottom: 1rem;
`;

const RetryButton = styled.button`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadiusSmall};
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color ${props => props.theme.transitionFast} ease;
  
  &:hover {
    background-color: ${props => props.theme.primary};
    opacity: 0.9;
  }
`;

/**
 * Default loading component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Loading component
 */
const DefaultLoading = ({ minHeight, size }) => (
  <LoadingContainer minHeight={minHeight}>
    <Spinner size={size} />
  </LoadingContainer>
);

DefaultLoading.propTypes = {
  minHeight: PropTypes.string,
  size: PropTypes.string
};

/**
 * Default error component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Error component
 */
const DefaultError = ({ error, retry, minHeight }) => (
  <ErrorContainer minHeight={minHeight}>
    <ErrorMessage>
      {error?.message || 'Failed to load component'}
    </ErrorMessage>
    {retry && (
      <RetryButton onClick={retry}>
        Retry
      </RetryButton>
    )}
  </ErrorContainer>
);

DefaultError.propTypes = {
  error: PropTypes.object,
  retry: PropTypes.func,
  minHeight: PropTypes.string
};

/**
 * Create a lazy-loaded component
 * @param {Function} importFn - Import function
 * @param {Object} options - Options
 * @returns {React.LazyExoticComponent} Lazy component
 */
export function createLazyComponent(importFn, options = {}) {
  const LazyComponent = lazy(async () => {
    try {
      // Add artificial delay in development for testing
      if (process.env.NODE_ENV === 'development' && options.delay) {
        await new Promise(resolve => setTimeout(resolve, options.delay));
      }
      
      return await importFn();
    } catch (error) {
      console.error('Failed to load component:', error);
      throw error;
    }
  });
  
  // Return wrapped component
  return function WrappedLazyComponent(props) {
    const {
      fallback = options.fallback,
      errorComponent = options.errorComponent,
      minHeight = options.minHeight,
      spinnerSize = options.spinnerSize,
      ...rest
    } = props;
    
    // Default loading component
    const LoadingComponent = fallback || (
      <DefaultLoading minHeight={minHeight} size={spinnerSize} />
    );
    
    return (
      <Suspense fallback={LoadingComponent}>
        <LazyComponent {...rest} />
      </Suspense>
    );
  };
}

/**
 * Lazy component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Lazy component
 */
const LazyComponent = ({
  importFn,
  fallback,
  errorComponent,
  minHeight = '200px',
  spinnerSize = '40px',
  ...props
}) => {
  // Create lazy component
  const Component = React.useMemo(() => {
    return createLazyComponent(importFn, {
      fallback,
      errorComponent,
      minHeight,
      spinnerSize
    });
  }, [importFn, fallback, errorComponent, minHeight, spinnerSize]);
  
  return <Component {...props} />;
};

LazyComponent.propTypes = {
  importFn: PropTypes.func.isRequired,
  fallback: PropTypes.node,
  errorComponent: PropTypes.func,
  minHeight: PropTypes.string,
  spinnerSize: PropTypes.string
};

export default LazyComponent;
