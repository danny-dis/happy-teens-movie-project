import React from 'react';
import { useTheme, THEMES } from '../context/ThemeContext';

/**
 * ThemeToggle - Component for switching between light and dark themes
 * 
 * @author zophlic
 */
const ThemeToggle = ({ variant = 'icon', className = '' }) => {
  const { themePreference, activeTheme, setTheme, isTransitioning } = useTheme();
  
  // Handle theme change
  const handleThemeChange = (event) => {
    setTheme(event.target.value);
  };
  
  // Icon-only variant
  if (variant === 'icon') {
    return (
      <button 
        className={`theme-toggle-icon ${className} ${isTransitioning ? 'transitioning' : ''}`}
        onClick={() => setTheme(activeTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK)}
        aria-label={`Switch to ${activeTheme === THEMES.DARK ? 'light' : 'dark'} theme`}
      >
        {activeTheme === THEMES.DARK ? (
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />
          </svg>
        )}
        
        <style jsx>{`
          .theme-toggle-icon {
            background: none;
            border: none;
            color: currentColor;
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s ease, transform 0.3s ease;
          }
          
          .theme-toggle-icon:hover {
            background-color: rgba(255, 255, 255, 0.1);
          }
          
          .theme-toggle-icon.transitioning {
            transform: rotate(180deg);
          }
        `}</style>
      </button>
    );
  }
  
  // Switch variant
  if (variant === 'switch') {
    return (
      <div className={`theme-toggle-switch ${className}`}>
        <label className="switch">
          <input
            type="checkbox"
            checked={activeTheme === THEMES.DARK}
            onChange={() => setTheme(activeTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK)}
          />
          <span className="slider"></span>
          <span className="icon light">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
            </svg>
          </span>
          <span className="icon dark">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />
            </svg>
          </span>
        </label>
        
        <style jsx>{`
          .theme-toggle-switch {
            display: inline-block;
          }
          
          .switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 30px;
          }
          
          .switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }
          
          .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #34495e;
            transition: 0.4s;
            border-radius: 30px;
          }
          
          .slider:before {
            position: absolute;
            content: "";
            height: 22px;
            width: 22px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: 0.4s;
            border-radius: 50%;
          }
          
          input:checked + .slider {
            background-color: #2c3e50;
          }
          
          input:checked + .slider:before {
            transform: translateX(30px);
          }
          
          .icon {
            position: absolute;
            top: 7px;
            color: white;
            transition: opacity 0.2s ease;
          }
          
          .icon.light {
            left: 8px;
            opacity: 0.7;
          }
          
          .icon.dark {
            right: 8px;
            opacity: 0.7;
          }
          
          input:checked ~ .icon.light {
            opacity: 0.3;
          }
          
          input:checked ~ .icon.dark {
            opacity: 1;
          }
          
          input:not(:checked) ~ .icon.light {
            opacity: 1;
          }
          
          input:not(:checked) ~ .icon.dark {
            opacity: 0.3;
          }
        `}</style>
      </div>
    );
  }
  
  // Select variant (default)
  return (
    <div className={`theme-toggle-select ${className}`}>
      <select 
        value={themePreference}
        onChange={handleThemeChange}
        className="theme-select"
        aria-label="Select theme"
      >
        <option value={THEMES.SYSTEM}>System</option>
        <option value={THEMES.LIGHT}>Light</option>
        <option value={THEMES.DARK}>Dark</option>
      </select>
      
      <div className="theme-icon">
        {activeTheme === THEMES.DARK ? (
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
          </svg>
        )}
      </div>
      
      <style jsx>{`
        .theme-toggle-select {
          position: relative;
          display: inline-block;
        }
        
        .theme-select {
          appearance: none;
          background-color: #2c3e50;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 32px 8px 12px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .theme-select:hover {
          background-color: #34495e;
        }
        
        .theme-select:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.5);
        }
        
        .theme-icon {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: #3498db;
        }
      `}</style>
    </div>
  );
};

export default ThemeToggle;
