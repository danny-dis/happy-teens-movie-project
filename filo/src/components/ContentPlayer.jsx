import React, { useEffect, useRef, useState } from 'react';
import './ContentPlayer.css';

/**
 * Content Player Component
 *
 * Provides video/audio playback functionality with:
 * - Adaptive quality selection
 * - Playback controls
 * - Progress tracking
 * - Subtitle support
 *
 * @author zophlic
 */
function ContentPlayer({ contentId, playbackInfo, onClose, onProgress, app }) {
  const playerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState(null);

  // Control visibility timer
  const controlsTimerRef = useRef(null);

  // Initialize player
  useEffect(() => {
    if (!playbackInfo || !playbackInfo.url) {
      setError('Invalid playback information');
      return;
    }

    // Reset player state
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBuffering(true);
    setError(null);

    // Auto-hide controls after 3 seconds
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);

    return () => {
      // Clean up
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }

      // Stop streaming when component unmounts
      if (app && contentId) {
        app.contentSharing.stopStreaming(contentId);
      }
    };
  }, [contentId, playbackInfo, app, isPlaying]);

  // Handle player events
  useEffect(() => {
    const player = playerRef.current;

    if (!player) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setBuffering(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(player.currentTime);

      // Report progress to parent component
      if (onProgress) {
        onProgress(player.currentTime, player.duration);
      }

      // Save progress to local storage
      if (app && contentId) {
        app.storage.updatePlayPosition(contentId, player.currentTime);
      }
    };

    const handleDurationChange = () => {
      setDuration(player.duration);
    };

    const handleVolumeChange = () => {
      setVolume(player.volume);
      setIsMuted(player.muted);
    };

    const handleWaiting = () => {
      setBuffering(true);
    };

    const handleCanPlay = () => {
      setBuffering(false);
    };

    const handleError = (e) => {
      console.error('Player error:', e);
      setError('Failed to play content. Please try again.');
      setBuffering(false);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement === player ||
        document.webkitFullscreenElement === player
      );
    };

    // Add event listeners
    player.addEventListener('play', handlePlay);
    player.addEventListener('pause', handlePause);
    player.addEventListener('timeupdate', handleTimeUpdate);
    player.addEventListener('durationchange', handleDurationChange);
    player.addEventListener('volumechange', handleVolumeChange);
    player.addEventListener('waiting', handleWaiting);
    player.addEventListener('canplay', handleCanPlay);
    player.addEventListener('error', handleError);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      // Remove event listeners
      player.removeEventListener('play', handlePlay);
      player.removeEventListener('pause', handlePause);
      player.removeEventListener('timeupdate', handleTimeUpdate);
      player.removeEventListener('durationchange', handleDurationChange);
      player.removeEventListener('volumechange', handleVolumeChange);
      player.removeEventListener('waiting', handleWaiting);
      player.removeEventListener('canplay', handleCanPlay);
      player.removeEventListener('error', handleError);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [contentId, onProgress, app]);

  // Handle play/pause
  const togglePlayback = () => {
    const player = playerRef.current;

    if (!player) return;

    if (isPlaying) {
      player.pause();
    } else {
      player.play().catch(error => {
        console.error('Playback error:', error);
        setError('Failed to start playback. Please try again.');
      });
    }
  };

  // Handle seek
  const handleSeek = (e) => {
    const player = playerRef.current;

    if (!player) return;

    const seekBar = e.currentTarget;
    const rect = seekBar.getBoundingClientRect();
    const seekPos = (e.clientX - rect.left) / rect.width;

    player.currentTime = seekPos * player.duration;
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const player = playerRef.current;

    if (!player) return;

    const newVolume = parseFloat(e.target.value);
    player.volume = newVolume;

    if (newVolume === 0) {
      player.muted = true;
    } else if (player.muted) {
      player.muted = false;
    }
  };

  // Toggle mute
  const toggleMute = () => {
    const player = playerRef.current;

    if (!player) return;

    player.muted = !player.muted;
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const player = playerRef.current;

    if (!player) return;

    if (!isFullscreen) {
      if (player.requestFullscreen) {
        player.requestFullscreen();
      } else if (player.webkitRequestFullscreen) {
        player.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  // Show controls when mouse moves
  const handleMouseMove = () => {
    setShowControls(true);

    // Reset auto-hide timer
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }

    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // Format time (seconds to MM:SS)
  // Implementation by zophlic - optimized for performance
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine if content is video or audio
  const isVideo = playbackInfo && (
    playbackInfo.type?.startsWith('video') ||
    playbackInfo.metadata?.type === 'video'
  );

  return (
    <div
      className="content-player-container"
      onMouseMove={handleMouseMove}
    >
      {error ? (
        <div className="player-error">
          <p>{error}</p>
          <button onClick={onClose}>Close</button>
        </div>
      ) : (
        <>
          {isVideo ? (
            <video
              ref={playerRef}
              src={playbackInfo.url}
              className="content-player"
              poster={playbackInfo.metadata?.thumbnailUrl}
              autoPlay
              playsInline
            />
          ) : (
            <audio
              ref={playerRef}
              src={playbackInfo.url}
              className="content-player audio"
              autoPlay
            />
          )}

          {buffering && (
            <div className="buffering-indicator">
              <div className="spinner"></div>
              <span>Buffering...</span>
            </div>
          )}

          <div className={`player-controls ${showControls ? 'visible' : ''}`}>
            <div className="player-header">
              <h3>{playbackInfo.metadata?.title || 'Unknown Content'}</h3>
              <button className="close-button" onClick={onClose}>×</button>
            </div>

            <div className="seek-bar-container" onClick={handleSeek}>
              <div className="seek-bar-background"></div>
              <div
                className="seek-bar-progress"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              ></div>
              <div
                className="seek-bar-handle"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              ></div>
            </div>

            <div className="controls-row">
              <div className="left-controls">
                <button
                  className="control-button"
                  onClick={togglePlayback}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>

                <div className="time-display">
                  <span>{formatTime(currentTime)}</span>
                  <span> / </span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="right-controls">
                <div className="volume-control">
                  <button
                    className="control-button"
                    onClick={toggleMute}
                  >
                    {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                </div>

                <button
                  className="control-button"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? '⏹️' : '⏫'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ContentPlayer;
