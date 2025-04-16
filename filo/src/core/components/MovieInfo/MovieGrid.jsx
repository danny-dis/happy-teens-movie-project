/**
 * Movie Grid Component for Filo
 * Displays a grid of movies or TV shows
 * 
 * @author zophlic
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import MovieInfoCard from './MovieInfoCard';
import movieDatabaseService from '../../api/MovieDatabaseService';

// Styled components
const Container = styled.div`
  width: 100%;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1.5rem;
  
  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-size: ${props => props.theme.fontSizeLarge};
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
  margin: 0;
`;

const ViewAllButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.primary};
  font-size: ${props => props.theme.fontSizeSmall};
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: ${props => props.theme.textSecondary};
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: ${props => props.theme.error};
  text-align: center;
`;

const RetryButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadiusSmall};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.primaryHover};
  }
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: ${props => props.theme.textSecondary};
  text-align: center;
  
  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
`;

const LoadMoreButton = styled.button`
  display: block;
  margin: 2rem auto 0;
  padding: 0.75rem 1.5rem;
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadiusMedium};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.primaryHover};
  }
  
  &:disabled {
    background-color: ${props => props.theme.backgroundAlt};
    color: ${props => props.theme.textTertiary};
    cursor: not-allowed;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const FilterButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: ${props => props.active ? props.theme.primary : props.theme.backgroundAlt};
  color: ${props => props.active ? 'white' : props.theme.textSecondary};
  border: none;
  border-radius: ${props => props.theme.borderRadiusSmall};
  font-size: ${props => props.theme.fontSizeSmall};
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.active ? props.theme.primaryHover : props.theme.backgroundHover};
  }
`;

/**
 * Movie Grid component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Movie grid component
 */
const MovieGrid = ({
  title,
  type,
  data,
  fetchFunction,
  fetchParams,
  onItemClick,
  onViewAll,
  className,
  maxItems,
  showDownloadStatus,
  showPeerInfo,
  showFilters
}) => {
  const [items, setItems] = useState(data || []);
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Mock download status data
  const [downloadStatus, setDownloadStatus] = useState({});
  const [peerInfo, setPeerInfo] = useState({});
  
  // Initialize mock data
  useEffect(() => {
    if (showDownloadStatus || showPeerInfo) {
      // Generate random download status and peer info for demo purposes
      const newDownloadStatus = {};
      const newPeerInfo = {};
      
      items.forEach(item => {
        const isDownloaded = Math.random() > 0.7;
        const downloadProgress = isDownloaded ? 100 : Math.floor(Math.random() * 100);
        const peerCount = Math.floor(Math.random() * 20);
        const fileSize = `${(Math.random() * 2 + 1).toFixed(1)} GB`;
        
        newDownloadStatus[item.id] = {
          isDownloaded,
          downloadProgress
        };
        
        newPeerInfo[item.id] = {
          peerCount,
          fileSize
        };
      });
      
      setDownloadStatus(newDownloadStatus);
      setPeerInfo(newPeerInfo);
    }
  }, [items, showDownloadStatus, showPeerInfo]);
  
  // Fetch data
  useEffect(() => {
    if (data) {
      setItems(data);
      setLoading(false);
      return;
    }
    
    if (!fetchFunction) {
      setLoading(false);
      return;
    }
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let result;
        
        // Determine which function to call
        switch (fetchFunction) {
          case 'popular-movies':
            result = await movieDatabaseService.getPopularMovies({ page, ...fetchParams });
            break;
          case 'popular-tv':
            result = await movieDatabaseService.getPopularTvShows({ page, ...fetchParams });
            break;
          case 'trending':
            result = await movieDatabaseService.getTrendingContent(
              fetchParams?.mediaType || 'all',
              fetchParams?.timeWindow || 'week',
              { page, ...fetchParams }
            );
            break;
          case 'search-movies':
            result = await movieDatabaseService.searchMovies(fetchParams.query, { page, ...fetchParams });
            break;
          case 'search-tv':
            result = await movieDatabaseService.searchTvShows(fetchParams.query, { page, ...fetchParams });
            break;
          case 'recommendations':
            result = await movieDatabaseService.getRecommendations(
              fetchParams.mediaType,
              fetchParams.id,
              { page, ...fetchParams }
            );
            break;
          default:
            throw new Error(`Unknown fetch function: ${fetchFunction}`);
        }
        
        if (result && result.results) {
          setItems(prevItems => page === 1 ? result.results : [...prevItems, ...result.results]);
          setTotalPages(result.total_pages || 1);
          setHasMore(result.page < result.total_pages);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [data, fetchFunction, fetchParams, page]);
  
  // Handle item click
  const handleItemClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };
  
  // Handle view all click
  const handleViewAllClick = () => {
    if (onViewAll) {
      onViewAll();
    }
  };
  
  // Handle retry
  const handleRetry = () => {
    setPage(1);
  };
  
  // Handle load more
  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };
  
  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };
  
  // Filter items based on active filter
  const filteredItems = items.filter(item => {
    if (activeFilter === 'all') {
      return true;
    }
    
    if (activeFilter === 'downloaded') {
      return downloadStatus[item.id]?.isDownloaded;
    }
    
    if (activeFilter === 'downloading') {
      return !downloadStatus[item.id]?.isDownloaded && downloadStatus[item.id]?.downloadProgress > 0;
    }
    
    if (activeFilter === 'not-downloaded') {
      return !downloadStatus[item.id]?.isDownloaded && (!downloadStatus[item.id] || downloadStatus[item.id]?.downloadProgress === 0);
    }
    
    return true;
  });
  
  // If loading and no items
  if (loading && items.length === 0) {
    return (
      <Container className={className}>
        {title && (
          <Header>
            <Title>{title}</Title>
          </Header>
        )}
        <LoadingContainer>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
          <span>Loading...</span>
        </LoadingContainer>
      </Container>
    );
  }
  
  // If error and no items
  if (error && items.length === 0) {
    return (
      <Container className={className}>
        {title && (
          <Header>
            <Title>{title}</Title>
          </Header>
        )}
        <ErrorContainer>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Failed to load content: {error}</span>
          <RetryButton onClick={handleRetry}>Retry</RetryButton>
        </ErrorContainer>
      </Container>
    );
  }
  
  // If no items
  if (items.length === 0) {
    return (
      <Container className={className}>
        {title && (
          <Header>
            <Title>{title}</Title>
          </Header>
        )}
        <EmptyContainer>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <span>No content found</span>
        </EmptyContainer>
      </Container>
    );
  }
  
  // Limit items if maxItems is specified
  const displayItems = maxItems ? filteredItems.slice(0, maxItems) : filteredItems;
  
  return (
    <Container className={className}>
      {title && (
        <Header>
          <Title>{title}</Title>
          {onViewAll && (
            <ViewAllButton onClick={handleViewAllClick}>
              View All
            </ViewAllButton>
          )}
        </Header>
      )}
      
      {showFilters && showDownloadStatus && (
        <FilterContainer>
          <FilterButton 
            active={activeFilter === 'all'} 
            onClick={() => handleFilterChange('all')}
          >
            All
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'downloaded'} 
            onClick={() => handleFilterChange('downloaded')}
          >
            Downloaded
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'downloading'} 
            onClick={() => handleFilterChange('downloading')}
          >
            Downloading
          </FilterButton>
          <FilterButton 
            active={activeFilter === 'not-downloaded'} 
            onClick={() => handleFilterChange('not-downloaded')}
          >
            Not Downloaded
          </FilterButton>
        </FilterContainer>
      )}
      
      <Grid>
        {displayItems.map(item => (
          <MovieInfoCard
            key={item.id}
            movieId={type === 'movie' ? item.id : undefined}
            tvShowId={type === 'tv' ? item.id : undefined}
            initialData={item}
            onClick={() => handleItemClick(item)}
            isDownloaded={showDownloadStatus ? downloadStatus[item.id]?.isDownloaded : undefined}
            downloadProgress={showDownloadStatus ? downloadStatus[item.id]?.downloadProgress : undefined}
            peerCount={showPeerInfo ? peerInfo[item.id]?.peerCount : undefined}
            fileSize={showPeerInfo ? peerInfo[item.id]?.fileSize : undefined}
          />
        ))}
      </Grid>
      
      {!maxItems && hasMore && (
        <LoadMoreButton onClick={handleLoadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </LoadMoreButton>
      )}
    </Container>
  );
};

MovieGrid.propTypes = {
  title: PropTypes.string,
  type: PropTypes.oneOf(['movie', 'tv', 'mixed']),
  data: PropTypes.array,
  fetchFunction: PropTypes.oneOf([
    'popular-movies',
    'popular-tv',
    'trending',
    'search-movies',
    'search-tv',
    'recommendations'
  ]),
  fetchParams: PropTypes.object,
  onItemClick: PropTypes.func,
  onViewAll: PropTypes.func,
  className: PropTypes.string,
  maxItems: PropTypes.number,
  showDownloadStatus: PropTypes.bool,
  showPeerInfo: PropTypes.bool,
  showFilters: PropTypes.bool
};

MovieGrid.defaultProps = {
  type: 'mixed',
  showDownloadStatus: false,
  showPeerInfo: false,
  showFilters: false
};

export default MovieGrid;
