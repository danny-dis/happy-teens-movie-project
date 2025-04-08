import React, { useState, useEffect } from 'react';
import './ContentLibrary.css';

/**
 * Content Library Component
 * 
 * Displays the user's content library with:
 * - Grid or list view options
 * - Filtering and sorting
 * - Content details and actions
 * 
 * @author zophlic
 */
function ContentLibrary({ app, onSelectContent }) {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('added');
  const [sortDir, setSortDir] = useState('desc');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load content library
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        setLoading(true);
        
        // Get content from app
        const libraryContent = await app.getContentLibrary({
          sortBy,
          sortDir
        });
        
        setContent(libraryContent);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load content library:', error);
        setError('Failed to load your content library. Please try again.');
        setLoading(false);
      }
    };
    
    loadLibrary();
  }, [app, sortBy, sortDir]);
  
  // Filter and search content
  const filteredContent = content.filter(item => {
    // Apply type filter
    if (filter !== 'all' && item.metadata?.type !== filter) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = (item.metadata?.title || '').toLowerCase();
      const description = (item.metadata?.description || '').toLowerCase();
      
      return title.includes(query) || description.includes(query);
    }
    
    return true;
  });
  
  // Handle sort change
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };
  
  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
  };
  
  // Handle filter change
  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };
  
  // Handle search
  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };
  
  // Handle content selection
  const handleSelectContent = (item) => {
    if (onSelectContent) {
      onSelectContent(item);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="content-library">
        <div className="library-header">
          <h2>Your Content Library</h2>
        </div>
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Loading your content...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="content-library">
        <div className="library-header">
          <h2>Your Content Library</h2>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="content-library">
      <div className="library-header">
        <h2>Your Content Library</h2>
        <div className="library-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
          
          <div className="filter-controls">
            <select value={filter} onChange={handleFilterChange}>
              <option value="all">All Types</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="image">Images</option>
              <option value="document">Documents</option>
            </select>
            
            <select value={sortBy} onChange={handleSortChange}>
              <option value="added">Date Added</option>
              <option value="title">Title</option>
              <option value="size">Size</option>
              <option value="publishedAt">Published Date</option>
            </select>
            
            <button 
              className="sort-direction-button" 
              onClick={toggleSortDirection}
              title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortDir === 'asc' ? '↑' : '↓'}
            </button>
            
            <div className="view-mode-toggle">
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                □□
              </button>
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                ≡
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {filteredContent.length === 0 ? (
        <div className="empty-library">
          <p>No content found in your library.</p>
          {searchQuery && (
            <p>Try adjusting your search or filters.</p>
          )}
          {!searchQuery && filter !== 'all' && (
            <p>Try selecting a different content type.</p>
          )}
          {!searchQuery && filter === 'all' && (
            <p>Share or download content to build your library.</p>
          )}
        </div>
      ) : (
        <div className={`content-grid ${viewMode}`}>
          {filteredContent.map(item => (
            <div 
              key={item.id} 
              className="content-item"
              onClick={() => handleSelectContent(item)}
            >
              <div className="content-thumbnail">
                {item.metadata?.thumbnailUrl ? (
                  <img 
                    src={item.metadata.thumbnailUrl} 
                    alt={item.metadata.title || 'Content'} 
                  />
                ) : (
                  <div className="placeholder-thumbnail">
                    {getContentTypeIcon(item.metadata?.type || 'unknown')}
                  </div>
                )}
              </div>
              
              <div className="content-details">
                <h3 className="content-title">
                  {item.metadata?.title || 'Untitled Content'}
                </h3>
                
                {viewMode === 'list' && (
                  <p className="content-description">
                    {item.metadata?.description || 'No description available'}
                  </p>
                )}
                
                <div className="content-meta">
                  <span className="content-type">
                    {formatContentType(item.metadata?.type || 'unknown')}
                  </span>
                  
                  <span className="content-size">
                    {formatFileSize(item.size || 0)}
                  </span>
                  
                  {viewMode === 'list' && (
                    <span className="content-date">
                      Added: {formatDate(item.added)}
                    </span>
                  )}
                </div>
              </div>
              
              {viewMode === 'grid' && (
                <div className="content-actions">
                  <button 
                    className="play-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectContent(item);
                    }}
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper function to get content type icon
function getContentTypeIcon(type) {
  switch (type) {
    case 'video':
      return '🎬';
    case 'audio':
      return '🎵';
    case 'image':
      return '🖼️';
    case 'document':
      return '📄';
    default:
      return '📁';
  }
}

// Helper function to format content type
function formatContentType(type) {
  switch (type) {
    case 'video':
      return 'Video';
    case 'audio':
      return 'Audio';
    case 'image':
      return 'Image';
    case 'document':
      return 'Document';
    default:
      return 'File';
  }
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to format date
function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

export default ContentLibrary;
