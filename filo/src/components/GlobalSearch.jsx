import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useP2P } from '../context/P2PContext';

/**
 * GlobalSearch - Advanced search component with autocomplete
 * Provides instant results and keyboard navigation
 * Optimized for P2P content discovery
 * 
 * @author zophlic
 */
const GlobalSearch = ({ 
  onSearch, 
  onResultSelect, 
  placeholder = 'Search files, peers, content...',
  includeRemoteResults = true
}) => {
  const { connections } = useP2P();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchScope, setSearchScope] = useState('all'); // 'all', 'local', 'peers'
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimeout = useRef(null);
  
  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem('filo_recent_searches');
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
      localStorage.setItem('filo_recent_searches', JSON.stringify(updatedSearches));
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
      // In a real implementation, this would search local files and query peers
      // For now, we'll simulate search results
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock local results
      const localResults = [
        {
          id: 'local-1',
          title: 'Project Presentation.pdf',
          type: 'file',
          fileType: 'pdf',
          size: 2500000,
          location: 'local',
          dateAdded: '2023-05-15T10:30:00Z',
          relevance: 0.95
        },
        {
          id: 'local-2',
          title: 'Research Paper.docx',
          type: 'file',
          fileType: 'docx',
          size: 1200000,
          location: 'local',
          dateAdded: '2023-06-20T14:45:00Z',
          relevance: 0.85
        }
      ];
      
      // Mock peer results
      const peerResults = [
        {
          id: 'peer-1',
          title: 'Data Analysis.xlsx',
          type: 'file',
          fileType: 'xlsx',
          size: 3800000,
          location: 'peer',
          peerId: 'peer-123',
          peerName: 'Research Lab',
          relevance: 0.75
        },
        {
          id: 'peer-2',
          title: 'Conference Video.mp4',
          type: 'media',
          fileType: 'mp4',
          size: 150000000,
          duration: 1800,
          location: 'peer',
          peerId: 'peer-456',
          peerName: 'Media Server',
          relevance: 0.65
        }
      ];
      
      // Filter results based on query
      const filteredLocalResults = localResults.filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      const filteredPeerResults = includeRemoteResults ? peerResults.filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) : [];
      
      // Filter based on search scope
      let combinedResults = [];
      
      if (searchScope === 'all') {
        combinedResults = [...filteredLocalResults, ...filteredPeerResults];
      } else if (searchScope === 'local') {
        combinedResults = filteredLocalResults;
      } else if (searchScope === 'peers') {
        combinedResults = filteredPeerResults;
      }
      
      // Sort by relevance
      combinedResults.sort((a, b) => b.relevance - a.relevance);
      
      setResults(combinedResults);
      setShowResults(true);
      setLoading(false);
      
      // Call onSearch callback
      if (onSearch) {
        onSearch(searchQuery, combinedResults, searchScope);
      }
      
      // Track search (in a real implementation, this would use analytics)
      console.log('Search performed:', {
        query: searchQuery,
        resultCount: combinedResults.length,
        scope: searchScope,
        connectedPeers: connections.length
      });
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
    
    // Track selection (in a real implementation, this would use analytics)
    console.log('Search result selected:', {
      query,
      resultId: result.id,
      resultType: result.type,
      resultTitle: result.title,
      resultLocation: result.location
    });
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
    localStorage.removeItem('filo_recent_searches');
  };
  
  // Handle search scope change
  const handleScopeChange = (scope) => {
    setSearchScope(scope);
    
    if (query.trim()) {
      performSearch(query);
    }
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
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format duration
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m ${secs}s`;
    }
  };
  
  // Get file icon based on file type
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />
          </svg>
        );
      case 'docx':
      case 'doc':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
          </svg>
        );
      case 'xlsx':
      case 'xls':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1.99 6H17L14.5 14h2.51l-1.99 5H7.5l2.49-5H7.5L10 9h7.01z" />
          </svg>
        );
      case 'mp4':
      case 'mov':
      case 'avi':
        return (
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z" />
          </svg>
        );
    }
  };
  
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
          <div className="search-scope">
            <button 
              className={`scope-button ${searchScope === 'all' ? 'active' : ''}`}
              onClick={() => handleScopeChange('all')}
            >
              All
            </button>
            <button 
              className={`scope-button ${searchScope === 'local' ? 'active' : ''}`}
              onClick={() => handleScopeChange('local')}
            >
              Local
            </button>
            <button 
              className={`scope-button ${searchScope === 'peers' ? 'active' : ''}`}
              onClick={() => handleScopeChange('peers')}
            >
              Peers ({connections.length})
            </button>
          </div>
          
          {results.length > 0 ? (
            <div className="results-list">
              {results.map((result, index) => (
                <div 
                  key={result.id}
                  className={`result-item ${selectedIndex === index ? 'selected' : ''}`}
                  onClick={() => handleResultSelect(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className={`result-icon ${result.fileType || result.type}`}>
                    {getFileIcon(result.fileType)}
                  </div>
                  
                  <div className="result-info">
                    <div className="result-title">{result.title}</div>
                    <div className="result-details">
                      {result.size && <span className="result-size">{formatFileSize(result.size)}</span>}
                      {result.duration && <span className="result-duration">{formatDuration(result.duration)}</span>}
                      {result.fileType && <span className="result-type">{result.fileType.toUpperCase()}</span>}
                    </div>
                  </div>
                  
                  {result.location === 'peer' && (
                    <div className="result-peer">
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                      <span>{result.peerName}</span>
                    </div>
                  )}
                  
                  {result.location === 'local' && (
                    <div className="result-local">
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                      </svg>
                      <span>Local</span>
                    </div>
                  )}
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
                    onResultSelect({ type: 'search', query, scope: searchScope });
                  }
                }}
              >
                Search all {searchScope} content
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
        
        .search-scope {
          display: flex;
          padding: 8px;
          border-bottom: 1px solid #34495e;
        }
        
        .scope-button {
          flex: 1;
          background: none;
          border: none;
          color: #95a5a6;
          padding: 6px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s ease;
        }
        
        .scope-button:hover {
          background-color: #34495e;
        }
        
        .scope-button.active {
          background-color: #3498db;
          color: white;
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
        
        .result-icon.pdf {
          background-color: #e74c3c;
        }
        
        .result-icon.doc, .result-icon.docx {
          background-color: #3498db;
        }
        
        .result-icon.xls, .result-icon.xlsx {
          background-color: #2ecc71;
        }
        
        .result-icon.mp4, .result-icon.mov, .result-icon.avi, .result-icon.media {
          background-color: #9b59b6;
        }
        
        .result-icon.file {
          background-color: #f39c12;
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
        
        .result-peer, .result-local {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #95a5a6;
          margin-left: 8px;
          padding: 2px 6px;
          border-radius: 4px;
          background-color: #34495e;
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
  placeholder: PropTypes.string,
  includeRemoteResults: PropTypes.bool
};

export default GlobalSearch;
