import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import p2pService from '../services/p2pService';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import '../App.css';

const P2PSettings = () => {
  const [p2pEnabled, setP2PEnabled] = useState(false);
  const [uploadLimit, setUploadLimit] = useState(1024); // KB/s
  const [downloadLimit, setDownloadLimit] = useState(0); // 0 = unlimited
  const [maxConnections, setMaxConnections] = useState(50);
  const [sharingStats, setSharingStats] = useState({
    peers: 0,
    upload: { totalUploaded: 0, uploadSpeed: 0, peakUploadSpeed: 0, averageUploadSpeed: 0 },
    download: { totalDownloaded: 0, downloadSpeed: 0, peakDownloadSpeed: 0, averageDownloadSpeed: 0 },
    torrents: { seeding: 0, downloading: 0, total: 0 },
    networkMetrics: { healthScore: 0, averageLatency: 0, connectionSuccessRate: 1.0, peerAvailability: 0 }
  });
  const [activeTorrents, setActiveTorrents] = useState({ seeding: [], downloading: [] });
  const [speedHistory, setSpeedHistory] = useState([]);
  const [peerLocations, setPeerLocations] = useState([]);
  const [contentDistribution, setContentDistribution] = useState([]);
  const [healthMetrics, setHealthMetrics] = useState([]);
  const speedHistoryRef = useRef([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [networkType, setNetworkType] = useState('unknown');
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState('');

  // Load settings from localStorage
  useEffect(() => {
    const loadSettings = () => {
      const settings = JSON.parse(localStorage.getItem('p2pSettings') || '{}');
      setP2PEnabled(settings.enabled || false);
      setUploadLimit(settings.uploadLimit || 1024);
      setDownloadLimit(settings.downloadLimit || 0);
      setMaxConnections(settings.maxConnections || 50);
    };

    loadSettings();
    detectNetworkType();
  }, []);

  // Initialize P2P service when enabled
  useEffect(() => {
    if (p2pEnabled && !p2pService.initialized) {
      initializeP2PService();
    }
  }, [p2pEnabled]);

  // Update stats periodically with enhanced data collection
  useEffect(() => {
    let statsInterval;

    if (p2pEnabled && p2pService.initialized) {
      // Update immediately
      updateStats();

      // Then set up interval for regular updates
      statsInterval = setInterval(() => {
        updateStats();
      }, 1000); // More frequent updates for smoother UI
    }

    return () => {
      if (statsInterval) {
        clearInterval(statsInterval);
      }
    };
  }, [p2pEnabled]);

  // Initialize P2P service with enhanced features
  const initializeP2PService = async () => {
    setIsInitializing(true);
    setError('');

    try {
      await p2pService.initialize();

      // Set up event listeners for real-time updates
      p2pService.addEventListener('onPeerConnect', handlePeerConnect);
      p2pService.addEventListener('onPeerDisconnect', handlePeerDisconnect);
      p2pService.addEventListener('onNetworkQualityChange', handleNetworkQualityChange);
      p2pService.addEventListener('onSecurityEvent', handleSecurityEvent);

      updateStats();
      setIsInitializing(false);
    } catch (err) {
      console.error('Failed to initialize P2P service:', err);
      setError('Failed to initialize P2P service. Please check your browser settings and try again.');
      setP2PEnabled(false);
      setIsInitializing(false);
    }
  };

  // Handle peer connect event
  const handlePeerConnect = (data) => {
    // Update peer locations (simulated)
    setPeerLocations(prev => {
      // Generate a random location for demonstration
      const locations = [
        { country: 'United States', code: 'US', lat: 37.09, lng: -95.71 },
        { country: 'United Kingdom', code: 'GB', lat: 55.38, lng: -3.44 },
        { country: 'Germany', code: 'DE', lat: 51.17, lng: 10.45 },
        { country: 'France', code: 'FR', lat: 46.23, lng: 2.21 },
        { country: 'Japan', code: 'JP', lat: 36.20, lng: 138.25 },
        { country: 'Australia', code: 'AU', lat: -25.27, lng: 133.78 },
        { country: 'Canada', code: 'CA', lat: 56.13, lng: -106.35 },
        { country: 'Brazil', code: 'BR', lat: -14.24, lng: -51.93 }
      ];

      const randomLocation = locations[Math.floor(Math.random() * locations.length)];

      // Add new peer with location
      return [...prev, {
        id: data.peerId,
        country: randomLocation.country,
        countryCode: randomLocation.code,
        lat: randomLocation.lat,
        lng: randomLocation.lng,
        torrentId: data.torrentId,
        clientVersion: data.clientVersion || 'Unknown'
      }];
    });
  };

  // Handle peer disconnect event
  const handlePeerDisconnect = (data) => {
    // Remove peer from locations
    setPeerLocations(prev => prev.filter(peer => peer.id !== data.peerId));
  };

  // Handle network quality change event
  const handleNetworkQualityChange = (data) => {
    // Update network type if available
    if (data.connectionType) {
      setNetworkType(data.connectionType);
    }

    // Update health metrics
    setHealthMetrics(prev => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString();

      // Keep only the last 20 data points
      const newMetrics = [...prev, {
        time: timeStr,
        health: data.healthScore || prev[prev.length - 1]?.health || 0,
        peers: data.peers || sharingStats.peers,
        latency: data.latency || sharingStats.networkMetrics?.averageLatency || 0
      }];

      if (newMetrics.length > 20) {
        return newMetrics.slice(newMetrics.length - 20);
      }

      return newMetrics;
    });
  };

  // Handle security events
  const handleSecurityEvent = (data) => {
    // In a real implementation, we would show security alerts to the user
    console.log('Security event:', data);

    if (data.type === 'blocked_peer') {
      setError(`Blocked connection from potentially malicious peer: ${data.peerAddress}`);

      // Clear error after 5 seconds
      setTimeout(() => setError(''), 5000);
    }
  };

  // Update sharing statistics with enhanced metrics
  const updateStats = () => {
    if (p2pService.initialized) {
      // Get basic stats
      const stats = p2pService.getStats();
      setSharingStats(stats);
      setActiveTorrents(p2pService.getActiveTorrents());

      // Update speed history for charts
      const now = new Date();
      const timeStr = now.toLocaleTimeString();

      // Keep a reference to avoid state closure issues
      const newSpeedHistory = [...speedHistoryRef.current, {
        time: timeStr,
        upload: stats.upload.uploadSpeed / 1024, // KB/s
        download: stats.download.downloadSpeed / 1024 // KB/s
      }];

      // Keep only the last 60 data points (1 minute at 1 second intervals)
      if (newSpeedHistory.length > 60) {
        newSpeedHistory.splice(0, newSpeedHistory.length - 60);
      }

      speedHistoryRef.current = newSpeedHistory;
      setSpeedHistory(newSpeedHistory);

      // Update content distribution
      const contentTypes = {
        'movie': 0,
        'series': 0,
        'documentary': 0,
        'other': 0
      };

      // Count content by type
      [...stats.torrents.seeding || [], ...stats.torrents.downloading || []].forEach(torrent => {
        const category = torrent.category || 'other';
        if (contentTypes[category] !== undefined) {
          contentTypes[category]++;
        } else {
          contentTypes.other++;
        }
      });

      // Convert to array for chart
      const distribution = Object.entries(contentTypes).map(([name, value]) => ({
        name,
        value: value || 0
      })).filter(item => item.value > 0);

      setContentDistribution(distribution);
    }
  };

  // Detect network type
  const detectNetworkType = () => {
    if ('connection' in navigator) {
      setNetworkType(navigator.connection.type || 'unknown');

      navigator.connection.addEventListener('change', () => {
        setNetworkType(navigator.connection.type || 'unknown');
      });
    }
  };

  // Save settings
  const saveSettings = () => {
    const settings = {
      enabled: p2pEnabled,
      uploadLimit,
      downloadLimit,
      maxConnections
    };

    localStorage.setItem('p2pSettings', JSON.stringify(settings));

    // Apply settings to P2P service
    if (p2pService.initialized) {
      // In a real implementation, we would apply these settings to the WebTorrent client
      // For now, we'll just log them
      console.log('Applied P2P settings:', settings);
    }
  };

  // Toggle P2P sharing
  const toggleP2P = async () => {
    const newState = !p2pEnabled;
    setP2PEnabled(newState);

    if (newState) {
      if (!p2pService.initialized) {
        await initializeP2PService();
      }
    } else {
      // Stop P2P service
      if (p2pService.initialized) {
        p2pService.destroy();
      }
    }

    saveSettings();
  };

  // Format bytes to human-readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Format speed to human-readable format
  const formatSpeed = (bytesPerSecond) => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  // Stop a torrent
  const stopTorrent = async (infoHash) => {
    try {
      await p2pService.stopTorrent(infoHash);
      updateStats();
    } catch (err) {
      console.error('Failed to stop torrent:', err);
      setError('Failed to stop sharing. Please try again.');
    }
  };

  return (
    <div className="content-container p2p-settings-container">
      <div className="content-header">
        <h1>P2P Sharing Settings</h1>
        <Link to="/preferences" className="back-btn">← Back to Preferences</Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="p2p-status-card">
        <div className="p2p-status-header">
          <h2>Peer-to-Peer Sharing</h2>
          <div className="p2p-toggle-container">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={p2pEnabled}
                onChange={toggleP2P}
                disabled={isInitializing}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className="toggle-label">{p2pEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
        </div>

        <div className="p2p-description">
          <p>
            When enabled, P2P sharing allows you to stream content directly from other users,
            and contribute your downloaded content back to the network. This helps provide
            faster streaming speeds and reduces server load.
          </p>

          <div className="network-status">
            <div className="status-item">
              <span className="status-label">Network Type:</span>
              <span className="status-value">{networkType === 'unknown' ? 'Unknown' : networkType}</span>
            </div>

            <div className="status-item">
              <span className="status-label">Connected Peers:</span>
              <span className="status-value">{sharingStats.peers}</span>
            </div>
          </div>
        </div>
      </div>

      {p2pEnabled && (
        <>
          <div className="p2p-stats-grid">
            <div className="p2p-stat-card">
              <h3>Upload</h3>
              <div className="stat-value">{formatSpeed(sharingStats.upload.uploadSpeed)}</div>
              <div className="stat-label">Current Speed</div>
              <div className="stat-secondary">
                Total: {formatBytes(sharingStats.upload.totalUploaded)}
              </div>
              <div className="stat-tertiary">
                Peak: {formatSpeed(sharingStats.upload.peakUploadSpeed)}
              </div>
            </div>

            <div className="p2p-stat-card">
              <h3>Download</h3>
              <div className="stat-value">{formatSpeed(sharingStats.download.downloadSpeed)}</div>
              <div className="stat-label">Current Speed</div>
              <div className="stat-secondary">
                Total: {formatBytes(sharingStats.download.totalDownloaded)}
              </div>
              <div className="stat-tertiary">
                Peak: {formatSpeed(sharingStats.download.peakDownloadSpeed)}
              </div>
            </div>

            <div className="p2p-stat-card">
              <h3>Sharing</h3>
              <div className="stat-value">{sharingStats.torrents.seeding}</div>
              <div className="stat-label">Files Seeding</div>
              <div className="stat-secondary">
                Downloading: {sharingStats.torrents.downloading}
              </div>
              <div className="stat-tertiary">
                Connected Peers: {sharingStats.peers}
              </div>
            </div>

            <div className="p2p-stat-card">
              <h3>Network Health</h3>
              <div className="stat-value">
                {Math.round((sharingStats.networkMetrics?.healthScore || 0) * 100)}%
              </div>
              <div className="stat-label">Overall Health</div>
              <div className="stat-secondary">
                Latency: {Math.round(sharingStats.networkMetrics?.averageLatency || 0)}ms
              </div>
              <div className="stat-tertiary">
                Success Rate: {Math.round((sharingStats.networkMetrics?.connectionSuccessRate || 0) * 100)}%
              </div>
            </div>
          </div>

          <div className="p2p-charts-container">
            <div className="p2p-chart-card">
              <h3>Speed History</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={speedHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="time" tick={{ fill: '#e5e5e5' }} />
                    <YAxis tick={{ fill: '#e5e5e5' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value) => [`${value.toFixed(2)} KB/s`, null]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="upload"
                      stroke="#e50914"
                      strokeWidth={2}
                      dot={false}
                      name="Upload Speed"
                    />
                    <Line
                      type="monotone"
                      dataKey="download"
                      stroke="#2196f3"
                      strokeWidth={2}
                      dot={false}
                      name="Download Speed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p2p-chart-card">
              <h3>Content Distribution</h3>
              <div className="chart-container">
                {contentDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={contentDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {contentDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={[
                            '#e50914', '#ff9800', '#4caf50', '#2196f3', '#9c27b0'
                          ][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #333' }}
                        labelStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-chart-message">No content being shared</div>
                )}
              </div>
            </div>
          </div>

          <div className="p2p-peers-map">
            <h3>Connected Peers</h3>
            <div className="peers-list">
              {peerLocations.length > 0 ? (
                <div className="peer-locations-grid">
                  {peerLocations.map(peer => (
                    <div key={peer.id} className="peer-location-item">
                      <div className="peer-country">
                        <span className="country-flag">{peer.countryCode}</span>
                        <span className="country-name">{peer.country}</span>
                      </div>
                      <div className="peer-details">
                        <span className="peer-id">{peer.id.substring(0, 8)}...</span>
                        <span className="peer-client">{peer.clientVersion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-peers-message">No peers connected</div>
              )}
            </div>
          </div>

          <div className="p2p-settings-form">
            <h2>Sharing Limits</h2>

            <div className="settings-grid">
              <div className="setting-item">
                <label htmlFor="uploadLimit">Upload Speed Limit</label>
                <div className="slider-with-value">
                  <input
                    type="range"
                    id="uploadLimit"
                    min="128"
                    max="10240"
                    step="128"
                    value={uploadLimit}
                    onChange={(e) => setUploadLimit(parseInt(e.target.value))}
                  />
                  <span className="slider-value">
                    {uploadLimit === 0 ? 'Unlimited' : formatSpeed(uploadLimit * 1024)}
                  </span>
                </div>
              </div>

              <div className="setting-item">
                <label htmlFor="downloadLimit">Download Speed Limit</label>
                <div className="slider-with-value">
                  <input
                    type="range"
                    id="downloadLimit"
                    min="0"
                    max="10240"
                    step="128"
                    value={downloadLimit}
                    onChange={(e) => setDownloadLimit(parseInt(e.target.value))}
                  />
                  <span className="slider-value">
                    {downloadLimit === 0 ? 'Unlimited' : formatSpeed(downloadLimit * 1024)}
                  </span>
                </div>
              </div>

              <div className="setting-item">
                <label htmlFor="maxConnections">Maximum Connections</label>
                <div className="slider-with-value">
                  <input
                    type="range"
                    id="maxConnections"
                    min="10"
                    max="200"
                    step="10"
                    value={maxConnections}
                    onChange={(e) => setMaxConnections(parseInt(e.target.value))}
                  />
                  <span className="slider-value">{maxConnections} peers</span>
                </div>
              </div>
            </div>

            <button
              className="save-settings-btn"
              onClick={saveSettings}
            >
              Save Settings
            </button>

            <button
              className="toggle-advanced-btn"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
            </button>

            {showAdvanced && (
              <div className="advanced-settings">
                <h3>Advanced Settings</h3>

                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => {}}
                    />
                    Only share on Wi-Fi
                  </label>
                  <p className="setting-description">
                    When enabled, P2P sharing will only work when connected to Wi-Fi to save mobile data.
                  </p>
                </div>

                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => {}}
                    />
                    Optimize for battery life
                  </label>
                  <p className="setting-description">
                    When enabled, P2P sharing will be paused when your device is on battery power.
                  </p>
                </div>

                <div className="setting-item checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => {}}
                    />
                    Enable WebRTC encryption
                  </label>
                  <p className="setting-description">
                    When enabled, all P2P connections will be encrypted for better security.
                  </p>
                </div>

                <div className="setting-item">
                  <label htmlFor="sharingDuration">Sharing Duration</label>
                  <select
                    id="sharingDuration"
                    value="forever"
                    onChange={() => {}}
                  >
                    <option value="1day">1 day after download</option>
                    <option value="1week">1 week after download</option>
                    <option value="1month">1 month after download</option>
                    <option value="forever">Forever (until manually stopped)</option>
                  </select>
                  <p className="setting-description">
                    How long to continue sharing content after you've downloaded it.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="active-torrents">
            <h2>Currently Sharing</h2>

            {activeTorrents.seeding.length === 0 && activeTorrents.downloading.length === 0 ? (
              <div className="empty-list">
                <p>You are not currently sharing any content.</p>
              </div>
            ) : (
              <>
                {activeTorrents.seeding.length > 0 && (
                  <div className="torrents-section">
                    <h3>Seeding ({activeTorrents.seeding.length})</h3>

                    <div className="torrents-list">
                      {activeTorrents.seeding.map(torrent => (
                        <div key={torrent.infoHash} className="torrent-item">
                          <div className="torrent-info">
                            <h4>{torrent.name}</h4>
                            <div className="torrent-meta">
                              <span className="torrent-size">{formatBytes(torrent.size)}</span>
                              <span className="torrent-status">Seeding</span>
                            </div>
                          </div>

                          <button
                            className="stop-torrent-btn"
                            onClick={() => stopTorrent(torrent.infoHash)}
                          >
                            Stop Sharing
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTorrents.downloading.length > 0 && (
                  <div className="torrents-section">
                    <h3>Downloading ({activeTorrents.downloading.length})</h3>

                    <div className="torrents-list">
                      {activeTorrents.downloading.map(torrent => (
                        <div key={torrent.infoHash} className="torrent-item">
                          <div className="torrent-info">
                            <h4>{torrent.name}</h4>
                            <div className="torrent-meta">
                              <span className="torrent-size">{formatBytes(torrent.size)}</span>
                              <span className="torrent-status">
                                Downloading ({Math.round(torrent.progress * 100)}%)
                              </span>
                            </div>

                            <div className="torrent-progress-bar">
                              <div
                                className="torrent-progress-fill"
                                style={{ width: `${torrent.progress * 100}%` }}
                              />
                            </div>
                          </div>

                          <button
                            className="stop-torrent-btn"
                            onClick={() => stopTorrent(torrent.infoHash)}
                          >
                            Cancel
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      <div className="p2p-info-section">
        <h2>About P2P Streaming</h2>

        <div className="info-grid">
          <div className="info-card">
            <div className="info-icon">🔒</div>
            <h3>Privacy & Security</h3>
            <p>
              All P2P connections are encrypted. We only share movie data, never your personal information.
              You can control exactly what and when you share.
            </p>
          </div>

          <div className="info-card">
            <div className="info-icon">⚡</div>
            <h3>Better Performance</h3>
            <p>
              P2P streaming can provide faster start times and higher quality video by sourcing content
              from multiple peers simultaneously, especially for popular content.
            </p>
          </div>

          <div className="info-card">
            <div className="info-icon">📱</div>
            <h3>Data Usage</h3>
            <p>
              When enabled, P2P sharing will use your internet connection to help others stream content.
              You can set limits to control how much bandwidth is used.
            </p>
          </div>

          <div className="info-card">
            <div className="info-icon">🌐</div>
            <h3>4K Streaming</h3>
            <p>
              P2P technology allows for high-resolution streaming up to 4K by distributing the bandwidth
              load across multiple peers, reducing buffering and improving quality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default P2PSettings;
