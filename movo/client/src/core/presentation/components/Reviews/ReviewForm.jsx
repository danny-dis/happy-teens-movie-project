/**
 * Review Form Component for Movo
 * Allows users to submit reviews for media content
 * 
 * @author zophlic
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useUser } from '../../stores/userStore';

// Styled components
const FormContainer = styled.div`
  background-color: ${props => props.theme.surface};
  border-radius: ${props => props.theme.borderRadiusMedium};
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const FormTitle = styled.h4`
  font-size: ${props => props.theme.fontSizeMedium};
  font-weight: ${props => props.theme.fontWeightMedium};
  color: ${props => props.theme.text};
  margin: 0 0 1rem 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  background-color: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.inputBorder};
  border-radius: ${props => props.theme.borderRadiusSmall};
  font-family: ${props => props.theme.fontFamily};
  font-size: ${props => props.theme.fontSizeNormal};
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.primary}40;
  }
  
  &::placeholder {
    color: ${props => props.theme.textSecondary};
  }
`;

const RatingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RatingLabel = styled.label`
  font-size: ${props => props.theme.fontSizeNormal};
  color: ${props => props.theme.text};
  margin-right: 0.5rem;
`;

const StarContainer = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const Star = styled.button`
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-size: 1.5rem;
  color: ${props => props.filled ? props.theme.warning : props.theme.textSecondary};
  transition: color ${props => props.theme.transitionFast} ease;
  
  &:hover {
    color: ${props => props.theme.warning};
  }
  
  &:focus {
    outline: none;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const SubmitButton = styled.button`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadiusMedium};
  padding: 0.75rem 1.5rem;
  font-size: ${props => props.theme.fontSizeNormal};
  cursor: pointer;
  transition: background-color ${props => props.theme.transitionFast} ease;
  
  &:hover {
    background-color: ${props => props.theme.primary};
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  background-color: transparent;
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  border-radius: ${props => props.theme.borderRadiusMedium};
  padding: 0.75rem 1.5rem;
  font-size: ${props => props.theme.fontSizeNormal};
  cursor: pointer;
  transition: all ${props => props.theme.transitionFast} ease;
  
  &:hover {
    background-color: ${props => props.theme.background};
  }
`;

const CharacterCount = styled.div`
  text-align: right;
  font-size: ${props => props.theme.fontSizeSmall};
  color: ${props => props.theme.textSecondary};
  margin-top: 0.25rem;
`;

/**
 * Review form component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Review form component
 */
const ReviewForm = ({ onSubmit, isLoading }) => {
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const user = useUser();
  
  // Maximum character count
  const MAX_CHARS = 500;
  
  // Handle content change
  const handleContentChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setContent(value);
    }
  };
  
  // Handle rating click
  const handleRatingClick = (value) => {
    setRating(value);
  };
  
  // Handle rating hover
  const handleRatingHover = (value) => {
    setHoverRating(value);
  };
  
  // Handle rating leave
  const handleRatingLeave = () => {
    setHoverRating(0);
  };
  
  // Handle form reset
  const handleReset = () => {
    setContent('');
    setRating(0);
  };
  
  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!content.trim() || rating === 0) {
      return;
    }
    
    onSubmit({
      content,
      rating,
      userId: user.id,
      username: user.username
    });
    
    // Reset form
    handleReset();
  };
  
  // Check if form is valid
  const isFormValid = content.trim().length > 0 && rating > 0;
  
  return (
    <FormContainer>
      <FormTitle>Write a Review</FormTitle>
      <Form onSubmit={handleSubmit}>
        <RatingContainer>
          <RatingLabel>Your Rating:</RatingLabel>
          <StarContainer 
            onMouseLeave={handleRatingLeave}
          >
            {[1, 2, 3, 4, 5].map(value => (
              <Star
                key={value}
                type="button"
                filled={value <= (hoverRating || rating)}
                onClick={() => handleRatingClick(value)}
                onMouseEnter={() => handleRatingHover(value)}
                aria-label={`Rate ${value} stars`}
              >
                ★
              </Star>
            ))}
          </StarContainer>
        </RatingContainer>
        
        <div>
          <TextArea
            placeholder="Share your thoughts about this title..."
            value={content}
            onChange={handleContentChange}
            disabled={isLoading}
            required
          />
          <CharacterCount>
            {content.length}/{MAX_CHARS}
          </CharacterCount>
        </div>
        
        <ButtonContainer>
          <CancelButton 
            type="button" 
            onClick={handleReset}
            disabled={isLoading}
          >
            Cancel
          </CancelButton>
          <SubmitButton 
            type="submit" 
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Review'}
          </SubmitButton>
        </ButtonContainer>
      </Form>
    </FormContainer>
  );
};

ReviewForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

ReviewForm.defaultProps = {
  isLoading: false
};

export default ReviewForm;
