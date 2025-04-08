import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DownloadSettings from './DownloadSettings';
import '../App.css';

const DownloadManager = () => {
  const [activeDownloads, setActiveDownloads] = useState([]);
  const [completedDownloads, setCompletedDownloads] = useState([]);
  const [queuedDownloads, setQueuedDownloads] = useState([]);
  const [downloadHistory, setDownloadHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('active');
  const [totalStorage, setTotalStorage] = useState({ used: 0, total: 50 }); // GB
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [downloadSettings, setDownloadSettings] = useState({
    maxConcurrent: 2,
    autoDeleteWatched: false,
    downloadOnWiFiOnly: true,
    downloadQuality: 'HD',
    downloadSchedule: {
      enabled: false,
      startTime: '01:00',
      endTime: '06:00'
    },
    bandwidthLimit: {
      enabled: false,
      limit: 2 // MB/s
    },
    storageLimit: {
      enabled: true,
      limit: 20 // GB
    }
  });
  const [showSettings, setShowSettings] = useState(false);

  // Get the next scheduled time for downloads
  const getNextScheduledTime = (startTime) => {
    const now = new Date();
    const [hours, minutes] = startTime.split(':').map(Number);

    // Create a date object for the scheduled time today
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the scheduled time is already past for today, set it for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    return scheduledTime.toISOString();
  };

  // Save download settings
  const saveSettings = (newSettings) => {
    setDownloadSettings(newSettings);
    localStorage.setItem('downloadSettings', JSON.stringify(newSettings));

    // Show success message
    alert('Download settings saved successfully!');
  };

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

  // Load downloads from localStorage
  useEffect(() => {
    const loadDownloads = () => {
      try {
        // Load active downloads
        const savedActive = localStorage.getItem('activeDownloads');
        if (savedActive) {
          setActiveDownloads(JSON.parse(savedActive));
        }

        // Load completed downloads
        const savedCompleted = localStorage.getItem('completedDownloads');
        if (savedCompleted) {
          setCompletedDownloads(JSON.parse(savedCompleted));
        }

        // Load queued downloads
        const savedQueued = localStorage.getItem('queuedDownloads');
        if (savedQueued) {
          setQueuedDownloads(JSON.parse(savedQueued));
        }

        // Load download history
        const savedHistory = localStorage.getItem('downloadHistory');
        if (savedHistory) {
          setDownloadHistory(JSON.parse(savedHistory));
        }

        // Load download settings
        const savedSettings = localStorage.getItem('downloadSettings');
        if (savedSettings) {
          setDownloadSettings(JSON.parse(savedSettings));
        }

        // Calculate storage usage
        calculateStorageUsage();
      } catch (error) {
        console.error('Error loading downloads:', error);
      }
    };

    loadDownloads();

    // Simulate download progress for active downloads
    const progressInterval = setInterval(() => {
      updateDownloadProgress();
    }, 1000);

    return () => {
      clearInterval(progressInterval);
    };
  }, []);

  // Calculate storage usage
  const calculateStorageUsage = () => {
    // In a real implementation, this would query the actual storage usage
    // For now, we'll use mock data
    const mockUsed = completedDownloads.reduce((total, download) => {
      return total + download.size;
    }, 0);

    setTotalStorage({
      used: mockUsed,
      total: 50 // 50 GB total storage
    });
  };

  // Update download progress for active downloads
  const updateDownloadProgress = () => {
    if (activeDownloads.length === 0) return;

    const updatedDownloads = activeDownloads.map(download => {
      // Simulate progress increase
      let newProgress = download.progress + (Math.random() * 5);

      // If download is complete, move it to completed downloads
      if (newProgress >= 100) {
        newProgress = 100;

        // Add to completed downloads
        const completedDownload = {
          ...download,
          progress: 100,
          status: 'completed',
          completedAt: new Date().toISOString()
        };

        setCompletedDownloads(prev => [completedDownload, ...prev]);

        // Add to history
        const historyEntry = {
          id: download.id,
          title: download.title,
          posterUrl: download.posterUrl,
          size: download.size,
          downloadedAt: new Date().toISOString(),
          status: 'completed'
        };

        setDownloadHistory(prev => [historyEntry, ...prev]);

        // Start next download from queue if available
        if (queuedDownloads.length > 0) {
          const nextDownload = queuedDownloads[0];
          const updatedNextDownload = {
            ...nextDownload,
            status: 'downloading',
            progress: 0,
            startedAt: new Date().toISOString()
          };

          setActiveDownloads(prev => [...prev.filter(d => d.id !== download.id), updatedNextDownload]);
          setQueuedDownloads(prev => prev.slice(1));
        } else {
          setActiveDownloads(prev => prev.filter(d => d.id !== download.id));
        }

        // Update storage usage
        calculateStorageUsage();

        return null;
      }

      return {
        ...download,
        progress: newProgress,
        downloadedSize: (newProgress / 100) * download.size
      };
    }).filter(Boolean);

    setActiveDownloads(updatedDownloads);

    // Save to localStorage
    localStorage.setItem('activeDownloads', JSON.stringify(updatedDownloads));
    localStorage.setItem('completedDownloads', JSON.stringify(completedDownloads));
    localStorage.setItem('queuedDownloads', JSON.stringify(queuedDownloads));
    localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory));
  };

  // Add a new download
  const addDownload = (movie) => {
    const newDownload = {
      id: movie.id || movie.imdbID,
      title: movie.title || movie.Title,
      posterUrl: movie.posterUrl || movie.Poster,
      size: Math.random() * 4 + 1, // Random size between 1-5 GB
      progress: 0,
      downloadedSize: 0,
      status: 'queued',
      quality: downloadSettings.downloadQuality,
      addedAt: new Date().toISOString(),
      priority: 'normal', // 'low', 'normal', 'high'
      bandwidth: downloadSettings.bandwidthLimit.enabled ? downloadSettings.bandwidthLimit.limit : 0, // 0 means unlimited
      resumable: true,
      metadata: {
        genres: movie.genres || [],
        year: movie.year || movie.Year,
        director: movie.director,
        actors: movie.actors || []
      }
    };

    // Check if download should be scheduled for off-peak hours
    if (downloadSettings.downloadSchedule.enabled) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

      const startTime = downloadSettings.downloadSchedule.startTime;
      const endTime = downloadSettings.downloadSchedule.endTime;

      // Check if current time is within the scheduled download window
      if (currentTime >= startTime && currentTime <= endTime) {
        // Start download now if within window
        if (activeDownloads.length < downloadSettings.maxConcurrent && isOnline) {
          newDownload.status = 'downloading';
          newDownload.startedAt = new Date().toISOString();
          setActiveDownloads(prev => [...prev, newDownload]);
        } else {
          // Add to queue
          setQueuedDownloads(prev => [...prev, newDownload]);
        }
      } else {
        // Schedule for later
        newDownload.status = 'scheduled';
        newDownload.scheduledFor = getNextScheduledTime(startTime);
        setQueuedDownloads(prev => [...prev, newDownload]);
      }
    } else {
      // Normal download logic (not scheduled)
      // Check if we can start the download immediately
      if (activeDownloads.length < downloadSettings.maxConcurrent && isOnline) {
        newDownload.status = 'downloading';
        newDownload.startedAt = new Date().toISOString();
        setActiveDownloads(prev => [...prev, newDownload]);
      } else {
        // Add to queue
        setQueuedDownloads(prev => [...prev, newDownload]);
      }
    }

    // Check storage limits
    if (downloadSettings.storageLimit.enabled) {
      const totalDownloadSize = [...activeDownloads, ...completedDownloads, ...queuedDownloads, newDownload]
        .reduce((total, download) => total + download.size, 0);

      if (totalDownloadSize > downloadSettings.storageLimit.limit) {
        // Show warning
        alert(`Warning: Adding this download will exceed your storage limit of ${downloadSettings.storageLimit.limit} GB.`);
      }
    }

    // Add to history
    const historyEntry = {
      id: newDownload.id,
      title: newDownload.title,
      posterUrl: newDownload.posterUrl,
      size: newDownload.size,
      addedAt: new Date().toISOString(),
      status: newDownload.status
    };

    setDownloadHistory(prev => [historyEntry, ...prev]);

    // Save to localStorage
    localStorage.setItem('activeDownloads', JSON.stringify(activeDownloads));
    localStorage.setItem('queuedDownloads', JSON.stringify(queuedDownloads));
    localStorage.setItem('downloadHistory', JSON.stringify([historyEntry, ...downloadHistory]));
  };

  // Pause a download
  const pauseDownload = (downloadId) => {
    const updatedDownloads = activeDownloads.map(download => {
      if (download.id === downloadId) {
        return {
          ...download,
          status: 'paused'
        };
      }
      return download;
    });

    setActiveDownloads(updatedDownloads);

    // Update history
    const historyEntry = {
      id: downloadId,
      title: activeDownloads.find(d => d.id === downloadId).title,
      posterUrl: activeDownloads.find(d => d.id === downloadId).posterUrl,
      pausedAt: new Date().toISOString(),
      status: 'paused'
    };

    setDownloadHistory(prev => [historyEntry, ...prev]);

    // Save to localStorage
    localStorage.setItem('activeDownloads', JSON.stringify(updatedDownloads));
    localStorage.setItem('downloadHistory', JSON.stringify([historyEntry, ...downloadHistory]));
  };

  // Resume a download
  const resumeDownload = (downloadId) => {
    const updatedDownloads = activeDownloads.map(download => {
      if (download.id === downloadId) {
        return {
          ...download,
          status: 'downloading'
        };
      }
      return download;
    });

    setActiveDownloads(updatedDownloads);

    // Update history
    const historyEntry = {
      id: downloadId,
      title: activeDownloads.find(d => d.id === downloadId).title,
      posterUrl: activeDownloads.find(d => d.id === downloadId).posterUrl,
      resumedAt: new Date().toISOString(),
      status: 'downloading'
    };

    setDownloadHistory(prev => [historyEntry, ...prev]);

    // Save to localStorage
    localStorage.setItem('activeDownloads', JSON.stringify(updatedDownloads));
    localStorage.setItem('downloadHistory', JSON.stringify([historyEntry, ...downloadHistory]));
  };

  // Cancel a download
  const cancelDownload = (downloadId, type) => {
    if (type === 'active') {
      setActiveDownloads(prev => prev.filter(d => d.id !== downloadId));

      // Start next download from queue if available
      if (queuedDownloads.length > 0) {
        const nextDownload = queuedDownloads[0];
        const updatedNextDownload = {
          ...nextDownload,
          status: 'downloading',
          progress: 0,
          startedAt: new Date().toISOString()
        };

        setActiveDownloads(prev => [...prev, updatedNextDownload]);
        setQueuedDownloads(prev => prev.slice(1));
      }
    } else if (type === 'queued') {
      setQueuedDownloads(prev => prev.filter(d => d.id !== downloadId));
    }

    // Update history
    const download = type === 'active'
      ? activeDownloads.find(d => d.id === downloadId)
      : queuedDownloads.find(d => d.id === downloadId);

    const historyEntry = {
      id: downloadId,
      title: download.title,
      posterUrl: download.posterUrl,
      cancelledAt: new Date().toISOString(),
      status: 'cancelled'
    };

    setDownloadHistory(prev => [historyEntry, ...prev]);

    // Save to localStorage
    localStorage.setItem('activeDownloads', JSON.stringify(activeDownloads));
    localStorage.setItem('queuedDownloads', JSON.stringify(queuedDownloads));
    localStorage.setItem('downloadHistory', JSON.stringify([historyEntry, ...downloadHistory]));
  };

  // Delete a completed download
  const deleteDownload = (downloadId) => {
    setCompletedDownloads(prev => prev.filter(d => d.id !== downloadId));

    // Update history
    const download = completedDownloads.find(d => d.id === downloadId);

    const historyEntry = {
      id: downloadId,
      title: download.title,
      posterUrl: download.posterUrl,
      deletedAt: new Date().toISOString(),
      status: 'deleted'
    };

    setDownloadHistory(prev => [historyEntry, ...prev]);

    // Update storage usage
    calculateStorageUsage();

    // Save to localStorage
    localStorage.setItem('completedDownloads', JSON.stringify(completedDownloads.filter(d => d.id !== downloadId)));
    localStorage.setItem('downloadHistory', JSON.stringify([historyEntry, ...downloadHistory]));
  };

  // Update download settings
  const updateSettings = (newSettings) => {
    setDownloadSettings(newSettings);
    localStorage.setItem('downloadSettings', JSON.stringify(newSettings));
  };

  // Format file size
  const formatFileSize = (sizeInGB) => {
    if (sizeInGB < 0.1) {
      return `${Math.round(sizeInGB * 1000)} MB`;
    }
    return `${sizeInGB.toFixed(1)} GB`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Calculate time remaining
  const calculateTimeRemaining = (download) => {
    const downloadSpeed = 2 + Math.random() * 3; // Random speed between 2-5 MB/s
    const remainingSize = download.size - download.downloadedSize;
    const remainingSeconds = (remainingSize * 1024) / downloadSpeed;

    if (remainingSeconds < 60) {
      return 'Less than a minute';
    } else if (remainingSeconds < 3600) {
      return `${Math.round(remainingSeconds / 60)} minutes`;
    } else {
      const hours = Math.floor(remainingSeconds / 3600);
      const minutes = Math.round((remainingSeconds % 3600) / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="content-container download-manager-container">
      <div className="content-header">
        <h1>Download Manager</h1>
        <Link to="/preferences" className="back-btn">← Back to Preferences</Link>
      </div>

      <div className="download-status-bar">
        <div className="online-status">
          <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
          <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        <div className="storage-status">
          <div className="storage-bar">
            <div
              className="storage-used"
              style={{ width: `${(totalStorage.used / totalStorage.total) * 100}%` }}
            ></div>
          </div>
          <div className="storage-text">
            {formatFileSize(totalStorage.used)} of {formatFileSize(totalStorage.total)} used
          </div>
        </div>

        <button
          className="settings-toggle-btn"
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? 'Hide Settings' : 'Show Settings'}
        </button>
      </div>

      {showSettings && (
        <div className="download-settings">
          <h2>Download Settings</h2>

          <div className="settings-grid">
            <div className="setting-item">
              <label htmlFor="maxConcurrent">Maximum Concurrent Downloads</label>
              <select
                id="maxConcurrent"
                value={downloadSettings.maxConcurrent}
                onChange={(e) => updateSettings({
                  ...downloadSettings,
                  maxConcurrent: parseInt(e.target.value)
                })}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="5">5</option>
              </select>
            </div>

            <div className="setting-item">
              <label htmlFor="downloadQuality">Download Quality</label>
              <select
                id="downloadQuality"
                value={downloadSettings.downloadQuality}
                onChange={(e) => updateSettings({
                  ...downloadSettings,
                  downloadQuality: e.target.value
                })}
              >
                <option value="SD">SD (Standard Definition)</option>
                <option value="HD">HD (High Definition)</option>
                <option value="4K">4K (Ultra High Definition)</option>
              </select>
            </div>

            <div className="setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={downloadSettings.downloadOnWiFiOnly}
                  onChange={(e) => updateSettings({
                    ...downloadSettings,
                    downloadOnWiFiOnly: e.target.checked
                  })}
                />
                Download on Wi-Fi only
              </label>
            </div>

            <div className="setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={downloadSettings.autoDeleteWatched}
                  onChange={(e) => updateSettings({
                    ...downloadSettings,
                    autoDeleteWatched: e.target.checked
                  })}
                />
                Auto-delete after watching
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="download-tabs">
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active Downloads ({activeDownloads.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'queued' ? 'active' : ''}`}
          onClick={() => setActiveTab('queued')}
        >
          Queue ({queuedDownloads.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({completedDownloads.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {/* Active Downloads Tab */}
      {activeTab === 'active' && (
        <div className="downloads-list">
          {activeDownloads.length === 0 ? (
            <div className="empty-list">
              <p>No active downloads</p>
            </div>
          ) : (
            activeDownloads.map(download => (
              <div key={download.id} className="download-item">
                <div className="download-poster">
                  <img src={download.posterUrl} alt={download.title} />
                </div>

                <div className="download-info">
                  <h3>{download.title}</h3>
                  <div className="download-meta">
                    <span className="download-quality">{download.quality}</span>
                    <span className="download-size">{formatFileSize(download.size)}</span>
                  </div>

                  <div className="download-progress-container">
                    <div className="download-progress-bar">
                      <div
                        className="download-progress-fill"
                        style={{ width: `${download.progress}%` }}
                      ></div>
                    </div>
                    <div className="download-progress-text">
                      {download.progress.toFixed(0)}% • {formatFileSize(download.downloadedSize)} of {formatFileSize(download.size)}
                    </div>
                  </div>

                  <div className="download-status-info">
                    <span className="download-speed">2.5 MB/s</span>
                    <span className="download-time-remaining">
                      {download.status === 'downloading' ? calculateTimeRemaining(download) : 'Paused'}
                    </span>
                  </div>
                </div>

                <div className="download-actions">
                  {download.status === 'downloading' ? (
                    <button
                      className="download-action-btn pause-btn"
                      onClick={() => pauseDownload(download.id)}
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      className="download-action-btn resume-btn"
                      onClick={() => resumeDownload(download.id)}
                      disabled={!isOnline}
                    >
                      Resume
                    </button>
                  )}

                  <button
                    className="download-action-btn cancel-btn"
                    onClick={() => cancelDownload(download.id, 'active')}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Queued Downloads Tab */}
      {activeTab === 'queued' && (
        <div className="downloads-list">
          {queuedDownloads.length === 0 ? (
            <div className="empty-list">
              <p>No queued downloads</p>
            </div>
          ) : (
            queuedDownloads.map((download, index) => (
              <div key={download.id} className="download-item">
                <div className="download-poster">
                  <img src={download.posterUrl} alt={download.title} />
                  <div className="queue-position">{index + 1}</div>
                </div>

                <div className="download-info">
                  <h3>{download.title}</h3>
                  <div className="download-meta">
                    <span className="download-quality">{download.quality}</span>
                    <span className="download-size">{formatFileSize(download.size)}</span>
                  </div>

                  <div className="download-status-info">
                    <span className="download-status">Queued</span>
                    <span className="download-added-at">Added: {formatDate(download.addedAt)}</span>
                  </div>
                </div>

                <div className="download-actions">
                  <button
                    className="download-action-btn cancel-btn"
                    onClick={() => cancelDownload(download.id, 'queued')}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Completed Downloads Tab */}
      {activeTab === 'completed' && (
        <div className="downloads-list">
          {completedDownloads.length === 0 ? (
            <div className="empty-list">
              <p>No completed downloads</p>
            </div>
          ) : (
            completedDownloads.map(download => (
              <div key={download.id} className="download-item">
                <div className="download-poster">
                  <img src={download.posterUrl} alt={download.title} />
                </div>

                <div className="download-info">
                  <h3>{download.title}</h3>
                  <div className="download-meta">
                    <span className="download-quality">{download.quality}</span>
                    <span className="download-size">{formatFileSize(download.size)}</span>
                  </div>

                  <div className="download-status-info">
                    <span className="download-status">Completed</span>
                    <span className="download-completed-at">
                      Completed: {formatDate(download.completedAt)}
                    </span>
                  </div>
                </div>

                <div className="download-actions">
                  <Link
                    to={`/play/${download.id}`}
                    className="download-action-btn play-btn"
                  >
                    Play
                  </Link>

                  <button
                    className="download-action-btn delete-btn"
                    onClick={() => deleteDownload(download.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="download-history">
          {downloadHistory.length === 0 ? (
            <div className="empty-list">
              <p>No download history</p>
            </div>
          ) : (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Movie</th>
                  <th>Action</th>
                  <th>Date</th>
                  <th>Size</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {downloadHistory.map((entry, index) => (
                  <tr key={`${entry.id}-${index}`}>
                    <td className="history-movie">
                      <img src={entry.posterUrl} alt={entry.title} className="history-poster" />
                      <span>{entry.title}</span>
                    </td>
                    <td>
                      {entry.addedAt && 'Added'}
                      {entry.startedAt && 'Started'}
                      {entry.pausedAt && 'Paused'}
                      {entry.resumedAt && 'Resumed'}
                      {entry.completedAt && 'Completed'}
                      {entry.cancelledAt && 'Cancelled'}
                      {entry.deletedAt && 'Deleted'}
                    </td>
                    <td>
                      {formatDate(
                        entry.addedAt ||
                        entry.startedAt ||
                        entry.pausedAt ||
                        entry.resumedAt ||
                        entry.completedAt ||
                        entry.cancelledAt ||
                        entry.deletedAt
                      )}
                    </td>
                    <td>{entry.size ? formatFileSize(entry.size) : '-'}</td>
                    <td>
                      <span className={`status-badge ${entry.status}`}>
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default DownloadManager;
