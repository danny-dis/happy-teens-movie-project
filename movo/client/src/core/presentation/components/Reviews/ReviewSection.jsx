/**
 * Review Section Component for Movo
 * Displays and manages user reviews for media content
 * 
 * @author zophlic
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useQueryRepository } from '../../hooks/useQueryRepository';
import { useIsAuthenticated } from '../../stores/userStore';
import { useToast } from '../Toast';
import ReviewForm from './ReviewForm';
import ReviewItem from './ReviewItem';
import telemetryService from '../../../infrastructure/telemetry/TelemetryService';

// Styled components
const Container = styled.div`
  margin: 2rem 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const Title = styled.h3`
  font-size: ${props => props.theme.fontSizeLarge};
  font-weight: ${props => props.theme.fontWeightBold};
  color: ${props => props.theme.text};
  margin: 0;
`;

const ReviewCount = styled.span`
  font-size: ${props => props.theme.fontSizeSmall};
  color: ${props => props.theme.textSecondary};
  margin-left: 0.5rem;
`;

const ReviewList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const LoadMoreButton = styled.button`
  background-color: transparent;
  border: 1px solid ${props => props.theme.primary};
  color: ${props => props.theme.primary};
  border-radius: ${props => props.theme.borderRadiusMedium};
  padding: 0.75rem 1.5rem;
  font-size: ${props => props.theme.fontSizeNormal};
  cursor: pointer;
  margin-top: 1.5rem;
  transition: all ${props => props.theme.transitionFast} ease;
  
  &:hover {
    background-color: ${props => props.theme.primary};
    color: white;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${props => props.theme.textSecondary};
  background-color: ${props => props.theme.surface};
  border-radius: ${props => props.theme.borderRadiusMedium};
`;

const SortOptions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const SortButton = styled.button`
  background-color: ${props => props.active ? props.theme.primary : 'transparent'};
  color: ${props => props.active ? 'white' : props.theme.text};
  border: 1px solid ${props => props.active ? props.theme.primary : props.theme.border};
  border-radius: ${props => props.theme.borderRadiusSmall};
  padding: 0.5rem 1rem;
  font-size: ${props => props.theme.fontSizeSmall};
  cursor: pointer;
  transition: all ${props => props.theme.transitionFast} ease;
  
  &:hover {
    background-color: ${props => props.active ? props.theme.primary : props.theme.background};
  }
`;

/**
 * Review section component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Review section component
 */
const ReviewSection = ({ mediaId, mediaTitle }) => {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('recent');
  const isAuthenticated = useIsAuthenticated();
  const toast = useToast();
  
  // Use review repository
  const reviewRepo = useQueryRepository('ReviewRepository');
  
  // Get reviews
  const { 
    data: reviewsData, 
    isLoading, 
    refetch 
  } = reviewRepo.useQuery('getReviewsByMedia', [mediaId, page, 10, sortBy]);
  
  // Add review mutation
  const { 
    mutate: addReview, 
    isLoading: isAddingReview 
  } = reviewRepo.useMutation('addReview', {
    onSuccess: () => {
      toast.success('Review Added', 'Your review has been added successfully');
      refetch();
      
      // Track event
      telemetryService.trackEvent('content', 'add_review', {
        mediaId,
        mediaTitle
      });
    },
    onError: (error) => {
      toast.error('Error', error.message || 'Failed to add review');
    }
  });
  
  // Delete review mutation
  const { 
    mutate: deleteReview, 
    isLoading: isDeletingReview 
  } = reviewRepo.useMutation('deleteReview', {
    onSuccess: () => {
      toast.success('Review Deleted', 'Your review has been deleted');
      refetch();
      
      // Track event
      telemetryService.trackEvent('content', 'delete_review', {
        mediaId,
        mediaTitle
      });
    },
    onError: (error) => {
      toast.error('Error', error.message || 'Failed to delete review');
    }
  });
  
  // Like review mutation
  const { 
    mutate: likeReview 
  } = reviewRepo.useMutation('likeReview', {
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      toast.error('Error', error.message || 'Failed to like review');
    }
  });
  
  // Handle add review
  const handleAddReview = (reviewData) => {
    addReview({
      mediaId,
      ...reviewData
    });
  };
  
  // Handle delete review
  const handleDeleteReview = (reviewId) => {
    deleteReview(reviewId);
  };
  
  // Handle like review
  const handleLikeReview = (reviewId, isLiked) => {
    if (!isAuthenticated) {
      toast.info('Sign In Required', 'Please sign in to like reviews');
      return;
    }
    
    likeReview({
      reviewId,
      isLiked: !isLiked
    });
  };
  
  // Handle load more
  const handleLoadMore = () => {
    setPage(prevPage => prevPage + 1);
  };
  
  // Handle sort change
  const handleSortChange = (sort) => {
    setSortBy(sort);
    setPage(1);
  };
  
  // Reviews data
  const reviews = reviewsData?.reviews || [];
  const totalReviews = reviewsData?.totalCount || 0;
  const hasMoreReviews = reviewsData?.hasMore || false;
  
  return (
    <Container>
      <Header>
        <div>
          <Title>
            Reviews
            <ReviewCount>({totalReviews})</ReviewCount>
          </Title>
        </div>
      </Header>
      
      {isAuthenticated && (
        <ReviewForm 
          onSubmit={handleAddReview} 
          isLoading={isAddingReview} 
        />
      )}
      
      <SortOptions>
        <SortButton 
          active={sortBy === 'recent'} 
          onClick={() => handleSortChange('recent')}
        >
          Most Recent
        </SortButton>
        <SortButton 
          active={sortBy === 'rating'} 
          onClick={() => handleSortChange('rating')}
        >
          Highest Rated
        </SortButton>
        <SortButton 
          active={sortBy === 'likes'} 
          onClick={() => handleSortChange('likes')}
        >
          Most Liked
        </SortButton>
      </SortOptions>
      
      {isLoading && page === 1 ? (
        <EmptyState>Loading reviews...</EmptyState>
      ) : reviews.length > 0 ? (
        <>
          <ReviewList>
            {reviews.map(review => (
              <ReviewItem
                key={review.id}
                review={review}
                onDelete={handleDeleteReview}
                onLike={handleLikeReview}
              />
            ))}
          </ReviewList>
          
          {hasMoreReviews && (
            <LoadMoreButton 
              onClick={handleLoadMore} 
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load More Reviews'}
            </LoadMoreButton>
          )}
        </>
      ) : (
        <EmptyState>
          No reviews yet. Be the first to share your thoughts!
        </EmptyState>
      )}
    </Container>
  );
};

ReviewSection.propTypes = {
  mediaId: PropTypes.string.isRequired,
  mediaTitle: PropTypes.string.isRequired
};

export default ReviewSection;
