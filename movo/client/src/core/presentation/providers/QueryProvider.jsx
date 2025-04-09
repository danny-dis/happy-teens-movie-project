/**
 * Query Provider for Movo
 * Provides React Query context for the application
 * 
 * @author zophlic
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import loggingService from '../../infrastructure/logging/LoggingService';
import telemetryService from '../../infrastructure/telemetry/TelemetryService';
import { settingsStore } from '../stores/settingsStore';

// Create query client
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        onError: (error) => {
          loggingService.error('Query error', { error });
        }
      },
      mutations: {
        retry: 1,
        onError: (error) => {
          loggingService.error('Mutation error', { error });
        }
      }
    },
    queryCache: {
      onError: (error, query) => {
        // Log error
        loggingService.error('Query cache error', { error, queryKey: query.queryKey });
        
        // Track error
        telemetryService.trackEvent('error', 'query_error', {
          queryKey: JSON.stringify(query.queryKey),
          error: error.message
        });
      }
    },
    mutationCache: {
      onError: (error, variables, context, mutation) => {
        // Log error
        loggingService.error('Mutation cache error', { 
          error, 
          mutationKey: mutation.options.mutationKey 
        });
        
        // Track error
        telemetryService.trackEvent('error', 'mutation_error', {
          mutationKey: JSON.stringify(mutation.options.mutationKey),
          error: error.message
        });
      }
    }
  });
};

// Create query client instance
const queryClient = createQueryClient();

/**
 * Query provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Query provider component
 */
const QueryProvider = ({ children }) => {
  const { developerMode } = settingsStore.getState();
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {developerMode && <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />}
    </QueryClientProvider>
  );
};

export default QueryProvider;
