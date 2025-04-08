import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import './zophlic.css';

const UserPreferences = ({ preferences, updatePreferences }) => {
  const [formValues, setFormValues] = useState(preferences);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormValues(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updatePreferences(formValues);
    // Show success message
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.textContent = 'Preferences saved successfully!';
    document.querySelector('.preferences-container').appendChild(successMessage);

    setTimeout(() => {
      successMessage.remove();
    }, 3000);
  };

  return (
    <div className="content-container preferences-container">
      <div className="content-header">
        <h1>User Preferences</h1>
        <Link to="/local" className="back-btn">← Back to Library</Link>
      </div>

      <form className="preferences-form" onSubmit={handleSubmit}>
        <div className="preferences-section chimera-mode-section">
          <h2>Chimera Mode</h2>

          <div className="preference-item chimera-toggle">
            <div className="chimera-mode-header">
              <label htmlFor="chimeraMode">
                <input
                  type="checkbox"
                  id="chimeraMode"
                  name="chimeraMode"
                  checked={formValues.chimeraMode}
                  onChange={handleChange}
                />
                Enable Chimera Mode
              </label>
              <div className="chimera-badge">New</div>
            </div>
            <p className="preference-description">
              Chimera Mode provides a seamless streaming-like experience even when offline.
              Your downloaded content will automatically populate the streaming interface,
              giving you a consistent experience whether you're online or offline.
              When enabled, the app will intelligently switch between online streaming and
              local content, ensuring you always have the best viewing experience possible.
              <span className="zophlic-signature">Designed by zophlic</span>
            </p>
          </div>
        </div>

        <div className="preferences-section">
          <h2>Playback Settings</h2>

          <div className="preference-item">
            <label htmlFor="autoSkipIntro">
              <input
                type="checkbox"
                id="autoSkipIntro"
                name="autoSkipIntro"
                checked={formValues.autoSkipIntro}
                onChange={handleChange}
              />
              Auto-skip intros
            </label>
            <p className="preference-description">Automatically skip intro sequences when watching movies</p>
          </div>

          <div className="preference-item">
            <label htmlFor="autoSkipOutro">
              <input
                type="checkbox"
                id="autoSkipOutro"
                name="autoSkipOutro"
                checked={formValues.autoSkipOutro}
                onChange={handleChange}
              />
              Auto-skip outros
            </label>
            <p className="preference-description">Automatically skip end credits when watching movies</p>
          </div>

          <div className="preference-item">
            <label htmlFor="defaultVolume">Default Volume: {formValues.defaultVolume * 100}%</label>
            <input
              type="range"
              id="defaultVolume"
              name="defaultVolume"
              min="0"
              max="1"
              step="0.1"
              value={formValues.defaultVolume}
              onChange={handleChange}
            />
          </div>

          <div className="preference-item">
            <label htmlFor="subtitlesEnabled">
              <input
                type="checkbox"
                id="subtitlesEnabled"
                name="subtitlesEnabled"
                checked={formValues.subtitlesEnabled}
                onChange={handleChange}
              />
              Enable subtitles by default
            </label>
          </div>
        </div>

        <div className="preferences-section">
          <h2>Appearance</h2>

          <div className="preference-item">
            <label htmlFor="darkMode">
              <input
                type="checkbox"
                id="darkMode"
                name="darkMode"
                checked={formValues.darkMode}
                onChange={handleChange}
              />
              Dark Mode
            </label>
            <p className="preference-description">Use dark theme throughout the application</p>
          </div>
        </div>

        <div className="preferences-section">
          <h2>Download Settings</h2>

          <div className="preference-item">
            <label htmlFor="downloadQuality">Download Quality</label>
            <select
              id="downloadQuality"
              name="downloadQuality"
              value={formValues.downloadQuality}
              onChange={handleChange}
            >
              <option value="SD">SD (Standard Definition)</option>
              <option value="HD">HD (High Definition)</option>
              <option value="4K">4K (Ultra High Definition)</option>
            </select>
            <p className="preference-description">Quality setting for downloading movie content</p>
          </div>
        </div>

        <button type="submit" className="save-preferences-btn">Save Preferences</button>
      </form>

      <div className="preferences-additional-links">
        <h2>Additional Features</h2>
        <div className="additional-links-grid">
          <Link to="/analytics" className="feature-link">
            <div className="feature-icon">📊</div>
            <div className="feature-info">
              <h3>Analytics Dashboard</h3>
              <p>View your watching statistics and trends</p>
            </div>
          </Link>

          <Link to="/downloads" className="feature-link">
            <div className="feature-icon">💾</div>
            <div className="feature-info">
              <h3>Download Manager</h3>
              <p>Manage your downloaded content</p>
            </div>
          </Link>

          <Link to="/p2p-settings" className="feature-link">
            <div className="feature-icon">🔗</div>
            <div className="feature-info">
              <h3>P2P Sharing Settings</h3>
              <p>Configure peer-to-peer streaming options</p>
            </div>
          </Link>

          <Link to="/profiles" className="feature-link">
            <div className="feature-icon">👤</div>
            <div className="feature-info">
              <h3>Manage Profiles</h3>
              <p>Create and edit user profiles</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserPreferences;
