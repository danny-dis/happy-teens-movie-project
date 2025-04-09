/**
 * Root Provider for Movo
 * Provides all necessary providers for the application
 * 
 * @author zophlic
 */

import React from 'react';
import PropTypes from 'prop-types';
import { BrowserRouter } from 'react-router-dom';
import QueryProvider from './QueryProvider';
import ThemeProvider from './ThemeProvider';
import ErrorBoundary from '../components/ErrorBoundary';
import { ToastContainer } from '../components/Toast';
import loggingService from '../../infrastructure/logging/LoggingService';
import telemetryService from '../../infrastructure/telemetry/TelemetryService';

/**
 * Root provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Root provider component
 */
const RootProvider = ({ children }) => {
  // Handle error boundary errors
  const handleError = (error, errorInfo) => {
    loggingService.error('Root error boundary caught error', { error, errorInfo });
    
    telemetryService.trackEvent('error', 'root_error', {
      error: error.message,
      componentStack: errorInfo.componentStack
    });
  };
  
  return (
    <ErrorBoundary onError={handleError}>
      <QueryProvider>
        <BrowserRouter>
          <ThemeProvider>
            {children}
            <ToastContainer position="top-right" />
          </ThemeProvider>
        </BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  );
};

RootProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default RootProvider;
