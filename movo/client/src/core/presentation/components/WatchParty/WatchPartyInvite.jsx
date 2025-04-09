/**
 * Watch Party Invite Component for Movo
 * Handles inviting friends to watch parties
 * 
 * @author zophlic
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useToast } from '../Toast';

// Styled components
const Container = styled.div`
  margin-bottom: 1.5rem;
`;

const Title = styled.h4`
  font-size: ${props => props.theme.fontSizeMedium};
  font-weight: ${props => props.theme.fontWeightMedium};
  color: ${props => props.theme.text};
  margin: 0 0 1rem 0;
`;

const InviteOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InviteOption = styled.button`
  display: flex;
  align-items: center;
  background-color: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: ${props => props.theme.borderRadiusMedium};
  padding: 1rem;
  cursor: pointer;
  transition: all ${props => props.theme.transitionFast} ease;
  
  &:hover {
    background-color: ${props => props.theme.surface};
    border-color: ${props => props.theme.primary};
  }
  
  svg {
    margin-right: 1rem;
    color: ${props => props.color || props.theme.primary};
  }
`;

const OptionText = styled.div`
  text-align: left;
`;

const OptionTitle = styled.div`
  font-weight: ${props => props.theme.fontWeightMedium};
  color: ${props => props.theme.text};
  margin-bottom: 0.25rem;
`;

const OptionDescription = styled.div`
  font-size: ${props => props.theme.fontSizeSmall};
  color: ${props => props.theme.textSecondary};
`;

const InputContainer = styled.div`
  margin-top: 1.5rem;
`;

const InputLabel = styled.label`
  display: block;
  font-size: ${props => props.theme.fontSizeNormal};
  color: ${props => props.theme.text};
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
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
  
  &::placeholder {
    color: ${props => props.theme.textSecondary};
  }
`;

const EmailForm = styled.div`
  margin-top: 1.5rem;
`;

const EmailInput = styled(Input)`
  margin-bottom: 1rem;
`;

const SendButton = styled.button`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadiusMedium};
  padding: 0.75rem 1.5rem;
  font-size: ${props => props.theme.fontSizeNormal};
  cursor: pointer;
  transition: background-color ${props => props.theme.transitionFast} ease;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * Watch party invite component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Watch party invite component
 */
const WatchPartyInvite = ({ 
  partyCode, 
  mediaTitle, 
  isJoining = false,
  inviteCode = '',
  onInviteCodeChange
}) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const toast = useToast();
  
  // Handle share via social media
  const handleShareSocial = (platform) => {
    const shareUrl = `${window.location.origin}/join-party/${partyCode}`;
    const shareText = `Join me for a watch party of "${mediaTitle}" on Movo! Use code: ${partyCode}`;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      default:
        // Use Web Share API if available
        if (navigator.share) {
          navigator.share({
            title: 'Movo Watch Party',
            text: shareText,
            url: shareUrl
          }).catch(error => {
            console.error('Error sharing:', error);
          });
        } else {
          navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
          toast.success('Copied', 'Invite details copied to clipboard');
        }
    }
  };
  
  // Handle send email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Invalid Email', 'Please enter a valid email address');
      return;
    }
    
    setIsSending(true);
    
    try {
      // In a real implementation, this would send an email through a backend service
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Invitation Sent', `Invitation sent to ${email}`);
      setEmail('');
      setShowEmailForm(false);
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast.error('Error', 'Failed to send invitation');
    } finally {
      setIsSending(false);
    }
  };
  
  // If joining, show the join form
  if (isJoining) {
    return (
      <Container>
        <Title>Join a Watch Party</Title>
        <p>Enter the party code you received from your friend.</p>
        
        <InputContainer>
          <InputLabel htmlFor="invite-code">Party Code</InputLabel>
          <Input
            id="invite-code"
            type="text"
            value={inviteCode}
            onChange={onInviteCodeChange}
            placeholder="Enter party code (e.g. ABC12345)"
            maxLength={8}
          />
        </InputContainer>
      </Container>
    );
  }
  
  return (
    <Container>
      <Title>Invite Friends</Title>
      
      {showEmailForm ? (
        <EmailForm>
          <form onSubmit={handleSendEmail}>
            <InputLabel htmlFor="friend-email">Friend's Email</InputLabel>
            <EmailInput
              id="friend-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your friend's email"
              required
            />
            
            <div>
              <SendButton type="submit" disabled={isSending}>
                {isSending ? 'Sending...' : 'Send Invitation'}
              </SendButton>
              <button 
                type="button" 
                onClick={() => setShowEmailForm(false)}
                style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#adb5bd', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </EmailForm>
      ) : (
        <InviteOptions>
          <InviteOption onClick={() => handleShareSocial('whatsapp')} color="#25D366">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
            </svg>
            <OptionText>
              <OptionTitle>Share via WhatsApp</OptionTitle>
              <OptionDescription>Send a message with the party code</OptionDescription>
            </OptionText>
          </InviteOption>
          
          <InviteOption onClick={() => handleShareSocial('telegram')} color="#0088CC">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.269c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.538-.196 1.006.128.832.953z"></path>
            </svg>
            <OptionText>
              <OptionTitle>Share via Telegram</OptionTitle>
              <OptionDescription>Send a message with the party code</OptionDescription>
            </OptionText>
          </InviteOption>
          
          <InviteOption onClick={() => handleShareSocial('twitter')} color="#1DA1F2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
            </svg>
            <OptionText>
              <OptionTitle>Share via Twitter</OptionTitle>
              <OptionDescription>Tweet the party code to your followers</OptionDescription>
            </OptionText>
          </InviteOption>
          
          <InviteOption onClick={() => setShowEmailForm(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <OptionText>
              <OptionTitle>Invite via Email</OptionTitle>
              <OptionDescription>Send an email invitation with the party code</OptionDescription>
            </OptionText>
          </InviteOption>
          
          <InviteOption onClick={() => handleShareSocial()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <OptionText>
              <OptionTitle>Share Link</OptionTitle>
              <OptionDescription>Share a direct link to join the party</OptionDescription>
            </OptionText>
          </InviteOption>
        </InviteOptions>
      )}
    </Container>
  );
};

WatchPartyInvite.propTypes = {
  partyCode: PropTypes.string,
  mediaTitle: PropTypes.string,
  isJoining: PropTypes.bool,
  inviteCode: PropTypes.string,
  onInviteCodeChange: PropTypes.func
};

export default WatchPartyInvite;
