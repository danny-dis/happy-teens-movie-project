/**
 * Watch Party Component for Movo
 * Allows users to watch content together in real-time
 * 
 * @author zophlic
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { useToast } from '../Toast';

// Styled components
const Container = styled.div`
  position: relative;
  background-color: ${props => props.theme.surface};
  border-radius: ${props => props.theme.borderRadiusMedium};
  box-shadow: ${props => props.theme.elevation2};
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: ${props => props.theme.surfaceAlt};
  border-bottom: 1px solid ${props => props.theme.border};
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSizeMedium};
  font-weight: 600;
  color: ${props => props.theme.textPrimary};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  
  &:hover {
    color: ${props => props.theme.textPrimary};
  }
`;

const Content = styled.div`
  padding: 1rem;
`;

const PartyInfo = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: ${props => props.theme.background};
  border-radius: ${props => props.theme.borderRadiusSmall};
`;

const PartyCode = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  background-color: ${props => props.theme.surfaceAlt};
  border-radius: ${props => props.theme.borderRadiusSmall};
  font-family: monospace;
  font-size: 1.2rem;
  letter-spacing: 0.1rem;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.primary};
  cursor: pointer;
  
  &:hover {
    color: ${props => props.theme.primaryHover};
  }
`;

const PartyStatus = styled.div`
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  font-size: ${props => props.theme.fontSizeSmall};
  color: ${props => props.active ? props.theme.success : props.theme.warning};
  
  svg {
    margin-right: 0.5rem;
  }
`;

const ParticipantList = styled.div`
  margin-bottom: 1.5rem;
`;

const ParticipantTitle = styled.h4`
  margin: 0 0 0.75rem 0;
  font-size: ${props => props.theme.fontSizeSmall};
  font-weight: 500;
  color: ${props => props.theme.textSecondary};
`;

const Participant = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  background-color: ${props => props.isHost ? props.theme.primaryLight : props.theme.background};
  border-radius: ${props => props.theme.borderRadiusSmall};
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${props => props.color || props.theme.primary};
  margin-right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: ${props => props.theme.fontSizeSmall};
`;

const ParticipantInfo = styled.div`
  flex: 1;
`;

const ParticipantName = styled.div`
  font-weight: 500;
  color: ${props => props.theme.textPrimary};
`;

const ParticipantStatus = styled.div`
  font-size: ${props => props.theme.fontSizeXSmall};
  color: ${props => props.theme.textSecondary};
`;

const HostBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: ${props => props.theme.primary};
  color: white;
  border-radius: ${props => props.theme.borderRadiusSmall};
  font-size: ${props => props.theme.fontSizeXSmall};
  margin-left: 0.5rem;
`;

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Button = styled.button`
  padding: 0.75rem 1rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  font-size: ${props => props.theme.fontSizeSmall};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    margin-right: 0.5rem;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme.primaryHover};
  }
`;

const SecondaryButton = styled(Button)`
  background-color: transparent;
  color: ${props => props.theme.textPrimary};
  border: 1px solid ${props => props.theme.border};
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme.backgroundHover};
    border-color: ${props => props.theme.borderHover};
  }
`;

const DangerButton = styled(Button)`
  background-color: ${props => props.theme.error};
  color: white;
  border: none;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme.errorHover};
  }
`;

const JoinForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.textPrimary};
  font-size: ${props => props.theme.fontSizeSmall};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.primary}40;
  }
`;

const ChatContainer = styled.div`
  margin-top: 1rem;
  border-top: 1px solid ${props => props.theme.border};
  padding-top: 1rem;
`;

const ChatTitle = styled.h4`
  margin: 0 0 0.75rem 0;
  font-size: ${props => props.theme.fontSizeSmall};
  font-weight: 500;
  color: ${props => props.theme.textSecondary};
`;

const ChatMessages = styled.div`
  height: 200px;
  overflow-y: auto;
  padding: 0.5rem;
  background-color: ${props => props.theme.background};
  border-radius: ${props => props.theme.borderRadiusSmall};
  margin-bottom: 0.75rem;
`;

const ChatMessage = styled.div`
  margin-bottom: 0.75rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const MessageSender = styled.span`
  font-weight: 500;
  color: ${props => props.isHost ? props.theme.primary : props.theme.textPrimary};
`;

const MessageTime = styled.span`
  font-size: ${props => props.theme.fontSizeXSmall};
  color: ${props => props.theme.textTertiary};
  margin-left: 0.5rem;
`;

const MessageContent = styled.div`
  margin-top: 0.25rem;
  color: ${props => props.theme.textPrimary};
  font-size: ${props => props.theme.fontSizeSmall};
`;

const ChatForm = styled.form`
  display: flex;
  gap: 0.5rem;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.textPrimary};
  font-size: ${props => props.theme.fontSizeSmall};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.primary}40;
  }
`;

const SendButton = styled.button`
  padding: 0.75rem 1rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  cursor: pointer;
  
  &:hover {
    background-color: ${props => props.theme.primaryHover};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

// Mock data for demo
const mockParticipants = [
  { id: 'user1', name: 'You', isHost: true, status: 'Playing' },
  { id: 'user2', name: 'Alex', isHost: false, status: 'Playing' },
  { id: 'user3', name: 'Jordan', isHost: false, status: 'Buffering...' }
];

const mockMessages = [
  { id: 1, sender: 'You', isHost: true, time: '10:32 PM', content: 'Welcome to the watch party!' },
  { id: 2, sender: 'Alex', isHost: false, time: '10:33 PM', content: 'Thanks for inviting me!' },
  { id: 3, sender: 'Jordan', isHost: false, time: '10:34 PM', content: 'This movie looks great!' }
];

/**
 * Watch Party component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Watch Party component
 */
const WatchParty = ({ className, contentId, contentTitle, onClose }) => {
  const [mode, setMode] = useState('join'); // 'join', 'create', 'active'
  const [partyCode, setPartyCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const toast = useToast();
  
  // Initialize with mock data for demo
  useEffect(() => {
    if (mode === 'active') {
      setParticipants(mockParticipants);
      setMessages(mockMessages);
    }
  }, [mode]);
  
  // Generate a random party code
  const generatePartyCode = () => {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };
  
  // Handle create party
  const handleCreateParty = () => {
    const newPartyCode = generatePartyCode();
    setPartyCode(newPartyCode);
    setIsHost(true);
    setMode('active');
    
    toast.success('Watch Party Created', `Party code: ${newPartyCode}`);
  };
  
  // Handle join party
  const handleJoinParty = () => {
    if (!joinCode) {
      toast.error('Error', 'Please enter a party code');
      return;
    }
    
    // In a real implementation, this would validate the code with a server
    setPartyCode(joinCode);
    setIsHost(false);
    setMode('active');
    
    toast.success('Joined Watch Party', `Joined party: ${joinCode}`);
  };
  
  // Handle leave party
  const handleLeaveParty = () => {
    setMode('join');
    setPartyCode('');
    setIsHost(false);
    setParticipants([]);
    setMessages([]);
    
    toast.info('Left Watch Party', 'You have left the watch party');
  };
  
  // Handle end party (host only)
  const handleEndParty = () => {
    setMode('join');
    setPartyCode('');
    setIsHost(false);
    setParticipants([]);
    setMessages([]);
    
    toast.info('Watch Party Ended', 'You have ended the watch party');
  };
  
  // Handle copy party code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(partyCode);
    toast.success('Copied', 'Party code copied to clipboard');
  };
  
  // Handle send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!messageInput.trim()) {
      return;
    }
    
    const newMessage = {
      id: Date.now(),
      sender: 'You',
      isHost,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: messageInput.trim()
    };
    
    setMessages([...messages, newMessage]);
    setMessageInput('');
  };
  
  // Render join/create form
  if (mode === 'join' || mode === 'create') {
    return (
      <Container className={className}>
        <Header>
          <Title>Watch Party</Title>
          {onClose && (
            <CloseButton onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </CloseButton>
          )}
        </Header>
        <Content>
          {contentTitle && (
            <PartyInfo>
              <strong>Content:</strong> {contentTitle}
            </PartyInfo>
          )}
          
          {mode === 'join' ? (
            <JoinForm>
              <Input
                type="text"
                placeholder="Enter party code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <PrimaryButton onClick={handleJoinParty}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Join Party
              </PrimaryButton>
              <SecondaryButton onClick={() => setMode('create')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                Create New Party
              </SecondaryButton>
            </JoinForm>
          ) : (
            <JoinForm>
              <PrimaryButton onClick={handleCreateParty}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                Create Watch Party
              </PrimaryButton>
              <SecondaryButton onClick={() => setMode('join')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Join Existing Party
              </SecondaryButton>
            </JoinForm>
          )}
        </Content>
      </Container>
    );
  }
  
  // Render active party
  return (
    <Container className={className}>
      <Header>
        <Title>Watch Party</Title>
        {onClose && (
          <CloseButton onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </CloseButton>
        )}
      </Header>
      <Content>
        <PartyInfo>
          <PartyCode>
            {partyCode}
            <CopyButton onClick={handleCopyCode}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </CopyButton>
          </PartyCode>
          {contentTitle && <div><strong>Content:</strong> {contentTitle}</div>}
          <PartyStatus active={true}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5l10 -10"></path>
            </svg>
            Party Active
          </PartyStatus>
        </PartyInfo>
        
        <ParticipantList>
          <ParticipantTitle>Participants ({participants.length})</ParticipantTitle>
          {participants.map((participant) => (
            <Participant key={participant.id} isHost={participant.isHost}>
              <Avatar color={participant.isHost ? undefined : `hsl(${participant.name.charCodeAt(0) * 10}, 70%, 50%)`}>
                {participant.name.charAt(0)}
              </Avatar>
              <ParticipantInfo>
                <ParticipantName>
                  {participant.name}
                  {participant.isHost && <HostBadge>Host</HostBadge>}
                </ParticipantName>
                <ParticipantStatus>{participant.status}</ParticipantStatus>
              </ParticipantInfo>
            </Participant>
          ))}
        </ParticipantList>
        
        <ChatContainer>
          <ChatTitle>Chat</ChatTitle>
          <ChatMessages>
            {messages.map((message) => (
              <ChatMessage key={message.id}>
                <MessageSender isHost={message.isHost}>{message.sender}</MessageSender>
                <MessageTime>{message.time}</MessageTime>
                <MessageContent>{message.content}</MessageContent>
              </ChatMessage>
            ))}
          </ChatMessages>
          <ChatForm onSubmit={handleSendMessage}>
            <ChatInput
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
            />
            <SendButton type="submit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </SendButton>
          </ChatForm>
        </ChatContainer>
        
        <Controls>
          {isHost ? (
            <DangerButton onClick={handleEndParty}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              End Watch Party
            </DangerButton>
          ) : (
            <SecondaryButton onClick={handleLeaveParty}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Leave Party
            </SecondaryButton>
          )}
        </Controls>
      </Content>
    </Container>
  );
};

WatchParty.propTypes = {
  className: PropTypes.string,
  contentId: PropTypes.string,
  contentTitle: PropTypes.string,
  onClose: PropTypes.func
};

export default WatchParty;
