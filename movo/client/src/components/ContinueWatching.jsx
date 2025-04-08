import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const ContinueWatching = ({ contentType = "movies" }) => {
  const [continueWatchingItems, setContinueWatchingItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch from an API
    // For now, we'll use localStorage to simulate the continue watching feature
    const fetchContinueWatching = () => {
      try {
        const savedItems = localStorage.getItem('continueWatching');
        let parsedItems = [];

        if (savedItems) {
          parsedItems = JSON.parse(savedItems);
        } else {
          // Mock data if nothing in localStorage
          parsedItems = [
            {
              id: 1,
              title: "The Avengers",
              year: "2012",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
              progress: 35, // percentage watched
              currentTime: 2520, // seconds
              duration: 7200, // seconds
              isLocal: true,
              lastWatched: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            },
            {
              id: 3,
              title: "The Dark Knight",
              year: "2008",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg",
              progress: 65,
              currentTime: 5070,
              duration: 7800,
              isLocal: true,
              lastWatched: new Date(Date.now() - 172800000).toISOString() // 2 days ago
            },
            {
              imdbID: "tt1375666",
              Title: "Inception",
              Year: "2010",
              Poster: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
              progress: 15,
              currentTime: 1260,
              duration: 8400,
              isLocal: false,
              lastWatched: new Date(Date.now() - 259200000).toISOString() // 3 days ago
            }
          ];
          localStorage.setItem('continueWatching', JSON.stringify(parsedItems));
        }

        // Filter items based on content type
        const filteredItems = parsedItems.filter(item => {
          if (contentType === "movies") {
            return !item.hasOwnProperty('seasons') && !item.hasOwnProperty('episodes') && item.category !== "Documentary" && !item.hasOwnProperty('duration');
          } else if (contentType === "tv") {
            return item.hasOwnProperty('seasons') || (item.hasOwnProperty('episodes') && item.category !== "Documentary");
          } else if (contentType === "documentaries") {
            return item.category === "Documentary" || item.category === "Nature" || item.category === "Technology" || item.category === "Sports";
          } else if (contentType === "music") {
            return item.hasOwnProperty('duration') && (item.category === "Rock" || item.category === "Pop" || item.category === "Electronic");
          }
          return true; // Default case
        });

        setContinueWatchingItems(filteredItems);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching continue watching items:", error);
        setLoading(false);
      }
    };

    fetchContinueWatching();
  }, [contentType]);

  // Remove item from continue watching
  const removeItem = (index) => {
    const updatedItems = [...continueWatchingItems];
    updatedItems.splice(index, 1);
    setContinueWatchingItems(updatedItems);
    localStorage.setItem('continueWatching', JSON.stringify(updatedItems));
  };

  // Format time (seconds to HH:MM:SS)
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${hours > 0 ? hours + ':' : ''}${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Format date to relative time (e.g., "2 days ago")
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="loading"><h2>Loading...</h2></div>;
  }

  if (continueWatchingItems.length === 0) {
    return null; // Don't show the section if there's nothing to continue watching
  }

  return (
    <div className="continue-watching-section">
      <h2 className="section-title">Continue Watching {contentType === "tv" ? "Shows" : contentType === "documentaries" ? "Documentaries" : contentType === "music" ? "Music" : "Movies"}</h2>

      <div className="continue-watching-grid">
        {continueWatchingItems.map((item, index) => {
          // Determine if it's a local or streaming item
          const id = item.id || item.imdbID;
          const title = item.title || item.Title;
          const year = item.year || item.Year;
          const posterUrl = item.posterUrl || item.Poster;
          const linkPath = item.isLocal ? `/play/${id}?t=${item.currentTime}` : `/details/${id}?t=${item.currentTime}`;

          return (
            <div key={id} className="continue-watching-item">
              <div className="continue-item-poster">
                <Link to={linkPath}>
                  <img src={posterUrl} alt={title} />
                  <div className="continue-overlay">
                    <button className="play-btn">▶ Resume</button>
                  </div>
                </Link>
                <button
                  className="remove-btn"
                  onClick={() => removeItem(index)}
                  aria-label="Remove from continue watching"
                >
                  ✕
                </button>
              </div>

              <div className="continue-item-info">
                <h3>{title} <span className="continue-year">({year})</span></h3>
                <div className="continue-progress-bar">
                  <div
                    className="continue-progress-filled"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div className="continue-meta">
                  <span className="continue-time">{formatTime(item.currentTime)} / {formatTime(item.duration)}</span>
                  <span className="continue-last-watched">{formatRelativeTime(item.lastWatched)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContinueWatching;
