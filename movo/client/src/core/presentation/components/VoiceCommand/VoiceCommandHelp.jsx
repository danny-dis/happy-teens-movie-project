/**
 * Voice Command Help Component for Movo
 * Displays available voice commands and usage instructions
 *
 * @author zophlic
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { COMMAND_TYPE } from '../../../infrastructure/voice/VoiceCommandService';

// Styled components
const Container = styled.div`
  background-color: ${props => props.theme.surface};
  border-radius: ${props => props.theme.borderRadiusMedium};
  box-shadow: ${props => props.theme.elevation3};
  overflow: hidden;
  max-width: 600px;
  width: 100%;
`;

const Header = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  font-size: ${props => props.theme.fontSizeLarge};
  font-weight: ${props => props.theme.fontWeightBold};
  color: ${props => props.theme.text};
  margin: 0;
  display: flex;
  align-items: center;

  svg {
    margin-right: 0.75rem;
    color: ${props => props.theme.primary};
  }
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

  svg {
    width: 24px;
    height: 24px;
  }
`;

const Content = styled.div`
  padding: 1.5rem;
`;

const Introduction = styled.p`
  margin-top: 0;
  margin-bottom: 1.5rem;
  color: ${props => props.theme.text};
  line-height: 1.6;
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid ${props => props.theme.border};
  margin-bottom: 1.5rem;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Tab = styled.button`
  background: none;
  border: none;
  padding: 0.75rem 1.25rem;
  font-size: ${props => props.theme.fontSizeNormal};
  color: ${props => props.active ? props.theme.primary : props.theme.text};
  cursor: pointer;
  position: relative;
  white-space: nowrap;

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: ${props => props.active ? props.theme.primary : 'transparent'};
  }

  &:hover {
    color: ${props => props.theme.primary};
  }
`;

const CommandList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CommandItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 0.75rem;
  border-radius: ${props => props.theme.borderRadiusSmall};
  background-color: ${props => props.theme.background};
  transition: transform ${props => props.theme.transitionFast} ease;

  &:hover {
    transform: translateX(5px);
  }
`;

const CommandPhrases = styled.div`
  flex: 1;
`;

const PrimaryPhrase = styled.div`
  font-weight: ${props => props.theme.fontWeightMedium};
  color: ${props => props.theme.text};
  margin-bottom: 0.25rem;
`;

const AlternativePhrases = styled.div`
  font-size: ${props => props.theme.fontSizeSmall};
  color: ${props => props.theme.textSecondary};
`;

const CommandDescription = styled.div`
  flex: 1;
  color: ${props => props.theme.text};
  padding-left: 1rem;
`;

const Footer = styled.div`
  padding: 1.5rem;
  border-top: 1px solid ${props => props.theme.border};
  text-align: center;
  color: ${props => props.theme.textSecondary};
  font-size: ${props => props.theme.fontSizeSmall};
`;

/**
 * Voice command help component
 * @param {Object} props - Component props
 * @returns {JSX.Element} Voice command help component
 */
const VoiceCommandHelp = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState(COMMAND_TYPE.PLAYBACK);

  // Command data
  const commands = {
    [COMMAND_TYPE.PLAYBACK]: [
      {
        primary: 'Play',
        alternatives: ['Resume', 'Start playing', 'Continue'],
        description: 'Start or resume playback'
      },
      {
        primary: 'Pause',
        alternatives: ['Stop playing', 'Wait'],
        description: 'Pause the current playback'
      },
      {
        primary: 'Stop',
        alternatives: ['End playback', 'Finish'],
        description: 'Stop the current playback completely'
      },
      {
        primary: 'Skip intro',
        alternatives: ['Skip opening', 'Skip the intro'],
        description: 'Skip the intro sequence of the current content'
      },
      {
        primary: 'Skip credits',
        alternatives: ['Skip ending', 'Skip the credits'],
        description: 'Skip to the end of the credits'
      },
      {
        primary: 'Forward',
        alternatives: ['Skip forward', 'Seek forward', 'Fast forward'],
        description: 'Skip forward in the current media (default: 10 seconds)'
      },
      {
        primary: 'Backward',
        alternatives: ['Skip backward', 'Seek backward', 'Rewind'],
        description: 'Skip backward in the current media (default: 10 seconds)'
      },
      {
        primary: 'Volume up',
        alternatives: ['Increase volume', 'Louder'],
        description: 'Increase the volume'
      },
      {
        primary: 'Volume down',
        alternatives: ['Decrease volume', 'Quieter'],
        description: 'Decrease the volume'
      },
      {
        primary: 'Mute',
        alternatives: ['Silence'],
        description: 'Mute the audio'
      },
      {
        primary: 'Unmute',
        alternatives: ['Sound on'],
        description: 'Unmute the audio'
      }
    ],
    [COMMAND_TYPE.NAVIGATION]: [
      {
        primary: 'Go home',
        alternatives: ['Home page', 'Main page'],
        description: 'Navigate to the home page'
      },
      {
        primary: 'Go back',
        alternatives: ['Previous page'],
        description: 'Navigate to the previous page'
      },
      {
        primary: 'Go to [page]',
        alternatives: ['Navigate to [page]', 'Open [page]'],
        description: 'Navigate to a specific page (e.g., "Go to settings")'
      }
    ],
    [COMMAND_TYPE.SEARCH]: [
      {
        primary: 'Search for [query]',
        alternatives: ['Find [query]', 'Look for [query]'],
        description: 'Search for content (e.g., "Search for action movies")'
      },
      {
        primary: 'Recommendations',
        alternatives: ['Show recommendations', 'What should I watch'],
        description: 'Show personalized content recommendations'
      }
    ],
    [COMMAND_TYPE.SYSTEM]: [
      {
        primary: 'Fullscreen',
        alternatives: ['Exit fullscreen', 'Toggle fullscreen'],
        description: 'Toggle fullscreen mode'
      },
      {
        primary: 'Subtitles',
        alternatives: ['Captions', 'Toggle subtitles', 'Show subtitles', 'Hide subtitles'],
        description: 'Toggle subtitles on/off'
      },
      {
        primary: 'Dark mode',
        alternatives: ['Light mode', 'Toggle theme', 'Change theme'],
        description: 'Toggle between dark and light theme'
      },
      {
        primary: 'Toggle chimera',
        alternatives: ['Switch mode', 'Change mode', 'Chimera mode'],
        description: 'Toggle between streaming and local content modes'
      },
      {
        primary: 'Help',
        alternatives: ['Commands', 'What can I say', 'Voice commands'],
        description: 'Show this help dialog'
      }
    ],
    [COMMAND_TYPE.DEVICE]: [
      {
        primary: 'Cast to [device]',
        alternatives: ['Play on [device]', 'Cast to TV'],
        description: 'Cast content to a connected device'
      },
      {
        primary: 'Stop casting',
        alternatives: ['Stop playing on TV', 'Disconnect from TV', 'Play on this device'],
        description: 'Stop casting to external device'
      },
      {
        primary: 'Connect to [device]',
        alternatives: ['Pair with [device]', 'Connect device'],
        description: 'Connect to a new device'
      }
    ],
    [COMMAND_TYPE.SOCIAL]: [
      {
        primary: 'Share',
        alternatives: ['Share this', 'Share on [platform]', 'Post to [platform]'],
        description: 'Share the current content'
      },
      {
        primary: 'Start watch party',
        alternatives: ['Create watch party', 'Host watch party', 'Watch with friends'],
        description: 'Start a new watch party for the current content'
      },
      {
        primary: 'Join watch party',
        alternatives: ['Join party', 'Enter party code'],
        description: 'Join an existing watch party'
      }
    ]
  };

  return (
    <Container>
      <Header>
        <Title>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
          Voice Commands
        </Title>
        <CloseButton onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </CloseButton>
      </Header>

      <Content>
        <Introduction>
          Control Movo with your voice! Click the microphone icon in the interface to start listening for voice commands. Here are the commands you can use:
        </Introduction>

        <Tabs>
          <Tab
            active={activeTab === COMMAND_TYPE.PLAYBACK}
            onClick={() => setActiveTab(COMMAND_TYPE.PLAYBACK)}
          >
            Playback
          </Tab>
          <Tab
            active={activeTab === COMMAND_TYPE.NAVIGATION}
            onClick={() => setActiveTab(COMMAND_TYPE.NAVIGATION)}
          >
            Navigation
          </Tab>
          <Tab
            active={activeTab === COMMAND_TYPE.SEARCH}
            onClick={() => setActiveTab(COMMAND_TYPE.SEARCH)}
          >
            Search
          </Tab>
          <Tab
            active={activeTab === COMMAND_TYPE.SYSTEM}
            onClick={() => setActiveTab(COMMAND_TYPE.SYSTEM)}
          >
            System
          </Tab>
          <Tab
            active={activeTab === COMMAND_TYPE.DEVICE}
            onClick={() => setActiveTab(COMMAND_TYPE.DEVICE)}
          >
            Devices
          </Tab>
          <Tab
            active={activeTab === COMMAND_TYPE.SOCIAL}
            onClick={() => setActiveTab(COMMAND_TYPE.SOCIAL)}
          >
            Social
          </Tab>
        </Tabs>

        <CommandList>
          {commands[activeTab].map((command, index) => (
            <CommandItem key={index}>
              <CommandPhrases>
                <PrimaryPhrase>{command.primary}</PrimaryPhrase>
                <AlternativePhrases>
                  {command.alternatives.join(', ')}
                </AlternativePhrases>
              </CommandPhrases>
              <CommandDescription>
                {command.description}
              </CommandDescription>
            </CommandItem>
          ))}
        </CommandList>
      </Content>

      <Footer>
        Voice commands are processed locally on your device and are not sent to any server.
      </Footer>
    </Container>
  );
};

VoiceCommandHelp.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default VoiceCommandHelp;
