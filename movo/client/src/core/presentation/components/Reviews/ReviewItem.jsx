/**
 * Review Item Component for Movo
 * Displays a single review with user information and actions
 * 
 * @author zophlic
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '../../stores/userStore';

// Styled components
const Container = styled.div`
  background-color: ${props => props.theme.surface};
  border-radius: ${props => props.theme.borderRadiusMedium};
  padding: 1.5rem;
  transition: transform ${props => props.theme.transitionFast} ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.elevation2};
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.theme.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${props => props.theme.fontWeightBold};
  font-size: ${props => props.theme.fontSizeNormal};
`;

const UserName = styled.div`
  font-weight: ${props => props.theme.fontWeightMedium};
  color: ${props => props.theme.text};
`;

const Timestamp = styled.div`
  font-size: ${props => props.theme.fontSizeSmall};
  color: ${props => props.theme.textSecondary};
  margin-top: 0.25rem;
`;

const Rating = styled.div`
  display: flex;
  align-items: center;
  color: ${props => props.theme.warning};
  font-weight: ${props => props.theme.fontWeightMedium};
`;

const Content = styled.div`
  color: ${props => props.theme.text};
  line-height: 1.6;
  margin-bottom: 1rem;
  white-space: pre-wrap;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${props => props.theme.border};
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.active ? props.theme.primary : props.theme.textSecondary};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  transition: all ${props => props.theme.transitionFast} ease;
  
  &:hover {
    background-color: ${props => props.theme.background};
    color: ${props => props.active ? props.theme.primary : props.theme.text};
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const DeleteButton = styled(ActionButton)`
  color: ${props => props.theme.error};
  
  &:hover {
    color: ${props => props.theme.error};
  }
`;

const ConfirmDialog = styled.div`
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 0.5rem;
  background-color: ${props => props.theme.surface};
  border-radius: ${props => props.theme.borderRadiusMedium};
  box-shadow: ${props => props.theme.elevation3};
  padding: 1rem;
  width: 250px;
  z-index: ${props => props.theme.zIndexDropdown};
`;

const ConfirmText = styled.p`
  margin: 0 0 1rem 0;
  color: ${props => props.theme.text};
`;

const ConfirmButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const ConfirmButton = styled.button`
  background-color: ${props => props.danger ? props.theme.error : props.theme.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadiusSmall};
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: ${props => props.theme.fontSizeSmall};
  
  &:hover {
    opacity: 0.9;
  }
`;

const CancelButton = styled.button`
  background-color: transparent;
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  border-radius: ${props => props.theme.borderRadiusSmall};
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: ${props => props.theme.fontSizeSmall};
  
  &:hover {
    background-color: ${props => props.theme.background};
  }
`;

const ActionContainer = styled.div`
  position: relative;
`;

/**
 * Review item component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Review item component
 */
const ReviewItem = ({ review, onDelete, onLike }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const currentUser = useUser();
  
  // Check if current user is the author
  const isAuthor = currentUser && currentUser.id === review.userId;
  
  // Check if current user has liked the review
  const isLiked = review.likes && review.likes.includes(currentUser?.id);
  
  // Format date
  const formattedDate = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });
  
  // Get user initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Handle delete
  const handleDelete = () => {
    onDelete(review.id);
    setShowConfirmDelete(false);
  };
  
  // Handle like
  const handleLike = () => {
    onLike(review.id, isLiked);
  };
  
  return (
    <Container>
      <Header>
        <UserInfo>
          <Avatar>{getInitials(review.username)}</Avatar>
          <div>
            <UserName>{review.username}</UserName>
            <Timestamp>{formattedDate}</Timestamp>
          </div>
        </UserInfo>
        <Rating>
          {review.rating.toFixed(1)} ★
        </Rating>
      </Header>
      
      <Content>{review.content}</Content>
      
      <Actions>
        <ActionButton 
          onClick={handleLike}
          active={isLiked}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
          </svg>
          {review.likeCount || 0}
        </ActionButton>
        
        {isAuthor && (
          <ActionContainer>
            <DeleteButton onClick={() => setShowConfirmDelete(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Delete
            </DeleteButton>
            
            {showConfirmDelete && (
              <ConfirmDialog>
                <ConfirmText>Are you sure you want to delete this review?</ConfirmText>
                <ConfirmButtons>
                  <CancelButton onClick={() => setShowConfirmDelete(false)}>
                    Cancel
                  </CancelButton>
                  <ConfirmButton danger onClick={handleDelete}>
                    Delete
                  </ConfirmButton>
                </ConfirmButtons>
              </ConfirmDialog>
            )}
          </ActionContainer>
        )}
      </Actions>
    </Container>
  );
};

ReviewItem.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    rating: PropTypes.number.isRequired,
    createdAt: PropTypes.string.isRequired,
    likeCount: PropTypes.number,
    likes: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onLike: PropTypes.func.isRequired
};

export default ReviewItem;
