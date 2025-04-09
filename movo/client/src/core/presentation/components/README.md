# Movo Components

This directory contains the presentation components for the Movo application.

## Recent Enhancements

### Social Features
- **WatchParty**: Allows users to watch content together in real-time with chat functionality
- **SocialShareButton**: Enhanced with more platforms (Reddit, LinkedIn, Pinterest) for sharing content

### Smart Device Integration
- **DeviceSelector**: UI for discovering and connecting to smart devices
- **DeviceManager**: Service for managing device connections and casting content

### Notification System
- **NotificationPreferences**: UI for managing notification settings
- **NotificationService**: Enhanced with typed notifications and preference management

### Voice Commands
- Added support for device control commands (casting, connecting)
- Added support for social commands (sharing, watch parties)
- Enhanced voice command help with categorized commands

## Usage Examples

### Watch Party

```jsx
import { WatchParty } from '../components/Social';

const MyComponent = () => {
  return (
    <WatchParty 
      contentId="movie-123"
      contentTitle="The Matrix"
      onClose={() => console.log('Watch party closed')}
    />
  );
};
```

### Device Selector

```jsx
import DeviceSelector from '../components/Devices/DeviceSelector';

const MyComponent = () => {
  return (
    <DeviceSelector 
      onDeviceSelected={(device) => console.log('Selected device:', device)}
      onClose={() => console.log('Device selector closed')}
    />
  );
};
```

### Notification Preferences

```jsx
import NotificationPreferences from '../components/Notifications/NotificationPreferences';

const MyComponent = () => {
  return (
    <NotificationPreferences />
  );
};
```

## Author
- zophlic
