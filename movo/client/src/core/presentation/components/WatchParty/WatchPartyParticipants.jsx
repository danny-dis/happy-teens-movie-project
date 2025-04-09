/**
 * Watch Party Participants Component for Movo
 * Displays and manages participants in a watch party
 * 
 * @author zophlic
 */

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '../../stores/userStore';

// Styled components
const Container = styled.div`
  background-color: ${props => props.theme.surface};
  border-radius: ${props => props.theme.borderRadiusMedium};
  overflow: hidden;
`;

const Header = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const Title = styled.h3`
  font-size: ${props => props.theme.fontSizeMedium};
  font-weight: ${props => props.theme.fontWeightMedium};
  color: ${props => props.theme.text};
  margin: 0;
  display: flex;
  align-items: center;
  
  span {
    margin-left: 0.5rem;
    font-size: ${props => props.theme.fontSizeSmall};
    color: ${props => props.theme.textSecondary};
  }
`;

const ParticipantList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const ParticipantItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid ${props => props.theme.border};
  
  &:last-child {
    border-bottom: none;
  }
  
  ${props => props.isCurrentUser && `
    background-color: ${props.theme.background};
  `}
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${props => props.isHost ? props.theme.warning : props.theme.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${props => props.theme.fontWeightBold};
  font-size: ${props => props.theme.fontSizeNormal};
  margin-right: 0.75rem;
  position: relative;
  
  ${props => props.isActive && `
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      right: 0;
      width: 10px;
      height: 10px;
      background-color: ${props.theme.success};
      border-radius: 50%;
      border: 2px solid ${props.theme.surface};
    }
  `}
`;

const ParticipantInfo = styled.div`
  flex: 1;
`;

const ParticipantName = styled.div`
  font-weight: ${props => props.theme.fontWeightMedium};
  color: ${props => props.theme.text};
  display: flex;
  align-items: center;
  
  ${props => props.isCurrentUser && `
    &::after {
      content: '(You)';
      margin-left: 0.5rem;
      font-size: ${props.theme.fontSizeSmall};
      color: ${props.theme.textSecondary};
    }
  `}
`;

const ParticipantStatus = styled.div`
  font-size: ${props => props.theme.fontSizeSmall};
  color: ${props => props.theme.textSecondary};
  margin-top: 0.25rem;
`;

const Badge = styled.span`
  background-color: ${props => props.theme.warning};
  color: white;
  font-size: 0.7rem;
  padding: 0.2rem 0.4rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  margin-left: 0.5rem;
  text-transform: uppercase;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  
  &:hover {
    color: ${props => props.theme.text};
    background-color: ${props => props.theme.background};
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${props => props.theme.textSecondary};
`;

/**
 * Watch party participants component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Watch party participants component
 */
const WatchPartyParticipants = ({ 
  participants = [], 
  hostId,
  onKickParticipant
}) => {
  const currentUser = useUser();
  
  // Check if current user is host
  const isHost = currentUser && currentUser.id === hostId;
  
  // Get user initials
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format joined time
  const formatJoinedTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  // Handle kick participant
  const handleKickParticipant = (participantId) => {
    if (isHost && onKickParticipant) {
      onKickParticipant(participantId);
    }
  };
  
  return (
    <Container>
      <Header>
        <Title>
          Participants
          <span>({participants.length})</span>
        </Title>
      </Header>
      
      <ParticipantList>
        {participants.length === 0 ? (
          <EmptyState>No participants yet</EmptyState>
        ) : (
          participants.map(participant => {
            const isCurrentUser = participant.id === currentUser?.id;
            const isParticipantHost = participant.id === hostId;
            
            return (
              <ParticipantItem 
                key={participant.id}
                isCurrentUser={isCurrentUser}
              >
                <Avatar 
                  isHost={isParticipantHost}
                  isActive={participant.isActive}
                >
                  {getInitials(participant.name)}
                </Avatar>
                
                <ParticipantInfo>
                  <ParticipantName isCurrentUser={isCurrentUser}>
                    {participant.name}
                    {isParticipantHost && <Badge>Host</Badge>}
                  </ParticipantName>
                  
                  <ParticipantStatus>
                    {participant.isActive 
                      ? 'Watching now' 
                      : `Joined ${formatJoinedTime(participant.joinedAt)}`
                    }
                  </ParticipantStatus>
                </ParticipantInfo>
                
                {isHost && !isCurrentUser && !isParticipantHost && (
                  <ActionButton 
                    onClick={() => handleKickParticipant(participant.id)}
                    title="Remove from party"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="15" y1="9" x2="9" y2="15"></line>
                      <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                  </ActionButton>
                )}
              </ParticipantItem>
            );
          })
        )}
      </ParticipantList>
    </Container>
  );
};

WatchPartyParticipants.propTypes = {
  participants: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      isActive: PropTypes.bool,
      joinedAt: PropTypes.string.isRequired
    })
  ),
  hostId: PropTypes.string.isRequired,
  onKickParticipant: PropTypes.func
};

export default WatchPartyParticipants;
