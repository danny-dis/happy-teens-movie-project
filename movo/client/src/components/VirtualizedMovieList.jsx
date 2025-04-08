import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useChimera } from '../context/ChimeraContext';
import analyticsService, { EVENT_CATEGORIES } from '../services/analyticsService';

/**
 * VirtualizedMovieList - Efficient rendering of large movie lists
 * Uses virtualization to only render visible items
 * 
 * @author zophlic
 */
const VirtualizedMovieList = ({ 
  movies, 
  onMovieSelect, 
  loading = false,
  loadMore = null,
  columnCount = 5,
  itemHeight = 300,
  itemWidth = 200,
  gap = 16
}) => {
  const { isStreamingMode } = useChimera();
  const [hoveredMovie, setHoveredMovie] = useState(null);
  
  // Track scroll position for infinite loading
  const handleScroll = useCallback(({ scrollTop, scrollUpdateWasRequested }) => {
    // Only check for loadMore when user is scrolling, not when scroll position is updated programmatically
    if (!scrollUpdateWasRequested && loadMore && !loading) {
      const scrollThreshold = 200; // pixels from bottom to trigger load more
      const scrollHeight = movies.length / columnCount * itemHeight;
      const scrollBottom = scrollHeight - scrollTop - window.innerHeight;
      
      if (scrollBottom < scrollThreshold) {
        loadMore();
      }
    }
  }, [loadMore, loading, movies.length, columnCount, itemHeight]);
  
  // Track impressions for analytics
  useEffect(() => {
    if (movies.length > 0) {
      analyticsService.trackEvent(
        EVENT_CATEGORIES.CONTENT,
        'movie_list_impression',
        {
          count: movies.length,
          mode: isStreamingMode ? 'streaming' : 'local'
        }
      );
    }
  }, [movies.length, isStreamingMode]);
  
  // Render a movie item
  const MovieItem = useCallback(({ movie, style }) => {
    const isHovered = hoveredMovie === movie.id;
    
    return (
      <div 
        className={`movie-item ${isHovered ? 'hovered' : ''}`}
        style={style}
        onClick={() => {
          onMovieSelect(movie);
          
          // Track selection for analytics
          analyticsService.trackEvent(
            EVENT_CATEGORIES.CONTENT,
            'movie_select',
            {
              movieId: movie.id,
              title: movie.title,
              mode: isStreamingMode ? 'streaming' : 'local'
            }
          );
        }}
        onMouseEnter={() => setHoveredMovie(movie.id)}
        onMouseLeave={() => setHoveredMovie(null)}
      >
        <div className="movie-poster">
          {movie.posterUrl ? (
            <img 
              src={movie.posterUrl} 
              alt={movie.title} 
              loading="lazy" 
              width={itemWidth - 32} 
              height={(itemHeight - 80)}
            />
          ) : (
            <div className="poster-placeholder">
              <span>{movie.title.substring(0, 1)}</span>
            </div>
          )}
          
          {isHovered && (
            <div className="movie-hover-info">
              <div className="hover-content">
                <button className="play-button">
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M8 5v14l11-7z" />
                  </svg>
                  <span>Play</span>
                </button>
                <div className="movie-meta">
                  {movie.year && <span className="year">{movie.year}</span>}
                  {movie.duration && <span className="duration">{movie.duration}</span>}
                  {movie.rating && <span className="rating">{movie.rating}</span>}
                </div>
              </div>
            </div>
          )}
          
          {movie.isNew && <div className="new-badge">NEW</div>}
          {!isStreamingMode && movie.isDownloaded && (
            <div className="downloaded-badge">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="movie-info">
          <h3 className="movie-title">{movie.title}</h3>
          {movie.genres && (
            <div className="movie-genres">
              {movie.genres.slice(0, 2).join(' • ')}
            </div>
          )}
        </div>
      </div>
    );
  }, [hoveredMovie, onMovieSelect, isStreamingMode, itemWidth, itemHeight]);
  
  // Cell renderer for the grid
  const Cell = useCallback(({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    
    // Return empty cell if index is out of bounds
    if (index >= movies.length) {
      return null;
    }
    
    const movie = movies[index];
    
    // Adjust style to account for gap
    const adjustedStyle = {
      ...style,
      left: style.left + gap,
      top: style.top + gap,
      width: style.width - gap * 2,
      height: style.height - gap * 2
    };
    
    return <MovieItem movie={movie} style={adjustedStyle} />;
  }, [movies, columnCount, gap, MovieItem]);
  
  // Empty state when no movies are available
  if (movies.length === 0 && !loading) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48">
          <path fill="currentColor" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
        </svg>
        <h3>No movies found</h3>
        <p>{isStreamingMode ? 
          "We couldn't find any movies to stream. Try again later." : 
          "You don't have any downloaded movies. Switch to streaming mode to watch online content."}
        </p>
      </div>
    );
  }
  
  return (
    <div className="virtualized-movie-list">
      <AutoSizer>
        {({ height, width }) => {
          // Calculate how many columns can fit
          const calculatedColumnCount = Math.max(1, Math.floor(width / (itemWidth + gap)));
          const actualColumnCount = columnCount || calculatedColumnCount;
          
          // Calculate row count
          const rowCount = Math.ceil(movies.length / actualColumnCount);
          
          return (
            <FixedSizeGrid
              columnCount={actualColumnCount}
              columnWidth={itemWidth + gap}
              height={height}
              rowCount={rowCount}
              rowHeight={itemHeight + gap}
              width={width}
              onScroll={handleScroll}
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
          <p>Loading more movies...</p>
        </div>
      )}
      
      <style jsx>{`
        .virtualized-movie-list {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 500px;
        }
        
        .movie-item {
          padding: 16px;
          cursor: pointer;
          transition: transform 0.2s ease;
          position: relative;
        }
        
        .movie-item:hover {
          transform: scale(1.05);
          z-index: 1;
        }
        
        .movie-poster {
          position: relative;
          width: 100%;
          height: calc(100% - 60px);
          border-radius: 8px;
          overflow: hidden;
          background-color: #2c3e50;
        }
        
        .movie-poster img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: filter 0.3s ease;
        }
        
        .movie-item:hover .movie-poster img {
          filter: brightness(0.7);
        }
        
        .poster-placeholder {
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
        
        .movie-hover-info {
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
        
        .movie-item:hover .movie-hover-info {
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
          background-color: #e50914;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .play-button:hover {
          background-color: #f40612;
        }
        
        .movie-meta {
          display: flex;
          gap: 8px;
          color: white;
          font-size: 12px;
        }
        
        .new-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background-color: #e50914;
          color: white;
          font-size: 10px;
          font-weight: bold;
          padding: 4px 6px;
          border-radius: 4px;
        }
        
        .downloaded-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background-color: #2ecc71;
          color: white;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .movie-info {
          padding: 8px 0;
        }
        
        .movie-title {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .movie-genres {
          font-size: 12px;
          color: #95a5a6;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
          margin: 0;
          font-size: 14px;
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

VirtualizedMovieList.propTypes = {
  movies: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    posterUrl: PropTypes.string,
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    duration: PropTypes.string,
    rating: PropTypes.string,
    genres: PropTypes.arrayOf(PropTypes.string),
    isNew: PropTypes.bool,
    isDownloaded: PropTypes.bool
  })).isRequired,
  onMovieSelect: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  loadMore: PropTypes.func,
  columnCount: PropTypes.number,
  itemHeight: PropTypes.number,
  itemWidth: PropTypes.number,
  gap: PropTypes.number
};

export default VirtualizedMovieList;
