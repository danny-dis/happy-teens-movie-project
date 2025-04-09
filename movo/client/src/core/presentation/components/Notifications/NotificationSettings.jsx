/**
 * Notification Settings Component for Movo
 * Allows users to configure notification preferences
 * 
 * @author zophlic
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useToast } from '../Toast';
import notificationService from '../../../infrastructure/notifications/NotificationService';
import telemetryService from '../../../infrastructure/telemetry/TelemetryService';

// Styled components
const Container = styled.div`
  background-color: ${props => props.theme.surface};
  border-radius: ${props => props.theme.borderRadiusMedium};
  padding: 1.5rem;
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
`;

const Title = styled.h3`
  font-size: ${props => props.theme.fontSizeLarge};
  font-weight: ${props => props.theme.fontWeightBold};
  color: ${props => props.theme.text};
  margin: 0 0 0.5rem 0;
`;

const Description = styled.p`
  color: ${props => props.theme.textSecondary};
  margin: 0;
`;

const SettingsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SettingItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: ${props => props.theme.background};
  border-radius: ${props => props.theme.borderRadiusSmall};
`;

const SettingInfo = styled.div`
  flex: 1;
`;

const SettingTitle = styled.div`
  font-weight: ${props => props.theme.fontWeightMedium};
  color: ${props => props.theme.text};
  margin-bottom: 0.25rem;
`;

const SettingDescription = styled.div`
  font-size: ${props => props.theme.fontSizeSmall};
  color: ${props => props.theme.textSecondary};
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  margin-left: 1rem;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: ${props => props.theme.primary};
  }
  
  &:checked + span:before {
    transform: translateX(24px);
  }
  
  &:disabled + span {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme.border};
  transition: ${props => props.theme.transitionFast} ease;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: ${props => props.theme.transitionFast} ease;
    border-radius: 50%;
  }
`;

const PermissionButton = styled.button`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadiusSmall};
  padding: 0.5rem 1rem;
  font-size: ${props => props.theme.fontSizeSmall};
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

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  font-size: 0.75rem;
  font-weight: ${props => props.theme.fontWeightMedium};
  margin-left: 0.5rem;
  background-color: ${props => {
    switch (props.status) {
      case 'granted':
        return props.theme.success;
      case 'denied':
        return props.theme.error;
      default:
        return props.theme.warning;
    }
  }};
  color: white;
`;

const TestButton = styled.button`
  background-color: transparent;
  border: 1px solid ${props => props.theme.primary};
  color: ${props => props.theme.primary};
  border-radius: ${props => props.theme.borderRadiusSmall};
  padding: 0.5rem 1rem;
  font-size: ${props => props.theme.fontSizeSmall};
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

/**
 * Notification settings component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Notification settings component
 */
const NotificationSettings = ({ className }) => {
  const [status, setStatus] = useState({
    supported: false,
    enabled: false,
    permission: 'default',
    subscribed: false
  });
  
  const [settings, setSettings] = useState({
    newContent: true,
    recommendations: true,
    watchlist: true,
    system: true
  });
  
  const toast = useToast();
  
  // Get notification status
  useEffect(() => {
    const notificationStatus = notificationService.getStatus();
    setStatus(notificationStatus);
  }, []);
  
  // Handle permission request
  const handleRequestPermission = async () => {
    const permission = await notificationService.requestPermission();
    
    if (permission === 'granted') {
      // Subscribe to push notifications
      await notificationService.subscribe();
      
      // Update status
      setStatus(notificationService.getStatus());
      
      toast.success('Notifications Enabled', 'You will now receive notifications');
    } else if (permission === 'denied') {
      toast.error('Permission Denied', 'Please enable notifications in your browser settings');
    }
  };
  
  // Handle toggle notifications
  const handleToggleNotifications = async (enabled) => {
    if (enabled) {
      // Enable notifications
      notificationService.enable();
      
      // Request permission if needed
      if (Notification.permission !== 'granted') {
        await handleRequestPermission();
      } else {
        // Subscribe to push notifications
        await notificationService.subscribe();
      }
    } else {
      // Disable notifications
      notificationService.disable();
      
      // Unsubscribe from push notifications
      await notificationService.unsubscribe();
    }
    
    // Update status
    setStatus(notificationService.getStatus());
    
    // Track event
    telemetryService.trackEvent('settings', 'toggle_notifications', {
      enabled
    });
  };
  
  // Handle toggle setting
  const handleToggleSetting = (setting, enabled) => {
    setSettings(prev => ({
      ...prev,
      [setting]: enabled
    }));
    
    // Track event
    telemetryService.trackEvent('settings', 'toggle_notification_setting', {
      setting,
      enabled
    });
  };
  
  // Handle test notification
  const handleTestNotification = () => {
    notificationService.sendNotification({
      title: 'Test Notification',
      body: 'This is a test notification from Movo.',
      tag: 'test',
      data: {
        url: '/settings/notifications'
      }
    });
  };
  
  return (
    <Container className={className}>
      <Header>
        <Title>Notification Settings</Title>
        <Description>
          Configure how and when you receive notifications from Movo.
        </Description>
      </Header>
      
      <SettingsList>
        <SettingItem>
          <SettingInfo>
            <SettingTitle>
              Enable Notifications
              {status.permission !== 'default' && (
                <StatusBadge status={status.permission}>
                  {status.permission === 'granted' ? 'Allowed' : 'Blocked'}
                </StatusBadge>
              )}
            </SettingTitle>
            <SettingDescription>
              {status.supported 
                ? 'Receive notifications about new content, recommendations, and more.'
                : 'Notifications are not supported in your browser.'
              }
            </SettingDescription>
          </SettingInfo>
          
          {status.permission === 'default' ? (
            <PermissionButton 
              onClick={handleRequestPermission}
              disabled={!status.supported}
            >
              Allow Notifications
            </PermissionButton>
          ) : (
            <Switch>
              <SwitchInput 
                type="checkbox" 
                checked={status.enabled}
                onChange={(e) => handleToggleNotifications(e.target.checked)}
                disabled={!status.supported || status.permission === 'denied'}
              />
              <SwitchSlider />
            </Switch>
          )}
        </SettingItem>
        
        <SettingItem>
          <SettingInfo>
            <SettingTitle>New Content</SettingTitle>
            <SettingDescription>
              Get notified when new movies or shows are added.
            </SettingDescription>
          </SettingInfo>
          <Switch>
            <SwitchInput 
              type="checkbox" 
              checked={settings.newContent}
              onChange={(e) => handleToggleSetting('newContent', e.target.checked)}
              disabled={!status.enabled || status.permission !== 'granted'}
            />
            <SwitchSlider />
          </Switch>
        </SettingItem>
        
        <SettingItem>
          <SettingInfo>
            <SettingTitle>Recommendations</SettingTitle>
            <SettingDescription>
              Receive personalized content recommendations.
            </SettingDescription>
          </SettingInfo>
          <Switch>
            <SwitchInput 
              type="checkbox" 
              checked={settings.recommendations}
              onChange={(e) => handleToggleSetting('recommendations', e.target.checked)}
              disabled={!status.enabled || status.permission !== 'granted'}
            />
            <SwitchSlider />
          </Switch>
        </SettingItem>
        
        <SettingItem>
          <SettingInfo>
            <SettingTitle>Watchlist Updates</SettingTitle>
            <SettingDescription>
              Get notified about updates to items in your watchlist.
            </SettingDescription>
          </SettingInfo>
          <Switch>
            <SwitchInput 
              type="checkbox" 
              checked={settings.watchlist}
              onChange={(e) => handleToggleSetting('watchlist', e.target.checked)}
              disabled={!status.enabled || status.permission !== 'granted'}
            />
            <SwitchSlider />
          </Switch>
        </SettingItem>
        
        <SettingItem>
          <SettingInfo>
            <SettingTitle>System Notifications</SettingTitle>
            <SettingDescription>
              Receive notifications about app updates and system messages.
            </SettingDescription>
          </SettingInfo>
          <Switch>
            <SwitchInput 
              type="checkbox" 
              checked={settings.system}
              onChange={(e) => handleToggleSetting('system', e.target.checked)}
              disabled={!status.enabled || status.permission !== 'granted'}
            />
            <SwitchSlider />
          </Switch>
        </SettingItem>
      </SettingsList>
      
      {status.permission === 'granted' && status.enabled && (
        <TestButton onClick={handleTestNotification}>
          Send Test Notification
        </TestButton>
      )}
    </Container>
  );
};

NotificationSettings.propTypes = {
  className: PropTypes.string
};

export default NotificationSettings;
