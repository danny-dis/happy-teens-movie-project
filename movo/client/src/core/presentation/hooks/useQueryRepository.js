/**
 * Query Repository Hook for Movo
 * Provides a React hook for using repositories with React Query
 * 
 * @author zophlic
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from 'react-query';
import { RepositoryFactory } from '../../domain/repositories';
import container from '../../infrastructure/di/Container';
import loggingService from '../../infrastructure/logging/LoggingService';

/**
 * Get repository instance
 * @param {string} repositoryName - Repository name
 * @returns {Object} Repository instance
 */
function getRepository(repositoryName) {
  try {
    // Check if repository is registered in container
    if (container.has(repositoryName)) {
      return container.get(repositoryName);
    }
    
    // Create repository
    return RepositoryFactory.create(repositoryName);
  } catch (error) {
    loggingService.error(`Failed to get repository: ${repositoryName}`, { error });
    throw error;
  }
}

/**
 * Use query repository hook
 * @param {string} repositoryName - Repository name
 * @returns {Object} Query repository hook result
 */
export function useQueryRepository(repositoryName) {
  const queryClient = useQueryClient();
  
  // Create query key
  const createQueryKey = useCallback((methodName, ...args) => {
    return [repositoryName, methodName, ...args];
  }, [repositoryName]);
  
  // Create query function
  const createQueryFn = useCallback((methodName) => {
    return async (...args) => {
      try {
        const repository = getRepository(repositoryName);
        return await repository[methodName](...args);
      } catch (error) {
        loggingService.error(`Failed to execute repository method: ${methodName}`, { error, args });
        throw error;
      }
    };
  }, [repositoryName]);
  
  // Use repository query
  const useRepositoryQuery = useCallback((methodName, args = [], options = {}) => {
    const queryKey = createQueryKey(methodName, ...args);
    const queryFn = () => createQueryFn(methodName)(...args);
    
    return useQuery(queryKey, queryFn, options);
  }, [createQueryKey, createQueryFn]);
  
  // Use repository mutation
  const useRepositoryMutation = useCallback((methodName, options = {}) => {
    const mutationFn = (args) => {
      const repository = getRepository(repositoryName);
      return repository[methodName](...(Array.isArray(args) ? args : [args]));
    };
    
    return useMutation(mutationFn, {
      ...options,
      onSuccess: (data, variables, context) => {
        // Invalidate queries based on repository name
        queryClient.invalidateQueries([repositoryName]);
        
        // Call original onSuccess
        if (options.onSuccess) {
          options.onSuccess(data, variables, context);
        }
      }
    });
  }, [repositoryName, queryClient]);
  
  // Invalidate queries
  const invalidateQueries = useCallback((methodName, ...args) => {
    const queryKey = createQueryKey(methodName, ...args);
    return queryClient.invalidateQueries(queryKey);
  }, [createQueryKey, queryClient]);
  
  // Set query data
  const setQueryData = useCallback((methodName, data, ...args) => {
    const queryKey = createQueryKey(methodName, ...args);
    return queryClient.setQueryData(queryKey, data);
  }, [createQueryKey, queryClient]);
  
  return {
    useQuery: useRepositoryQuery,
    useMutation: useRepositoryMutation,
    invalidateQueries,
    setQueryData
  };
}

export default useQueryRepository;
