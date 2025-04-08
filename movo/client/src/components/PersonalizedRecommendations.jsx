import React, { useState, useEffect } from 'react';
import Recommendations from './Recommendations';
import recommendationService from '../services/recommendationService';
import '../App.css';

const PersonalizedRecommendations = ({ contentType = "movies" }) => {
  const [favoriteGenres, setFavoriteGenres] = useState([]);
  const [becauseYouWatched, setBecauseYouWatched] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingHistory, setViewingHistory] = useState([]);

  useEffect(() => {
    // Get user's viewing history and preferences
    const fetchUserData = () => {
      try {
        // Get viewing history from localStorage
        const continueWatching = localStorage.getItem('continueWatching');
        let history = continueWatching ? JSON.parse(continueWatching) : [];

        // Filter history based on content type
        history = history.filter(item => {
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

        setViewingHistory(history);

        // Get favorite genres
        const { sortedGenres } = recommendationService.getFavoriteGenres();
        setFavoriteGenres(sortedGenres.slice(0, 3)); // Top 3 genres

        // Get "Because You Watched" recommendations
        const becauseYouWatchedSections = recommendationService.getBecauseYouWatchedRecommendations(2);
        setBecauseYouWatched(becauseYouWatchedSections.map(section => section.baseMovie));

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [contentType]);

  if (loading) {
    return <div className="loading"><h2>Personalizing your experience...</h2></div>;
  }

  // If user has no viewing history, just show general recommendations
  if (viewingHistory.length === 0) {
    return (
      <div className="personalized-recommendations">
        <Recommendations type="general" />
        <Recommendations type="trending" />
      </div>
    );
  }

  return (
    <div className="personalized-recommendations">
      {/* General personalized recommendations */}
      <Recommendations type="general" contentType={contentType} />

      {/* Trending recommendations */}
      <Recommendations type="trending" contentType={contentType} />

      {/* Because You Watched sections */}
      {becauseYouWatched.map((movie, index) => (
        <Recommendations
          key={`because-${movie.imdbID || movie.id}-${index}`}
          type="becauseYouWatched"
          basedOn={movie}
          contentType={contentType}
        />
      ))}

      {/* Genre-based recommendations */}
      {favoriteGenres.map((genre, index) => (
        <Recommendations
          key={`genre-${genre}-${index}`}
          type="genre"
          basedOn={genre}
          contentType={contentType}
        />
      ))}
    </div>
  );
};

export default PersonalizedRecommendations;
