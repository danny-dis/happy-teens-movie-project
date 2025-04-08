import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import SubtitleManager from './SubtitleManager';
import TimestampEditor from './TimestampEditor';
import p2pService from '../services/p2pService';
import '../App.css';

const MoviePlayer = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [p2pEnabled, setP2PEnabled] = useState(false);
  const [p2pStats, setP2PStats] = useState(null);
  const [p2pPeers, setP2PPeers] = useState(0);
  const [showP2PInfo, setShowP2PInfo] = useState(false);
  const [showTimestampEditor, setShowTimestampEditor] = useState(false);
  const [preferences, setPreferences] = useState({
    autoSkipIntro: true,
    autoSkipOutro: true,
    subtitlesEnabled: false
  });
  const videoRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const p2pStatsIntervalRef = useRef(null);

  // Get the time parameter from the URL if present
  const getTimeFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const timeParam = urlParams.get('t');
    return timeParam ? parseInt(timeParam, 10) : 0;
  };

  // Check if P2P is enabled in user settings
  useEffect(() => {
    const p2pSettings = JSON.parse(localStorage.getItem('p2pSettings') || '{}');
    setP2PEnabled(p2pSettings.enabled || false);
  }, []);

  // Initialize P2P service if enabled
  useEffect(() => {
    if (p2pEnabled && movie) {
      const initP2P = async () => {
        try {
          await p2pService.initialize();

          // Set up P2P event listeners
          p2pService.addEventListener('onPeerConnect', (data) => {
            setP2PPeers(prev => prev + 1);
          });

          p2pService.addEventListener('onPeerDisconnect', (data) => {
            setP2PPeers(prev => Math.max(0, prev - 1));
          });

          // Start stats update interval
          p2pStatsIntervalRef.current = setInterval(() => {
            if (p2pService.initialized) {
              setP2PStats(p2pService.getStats());
            }
          }, 2000);
        } catch (error) {
          console.error('Failed to initialize P2P service:', error);
        }
      };

      initP2P();
    }

    return () => {
      // Clean up P2P resources
      if (p2pStatsIntervalRef.current) {
        clearInterval(p2pStatsIntervalRef.current);
      }
    };
  }, [p2pEnabled, movie]);

  // Fetch movie details
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        // In a real implementation, this would be an API call
        // const response = await fetch(`http://localhost:5000/api/local-movies/${id}`);
        // const data = await response.json();

        // For now, use mock data
        const mockMovie = {
          id: parseInt(id),
          title: ["The Avengers", "Inception", "The Dark Knight", "Toy Story", "The Shawshank Redemption"][parseInt(id) - 1],
          year: ["2012", "2010", "2008", "1995", "1994"][parseInt(id) - 1],
          category: ["Action", "Sci-Fi", "Action", "Animation", "Drama"][parseInt(id) - 1],
          posterUrl: [
            "https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
            "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
            "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg",
            "https://m.media-amazon.com/images/M/MV5BMDU2ZWJlMjktMTRhMy00ZTA5LWEzNDgtYmNmZTEwZTViZWJkXkEyXkFqcGdeQXVyNDQ2OTk4MzI@._V1_SX300.jpg",
            "https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg"
          ][parseInt(id) - 1],
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Sample video
          introStart: 0,
          introEnd: [120, 90, 60, 30, 150][parseInt(id) - 1], // Intro end times in seconds
          outroStart: [7200, 8400, 7800, 4800, 8100][parseInt(id) - 1], // Outro start times in seconds
          downloaded: true
        };

        setMovie(mockMovie);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching movie:", error);
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  // Load user preferences
  useEffect(() => {
    const savedPrefs = localStorage.getItem('userPreferences');
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (error) {
        console.error('Error parsing saved preferences:', error);
      }
    }
  }, []);

  // Handle auto-skip intro/outro
  useEffect(() => {
    if (!videoRef.current || !movie) return;

    const handleTimeUpdate = () => {
      const currentTime = videoRef.current.currentTime;
      setCurrentTime(currentTime);

      // Auto-skip intro if enabled in preferences
      if (preferences.autoSkipIntro && currentTime >= movie.introStart && currentTime < movie.introEnd) {
        videoRef.current.currentTime = movie.introEnd;

        // Show notification
        const notification = document.createElement('div');
        notification.className = 'skip-notification';
        notification.textContent = 'Intro Skipped';
        document.querySelector('.video-container').appendChild(notification);

        setTimeout(() => {
          notification.remove();
        }, 2000);
      }

      // Auto-skip outro if enabled in preferences
      if (preferences.autoSkipOutro && currentTime >= movie.outroStart && currentTime < duration) {
        videoRef.current.currentTime = duration;

        // Show notification
        const notification = document.createElement('div');
        notification.className = 'skip-notification';
        notification.textContent = 'Outro Skipped';
        document.querySelector('.video-container').appendChild(notification);

        setTimeout(() => {
          notification.remove();
        }, 2000);
      }
    };

    videoRef.current.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, [movie, duration, preferences]);

  // Handle video metadata loaded
  const handleMetadataLoaded = () => {
    setDuration(videoRef.current.duration);

    // Set the current time from URL parameter if present
    const startTime = getTimeFromUrl();
    if (startTime > 0 && startTime < videoRef.current.duration) {
      videoRef.current.currentTime = startTime;
      setCurrentTime(startTime);

      // Show notification
      const notification = document.createElement('div');
      notification.className = 'skip-notification';
      notification.textContent = 'Resuming from where you left off';
      document.querySelector('.video-container').appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
  };

  // Handle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Handle seeking
  const handleSeek = (e) => {
    const seekTime = (e.nativeEvent.offsetX / e.target.clientWidth) * duration;
    videoRef.current.currentTime = seekTime;
  };

  // Update continue watching list
  const updateContinueWatching = () => {
    if (!movie || currentTime < 30) return; // Don't save if less than 30 seconds watched

    try {
      // Calculate progress percentage
      const progress = Math.floor((currentTime / duration) * 100);

      // Create continue watching item
      const watchItem = {
        id: movie.id,
        title: movie.title,
        year: movie.year,
        posterUrl: movie.posterUrl,
        progress: progress,
        currentTime: currentTime,
        duration: duration,
        isLocal: true,
        lastWatched: new Date().toISOString()
      };

      // Get existing items
      const savedItems = localStorage.getItem('continueWatching');
      let continueWatchingItems = savedItems ? JSON.parse(savedItems) : [];

      // Remove this movie if it already exists in the list
      continueWatchingItems = continueWatchingItems.filter(item =>
        !(item.id === movie.id && item.isLocal === true)
      );

      // Add to beginning of array (most recent)
      continueWatchingItems.unshift(watchItem);

      // Limit to 10 items
      if (continueWatchingItems.length > 10) {
        continueWatchingItems = continueWatchingItems.slice(0, 10);
      }

      // Save to localStorage
      localStorage.setItem('continueWatching', JSON.stringify(continueWatchingItems));
    } catch (error) {
      console.error('Error updating continue watching:', error);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
  };

  // Handle timestamp updates
  const handleTimestampUpdate = (timestamps) => {
    // Update movie object with new timestamps
    setMovie(prev => ({
      ...prev,
      introStart: timestamps.introStart,
      introEnd: timestamps.introEnd,
      outroStart: timestamps.outroStart
    }));

    // In a real implementation, this would save to the database
    // For now, just show a success notification
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = 'Timestamps updated successfully';
    document.querySelector('.video-container').appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);

    // Close the editor
    setShowTimestampEditor(false);
  };

  // Show/hide controls on mouse movement
  const handleMouseMove = () => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  // Add event listeners for page unload to save watching progress
  useEffect(() => {
    const handleBeforeUnload = () => {
      updateContinueWatching();
    };

    // Save progress when user leaves the page
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also save progress when component unmounts
      updateContinueWatching();
    };
  }, [currentTime, duration, movie]);

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (loading) {
    return (
      <div className="movie-player">
        <div className="loading">
          <h2>Loading movie...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="movie-player">
      <div className="player-header">
        <Link to="/local" className="back-btn">← Back to Library</Link>
        <h2>{movie.title}</h2>
      </div>

      <div
        className="video-container"
        onMouseMove={handleMouseMove}
      >
        <video
          ref={videoRef}
          className="video-player"
          src={p2pEnabled ? null : movie.videoUrl} // src will be set by P2P service if enabled
          autoPlay
          onLoadedMetadata={handleMetadataLoaded}
          onClick={togglePlay}
        />

        {p2pEnabled && p2pPeers > 0 && (
          <div className="p2p-indicator" onClick={() => setShowP2PInfo(!showP2PInfo)}>
            <span className="p2p-icon">🔄</span>
            <span className="p2p-peers">{p2pPeers} peers</span>
          </div>
        )}

        {showP2PInfo && p2pStats && (
          <div className="p2p-info-panel">
            <div className="p2p-info-header">
              <h3>P2P Streaming Stats</h3>
              <button className="close-p2p-info" onClick={() => setShowP2PInfo(false)}>×</button>
            </div>
            <div className="p2p-info-content">
              <div className="p2p-stat-item">
                <span className="p2p-stat-label">Download Speed:</span>
                <span className="p2p-stat-value">{(p2pStats.download.downloadSpeed / 1024).toFixed(2)} KB/s</span>
              </div>
              <div className="p2p-stat-item">
                <span className="p2p-stat-label">Upload Speed:</span>
                <span className="p2p-stat-value">{(p2pStats.upload.uploadSpeed / 1024).toFixed(2)} KB/s</span>
              </div>
              <div className="p2p-stat-item">
                <span className="p2p-stat-label">Connected Peers:</span>
                <span className="p2p-stat-value">{p2pPeers}</span>
              </div>
              <div className="p2p-stat-item">
                <span className="p2p-stat-label">Total Downloaded:</span>
                <span className="p2p-stat-value">{(p2pStats.download.totalDownloaded / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <div className="p2p-stat-item">
                <span className="p2p-stat-label">Total Uploaded:</span>
                <span className="p2p-stat-value">{(p2pStats.upload.totalUploaded / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            </div>
          </div>
        )}

        {showControls && (
          <div className="video-controls">
            <div className="progress-bar" onClick={handleSeek}>
              <div
                className="progress-filled"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>

            <div className="controls-bottom">
              <button className="control-btn" onClick={togglePlay}>
                {isPlaying ? '❚❚' : '▶'}
              </button>

              <div className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              <div className="volume-control">
                <span>{volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
                />
              </div>

              {/* Subtitle manager */}
              <SubtitleManager
                videoRef={videoRef}
                movieId={movie?.id}
                preferences={preferences}
              />

              <button className="control-btn fullscreen-btn">⛶</button>
            </div>
          </div>
        )}
      </div>

      {showTimestampEditor ? (
        <div className="timestamp-editor-container">
          <TimestampEditor
            movie={movie}
            onSave={handleTimestampUpdate}
            onCancel={() => setShowTimestampEditor(false)}
          />
        </div>
      ) : (
        <div className="movie-info-panel">
          <div className="movie-details-section">
            <img src={movie.posterUrl} alt={movie.title} className="movie-poster-small" />
            <div className="movie-details-text">
              <h3>{movie.title} ({movie.year})</h3>
              <p className="movie-category">{movie.category}</p>
              <div className="intro-outro-settings">
                <div className="setting-group">
                  <label>Intro End:</label>
                  <span>{formatTime(movie.introEnd)}</span>
                  <button className="edit-btn" onClick={() => setShowTimestampEditor(true)}>Edit</button>
                </div>
                <div className="setting-group">
                  <label>Outro Start:</label>
                  <span>{formatTime(movie.outroStart)}</span>
                  <button className="edit-btn" onClick={() => setShowTimestampEditor(true)}>Edit</button>
                </div>
              </div>
              <div className="skip-settings">
                <div className="setting-group">
                  <label>Auto-skip Intro:</label>
                  <input
                    type="checkbox"
                    checked={preferences.autoSkipIntro}
                    onChange={(e) => {
                      const newPrefs = {...preferences, autoSkipIntro: e.target.checked};
                      setPreferences(newPrefs);
                      localStorage.setItem('userPreferences', JSON.stringify(newPrefs));
                    }}
                  />
                </div>
                <div className="setting-group">
                  <label>Auto-skip Outro:</label>
                  <input
                    type="checkbox"
                    checked={preferences.autoSkipOutro}
                    onChange={(e) => {
                      const newPrefs = {...preferences, autoSkipOutro: e.target.checked};
                      setPreferences(newPrefs);
                      localStorage.setItem('userPreferences', JSON.stringify(newPrefs));
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoviePlayer;
