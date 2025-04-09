/**
 * Repository Hook for Movo
 * Provides a React hook for using repositories
 * 
 * @author zophlic
 */

import { useState, useCallback } from 'react';
import { RepositoryFactory } from '../../domain/repositories';
import container from '../../infrastructure/di/Container';
import loggingService from '../../infrastructure/logging/LoggingService';

/**
 * Repository hook
 * @param {string} repositoryName - Repository name
 * @returns {Object} Repository hook result
 */
export function useRepository(repositoryName) {
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  
  // Get repository instance
  const getRepository = useCallback(() => {
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
  }, [repositoryName]);
  
  // Create wrapped repository methods
  const createWrappedMethod = useCallback((methodName) => {
    return async (...args) => {
      setLoading(prev => ({ ...prev, [methodName]: true }));
      setError(prev => ({ ...prev, [methodName]: null }));
      
      try {
        const repository = getRepository();
        const result = await repository[methodName](...args);
        
        setLoading(prev => ({ ...prev, [methodName]: false }));
        
        return result;
      } catch (error) {
        loggingService.error(`Failed to execute repository method: ${methodName}`, { error, args });
        
        setError(prev => ({ ...prev, [methodName]: error }));
        setLoading(prev => ({ ...prev, [methodName]: false }));
        
        throw error;
      }
    };
  }, [getRepository]);
  
  // Create repository proxy
  const repository = useCallback(() => {
    try {
      const repo = getRepository();
      const proxy = {};
      
      // Get all method names
      const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(repo))
        .filter(name => name !== 'constructor' && typeof repo[name] === 'function');
      
      // Create wrapped methods
      for (const methodName of methodNames) {
        proxy[methodName] = createWrappedMethod(methodName);
      }
      
      return proxy;
    } catch (error) {
      loggingService.error(`Failed to create repository proxy: ${repositoryName}`, { error });
      throw error;
    }
  }, [repositoryName, getRepository, createWrappedMethod]);
  
  return {
    repository: repository(),
    loading,
    error
  };
}

export default useRepository;
