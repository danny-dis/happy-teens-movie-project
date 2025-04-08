import React, { useEffect, useState } from 'react';
import { FiloApp } from '../core/filoApp';
import ContentLibrary from './ContentLibrary';
import ContentPlayer from './ContentPlayer';
import ExperimentalFeatures from './ExperimentalFeatures';
import './App.css';
import './zophlic.css';

// Experimental services
import federatedLearningService from '../services/federatedLearningService';
import meshNetworkService from '../services/meshNetworkService';
import decentralizedComputationService from '../services/decentralizedComputationService';
import lightFieldVideoService from '../services/lightFieldVideoService';
import homomorphicEncryption from '../crypto/homomorphicEncryption';

/**
 * Main Filo Application Component
 *
 * @author zophlic
 */
function App() {
  const [app] = useState(() => new FiloApp());
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appState, setAppState] = useState({
    currentUser: null,
    isOnline: navigator.onLine,
    contentLibrary: [],
    networkStats: null
  });

  // UI state
  const [activeTab, setActiveTab] = useState('home');
  const [selectedContent, setSelectedContent] = useState(null);
  const [playbackInfo, setPlaybackInfo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize the app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        await app.initialize();
        setInitialized(true);

        // Initialize experimental services if enabled
        if (app.state.experimentalFeatures) {
          const { experimentalFeatures } = app.state;

          // Initialize Federated Learning
          if (experimentalFeatures.federatedLearning) {
            console.log('Initializing Federated Learning service...');
            await federatedLearningService.initialize();
          }

          // Initialize Mesh Network
          if (experimentalFeatures.meshNetworkSupport) {
            console.log('Initializing Mesh Network service...');
            await meshNetworkService.initialize();
          }

          // Initialize Decentralized Computation
          if (experimentalFeatures.decentralizedComputation) {
            console.log('Initializing Decentralized Computation service...');
            await decentralizedComputationService.initialize();
          }

          // Initialize Light Field Video
          if (experimentalFeatures.lightFieldVideo) {
            console.log('Initializing Light Field Video service...');
            await lightFieldVideoService.initialize();
          }

          // Initialize Homomorphic Encryption
          if (experimentalFeatures.homomorphicEncryption) {
            console.log('Initializing Homomorphic Encryption service...');
            await homomorphicEncryption.initialize();
          }
        }

        // Subscribe to app state changes
        const unsubscribe = app.subscribeToState(newState => {
          setAppState(prevState => ({
            ...prevState,
            ...newState
          }));
        });

        setLoading(false);

        // Clean up subscription
        return () => {
          unsubscribe();
        };
      } catch (err) {
        console.error('Failed to initialize app:', err);
        setError(err.message || 'Failed to initialize application');
        setLoading(false);
      }
    };

    initializeApp();
  }, [app]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setAppState(prevState => ({
        ...prevState,
        isOnline: true
      }));

      // Sync with network when coming online
      if (initialized && app) {
        app.syncWithNetwork();
      }
    };

    const handleOffline = () => {
      setAppState(prevState => ({
        ...prevState,
        isOnline: false
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [app, initialized]);

  // Handle content selection
  const handleSelectContent = async (content) => {
    setSelectedContent(content);

    try {
      // Get playback info
      const playInfo = await app.playContent(content.id);
      setPlaybackInfo(playInfo.playbackInfo);
      setIsPlaying(true);

      // Record interaction
      if (app.discovery) {
        app.discovery.recordInteraction(content.id, 'view');
      }
    } catch (error) {
      console.error('Failed to play content:', error);
      alert(`Failed to play content: ${error.message}`);
    }
  };

  // Handle content search
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      const results = await app.searchContent(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input
  const handleSearchInput = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  // Close player
  const handleClosePlayer = () => {
    setIsPlaying(false);
    setPlaybackInfo(null);

    // Stop streaming
    if (selectedContent && app.contentSharing) {
      app.contentSharing.stopStreaming(selectedContent.id);
    }
  };

  // Handle playback progress
  const handlePlaybackProgress = (currentTime, duration) => {
    // This could be used to update UI or save progress
    // For now, we'll just log it
    console.log(`Playback progress: ${currentTime}/${duration}`);
  };

  if (loading) {
    return (
      <div className="filo-loading">
        <div className="loading-spinner"></div>
        <h2>Initializing Filo...</h2>
        <p>Connecting to the decentralized network</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="filo-error">
        <h2>Error Initializing Filo</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="filo-app">
      {/* Player Overlay */}
      {isPlaying && playbackInfo && (
        <div className="player-overlay">
          <ContentPlayer
            contentId={selectedContent?.id}
            playbackInfo={playbackInfo}
            onClose={handleClosePlayer}
            onProgress={handlePlaybackProgress}
            app={app}
          />
        </div>
      )}

      <header className="filo-header">
        <div className="logo">
          <h1>Filo</h1>
        </div>

        <nav className="main-nav">
          <ul>
            <li>
              <button
                className={activeTab === 'home' ? 'active' : ''}
                onClick={() => setActiveTab('home')}
              >
                Home
              </button>
            </li>
            <li>
              <button
                className={activeTab === 'library' ? 'active' : ''}
                onClick={() => setActiveTab('library')}
              >
                Library
              </button>
            </li>
            <li>
              <button
                className={activeTab === 'discover' ? 'active' : ''}
                onClick={() => setActiveTab('discover')}
              >
                Discover
              </button>
            </li>
            <li>
              <button
                className={activeTab === 'settings' ? 'active' : ''}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            </li>
          </ul>
        </nav>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={handleSearchInput}
          />
          {isSearching && <div className="search-spinner"></div>}
        </div>

        <div className="user-info">
          {appState.currentUser && (
            <div className="user-profile">
              <div
                className="avatar"
                style={{
                  backgroundColor: appState.currentUser.avatar?.type === 'color'
                    ? appState.currentUser.avatar.value
                    : 'gray'
                }}
              >
                {appState.currentUser.username.charAt(0).toUpperCase()}
              </div>
              <span className="username">{appState.currentUser.username}</span>
            </div>
          )}
        </div>

        <div className="network-status">
          <div className={`status-indicator ${appState.isOnline ? 'online' : 'offline'}`}></div>
          <span>{appState.isOnline ? 'Connected' : 'Offline'}</span>
        </div>
      </header>

      <main className="filo-content">
        {/* Search Results */}
        {searchQuery && searchResults.length > 0 && (
          <div className="search-results">
            <h2>Search Results for "{searchQuery}"</h2>
            <div className="results-grid">
              {searchResults.map(item => (
                <div
                  key={item.id}
                  className="result-item"
                  onClick={() => handleSelectContent(item)}
                >
                  <div className="result-thumbnail">
                    {item.metadata?.thumbnailUrl ? (
                      <img src={item.metadata.thumbnailUrl} alt={item.metadata.title} />
                    ) : (
                      <div className="placeholder-thumbnail">
                        {item.metadata?.title?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="result-details">
                    <h4>{item.metadata?.title || 'Untitled'}</h4>
                    <p>{item.metadata?.description || 'No description'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Home Tab */}
        {activeTab === 'home' && !searchQuery && (
          <div className="home-tab">
            <div className="welcome-message">
              <h2>Welcome to Filo</h2>
              <p>The fully decentralized streaming platform with no central servers.</p>
              <p>Your identity: {appState.currentUser?.username}</p>

              {appState.networkStats && (
                <div className="network-stats">
                  <h3>Network Statistics</h3>
                  <ul>
                    <li>Upload Speed: {(appState.networkStats.uploadSpeed / 1024).toFixed(2)} KB/s</li>
                    <li>Download Speed: {(appState.networkStats.downloadSpeed / 1024).toFixed(2)} KB/s</li>
                    <li>Connected Peers: {appState.networkStats.peers}</li>
                    <li>Active Torrents: {appState.networkStats.torrents}</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="quick-access">
              <h3>Recently Added</h3>
              <div className="content-preview">
                {appState.contentLibrary.slice(0, 4).map(item => (
                  <div
                    key={item.id}
                    className="preview-item"
                    onClick={() => handleSelectContent(item)}
                  >
                    <div className="preview-thumbnail">
                      {item.metadata?.thumbnailUrl ? (
                        <img src={item.metadata.thumbnailUrl} alt={item.metadata.title} />
                      ) : (
                        <div className="placeholder-thumbnail">
                          {item.metadata?.title?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <h4>{item.metadata?.title || 'Untitled'}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Library Tab */}
        {activeTab === 'library' && !searchQuery && (
          <ContentLibrary
            app={app}
            onSelectContent={handleSelectContent}
          />
        )}

        {/* Discover Tab */}
        {activeTab === 'discover' && !searchQuery && (
          <div className="discover-tab">
            <h2>Discover Content</h2>
            <p>This feature is coming soon. In the future, you'll be able to discover content shared by other users in the network.</p>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && !searchQuery && (
          <div className="settings-tab">
            <h2>Settings</h2>

            <div className="settings-section">
              <h3>Experimental Features</h3>
              <p className="settings-description">
                These cutting-edge features are still in development and may affect stability.
                <span className="zophlic-signature">Curated by zophlic</span>
              </p>

              <ExperimentalFeatures app={app} />
            </div>
          </div>
        )}
      </main>

      <footer className="filo-footer">
        <p>Filo - True decentralization for content streaming</p>
        <p className="signature">Developed with ❤️ by zophlic</p>
      </footer>
    </div>
  );
}

export default App;
