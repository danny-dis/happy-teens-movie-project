/**
 * Watch Party Manager Component for Movo
 * Manages watch party sessions for collaborative viewing
 * 
 * @author zophlic
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../Toast';
import { useUser } from '../../stores/userStore';
import WatchPartyInvite from './WatchPartyInvite';
import WatchPartyChat from './WatchPartyChat';
import WatchPartyParticipants from './WatchPartyParticipants';
import telemetryService from '../../../infrastructure/telemetry/TelemetryService';
import { v4 as uuidv4 } from 'uuid';

// Styled components
const Container = styled.div`
  position: relative;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadiusMedium};
  padding: 0.75rem 1.25rem;
  font-size: ${props => props.theme.fontSizeNormal};
  cursor: pointer;
  transition: background-color ${props => props.theme.transitionFast} ease;
  
  &:hover {
    background-color: ${props => props.theme.primary};
    opacity: 0.9;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${props => props.theme.zIndexModal};
  padding: 1rem;
`;

const ModalContent = styled.div`
  background-color: ${props => props.theme.surface};
  border-radius: ${props => props.theme.borderRadiusMedium};
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${props => props.theme.elevation4};
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const ModalTitle = styled.h3`
  font-size: ${props => props.theme.fontSizeLarge};
  font-weight: ${props => props.theme.fontWeightBold};
  color: ${props => props.theme.text};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: ${props => props.theme.text};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid ${props => props.theme.border};
`;

const ActionButton = styled.button`
  background-color: ${props => props.primary ? props.theme.primary : 'transparent'};
  color: ${props => props.primary ? 'white' : props.theme.text};
  border: ${props => props.primary ? 'none' : `1px solid ${props.theme.border}`};
  border-radius: ${props => props.theme.borderRadiusMedium};
  padding: 0.75rem 1.5rem;
  font-size: ${props => props.theme.fontSizeNormal};
  cursor: pointer;
  transition: all ${props => props.theme.transitionFast} ease;
  
  &:hover {
    background-color: ${props => props.primary ? props.theme.primary : props.theme.background};
    opacity: ${props => props.primary ? 0.9 : 1};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const Tab = styled.button`
  background: none;
  border: none;
  padding: 1rem 1.5rem;
  font-size: ${props => props.theme.fontSizeNormal};
  color: ${props => props.active ? props.theme.primary : props.theme.text};
  cursor: pointer;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: ${props => props.active ? props.theme.primary : 'transparent'};
  }
  
  &:hover {
    color: ${props => props.theme.primary};
  }
`;

const TabContent = styled.div`
  padding: 1.5rem;
`;

const PartyCode = styled.div`
  background-color: ${props => props.theme.background};
  border-radius: ${props => props.theme.borderRadiusSmall};
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const PartyCodeText = styled.div`
  font-family: monospace;
  font-size: ${props => props.theme.fontSizeMedium};
  color: ${props => props.theme.text};
  letter-spacing: 2px;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

/**
 * Watch party manager component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Watch party manager component
 */
const WatchPartyManager = ({ mediaId, mediaTitle, onJoinParty }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [partyCode, setPartyCode] = useState('');
  const [isCreatingParty, setIsCreatingParty] = useState(false);
  const [isJoiningParty, setIsJoiningParty] = useState(false);
  const [partyData, setPartyData] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  
  const user = useUser();
  const toast = useToast();
  const navigate = useNavigate();
  
  // Generate party code
  const generatePartyCode = useCallback(() => {
    return uuidv4().substring(0, 8).toUpperCase();
  }, []);
  
  // Open modal
  const openModal = () => {
    setIsModalOpen(true);
    setActiveTab('create');
    setPartyCode(generatePartyCode());
  };
  
  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setPartyData(null);
  };
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Handle create party
  const handleCreateParty = async () => {
    if (!user) {
      toast.error('Sign In Required', 'Please sign in to create a watch party');
      return;
    }
    
    setIsCreatingParty(true);
    
    try {
      // Create party data
      const newPartyData = {
        id: partyCode,
        hostId: user.id,
        hostName: user.username,
        mediaId,
        mediaTitle,
        participants: [
          {
            id: user.id,
            name: user.username,
            isHost: true,
            joinedAt: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        status: 'waiting'
      };
      
      // In a real implementation, this would be saved to a database
      // and managed through a real-time service like WebSockets
      
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPartyData(newPartyData);
      
      // Track event
      telemetryService.trackEvent('social', 'create_watch_party', {
        mediaId,
        mediaTitle,
        partyCode
      });
      
      toast.success('Watch Party Created', 'Your watch party has been created');
      
      // Navigate to watch page with party code
      onJoinParty(partyCode);
      closeModal();
    } catch (error) {
      console.error('Failed to create watch party:', error);
      toast.error('Error', 'Failed to create watch party');
    } finally {
      setIsCreatingParty(false);
    }
  };
  
  // Handle join party
  const handleJoinParty = async () => {
    if (!inviteCode) {
      toast.error('Invalid Code', 'Please enter a valid party code');
      return;
    }
    
    if (!user) {
      toast.error('Sign In Required', 'Please sign in to join a watch party');
      return;
    }
    
    setIsJoiningParty(true);
    
    try {
      // In a real implementation, this would validate the code against a database
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Track event
      telemetryService.trackEvent('social', 'join_watch_party', {
        partyCode: inviteCode
      });
      
      toast.success('Joined Watch Party', 'You have joined the watch party');
      
      // Navigate to watch page with party code
      onJoinParty(inviteCode);
      closeModal();
    } catch (error) {
      console.error('Failed to join watch party:', error);
      toast.error('Error', 'Failed to join watch party. The code may be invalid or expired.');
    } finally {
      setIsJoiningParty(false);
    }
  };
  
  // Handle copy code
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(partyCode);
      toast.success('Copied', 'Party code copied to clipboard');
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast.error('Error', 'Failed to copy code');
    }
  };
  
  // Handle invite code change
  const handleInviteCodeChange = (e) => {
    setInviteCode(e.target.value.toUpperCase());
  };
  
  return (
    <Container>
      <Button onClick={openModal}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        Watch Party
      </Button>
      
      {isModalOpen && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Watch Party</ModalTitle>
              <CloseButton onClick={closeModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </CloseButton>
            </ModalHeader>
            
            <Tabs>
              <Tab 
                active={activeTab === 'create'} 
                onClick={() => handleTabChange('create')}
              >
                Create Party
              </Tab>
              <Tab 
                active={activeTab === 'join'} 
                onClick={() => handleTabChange('join')}
              >
                Join Party
              </Tab>
            </Tabs>
            
            <TabContent>
              {activeTab === 'create' ? (
                <>
                  <h4>Create a Watch Party for "{mediaTitle}"</h4>
                  <p>Invite friends to watch together with synchronized playback and chat.</p>
                  
                  <PartyCode>
                    <PartyCodeText>{partyCode}</PartyCodeText>
                    <CopyButton onClick={handleCopyCode}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy
                    </CopyButton>
                  </PartyCode>
                  
                  <WatchPartyInvite 
                    partyCode={partyCode} 
                    mediaTitle={mediaTitle} 
                  />
                </>
              ) : (
                <WatchPartyInvite 
                  isJoining={true}
                  inviteCode={inviteCode}
                  onInviteCodeChange={handleInviteCodeChange}
                />
              )}
            </TabContent>
            
            <ModalFooter>
              <ActionButton onClick={closeModal}>
                Cancel
              </ActionButton>
              {activeTab === 'create' ? (
                <ActionButton 
                  primary 
                  onClick={handleCreateParty}
                  disabled={isCreatingParty}
                >
                  {isCreatingParty ? 'Creating...' : 'Create & Start Watching'}
                </ActionButton>
              ) : (
                <ActionButton 
                  primary 
                  onClick={handleJoinParty}
                  disabled={isJoiningParty || !inviteCode}
                >
                  {isJoiningParty ? 'Joining...' : 'Join Party'}
                </ActionButton>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

WatchPartyManager.propTypes = {
  mediaId: PropTypes.string.isRequired,
  mediaTitle: PropTypes.string.isRequired,
  onJoinParty: PropTypes.func.isRequired
};

export default WatchPartyManager;
