import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useChimera } from '../context/ChimeraContext';
import analyticsService, { EVENT_CATEGORIES } from '../services/analyticsService';

/**
 * GlobalSearch - Advanced search component with autocomplete
 * Provides instant results and keyboard navigation
 * 
 * @author zophlic
 */
const GlobalSearch = ({ onSearch, onResultSelect, placeholder = 'Search movies, genres, actors...' }) => {
  const { isStreamingMode } = useChimera();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimeout = useRef(null);
  
  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem('movo_recent_searches');
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }
    } catch (error) {
      console.error('Failed to load recent searches', error);
    }
  }, []);
  
  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchQuery) => {
    if (!searchQuery.trim()) return;
    
    try {
      // Add to recent searches (avoid duplicates and limit to 5)
      const updatedSearches = [
        searchQuery,
        ...recentSearches.filter(s => s !== searchQuery)
      ].slice(0, 5);
      
      setRecentSearches(updatedSearches);
      localStorage.setItem('movo_recent_searches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Failed to save recent search', error);
    }
  }, [recentSearches]);
  
  // Handle search input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (value.trim()) {
      setLoading(true);
      
      // Debounce search to avoid too many requests
      searchTimeout.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
      setLoading(false);
    }
  };
  
  // Perform search
  const performSearch = async (searchQuery) => {
    try {
      // In a real implementation, this would call an API
      // For now, we'll simulate search results
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock results
      const mockResults = [
        {
          id: '1',
          title: 'The Matrix',
          type: 'movie',
          year: 1999,
          imageUrl: 'https://via.placeholder.com/50x75',
          relevance: 0.95
        },
        {
          id: '2',
          title: 'Matrix Reloaded',
          type: 'movie',
          year: 2003,
          imageUrl: 'https://via.placeholder.com/50x75',
          relevance: 0.85
        },
        {
          id: '3',
          title: 'Keanu Reeves',
          type: 'actor',
          imageUrl: 'https://via.placeholder.com/50x50',
          relevance: 0.75
        },
        {
          id: '4',
          title: 'Science Fiction',
          type: 'genre',
          relevance: 0.65
        }
      ].filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setResults(mockResults);
      setShowResults(true);
      setLoading(false);
      
      // Call onSearch callback
      if (onSearch) {
        onSearch(searchQuery, mockResults);
      }
      
      // Track search for analytics
      analyticsService.trackEvent(
        EVENT_CATEGORIES.CONTENT,
        'search',
        {
          query: searchQuery,
          resultCount: mockResults.length,
          mode: isStreamingMode ? 'streaming' : 'local'
        }
      );
    } catch (error) {
      console.error('Search failed', error);
      setLoading(false);
      setResults([]);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (query.trim()) {
      // If an item is selected, use that
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleResultSelect(results[selectedIndex]);
      } else {
        // Otherwise perform a full search
        performSearch(query);
        saveRecentSearch(query);
      }
    }
  };
  
  // Handle result selection
  const handleResultSelect = (result) => {
    // Save search query
    saveRecentSearch(query);
    
    // Clear search
    setQuery('');
    setResults([]);
    setShowResults(false);
    
    // Call result select callback
    if (onResultSelect) {
      onResultSelect(result);
    }
    
    // Track selection for analytics
    analyticsService.trackEvent(
      EVENT_CATEGORIES.CONTENT,
      'search_result_select',
      {
        query,
        resultId: result.id,
        resultType: result.type,
        resultTitle: result.title,
        mode: isStreamingMode ? 'streaming' : 'local'
      }
    );
  };
  
  // Handle recent search selection
  const handleRecentSearchSelect = (searchQuery) => {
    setQuery(searchQuery);
    performSearch(searchQuery);
  };
  
  // Handle clear recent searches
  const handleClearRecentSearches = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('movo_recent_searches');
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    // Only handle if results are showing
    if (!showResults) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
        
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        break;
        
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          e.preventDefault();
          handleResultSelect(results[selectedIndex]);
        }
        break;
        
      default:
        break;
    }
  };
  
  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Focus input when pressing / key
  useEffect(() => {
    const handleSlashKey = (e) => {
      // Focus search input when pressing / (but not when typing in an input or textarea)
      if (e.key === '/' && 
          document.activeElement.tagName !== 'INPUT' && 
          document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current.focus();
      }
    };
    
    document.addEventListener('keydown', handleSlashKey);
    return () => {
      document.removeEventListener('keydown', handleSlashKey);
    };
  }, []);
  
  return (
    <div className="global-search" ref={searchRef}>
      <form onSubmit={handleSubmit}>
        <div className="search-input-container">
          <svg className="search-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          
          <input
            type="text"
            ref={inputRef}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim() && results.length > 0) {
                setShowResults(true);
              } else if (recentSearches.length > 0) {
                setShowResults(true);
              }
            }}
            placeholder={placeholder}
            aria-label="Search"
            autoComplete="off"
          />
          
          {loading && (
            <div className="search-spinner"></div>
          )}
          
          {query && (
            <button 
              type="button" 
              className="clear-button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setShowResults(false);
                inputRef.current.focus();
              }}
              aria-label="Clear search"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
          
          <div className="keyboard-shortcut" title="Press / to search">
            /
          </div>
        </div>
      </form>
      
      {showResults && (
        <div className="search-results">
          {results.length > 0 ? (
            <div className="results-list">
              {results.map((result, index) => (
                <div 
                  key={result.id}
                  className={`result-item ${selectedIndex === index ? 'selected' : ''}`}
                  onClick={() => handleResultSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {result.imageUrl ? (
                    <div className="result-image">
                      <img src={result.imageUrl} alt={result.title} />
                    </div>
                  ) : (
                    <div className={`result-icon ${result.type}`}>
                      {result.type === 'movie' && (
                        <svg viewBox="0 0 24 24" width="20" height="20">
                          <path fill="currentColor" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
                        </svg>
                      )}
                      {result.type === 'actor' && (
                        <svg viewBox="0 0 24 24" width="20" height="20">
                          <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      )}
                      {result.type === 'genre' && (
                        <svg viewBox="0 0 24 24" width="20" height="20">
                          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                        </svg>
                      )}
                    </div>
                  )}
                  
                  <div className="result-info">
                    <div className="result-title">{result.title}</div>
                    <div className="result-details">
                      <span className="result-type">{result.type}</span>
                      {result.year && <span className="result-year">{result.year}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="no-results">
              <p>No results found for "{query}"</p>
              <button 
                className="search-all-button"
                onClick={() => {
                  saveRecentSearch(query);
                  if (onResultSelect) {
                    onResultSelect({ type: 'search', query });
                  }
                }}
              >
                Search all content
              </button>
            </div>
          ) : recentSearches.length > 0 ? (
            <div className="recent-searches">
              <div className="recent-header">
                <span>Recent Searches</span>
                <button 
                  className="clear-recent-button"
                  onClick={handleClearRecentSearches}
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <div 
                  key={index}
                  className="recent-search-item"
                  onClick={() => handleRecentSearchSelect(search)}
                >
                  <svg className="recent-icon" viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                  </svg>
                  <span>{search}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
      
      <style jsx>{`
        .global-search {
          position: relative;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .search-input-container {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .search-icon {
          position: absolute;
          left: 12px;
          color: #95a5a6;
          pointer-events: none;
        }
        
        input {
          width: 100%;
          padding: 12px 40px 12px 40px;
          border: none;
          border-radius: 8px;
          background-color: #2c3e50;
          color: white;
          font-size: 16px;
          transition: background-color 0.2s ease;
        }
        
        input:focus {
          outline: none;
          background-color: #34495e;
        }
        
        input::placeholder {
          color: #95a5a6;
        }
        
        .clear-button {
          position: absolute;
          right: 40px;
          background: none;
          border: none;
          color: #95a5a6;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }
        
        .clear-button:hover {
          color: white;
        }
        
        .keyboard-shortcut {
          position: absolute;
          right: 12px;
          background-color: #34495e;
          color: #95a5a6;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
        }
        
        .search-spinner {
          position: absolute;
          right: 40px;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .search-results {
          position: absolute;
          top: 100%;
          left: 0;
          width: 100%;
          margin-top: 8px;
          background-color: #2c3e50;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          z-index: 10;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .results-list {
          padding: 8px 0;
        }
        
        .result-item {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .result-item:hover, .result-item.selected {
          background-color: #34495e;
        }
        
        .result-image {
          width: 40px;
          height: 40px;
          margin-right: 12px;
          border-radius: 4px;
          overflow: hidden;
          flex-shrink: 0;
        }
        
        .result-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .result-icon {
          width: 40px;
          height: 40px;
          margin-right: 12px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .result-icon.movie {
          background-color: #e74c3c;
        }
        
        .result-icon.actor {
          background-color: #3498db;
        }
        
        .result-icon.genre {
          background-color: #2ecc71;
        }
        
        .result-info {
          flex: 1;
          min-width: 0;
        }
        
        .result-title {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .result-details {
          display: flex;
          gap: 8px;
          font-size: 12px;
          color: #95a5a6;
        }
        
        .result-type {
          text-transform: capitalize;
        }
        
        .no-results {
          padding: 16px;
          text-align: center;
          color: #95a5a6;
        }
        
        .search-all-button {
          margin-top: 8px;
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .recent-searches {
          padding: 8px 0;
        }
        
        .recent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          color: #95a5a6;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }
        
        .clear-recent-button {
          background: none;
          border: none;
          color: #3498db;
          font-size: 12px;
          cursor: pointer;
        }
        
        .recent-search-item {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .recent-search-item:hover {
          background-color: #34495e;
        }
        
        .recent-icon {
          margin-right: 8px;
          color: #95a5a6;
        }
      `}</style>
    </div>
  );
};

GlobalSearch.propTypes = {
  onSearch: PropTypes.func,
  onResultSelect: PropTypes.func,
  placeholder: PropTypes.string
};

export default GlobalSearch;
