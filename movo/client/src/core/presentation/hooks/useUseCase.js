/**
 * Use Case Hook for Movo
 * Provides a React hook for using domain use cases
 * 
 * @author zophlic
 */

import { useState, useCallback, useEffect } from 'react';
import { UseCaseFactory } from '../../domain/usecases';
import container from '../../infrastructure/di/Container';
import loggingService from '../../infrastructure/logging/LoggingService';

/**
 * Use case hook
 * @param {string} useCaseName - Use case name
 * @param {Object} dependencies - Use case dependencies
 * @returns {Object} Use case hook result
 */
export function useUseCase(useCaseName, dependencies = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Create use case instance
  const createUseCase = useCallback(() => {
    try {
      // Get dependencies from container
      const resolvedDependencies = {};
      
      for (const key in dependencies) {
        if (dependencies[key]) {
          resolvedDependencies[key] = dependencies[key];
        } else if (container.has(key)) {
          resolvedDependencies[key] = container.get(key);
        }
      }
      
      // Create use case
      return UseCaseFactory.create(useCaseName, resolvedDependencies);
    } catch (error) {
      loggingService.error(`Failed to create use case: ${useCaseName}`, { error });
      throw error;
    }
  }, [useCaseName, dependencies]);
  
  // Execute use case
  const execute = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      const useCase = createUseCase();
      const result = await useCase.execute(params);
      
      setData(result);
      setLoading(false);
      
      return result;
    } catch (error) {
      loggingService.error(`Failed to execute use case: ${useCaseName}`, { error, params });
      
      setError(error);
      setLoading(false);
      
      throw error;
    }
  }, [useCaseName, createUseCase]);
  
  return {
    data,
    loading,
    error,
    execute
  };
}

/**
 * Use case hook with automatic execution
 * @param {string} useCaseName - Use case name
 * @param {Object} params - Use case parameters
 * @param {Object} options - Hook options
 * @param {boolean} options.enabled - Whether to execute use case
 * @param {Object} options.dependencies - Use case dependencies
 * @returns {Object} Use case hook result
 */
export function useUseCaseEffect(useCaseName, params = {}, options = {}) {
  const { enabled = true, dependencies = {} } = options;
  const { data, loading, error, execute } = useUseCase(useCaseName, dependencies);
  
  useEffect(() => {
    if (enabled) {
      execute(params);
    }
  }, [enabled, execute, JSON.stringify(params)]);
  
  return {
    data,
    loading,
    error,
    execute
  };
}

export default useUseCase;
