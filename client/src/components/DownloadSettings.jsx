import React, { useState } from 'react';
import '../App.css';

const DownloadSettings = ({ settings, onSave, onCancel }) => {
  const [formValues, setFormValues] = useState({...settings});
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormValues(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: newValue
        }
      }));
    } else {
      setFormValues(prev => ({
        ...prev,
        [name]: newValue
      }));
    }
  };
  
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value);
    
    if (!isNaN(numValue)) {
      // Handle nested properties
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setFormValues(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: numValue
          }
        }));
      } else {
        setFormValues(prev => ({
          ...prev,
          [name]: numValue
        }));
      }
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formValues);
  };
  
  return (
    <div className="download-settings">
      <h2>Download Settings</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="settings-section">
          <h3>General Settings</h3>
          
          <div className="setting-item">
            <label htmlFor="maxConcurrent">Maximum Concurrent Downloads:</label>
            <input 
              type="number" 
              id="maxConcurrent" 
              name="maxConcurrent" 
              min="1" 
              max="10" 
              value={formValues.maxConcurrent} 
              onChange={handleNumberChange} 
            />
            <p className="setting-description">
              Limit the number of downloads that can run at the same time
            </p>
          </div>
          
          <div className="setting-item">
            <label htmlFor="downloadQuality">Download Quality:</label>
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
            <p className="setting-description">
              Default quality for new downloads
            </p>
          </div>
          
          <div className="setting-item checkbox-item">
            <input 
              type="checkbox" 
              id="autoDeleteWatched" 
              name="autoDeleteWatched" 
              checked={formValues.autoDeleteWatched} 
              onChange={handleChange} 
            />
            <label htmlFor="autoDeleteWatched">Auto-delete after watching</label>
            <p className="setting-description">
              Automatically delete movies after you've watched them to save space
            </p>
          </div>
          
          <div className="setting-item checkbox-item">
            <input 
              type="checkbox" 
              id="downloadOnWiFiOnly" 
              name="downloadOnWiFiOnly" 
              checked={formValues.downloadOnWiFiOnly} 
              onChange={handleChange} 
            />
            <label htmlFor="downloadOnWiFiOnly">Download on Wi-Fi only</label>
            <p className="setting-description">
              Only download content when connected to Wi-Fi to save mobile data
            </p>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Scheduled Downloads</h3>
          
          <div className="setting-item checkbox-item">
            <input 
              type="checkbox" 
              id="downloadSchedule.enabled" 
              name="downloadSchedule.enabled" 
              checked={formValues.downloadSchedule.enabled} 
              onChange={handleChange} 
            />
            <label htmlFor="downloadSchedule.enabled">Enable scheduled downloads</label>
            <p className="setting-description">
              Schedule downloads for specific times (e.g., overnight)
            </p>
          </div>
          
          {formValues.downloadSchedule.enabled && (
            <div className="schedule-times">
              <div className="setting-item">
                <label htmlFor="downloadSchedule.startTime">Start Time:</label>
                <input 
                  type="time" 
                  id="downloadSchedule.startTime" 
                  name="downloadSchedule.startTime" 
                  value={formValues.downloadSchedule.startTime} 
                  onChange={handleChange} 
                />
              </div>
              
              <div className="setting-item">
                <label htmlFor="downloadSchedule.endTime">End Time:</label>
                <input 
                  type="time" 
                  id="downloadSchedule.endTime" 
                  name="downloadSchedule.endTime" 
                  value={formValues.downloadSchedule.endTime} 
                  onChange={handleChange} 
                />
              </div>
              
              <p className="setting-description">
                Downloads will only start during this time window
              </p>
            </div>
          )}
        </div>
        
        <div className="settings-section">
          <h3>Bandwidth Management</h3>
          
          <div className="setting-item checkbox-item">
            <input 
              type="checkbox" 
              id="bandwidthLimit.enabled" 
              name="bandwidthLimit.enabled" 
              checked={formValues.bandwidthLimit.enabled} 
              onChange={handleChange} 
            />
            <label htmlFor="bandwidthLimit.enabled">Limit download speed</label>
            <p className="setting-description">
              Restrict the bandwidth used for downloads
            </p>
          </div>
          
          {formValues.bandwidthLimit.enabled && (
            <div className="setting-item">
              <label htmlFor="bandwidthLimit.limit">Speed Limit (MB/s):</label>
              <input 
                type="number" 
                id="bandwidthLimit.limit" 
                name="bandwidthLimit.limit" 
                min="0.1" 
                max="100" 
                step="0.1" 
                value={formValues.bandwidthLimit.limit} 
                onChange={handleNumberChange} 
              />
              <p className="setting-description">
                Maximum download speed in megabytes per second
              </p>
            </div>
          )}
        </div>
        
        <div className="settings-section">
          <h3>Storage Management</h3>
          
          <div className="setting-item checkbox-item">
            <input 
              type="checkbox" 
              id="storageLimit.enabled" 
              name="storageLimit.enabled" 
              checked={formValues.storageLimit.enabled} 
              onChange={handleChange} 
            />
            <label htmlFor="storageLimit.enabled">Limit storage usage</label>
            <p className="setting-description">
              Set a maximum amount of storage space for downloads
            </p>
          </div>
          
          {formValues.storageLimit.enabled && (
            <div className="setting-item">
              <label htmlFor="storageLimit.limit">Storage Limit (GB):</label>
              <input 
                type="number" 
                id="storageLimit.limit" 
                name="storageLimit.limit" 
                min="1" 
                max="1000" 
                value={formValues.storageLimit.limit} 
                onChange={handleNumberChange} 
              />
              <p className="setting-description">
                Maximum storage space in gigabytes
              </p>
            </div>
          )}
        </div>
        
        <div className="settings-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="save-btn">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default DownloadSettings;
