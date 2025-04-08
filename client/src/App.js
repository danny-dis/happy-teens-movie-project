import React, { useState, useEffect } from 'react';
import { Routes, Route, BrowserRouter, Link, Navigate, useLocation } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import MoviesApp from './components/MoviesApp';
import LocalMovies from './components/LocalMovies';
import MoviePlayer from './components/MoviePlayer';
import MovieDetails from './components/MovieDetails';
import UserPreferences from './components/UserPreferences';
import UserProfiles from './components/UserProfiles';
import SearchResults from './components/SearchResults';
import AdvancedSearch from './components/AdvancedSearch';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import Collections from './components/Collections';
import DownloadManager from './components/DownloadManager';
import SocialSharing from './components/SocialSharing';
import P2PSettings from './components/P2PSettings';
import { initKeyboardNavigation, addKeyboardNavigationStyles } from './utils/keyboardNavigation';

// Custom hook to get the current location
const useCurrentLocation = () => {
  const location = useLocation();
  return location.pathname;
};

// Navigation wrapper component
const NavigationWrapper = ({ children }) => {
  const currentPath = useCurrentLocation();

  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { currentPath });
    }
    return child;
  });
};

const App = () => {
  const [user, setUser] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showProfiles, setShowProfiles] = useState(true);
  const [currentProfile, setCurrentProfile] = useState(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // User preferences with Chimera Mode support
  // Chimera Mode is a feature that provides a seamless experience between online and offline content
  // When enabled, the app intelligently switches between streaming and local content
  const [userPreferences, setUserPreferences] = useState({
    chimeraMode: false,  // Toggle for Chimera Mode feature
    autoSkipIntro: true, // Automatically skip intro sequences
    autoSkipOutro: true, // Automatically skip end credits
    defaultVolume: 0.8,  // Default playback volume (0-1)
    darkMode: true,      // UI theme preference
    subtitlesEnabled: false, // Subtitle display preference
    downloadQuality: 'HD'    // Quality setting for downloads
  });

  // Update user preferences
  const updatePreferences = (newPrefs) => {
    setUserPreferences(prev => ({
      ...prev,
      ...newPrefs
    }));
    // In a real app, we would save this to localStorage or a database
    localStorage.setItem('userPreferences', JSON.stringify({
      ...userPreferences,
      ...newPrefs
    }));
  };

  // Load user preferences from localStorage on mount
  useEffect(() => {
    const savedPrefs = localStorage.getItem('userPreferences');
    if (savedPrefs) {
      try {
        setUserPreferences(JSON.parse(savedPrefs));
      } catch (error) {
        console.error('Error parsing saved preferences:', error);
      }
    }
  }, []);

  // Initialize keyboard navigation for accessibility
  useEffect(() => {
    // Add keyboard navigation
    initKeyboardNavigation();

    // Add keyboard navigation styles
    addKeyboardNavigationStyles();

    // Add meta tags for mobile devices
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
    }

    // Add accessibility attributes
    document.documentElement.setAttribute('lang', 'en');
    document.body.setAttribute('role', 'application');
  }, []);

  // Handle profile selection
  const handleSelectProfile = (profile) => {
    setCurrentProfile(profile);
    setShowProfiles(false);

    // Store the selected profile in localStorage
    localStorage.setItem('currentProfile', JSON.stringify(profile));
  };

  // Load the default or last selected profile
  useEffect(() => {
    if (user) {
      // Check if there's a stored profile
      const storedProfile = localStorage.getItem('currentProfile');
      if (storedProfile) {
        try {
          setCurrentProfile(JSON.parse(storedProfile));
          setShowProfiles(false);
        } catch (error) {
          console.error('Error parsing stored profile:', error);
          setShowProfiles(true);
        }
      } else {
        // Try to load the default profile
        const storedProfiles = localStorage.getItem('userProfiles');
        if (storedProfiles) {
          try {
            const profiles = JSON.parse(storedProfiles);
            const defaultProfile = profiles.find(p => p.isDefault);
            if (defaultProfile) {
              setCurrentProfile(defaultProfile);
              setShowProfiles(false);
              localStorage.setItem('currentProfile', JSON.stringify(defaultProfile));
            } else {
              setShowProfiles(true);
            }
          } catch (error) {
            console.error('Error parsing stored profiles:', error);
            setShowProfiles(true);
          }
        } else {
          setShowProfiles(true);
        }
      }
    }
  }, [user]);

  return (
    <div className={`app ${userPreferences.darkMode ? 'dark-mode' : 'light-mode'}`}>
      <BrowserRouter>
        {user && showProfiles ? (
          <UserProfiles onSelectProfile={handleSelectProfile} />
        ) : (
          <>
            <div className="navbar">
              <Link to="/" className="logo">
                Movo
              </Link>

              {user && (
                <div className="main-nav">
                  <Link to="/local" className={`nav-btn ${location => location.pathname === '/local' || location.pathname.startsWith('/play') ? 'active' : ''}`}>
                    <span className="nav-icon">📚</span> Movies
                  </Link>
                  <Link to="/tv" className={`nav-btn ${location => location.pathname === '/tv' ? 'active' : ''}`}>
                    <span className="nav-icon">📺</span> TV Shows
                  </Link>
                  <Link to="/documentaries" className={`nav-btn ${location => location.pathname === '/documentaries' ? 'active' : ''}`}>
                    <span className="nav-icon">🎬</span> Documentaries
                  </Link>
                  <Link to="/music" className={`nav-btn ${location => location.pathname === '/music' ? 'active' : ''}`}>
                    <span className="nav-icon">🎵</span> Music
                  </Link>
                  <Link to="/streaming" className={`nav-btn ${location => location.pathname === '/streaming' || location.pathname.startsWith('/details') ? 'active' : ''}`}>
                    <span className="nav-icon">🌐</span> Discover
                  </Link>
                  <Link to="/search" className={`nav-btn ${location => location.pathname === '/search' ? 'active' : ''}`}>
                    <span className="nav-icon">🔍</span> Search
                  </Link>
                </div>
              )}

              <ul className="navbar-nav">
                {!isOnline && (
                  <li className="nav-item">
                    <div className="offline-indicator">Offline Mode</div>
                  </li>
                )}
                {!user ? (
                  <>
                    <li className="nav-item">
                      <Link to="/signin" className="nav-link">Sign In</Link>
                    </li>
                    <li className="nav-item">
                      <Link to="/login" className="nav-link">Login</Link>
                    </li>
                  </>
                ) : (
                  <>
                    {currentProfile && (
                      <li className="nav-item">
                        <button
                          className="profile-switcher"
                          onClick={() => setShowProfiles(true)}
                        >
                          <span className="profile-avatar-small">{currentProfile.avatar}</span>
                          <span className="profile-name-small">{currentProfile.name}</span>
                        </button>
                      </li>
                    )}
                    <li className="nav-item">
                      <Link to="/preferences" className="nav-link settings-btn">
                        <span className="nav-icon">⚙️</span>
                      </Link>
                    </li>
                    <li className="nav-item">
                      <button
                        className="nav-link logout-btn"
                        onClick={() => {
                          setUser(false);
                          setCurrentProfile(null);
                          localStorage.removeItem('currentProfile');
                        }}
                      >
                        Logout
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {!isOnline && (
              <div className="offline-banner">
                You are currently offline. Some features may be limited.
              </div>
            )}

            <Routes>
              <Route path='/signin' element={<Register setUser={setUser} />} />
              <Route path='/login' element={<Login setUser={setUser} />} />
              {user ? (
                <>
                  {/*
                    Chimera Mode Routing Logic:
                    - When Chimera Mode is enabled, the default landing page is the streaming interface
                    - When disabled, the default is the local content library
                    - This provides a consistent entry point based on user preference
                  */}
                  <Route path='/' element={<Navigate to={userPreferences.chimeraMode ? "/streaming" : "/local"} />} />

                  {/* Local content pages are always accessible regardless of Chimera Mode */}
                  <Route path='/local' element={<LocalMovies isOnline={isOnline} currentProfile={currentProfile} contentType="movies" />} />

                  {/* Routes for different content types */}
                  <Route path='/tv' element={<LocalMovies isOnline={isOnline} currentProfile={currentProfile} contentType="tv" />} />
                  <Route path='/documentaries' element={<LocalMovies isOnline={isOnline} currentProfile={currentProfile} contentType="documentaries" />} />
                  <Route path='/music' element={<LocalMovies isOnline={isOnline} currentProfile={currentProfile} contentType="music" />} />

                  {/*
                    Streaming page behavior:
                    - When online: Always shows streaming content
                    - When offline with Chimera Mode enabled: Shows local content in streaming interface
                    - When offline with Chimera Mode disabled: Redirects to local library
                  */}
                  <Route path='/streaming' element={
                    isOnline || userPreferences.chimeraMode
                      ? <MoviesApp
                          currentProfile={currentProfile}
                          isOnline={isOnline}
                          chimeraMode={userPreferences.chimeraMode}
                        />
                      : <Navigate to="/local" />
                  } />

                  <Route path='/play/:id' element={<MoviePlayer preferences={userPreferences} currentProfile={currentProfile} />} />
                  <Route path='/details/:id' element={<MovieDetails isOnline={isOnline} currentProfile={currentProfile} />} />

                  {/*
                    Search functionality:
                    - When online: Searches both online and local content
                    - When offline with Chimera Mode: Searches local content only
                    - When offline without Chimera Mode: Redirects to local library
                    This ensures search is always available when Chimera Mode is enabled
                  */}
                  <Route path='/search' element={
                    isOnline || userPreferences.chimeraMode
                      ? <SearchResults
                          currentProfile={currentProfile}
                          isOnline={isOnline}
                          chimeraMode={userPreferences.chimeraMode}
                        />
                      : <Navigate to="/local" />
                  } />

                  <Route path='/preferences' element={<UserPreferences preferences={userPreferences} updatePreferences={updatePreferences} />} />
                  <Route path='/profiles' element={<UserProfiles onSelectProfile={handleSelectProfile} />} />
                  <Route path='/analytics' element={<AnalyticsDashboard currentProfile={currentProfile} />} />
                  <Route path='/downloads' element={<DownloadManager />} />
                  <Route path='/collections' element={<Collections />} />
                  <Route path='/p2p-settings' element={<P2PSettings />} />
                  <Route path='/shared/:id' element={<MovieDetails isOnline={isOnline} currentProfile={currentProfile} isShared={true} />} />

                  {/*
                    Default redirect for unknown routes:
                    - Follows the same logic as the root path
                    - Ensures consistent navigation based on Chimera Mode setting
                  */}
                  <Route path='*' element={<Navigate to={userPreferences.chimeraMode ? "/streaming" : "/local"} />} />
                </>
              ) : (
                <>
                  <Route path='/' element={<Navigate to="/login" />} />
                  <Route path='*' element={<Navigate to="/login" />} />
                </>
              )}
            </Routes>
          </>
        )}
      </BrowserRouter>
    </div>
  );
};



export default App;
