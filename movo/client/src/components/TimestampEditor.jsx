import React, { useState, useEffect, useRef } from 'react';
import '../App.css';

const TimestampEditor = ({ movie, onSave, onCancel }) => {
  const [introStart, setIntroStart] = useState(movie.introStart || 0);
  const [introEnd, setIntroEnd] = useState(movie.introEnd || 0);
  const [outroStart, setOutroStart] = useState(movie.outroStart || 0);
  const [previewTime, setPreviewTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSection, setCurrentSection] = useState('intro');
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Parse time (MM:SS to seconds)
  const parseTime = (timeString) => {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  // Handle time input change
  const handleTimeChange = (e, setter) => {
    const timeString = e.target.value;
    // Validate time format (MM:SS)
    if (/^\d+:\d{2}$/.test(timeString)) {
      setter(parseTime(timeString));
    }
  };

  // Handle slider change
  const handleSliderChange = (e, setter) => {
    setter(Number(e.target.value));
  };

  // Jump to specific time in video
  const jumpToTime = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setPreviewTime(time);
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle video time update
  useEffect(() => {
    const handleTimeUpdate = () => {
      if (videoRef.current) {
        setPreviewTime(videoRef.current.currentTime);
      }
    };

    if (videoRef.current) {
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
      videoRef.current.addEventListener('play', () => setIsPlaying(true));
      videoRef.current.addEventListener('pause', () => setIsPlaying(false));
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        videoRef.current.removeEventListener('play', () => setIsPlaying(true));
        videoRef.current.removeEventListener('pause', () => setIsPlaying(false));
      }
    };
  }, []);

  // Handle save
  const handleSave = () => {
    // Validate timestamps
    if (introEnd <= introStart) {
      alert('Intro end time must be after intro start time');
      return;
    }

    if (outroStart <= introEnd) {
      alert('Outro start time must be after intro end time');
      return;
    }

    onSave({
      introStart,
      introEnd,
      outroStart
    });
  };

  // Handle click on progress bar
  const handleProgressBarClick = (e) => {
    if (progressBarRef.current && videoRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const newTime = clickPosition * videoRef.current.duration;
      jumpToTime(newTime);
    }
  };

  // Detect scene changes (simplified version - in a real app, this would use ML)
  const detectScenes = () => {
    // Simulate scene detection with random timestamps
    const duration = videoRef.current?.duration || 7200;
    
    // For demo purposes, set intro to first 2-3% of the video
    const detectedIntroEnd = Math.floor(duration * (Math.random() * 0.01 + 0.02));
    
    // Set outro to last 5-10% of the video
    const detectedOutroStart = Math.floor(duration * (Math.random() * 0.05 + 0.85));
    
    setIntroStart(0);
    setIntroEnd(detectedIntroEnd);
    setOutroStart(detectedOutroStart);
    
    // Show notification
    const notification = document.createElement('div');
    notification.className = 'success-message';
    notification.textContent = 'Scene detection completed!';
    document.querySelector('.timestamp-editor').appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  return (
    <div className="timestamp-editor">
      <h2>Edit Timestamps</h2>
      
      <div className="video-preview-container">
        <video
          ref={videoRef}
          className="preview-player"
          src={movie.videoUrl}
          onLoadedMetadata={() => setPreviewTime(currentSection === 'intro' ? introStart : outroStart)}
        />
        
        <div className="preview-controls">
          <button className="control-btn" onClick={togglePlay}>
            {isPlaying ? '❚❚' : '▶'}
          </button>
          
          <div 
            className="preview-progress-bar" 
            ref={progressBarRef}
            onClick={handleProgressBarClick}
          >
            <div
              className="progress-filled"
              style={{ width: `${(previewTime / (videoRef.current?.duration || 1)) * 100}%` }}
            />
            {/* Markers for intro and outro */}
            <div 
              className="timestamp-marker intro-start-marker" 
              style={{ left: `${(introStart / (videoRef.current?.duration || 1)) * 100}%` }}
              title="Intro Start"
            />
            <div 
              className="timestamp-marker intro-end-marker" 
              style={{ left: `${(introEnd / (videoRef.current?.duration || 1)) * 100}%` }}
              title="Intro End"
            />
            <div 
              className="timestamp-marker outro-start-marker" 
              style={{ left: `${(outroStart / (videoRef.current?.duration || 1)) * 100}%` }}
              title="Outro Start"
            />
          </div>
          
          <div className="time-display">
            {formatTime(previewTime)} / {formatTime(videoRef.current?.duration || 0)}
          </div>
        </div>
      </div>
      
      <div className="timestamp-tabs">
        <button 
          className={`timestamp-tab ${currentSection === 'intro' ? 'active' : ''}`}
          onClick={() => {
            setCurrentSection('intro');
            jumpToTime(introStart);
          }}
        >
          Intro
        </button>
        <button 
          className={`timestamp-tab ${currentSection === 'outro' ? 'active' : ''}`}
          onClick={() => {
            setCurrentSection('outro');
            jumpToTime(outroStart);
          }}
        >
          Outro
        </button>
      </div>
      
      {currentSection === 'intro' ? (
        <div className="timestamp-section">
          <h3>Intro Settings</h3>
          
          <div className="timestamp-control">
            <label>Intro Start:</label>
            <input 
              type="text" 
              value={formatTime(introStart)}
              onChange={(e) => handleTimeChange(e, setIntroStart)}
            />
            <input
              type="range"
              min="0"
              max={videoRef.current?.duration || 7200}
              value={introStart}
              onChange={(e) => handleSliderChange(e, setIntroStart)}
            />
            <button 
              className="timestamp-btn"
              onClick={() => jumpToTime(introStart)}
            >
              Preview
            </button>
          </div>
          
          <div className="timestamp-control">
            <label>Intro End:</label>
            <input 
              type="text" 
              value={formatTime(introEnd)}
              onChange={(e) => handleTimeChange(e, setIntroEnd)}
            />
            <input
              type="range"
              min="0"
              max={videoRef.current?.duration || 7200}
              value={introEnd}
              onChange={(e) => handleSliderChange(e, setIntroEnd)}
            />
            <button 
              className="timestamp-btn"
              onClick={() => jumpToTime(introEnd)}
            >
              Preview
            </button>
          </div>
        </div>
      ) : (
        <div className="timestamp-section">
          <h3>Outro Settings</h3>
          
          <div className="timestamp-control">
            <label>Outro Start:</label>
            <input 
              type="text" 
              value={formatTime(outroStart)}
              onChange={(e) => handleTimeChange(e, setOutroStart)}
            />
            <input
              type="range"
              min="0"
              max={videoRef.current?.duration || 7200}
              value={outroStart}
              onChange={(e) => handleSliderChange(e, setOutroStart)}
            />
            <button 
              className="timestamp-btn"
              onClick={() => jumpToTime(outroStart)}
            >
              Preview
            </button>
          </div>
        </div>
      )}
      
      <div className="auto-detect-section">
        <button 
          className="auto-detect-btn"
          onClick={detectScenes}
        >
          Auto-Detect Scenes
        </button>
        <p className="auto-detect-info">
          Uses AI to automatically detect intro and outro sequences
        </p>
      </div>
      
      <div className="timestamp-actions">
        <button className="cancel-btn" onClick={onCancel}>Cancel</button>
        <button className="save-btn" onClick={handleSave}>Save Timestamps</button>
      </div>
    </div>
  );
};

export default TimestampEditor;
