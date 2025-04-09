/**
 * Device Selector Component for Movo
 * Allows users to select and connect to devices
 * 
 * @author zophlic
 */

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import deviceManager, { CONNECTION_STATE, DEVICE_TYPE } from '../../../infrastructure/devices/DeviceManager';
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

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: ${props => props.theme.primary};
  cursor: pointer;
  font-size: ${props => props.theme.fontSizeSmall};
  
  svg {
    margin-right: 0.5rem;
  }
  
  &:hover {
    color: ${props => props.theme.primaryHover};
  }
  
  &:disabled {
    color: ${props => props.theme.textDisabled};
    cursor: not-allowed;
  }
`;

const DeviceList = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const DeviceItem = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  background-color: ${props => props.active ? props.theme.primaryLight : props.theme.background};
  border: 1px solid ${props => props.active ? props.theme.primary : props.theme.border};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.active ? props.theme.primaryLight : props.theme.backgroundHover};
    border-color: ${props => props.active ? props.theme.primary : props.theme.borderHover};
  }
`;

const DeviceIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: ${props => props.theme.backgroundAlt};
  margin-right: 1rem;
  flex-shrink: 0;
  
  svg {
    width: 24px;
    height: 24px;
    color: ${props => props.theme.textPrimary};
  }
`;

const DeviceInfo = styled.div`
  flex: 1;
`;

const DeviceName = styled.div`
  font-size: ${props => props.theme.fontSizeMedium};
  font-weight: 500;
  color: ${props => props.theme.textPrimary};
  margin-bottom: 0.25rem;
`;

const DeviceModel = styled.div`
  font-size: ${props => props.theme.fontSizeSmall};
  color: ${props => props.theme.textSecondary};
`;

const DeviceStatus = styled.div`
  display: flex;
  align-items: center;
  font-size: ${props => props.theme.fontSizeSmall};
  color: ${props => {
    switch (props.status) {
      case CONNECTION_STATE.CONNECTED:
        return props.theme.success;
      case CONNECTION_STATE.CONNECTING:
        return props.theme.warning;
      case CONNECTION_STATE.ERROR:
        return props.theme.error;
      default:
        return props.theme.textSecondary;
    }
  }};
  
  svg {
    margin-right: 0.25rem;
  }
`;

const NoDevices = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${props => props.theme.textSecondary};
  background-color: ${props => props.theme.background};
  border-radius: ${props => props.theme.borderRadiusSmall};
  
  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 1rem;
    color: ${props => props.theme.textTertiary};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  font-size: ${props => props.theme.fontSizeSmall};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
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

/**
 * Get device icon based on device type
 * @param {string} type - Device type
 * @returns {JSX.Element} Device icon
 */
const getDeviceIcon = (type) => {
  switch (type) {
    case DEVICE_TYPE.CHROMECAST:
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11zm20-7H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
        </svg>
      );
    case DEVICE_TYPE.SMART_TV:
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L22 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" />
        </svg>
      );
    case DEVICE_TYPE.ROKU:
    case DEVICE_TYPE.FIRE_TV:
    case DEVICE_TYPE.APPLE_TV:
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L22 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" />
          <path d="M12 15.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z" />
        </svg>
      );
    case DEVICE_TYPE.GAME_CONSOLE:
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        </svg>
      );
    case DEVICE_TYPE.SPEAKER:
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 2c1.1 0 2 .9 2 2s-.9 2-2 2c-1.11 0-2-.9-2-2s.89-2 2-2zm0 16c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z" />
        </svg>
      );
  }
};

/**
 * Get connection status text
 * @param {string} status - Connection status
 * @returns {string} Status text
 */
const getStatusText = (status) => {
  switch (status) {
    case CONNECTION_STATE.CONNECTED:
      return 'Connected';
    case CONNECTION_STATE.CONNECTING:
      return 'Connecting...';
    case CONNECTION_STATE.ERROR:
      return 'Connection Error';
    default:
      return 'Not Connected';
  }
};

/**
 * Device selector component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Device selector component
 */
const DeviceSelector = ({ className, onDeviceSelected, onClose }) => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [activeDevice, setActiveDevice] = useState(null);
  const [connectionState, setConnectionState] = useState(CONNECTION_STATE.DISCONNECTED);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const toast = useToast();
  
  // Load devices on mount
  useEffect(() => {
    loadDevices();
    
    // Set active device if any
    const currentDevice = deviceManager.getActiveDevice();
    if (currentDevice) {
      setActiveDevice(currentDevice);
      setConnectionState(deviceManager.getConnectionState());
    }
    
    // Add event listeners
    deviceManager.on('deviceConnected', handleDeviceConnected);
    deviceManager.on('deviceDisconnected', handleDeviceDisconnected);
    deviceManager.on('deviceError', handleDeviceError);
    
    // Clean up
    return () => {
      deviceManager.off('deviceConnected', handleDeviceConnected);
      deviceManager.off('deviceDisconnected', handleDeviceDisconnected);
      deviceManager.off('deviceError', handleDeviceError);
    };
  }, []);
  
  // Handle device connected
  const handleDeviceConnected = (device) => {
    setActiveDevice(device);
    setConnectionState(CONNECTION_STATE.CONNECTED);
    toast.success('Device Connected', `Connected to ${device.name}`);
    
    // Notify parent
    if (onDeviceSelected) {
      onDeviceSelected(device);
    }
  };
  
  // Handle device disconnected
  const handleDeviceDisconnected = () => {
    setActiveDevice(null);
    setConnectionState(CONNECTION_STATE.DISCONNECTED);
    toast.info('Device Disconnected', 'Disconnected from device');
    
    // Notify parent
    if (onDeviceSelected) {
      onDeviceSelected(null);
    }
  };
  
  // Handle device error
  const handleDeviceError = ({ error }) => {
    setConnectionState(CONNECTION_STATE.ERROR);
    toast.error('Device Error', error);
  };
  
  // Load devices
  const loadDevices = async () => {
    setIsRefreshing(true);
    
    try {
      const discoveredDevices = await deviceManager.discoverDevices();
      setDevices(discoveredDevices);
      
      // Update active device
      const currentDevice = deviceManager.getActiveDevice();
      if (currentDevice) {
        setActiveDevice(currentDevice);
        setConnectionState(deviceManager.getConnectionState());
      }
    } catch (error) {
      toast.error('Error', 'Failed to discover devices');
      console.error('Failed to discover devices:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle device selection
  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
  };
  
  // Handle connect button
  const handleConnect = async () => {
    if (!selectedDevice) {
      return;
    }
    
    // If already connected to this device, do nothing
    if (activeDevice && activeDevice.id === selectedDevice.id) {
      toast.info('Already Connected', `Already connected to ${selectedDevice.name}`);
      return;
    }
    
    // If connected to another device, disconnect first
    if (activeDevice) {
      await deviceManager.disconnectFromDevice();
    }
    
    // Connect to selected device
    const success = await deviceManager.connectToDevice(selectedDevice.id);
    
    if (!success) {
      toast.error('Connection Failed', `Failed to connect to ${selectedDevice.name}`);
    }
  };
  
  // Handle disconnect button
  const handleDisconnect = async () => {
    if (!activeDevice) {
      return;
    }
    
    const success = await deviceManager.disconnectFromDevice();
    
    if (!success) {
      toast.error('Disconnection Failed', `Failed to disconnect from ${activeDevice.name}`);
    }
  };
  
  return (
    <Container className={className}>
      <Header>
        <Title>Select a Device</Title>
        <RefreshButton onClick={loadDevices} disabled={isRefreshing}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          Refresh
        </RefreshButton>
      </Header>
      
      {devices.length > 0 ? (
        <DeviceList>
          {devices.map((device) => (
            <DeviceItem
              key={device.id}
              active={activeDevice && activeDevice.id === device.id}
              onClick={() => handleDeviceSelect(device)}
              selected={selectedDevice && selectedDevice.id === device.id}
            >
              <DeviceIcon>
                {getDeviceIcon(device.type)}
              </DeviceIcon>
              <DeviceInfo>
                <DeviceName>{device.name}</DeviceName>
                <DeviceModel>{device.model}</DeviceModel>
              </DeviceInfo>
              {activeDevice && activeDevice.id === device.id && (
                <DeviceStatus status={connectionState}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {connectionState === CONNECTION_STATE.CONNECTED ? (
                      <path d="M5 12l5 5l10 -10"></path>
                    ) : connectionState === CONNECTION_STATE.CONNECTING ? (
                      <circle cx="12" cy="12" r="10"></circle>
                    ) : (
                      <React.Fragment>
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </React.Fragment>
                    )}
                  </svg>
                  {getStatusText(connectionState)}
                </DeviceStatus>
              )}
            </DeviceItem>
          ))}
        </DeviceList>
      ) : (
        <NoDevices>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect>
            <line x1="2" y1="12" x2="22" y2="12"></line>
          </svg>
          <p>No devices found</p>
          <p>Make sure your devices are on the same network and try refreshing</p>
        </NoDevices>
      )}
      
      <ActionButtons>
        {activeDevice ? (
          <SecondaryButton onClick={handleDisconnect}>
            Disconnect
          </SecondaryButton>
        ) : null}
        
        <PrimaryButton
          onClick={handleConnect}
          disabled={!selectedDevice || (activeDevice && activeDevice.id === selectedDevice.id)}
        >
          Connect
        </PrimaryButton>
        
        {onClose && (
          <SecondaryButton onClick={onClose}>
            Close
          </SecondaryButton>
        )}
      </ActionButtons>
    </Container>
  );
};

DeviceSelector.propTypes = {
  className: PropTypes.string,
  onDeviceSelected: PropTypes.func,
  onClose: PropTypes.func
};

export default DeviceSelector;
