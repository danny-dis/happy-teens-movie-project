import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useP2P } from '../context/P2PContext';

/**
 * VirtualizedMediaList - Efficient rendering of large media lists
 * Uses virtualization to only render visible items
 * Optimized for P2P shared content
 * 
 * @author zophlic
 */
const VirtualizedMediaList = ({ 
  mediaItems, 
  onMediaSelect, 
  loading = false,
  loadMore = null,
  columnCount = 5,
  itemHeight = 300,
  itemWidth = 200,
  gap = 16
}) => {
  const { connections } = useP2P();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [visibleItems, setVisibleItems] = useState(new Set());
  
  // Track scroll position for infinite loading
  const handleScroll = useCallback(({ scrollTop, scrollUpdateWasRequested }) => {
    // Only check for loadMore when user is scrolling, not when scroll position is updated programmatically
    if (!scrollUpdateWasRequested && loadMore && !loading) {
      const scrollThreshold = 200; // pixels from bottom to trigger load more
      const scrollHeight = mediaItems.length / columnCount * itemHeight;
      const scrollBottom = scrollHeight - scrollTop - window.innerHeight;
      
      if (scrollBottom < scrollThreshold) {
        loadMore();
      }
    }
  }, [loadMore, loading, mediaItems.length, columnCount, itemHeight]);
  
  // Track which items are visible for potential prefetching
  const onItemsRendered = useCallback(({ visibleRowStartIndex, visibleRowStopIndex, visibleColumnStartIndex, visibleColumnStopIndex }) => {
    const newVisibleItems = new Set();
    
    for (let rowIndex = visibleRowStartIndex; rowIndex <= visibleRowStopIndex; rowIndex++) {
      for (let colIndex = visibleColumnStartIndex; colIndex <= visibleColumnStopIndex; colIndex++) {
        const index = rowIndex * columnCount + colIndex;
        if (index < mediaItems.length) {
          newVisibleItems.add(mediaItems[index].id);
        }
      }
    }
    
    setVisibleItems(newVisibleItems);
  }, [mediaItems, columnCount]);
  
  // Prefetch metadata for visible items
  useEffect(() => {
    // In a real implementation, this would prefetch metadata for visible items
    // For now, we'll just log which items are visible
    console.log('Visible items:', Array.from(visibleItems));
  }, [visibleItems]);
  
  // Render a media item
  const MediaItem = useCallback(({ item, style }) => {
    const isHovered = hoveredItem === item.id;
    const isAvailableOffline = item.isDownloaded || item.isLocal;
    const isPeerAvailable = item.peerIds && item.peerIds.some(peerId => 
      connections.some(conn => conn.peerId === peerId)
    );
    
    return (
      <div 
        className={`media-item ${isHovered ? 'hovered' : ''}`}
        style={style}
        onClick={() => onMediaSelect(item)}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <div className="media-thumbnail">
          {item.thumbnailUrl ? (
            <img 
              src={item.thumbnailUrl} 
              alt={item.title} 
              loading="lazy" 
              width={itemWidth - 32} 
              height={(itemHeight - 80)}
            />
          ) : (
            <div className="thumbnail-placeholder">
              <span>{item.title.substring(0, 1)}</span>
            </div>
          )}
          
          {isHovered && (
            <div className="media-hover-info">
              <div className="hover-content">
                <button className="play-button">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M8 5v14l11-7z" />
                  </svg>
                  <span>Play</span>
                </button>
                <div className="media-meta">
                  {item.size && <span className="size">{formatFileSize(item.size)}</span>}
                  {item.duration && <span className="duration">{formatDuration(item.duration)}</span>}
                  {item.type && <span className="type">{item.type}</span>}
                </div>
              </div>
            </div>
          )}
          
          <div className="status-badges">
            {isAvailableOffline && (
              <div className="status-badge offline-badge" title="Available offline">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                </svg>
              </div>
            )}
            
            {isPeerAvailable && (
              <div className="status-badge peer-badge" title="Available from peers">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm6.5-12C20.88 2 23 4.12 23 6.5S20.88 11 18.5 11c-.91 0-1.76-.31-2.44-.81 1.43-1.23 1.94-3.26 1.94-3.69 0-.43-.51-2.46-1.94-3.69.68-.5 1.53-.81 2.44-.81zM3.5 2C5.88 2 8 4.12 8 6.5S5.88 11 3.5 11c-.91 0-1.76-.31-2.44-.81 1.43-1.23 1.94-3.26 1.94-3.69 0-.43-.51-2.46-1.94-3.69.68-.5 1.53-.81 2.44-.81z" />
                </svg>
              </div>
            )}
            
            {item.encrypted && (
              <div className="status-badge encrypted-badge" title="Encrypted">
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
              </div>
            )}
          </div>
        </div>
        
        <div className="media-info">
          <h3 className="media-title">{item.title}</h3>
          <div className="media-details">
            {item.creator && <span className="creator">{item.creator}</span>}
            {item.dateAdded && <span className="date">{formatDate(item.dateAdded)}</span>}
          </div>
        </div>
      </div>
    );
  }, [hoveredItem, onMediaSelect, connections, itemWidth, itemHeight]);
  
  // Cell renderer for the grid
  const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    
    // Return empty cell if index is out of bounds
    if (index >= mediaItems.length) {
      return null;
    }
    
    const item = mediaItems[index];
    
    // Adjust style to account for gap
    const adjustedStyle = {
      ...style,
      left: style.left + gap,
      top: style.top + gap,
      width: style.width - gap * 2,
      height: style.height - gap * 2
    };
    
    return <MediaItem item={item} style={adjustedStyle} />;
  }, [mediaItems, columnCount, gap, MediaItem]);
  
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
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Empty state when no media items are available
  if (mediaItems.length === 0 && !loading) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48">
          <path fill="currentColor" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
        </svg>
        <h3>No media found</h3>
        <p>Connect with peers to discover shared content or add your own media files.</p>
        <button className="connect-button">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span>Connect to Peers</span>
        </button>
      </div>
    );
  }
  
  return (
    <div className="virtualized-media-list">
      <AutoSizer>
        {({ height, width }) => {
          // Calculate how many columns can fit
          const calculatedColumnCount = Math.max(1, Math.floor(width / (itemWidth + gap)));
          const actualColumnCount = columnCount || calculatedColumnCount;
          
          // Calculate row count
          const rowCount = Math.ceil(mediaItems.length / actualColumnCount);
          
          return (
            <FixedSizeGrid
              columnCount={actualColumnCount}
              columnWidth={itemWidth + gap}
              height={height}
              rowCount={rowCount}
              rowHeight={itemHeight + gap}
              width={width}
              onScroll={handleScroll}
              onItemsRendered={onItemsRendered}
              overscanRowCount={2}
            >
              {Cell}
            </FixedSizeGrid>
          );
        }}
      </AutoSizer>
      
      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Discovering media...</p>
        </div>
      )}
      
      <style jsx>{`
        .virtualized-media-list {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 500px;
        }
        
        .media-item {
          padding: 16px;
          cursor: pointer;
          transition: transform 0.2s ease;
          position: relative;
        }
        
        .media-item:hover {
          transform: scale(1.05);
          z-index: 1;
        }
        
        .media-thumbnail {
          position: relative;
          width: 100%;
          height: calc(100% - 60px);
          border-radius: 8px;
          overflow: hidden;
          background-color: #2c3e50;
        }
        
        .media-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: filter 0.3s ease;
        }
        
        .media-item:hover .media-thumbnail img {
          filter: brightness(0.7);
        }
        
        .thumbnail-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #3498db, #2c3e50);
          color: white;
          font-size: 48px;
          font-weight: bold;
        }
        
        .media-hover-info {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 16px;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 50%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .media-item:hover .media-hover-info {
          opacity: 1;
        }
        
        .hover-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .play-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .play-button:hover {
          background-color: #2980b9;
        }
        
        .media-meta {
          display: flex;
          gap: 8px;
          color: white;
          font-size: 12px;
        }
        
        .status-badges {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .status-badge {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .offline-badge {
          background-color: #2ecc71;
        }
        
        .peer-badge {
          background-color: #3498db;
        }
        
        .encrypted-badge {
          background-color: #9b59b6;
        }
        
        .media-info {
          padding: 8px 0;
        }
        
        .media-title {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .media-details {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #95a5a6;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px;
          text-align: center;
          color: #7f8c8d;
        }
        
        .empty-state svg {
          margin-bottom: 16px;
          opacity: 0.5;
        }
        
        .empty-state h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
        }
        
        .empty-state p {
          margin: 0 0 16px 0;
          font-size: 14px;
        }
        
        .connect-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .loading-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
          color: white;
        }
        
        .spinner {
          width: 24px;
          height: 24px;
          margin-bottom: 8px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

VirtualizedMediaList.propTypes = {
  mediaItems: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    thumbnailUrl: PropTypes.string,
    creator: PropTypes.string,
    dateAdded: PropTypes.string,
    size: PropTypes.number,
    duration: PropTypes.number,
    type: PropTypes.string,
    isDownloaded: PropTypes.bool,
    isLocal: PropTypes.bool,
    encrypted: PropTypes.bool,
    peerIds: PropTypes.arrayOf(PropTypes.string)
  })).isRequired,
  onMediaSelect: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  loadMore: PropTypes.func,
  columnCount: PropTypes.number,
  itemHeight: PropTypes.number,
  itemWidth: PropTypes.number,
  gap: PropTypes.number
};

export default VirtualizedMediaList;
