import React, { Suspense } from 'react';
import PropTypes from 'prop-types';

/**
 * LazyComponent - A wrapper for React.lazy loaded components
 * Provides standardized loading state and error handling
 * 
 * @author zophlic
 */
const LazyComponent = ({ component: Component, fallback, errorBoundary: ErrorBoundary }) => {
  // Default fallback is a simple loading spinner
  const defaultFallback = (
    <div className="lazy-loading-fallback">
      <div className="spinner"></div>
      <p>Loading...</p>
      
      <style jsx>{`
        .lazy-loading-fallback {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          min-height: 200px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          margin-bottom: 1rem;
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left-color: #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
  
  // If ErrorBoundary is provided, wrap the component with it
  if (ErrorBoundary) {
    return (
      <ErrorBoundary>
        <Suspense fallback={fallback || defaultFallback}>
          <Component />
        </Suspense>
      </ErrorBoundary>
    );
  }
  
  // Otherwise, just use Suspense
  return (
    <Suspense fallback={fallback || defaultFallback}>
      <Component />
    </Suspense>
  );
};

LazyComponent.propTypes = {
  component: PropTypes.elementType.isRequired,
  fallback: PropTypes.node,
  errorBoundary: PropTypes.elementType
};

export default LazyComponent;

/**
 * Create a lazy-loaded component
 * @param {Function} importFunc - Dynamic import function
 * @returns {React.LazyExoticComponent} Lazy component
 */
export const createLazyComponent = (importFunc) => {
  return React.lazy(importFunc);
};
