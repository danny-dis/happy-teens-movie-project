/**
 * Watch Party Chat Component for Movo
 * Provides real-time chat functionality for watch parties
 * 
 * @author zophlic
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '../../stores/userStore';
import telemetryService from '../../../infrastructure/telemetry/TelemetryService';

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${props => props.theme.surface};
  border-radius: ${props => props.theme.borderRadiusMedium};
  overflow: hidden;
`;

const ChatHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ChatTitle = styled.h3`
  font-size: ${props => props.theme.fontSizeMedium};
  font-weight: ${props => props.theme.fontWeightMedium};
  color: ${props => props.theme.text};
  margin: 0;
`;

const ChatBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ChatFooter = styled.div`
  padding: 1rem;
  border-top: 1px solid ${props => props.theme.border};
`;

const ChatForm = styled.form`
  display: flex;
  gap: 0.5rem;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  background-color: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.inputBorder};
  border-radius: ${props => props.theme.borderRadiusSmall};
  font-family: ${props => props.theme.fontFamily};
  font-size: ${props => props.theme.fontSizeNormal};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.primary}40;
  }
`;

const SendButton = styled.button`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadiusSmall};
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const Message = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 80%;
  ${props => props.isCurrentUser ? 'align-self: flex-end;' : 'align-self: flex-start;'}
  background-color: ${props => props.isCurrentUser ? props.theme.primary : props.theme.background};
  color: ${props => props.isCurrentUser ? 'white' : props.theme.text};
  border-radius: ${props => props.theme.borderRadiusMedium};
  padding: 0.75rem 1rem;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    border: 8px solid transparent;
    ${props => props.isCurrentUser
      ? `border-left-color: ${props.theme.primary}; right: -16px; top: 10px;`
      : `border-right-color: ${props.theme.background}; left: -16px; top: 10px;`
    }
  }
`;

const MessageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
`;

const MessageSender = styled.span`
  font-weight: ${props => props.theme.fontWeightMedium};
  font-size: ${props => props.theme.fontSizeSmall};
`;

const MessageTime = styled.span`
  font-size: ${props => props.theme.fontSizeSmall};
  opacity: 0.7;
  margin-left: 0.5rem;
`;

const MessageContent = styled.div`
  word-break: break-word;
`;

const SystemMessage = styled.div`
  text-align: center;
  padding: 0.5rem;
  margin: 0.5rem 0;
  background-color: ${props => props.theme.background};
  border-radius: ${props => props.theme.borderRadiusSmall};
  color: ${props => props.theme.textSecondary};
  font-size: ${props => props.theme.fontSizeSmall};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
  color: ${props => props.theme.textSecondary};
`;

const EmojiButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary};
  cursor: pointer;
  padding: 0.75rem 0.5rem;
  
  &:hover {
    color: ${props => props.theme.text};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const EmojiPicker = styled.div`
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 0.5rem;
  background-color: ${props => props.theme.surface};
  border-radius: ${props => props.theme.borderRadiusMedium};
  box-shadow: ${props => props.theme.elevation3};
  padding: 0.5rem;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
  z-index: 10;
`;

const EmojiOption = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: ${props => props.theme.borderRadiusSmall};
  
  &:hover {
    background-color: ${props => props.theme.background};
  }
`;

/**
 * Watch party chat component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Watch party chat component
 */
const WatchPartyChat = ({ partyId, onSendMessage, messages = [] }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatBodyRef = useRef(null);
  const user = useUser();
  
  // Emojis
  const emojis = ['😀', '😂', '😍', '🤔', '😮', '😭', '👍', '👎', '🔥', '❤️', '🎉', '🍿', '🎬', '🎵', '👀', '💯', '🙌', '🤣', '😱', '🤩', '🥳'];
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Handle message submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      return;
    }
    
    // Send message
    onSendMessage({
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.username,
      content: message.trim(),
      timestamp: new Date().toISOString(),
      partyId
    });
    
    // Track event
    telemetryService.trackEvent('social', 'send_chat_message', {
      partyId
    });
    
    // Clear input
    setMessage('');
  };
  
  // Handle emoji select
  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  return (
    <Container>
      <ChatHeader>
        <ChatTitle>Party Chat</ChatTitle>
      </ChatHeader>
      
      <ChatBody ref={chatBodyRef}>
        {messages.length === 0 ? (
          <EmptyState>
            <p>No messages yet. Start the conversation!</p>
          </EmptyState>
        ) : (
          messages.map(msg => {
            // System message
            if (msg.type === 'system') {
              return (
                <SystemMessage key={msg.id}>
                  {msg.content}
                </SystemMessage>
              );
            }
            
            // User message
            const isCurrentUser = msg.senderId === user?.id;
            
            return (
              <Message 
                key={msg.id} 
                isCurrentUser={isCurrentUser}
              >
                <MessageHeader>
                  <MessageSender>
                    {isCurrentUser ? 'You' : msg.senderName}
                  </MessageSender>
                  <MessageTime>
                    {formatTimestamp(msg.timestamp)}
                  </MessageTime>
                </MessageHeader>
                <MessageContent>{msg.content}</MessageContent>
              </Message>
            );
          })
        )}
      </ChatBody>
      
      <ChatFooter>
        <ChatForm onSubmit={handleSubmit}>
          <ChatInput
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
          />
          
          <div style={{ position: 'relative' }}>
            <EmojiButton 
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            </EmojiButton>
            
            {showEmojiPicker && (
              <EmojiPicker>
                {emojis.map(emoji => (
                  <EmojiOption 
                    key={emoji} 
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </EmojiOption>
                ))}
              </EmojiPicker>
            )}
          </div>
          
          <SendButton type="submit" disabled={!message.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </SendButton>
        </ChatForm>
      </ChatFooter>
    </Container>
  );
};

WatchPartyChat.propTypes = {
  partyId: PropTypes.string.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      senderId: PropTypes.string,
      senderName: PropTypes.string,
      content: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired,
      type: PropTypes.string
    })
  )
};

export default WatchPartyChat;
