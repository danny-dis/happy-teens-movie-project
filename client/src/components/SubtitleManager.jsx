import React, { useState, useEffect } from 'react';
import '../App.css';

const SubtitleManager = ({ videoRef, movieId, preferences }) => {
  const [subtitles, setSubtitles] = useState([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [subtitleText, setSubtitleText] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [subtitleStyle, setSubtitleStyle] = useState({
    fontSize: '16px',
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    fontFamily: 'Arial',
    textShadow: '1px 1px 1px #000'
  });

  // Available subtitle languages (mock data)
  const availableSubtitles = [
    { id: 1, language: 'English', code: 'en', url: '/subtitles/movie1_en.vtt' },
    { id: 2, language: 'Spanish', code: 'es', url: '/subtitles/movie1_es.vtt' },
    { id: 3, language: 'French', code: 'fr', url: '/subtitles/movie1_fr.vtt' },
    { id: 4, language: 'German', code: 'de', url: '/subtitles/movie1_de.vtt' },
    { id: 5, language: 'Chinese', code: 'zh', url: '/subtitles/movie1_zh.vtt' }
  ];

  // Mock subtitle data (in a real app, this would be loaded from a VTT file)
  const mockSubtitles = [
    { start: 5, end: 8, text: 'Hello, welcome to our movie.' },
    { start: 10, end: 15, text: 'This is a sample subtitle text.' },
    { start: 18, end: 22, text: 'Subtitles can be in multiple languages.' },
    { start: 25, end: 30, text: 'You can customize the appearance of subtitles.' },
    { start: 35, end: 40, text: 'Subtitles help make content accessible to everyone.' },
    { start: 45, end: 50, text: 'Thanks for watching our demo!' }
  ];

  // Load available subtitles for the movie
  useEffect(() => {
    // In a real implementation, this would fetch from an API
    // For now, we'll use the mock data
    setSubtitles(availableSubtitles);
    
    // Auto-select subtitle based on preferences
    if (preferences && preferences.subtitlesEnabled) {
      const preferredLanguage = preferences.subtitleLanguage || 'en';
      const defaultSubtitle = availableSubtitles.find(sub => sub.code === preferredLanguage);
      if (defaultSubtitle) {
        setSelectedSubtitle(defaultSubtitle);
      }
    }
  }, [movieId, preferences]);

  // Handle subtitle display based on video time
  useEffect(() => {
    if (!videoRef.current || !selectedSubtitle) return;
    
    const handleTimeUpdate = () => {
      const currentTime = videoRef.current.currentTime;
      
      // In a real implementation, this would parse the VTT file
      // For now, we'll use the mock data
      const currentSubtitle = mockSubtitles.find(
        sub => currentTime >= sub.start && currentTime <= sub.end
      );
      
      setSubtitleText(currentSubtitle ? currentSubtitle.text : '');
    };
    
    videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
      }
    };
  }, [videoRef, selectedSubtitle]);

  // Change subtitle language
  const changeSubtitle = (subtitle) => {
    setSelectedSubtitle(subtitle);
    
    // In a real implementation, this would load the VTT file
    // For now, we'll just update the selected subtitle
    
    // Close the settings panel
    setShowSettings(false);
  };

  // Turn off subtitles
  const turnOffSubtitles = () => {
    setSelectedSubtitle(null);
    setSubtitleText('');
    setShowSettings(false);
  };

  // Update subtitle style
  const updateStyle = (property, value) => {
    setSubtitleStyle(prev => ({
      ...prev,
      [property]: value
    }));
  };

  return (
    <>
      {/* Subtitle display */}
      {selectedSubtitle && subtitleText && (
        <div 
          className="subtitle-container"
          style={{
            fontSize: subtitleStyle.fontSize,
            color: subtitleStyle.color,
            backgroundColor: subtitleStyle.backgroundColor,
            fontFamily: subtitleStyle.fontFamily,
            textShadow: subtitleStyle.textShadow
          }}
        >
          {subtitleText}
        </div>
      )}
      
      {/* Subtitle button */}
      <button 
        className="subtitle-btn"
        onClick={() => setShowSettings(!showSettings)}
        title={selectedSubtitle ? `Subtitles: ${selectedSubtitle.language}` : 'Subtitles Off'}
      >
        {selectedSubtitle ? 'CC' : 'CC'}
      </button>
      
      {/* Subtitle settings panel */}
      {showSettings && (
        <div className="subtitle-settings">
          <h3>Subtitles</h3>
          
          <div className="subtitle-languages">
            <button 
              className={`subtitle-language-btn ${!selectedSubtitle ? 'active' : ''}`}
              onClick={turnOffSubtitles}
            >
              Off
            </button>
            
            {subtitles.map(subtitle => (
              <button 
                key={subtitle.id}
                className={`subtitle-language-btn ${selectedSubtitle && selectedSubtitle.id === subtitle.id ? 'active' : ''}`}
                onClick={() => changeSubtitle(subtitle)}
              >
                {subtitle.language}
              </button>
            ))}
          </div>
          
          {selectedSubtitle && (
            <div className="subtitle-customization">
              <h4>Customize</h4>
              
              <div className="subtitle-option">
                <label>Font Size</label>
                <select 
                  value={subtitleStyle.fontSize}
                  onChange={(e) => updateStyle('fontSize', e.target.value)}
                >
                  <option value="12px">Small</option>
                  <option value="16px">Medium</option>
                  <option value="20px">Large</option>
                  <option value="24px">Extra Large</option>
                </select>
              </div>
              
              <div className="subtitle-option">
                <label>Font Color</label>
                <select 
                  value={subtitleStyle.color}
                  onChange={(e) => updateStyle('color', e.target.value)}
                >
                  <option value="#ffffff">White</option>
                  <option value="#ffff00">Yellow</option>
                  <option value="#00ff00">Green</option>
                  <option value="#ff0000">Red</option>
                </select>
              </div>
              
              <div className="subtitle-option">
                <label>Background</label>
                <select 
                  value={subtitleStyle.backgroundColor}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                >
                  <option value="rgba(0, 0, 0, 0)">Transparent</option>
                  <option value="rgba(0, 0, 0, 0.5)">Semi-transparent</option>
                  <option value="rgba(0, 0, 0, 0.8)">Dark</option>
                  <option value="#000000">Black</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SubtitleManager;
