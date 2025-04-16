/**
 * Movie Info Card Component for Filo
 * Displays movie information in a card format
 * 
 * @author zophlic
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import movieDatabaseService from '../../api/MovieDatabaseService';

// Styled components
const Card = styled.div`
  position: relative;
  width: 100%;
  background-color: ${props => props.theme.surface};
  border-radius: ${props => props.theme.borderRadiusMedium};
  overflow: hidden;
  box-shadow: ${props => props.theme.elevation1};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.elevation2};
  }
`;

const PosterContainer = styled.div`
  position: relative;
  width: 100%;
  padding-top: 150%; /* 2:3 aspect ratio */
  overflow: hidden;
`;

const Poster = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  
  ${Card}:hover & {
    transform: scale(1.05);
  }
`;

const PosterOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.7) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${Card}:hover & {
    opacity: 1;
  }
`;

const Content = styled.div`
  padding: 1rem;
`;

const Title = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: ${props => props.theme.fontSizeMedium};
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Year = styled.span`
  font-size: ${props => props.theme.fontSizeSmall};
  color: ${props => props.theme.textSecondary};
`;

const Rating = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: ${props => props.theme.fontSizeSmall};
  font-weight: 600;
  z-index: 1;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid transparent;
    border-top-color: ${props => {
      const rating = props.rating;
      if (rating >= 7) return props.theme.success;
      if (rating >= 5) return props.theme.warning;
      return props.theme.error;
    }};
    border-right-color: ${props => {
      const rating = props.rating;
      if (rating >= 7) return props.theme.success;
      if (rating >= 5) return props.theme.warning;
      return props.theme.error;
    }};
    opacity: 0.8;
  }
`;

const GenreList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const Genre = styled.span`
  font-size: ${props => props.theme.fontSizeXSmall};
  color: ${props => props.theme.textTertiary};
  background-color: ${props => props.theme.backgroundAlt};
  padding: 0.25rem 0.5rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
`;

const OverlayButtons = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  z-index: 1;
`;

const OverlayButton = styled.button`
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadiusSmall};
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.9);
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const Placeholder = styled.div`
  width: 100%;
  height: 100%;
  background-color: ${props => props.theme.backgroundAlt};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.textTertiary};
  font-size: ${props => props.theme.fontSizeSmall};
`;

const DownloadBadge = styled.div`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background-color: ${props => props.downloaded ? props.theme.success : props.theme.primary};
  color: white;
  font-size: ${props => props.theme.fontSizeXSmall};
  padding: 0.25rem 0.5rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  z-index: 1;
  display: flex;
  align-items: center;
  
  svg {
    width: 0.875rem;
    height: 0.875rem;
    margin-right: 0.25rem;
  }
`;

const P2PInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: ${props => props.theme.fontSizeXSmall};
  color: ${props => props.theme.textSecondary};
`;

const Peers = styled.span`
  display: flex;
  align-items: center;
  
  svg {
    width: 0.875rem;
    height: 0.875rem;
    margin-right: 0.25rem;
  }
`;

const Size = styled.span``;

/**
 * Movie Info Card component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Movie info card component
 */
const MovieInfoCard = ({
  movieId,
  tvShowId,
  initialData,
  className,
  onClick,
  isDownloaded,
  downloadProgress,
  peerCount,
  fileSize
}) => {
  const [data, setData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(null);
  const [posterUrl, setPosterUrl] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Fetch movie or TV show data
  useEffect(() => {
    const fetchData = async () => {
      if (initialData) {
        setData(initialData);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        let result;
        
        if (movieId) {
          result = await movieDatabaseService.getMovieDetails(movieId);
        } else if (tvShowId) {
          result = await movieDatabaseService.getTvShowDetails(tvShowId);
        } else {
          throw new Error('Either movieId or tvShowId is required');
        }
        
        setData(result);
      } catch (err) {
        console.error('Failed to fetch movie/TV show data', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [movieId, tvShowId, initialData]);
  
  // Fetch poster image
  useEffect(() => {
    const fetchPoster = async () => {
      if (!data || !data.poster_path) {
        return;
      }
      
      try {
        // For Filo, we try to get the locally cached image first
        const imageUrl = await movieDatabaseService.downloadImage(data.poster_path, 'w342', 'poster');
        setPosterUrl(imageUrl);
      } catch (err) {
        console.error('Failed to fetch poster image', err);
        // Fall back to online URL
        setPosterUrl(movieDatabaseService.getImageUrl(data.poster_path, 'w342', 'poster'));
      }
    };
    
    fetchPoster();
  }, [data]);
  
  // Handle click
  const handleClick = () => {
    if (onClick && data) {
      onClick(data);
    }
  };
  
  // Handle download
  const handleDownload = (e) => {
    e.stopPropagation();
    
    if (isDownloaded) {
      // Already downloaded, do nothing
      return;
    }
    
    if (isDownloading) {
      // Cancel download
      setIsDownloading(false);
      // Show toast or notification
      console.log('Download canceled');
    } else {
      // Start download
      setIsDownloading(true);
      // Show toast or notification
      console.log('Download started');
      
      // Simulate download progress (in a real app, this would be handled by a download service)
      const interval = setInterval(() => {
        setIsDownloading(false);
        clearInterval(interval);
        // Show toast or notification
        console.log('Download completed');
      }, 3000);
    }
  };
  
  // Handle share
  const handleShare = (e) => {
    e.stopPropagation();
    
    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: data.title || data.name,
        text: data.overview,
        url: window.location.origin + (movieId ? `/movie/${movieId}` : `/tv/${tvShowId}`)
      }).catch(err => {
        console.error('Error sharing', err);
      });
    } else {
      // Show toast or notification
      console.log('Sharing functionality coming soon');
    }
  };
  
  // Handle add to favorites
  const handleAddToFavorites = (e) => {
    e.stopPropagation();
    // Show toast or notification
    console.log('Added to favorites');
  };
  
  // If loading
  if (loading) {
    return (
      <Card className={className}>
        <PosterContainer>
          <Placeholder>Loading...</Placeholder>
        </PosterContainer>
        <Content>
          <Title>Loading...</Title>
        </Content>
      </Card>
    );
  }
  
  // If error
  if (error) {
    return (
      <Card className={className}>
        <PosterContainer>
          <Placeholder>Error</Placeholder>
        </PosterContainer>
        <Content>
          <Title>Error loading content</Title>
        </Content>
      </Card>
    );
  }
  
  // If no data
  if (!data) {
    return null;
  }
  
  // Get year
  const year = data.release_date
    ? new Date(data.release_date).getFullYear()
    : data.first_air_date
      ? new Date(data.first_air_date).getFullYear()
      : null;
  
  // Get rating
  const rating = data.vote_average ? Math.round(data.vote_average * 10) / 10 : null;
  
  // Get genres (limit to 3)
  const genres = data.genres ? data.genres.slice(0, 3) : [];
  
  return (
    <Card className={className} onClick={handleClick}>
      <PosterContainer>
        {posterUrl ? (
          <>
            <Poster src={posterUrl} alt={data.title || data.name} />
            <PosterOverlay />
          </>
        ) : (
          <Placeholder>No Image</Placeholder>
        )}
        
        {rating !== null && (
          <Rating rating={rating}>
            {rating}
          </Rating>
        )}
        
        {(isDownloaded || isDownloading) && (
          <DownloadBadge downloaded={isDownloaded}>
            {isDownloaded ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
                Downloaded
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="2" x2="12" y2="22"></line>
                  <polyline points="22 12 12 22 2 12"></polyline>
                </svg>
                Downloading
              </>
            )}
          </DownloadBadge>
        )}
        
        <OverlayButtons>
          <OverlayButton onClick={handleDownload} title={isDownloaded ? "Downloaded" : isDownloading ? "Cancel Download" : "Download"}>
            {isDownloaded ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7"></path>
              </svg>
            ) : isDownloading ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            )}
          </OverlayButton>
          <OverlayButton onClick={handleAddToFavorites} title="Add to Favorites">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </OverlayButton>
          <OverlayButton onClick={handleShare} title="Share">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
          </OverlayButton>
        </OverlayButtons>
      </PosterContainer>
      
      <Content>
        <Title title={data.title || data.name}>
          {data.title || data.name}
        </Title>
        
        {year && <Year>{year}</Year>}
        
        {genres.length > 0 && (
          <GenreList>
            {genres.map(genre => (
              <Genre key={genre.id}>{genre.name}</Genre>
            ))}
          </GenreList>
        )}
        
        {(peerCount !== undefined || fileSize !== undefined) && (
          <P2PInfo>
            {peerCount !== undefined && (
              <Peers>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                {peerCount} peers
              </Peers>
            )}
            
            {fileSize !== undefined && (
              <Size>{fileSize}</Size>
            )}
          </P2PInfo>
        )}
      </Content>
    </Card>
  );
};

MovieInfoCard.propTypes = {
  movieId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  tvShowId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  initialData: PropTypes.object,
  className: PropTypes.string,
  onClick: PropTypes.func,
  isDownloaded: PropTypes.bool,
  downloadProgress: PropTypes.number,
  peerCount: PropTypes.number,
  fileSize: PropTypes.string
};

export default MovieInfoCard;
