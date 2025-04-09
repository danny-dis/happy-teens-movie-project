/**
 * Notification Preferences Component for Movo
 * Allows users to manage notification settings
 * 
 * @author zophlic
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import notificationService, { NOTIFICATION_TYPE } from '../../../infrastructure/notifications/NotificationService';
import { useToast } from '../Toast';

// Styled components
const Container = styled.div`
  padding: 1.5rem;
  background-color: ${props => props.theme.surface};
  border-radius: ${props => props.theme.borderRadiusMedium};
  box-shadow: ${props => props.theme.elevation1};
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

const MasterToggle = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-size: ${props => props.theme.fontSizeMedium};
  color: ${props => props.theme.textPrimary};
  font-weight: 500;
`;

const ToggleSwitch = styled.div`
  position: relative;
  width: 48px;
  height: 24px;
  background-color: ${props => props.checked ? props.theme.primary : props.theme.border};
  border-radius: 24px;
  margin-right: 0.75rem;
  transition: background-color 0.2s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.checked ? '26px' : '2px'};
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    transition: left 0.2s ease;
  }
`;

const PreferencesList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const PreferenceItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  background-color: ${props => props.theme.background};
  
  &:hover {
    background-color: ${props => props.theme.backgroundHover};
  }
`;

const PreferenceInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const PreferenceName = styled.span`
  font-size: ${props => props.theme.fontSizeMedium};
  font-weight: 500;
  color: ${props => props.theme.textPrimary};
  margin-bottom: 0.25rem;
`;

const PreferenceDescription = styled.span`
  font-size: ${props => props.theme.fontSizeSmall};
  color: ${props => props.theme.textSecondary};
`;

const PermissionWarning = styled.div`
  padding: 1rem;
  margin-bottom: 1.5rem;
  background-color: ${props => props.theme.warningBackground};
  color: ${props => props.theme.warningText};
  border-radius: ${props => props.theme.borderRadiusSmall};
  font-size: ${props => props.theme.fontSizeSmall};
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.75rem;
    flex-shrink: 0;
  }
`;

const PermissionButton = styled.button`
  background-color: ${props => props.theme.warning};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadiusSmall};
  padding: 0.5rem 1rem;
  font-size: ${props => props.theme.fontSizeSmall};
  font-weight: 500;
  cursor: pointer;
  margin-left: auto;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.warningHover};
  }
`;

// Notification type info
const notificationTypes = [
  {
    type: NOTIFICATION_TYPE.CONTENT_UPDATE,
    name: 'Content Updates',
    description: 'Get notified when new content is added or updated'
  },
  {
    type: NOTIFICATION_TYPE.RECOMMENDATION,
    name: 'Recommendations',
    description: 'Receive personalized content recommendations'
  },
  {
    type: NOTIFICATION_TYPE.WATCHLIST,
    name: 'Watchlist Updates',
    description: 'Get notified about changes to your watchlist items'
  },
  {
    type: NOTIFICATION_TYPE.WATCH_LATER_REMINDER,
    name: 'Watch Later Reminders',
    description: 'Receive reminders about content in your watch later list'
  },
  {
    type: NOTIFICATION_TYPE.SYSTEM,
    name: 'System Notifications',
    description: 'Important system updates and announcements'
  },
  {
    type: NOTIFICATION_TYPE.SOCIAL,
    name: 'Social Notifications',
    description: 'Friend activity and social interactions'
  },
  {
    type: NOTIFICATION_TYPE.DOWNLOAD_COMPLETE,
    name: 'Download Notifications',
    description: 'Get notified when downloads complete'
  },
  {
    type: NOTIFICATION_TYPE.WATCH_PARTY,
    name: 'Watch Party Notifications',
    description: 'Invitations and updates for watch parties'
  }
];

/**
 * Notification preferences component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Notification preferences component
 */
const NotificationPreferences = ({ className }) => {
  const [status, setStatus] = useState(null);
  const [preferences, setPreferences] = useState({});
  const toast = useToast();
  
  // Load notification status
  useEffect(() => {
    const notificationStatus = notificationService.getStatus();
    setStatus(notificationStatus);
    setPreferences(notificationStatus.preferences || {});
  }, []);
  
  // Handle master toggle
  const handleMasterToggle = () => {
    if (status.enabled) {
      notificationService.disable();
      setStatus({ ...status, enabled: false });
      toast.info('Notifications Disabled', 'You will no longer receive notifications');
    } else {
      notificationService.enable();
      setStatus({ ...status, enabled: true });
      toast.success('Notifications Enabled', 'You will now receive notifications');
    }
  };
  
  // Handle permission request
  const handleRequestPermission = async () => {
    const permission = await notificationService.requestPermission();
    setStatus({ ...status, permission });
    
    if (permission === 'granted') {
      toast.success('Permission Granted', 'You will now receive notifications');
    } else {
      toast.error('Permission Denied', 'You will not receive notifications');
    }
  };
  
  // Handle preference toggle
  const handlePreferenceToggle = (type) => {
    const newValue = !preferences[type];
    notificationService.setTypePreference(type, newValue);
    
    setPreferences({
      ...preferences,
      [type]: newValue
    });
    
    toast.info(
      `${newValue ? 'Enabled' : 'Disabled'} ${notificationTypes.find(t => t.type === type).name}`,
      `You will ${newValue ? 'now' : 'no longer'} receive these notifications`
    );
  };
  
  // If status is not loaded yet
  if (!status) {
    return <Container className={className}>Loading notification preferences...</Container>;
  }
  
  // If notifications are not supported
  if (!status.supported) {
    return (
      <Container className={className}>
        <Title>Notifications Not Supported</Title>
        <p>Your browser does not support notifications. Please try a different browser.</p>
      </Container>
    );
  }
  
  return (
    <Container className={className}>
      <Header>
        <Title>Notification Preferences</Title>
      </Header>
      
      {status.permission !== 'granted' && (
        <PermissionWarning>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>
            Notification permission is required to receive notifications.
          </span>
          <PermissionButton onClick={handleRequestPermission}>
            Allow Notifications
          </PermissionButton>
        </PermissionWarning>
      )}
      
      <MasterToggle>
        <ToggleLabel>
          <ToggleSwitch checked={status.enabled} onClick={handleMasterToggle} />
          Enable All Notifications
        </ToggleLabel>
      </MasterToggle>
      
      <PreferencesList>
        {notificationTypes.map((notificationType) => (
          <PreferenceItem key={notificationType.type}>
            <PreferenceInfo>
              <PreferenceName>{notificationType.name}</PreferenceName>
              <PreferenceDescription>{notificationType.description}</PreferenceDescription>
            </PreferenceInfo>
            <ToggleSwitch 
              checked={status.enabled && preferences[notificationType.type]} 
              onClick={() => handlePreferenceToggle(notificationType.type)}
            />
          </PreferenceItem>
        ))}
      </PreferencesList>
    </Container>
  );
};

NotificationPreferences.propTypes = {
  className: PropTypes.string
};

export default NotificationPreferences;
