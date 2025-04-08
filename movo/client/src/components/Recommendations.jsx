import React, { useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import recommendationService from '../services/recommendationService';
import '../App.css';

const Recommendations = ({ type = 'general', basedOn = null, contentType = 'movies' }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = () => {
      try {
        // Simulate API delay
        setTimeout(() => {
          let results = [];

          // Different recommendation types
          if (type === 'general') {
            results = recommendationService.getPersonalizedRecommendations(5, contentType);
          } else if (type === 'similar' && basedOn) {
            results = recommendationService.getSimilarMovies(basedOn, 5, contentType);
          } else if (type === 'trending') {
            results = recommendationService.getTrendingMovies(5, contentType);
          } else if (type === 'genre' && basedOn) {
            results = recommendationService.getMoviesByGenre(basedOn, 5, contentType);
          } else if (type === 'becauseYouWatched' && basedOn) {
            results = recommendationService.getSimilarMovies(basedOn, 5, contentType);
          }

          setRecommendations(results);
          setLoading(false);
        }, 500); // Reduced delay for better UX
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [type, basedOn, contentType]);

  if (loading) {
    return <div className="loading"><h2>Loading recommendations...</h2></div>;
  }

  if (recommendations.length === 0) {
    return null; // Don't show the section if there are no recommendations
  }

  // Generate section title based on type and content type
  let sectionTitle = "Recommended for You";
  let contentTypeLabel = "";

  // Add content type label
  if (contentType === "tv") {
    contentTypeLabel = "Shows";
  } else if (contentType === "documentaries") {
    contentTypeLabel = "Documentaries";
  } else if (contentType === "music") {
    contentTypeLabel = "Music";
  }

  if (type === 'similar' && basedOn) {
    sectionTitle = `Because You Watched ${basedOn.title || basedOn.Title}`;
  } else if (type === 'trending') {
    sectionTitle = `Trending ${contentTypeLabel || "Now"}`;
  } else if (type === 'genre' && basedOn) {
    sectionTitle = `Popular ${contentTypeLabel || "Movies"} in ${basedOn}`;
  } else if (type === 'becauseYouWatched' && basedOn) {
    sectionTitle = `Because You Watched ${basedOn.title || basedOn.Title}`;
  } else if (type === 'general') {
    sectionTitle = `Recommended ${contentTypeLabel || "Movies"} for You`;
  }

  return (
    <div className="recommendations-section">
      <h2 className="section-title">{sectionTitle}</h2>

      <div className="recommendations-grid">
        {recommendations.map((movie) => (
          <MovieCard
            key={movie.imdbID}
            movie={movie}
            isLocal={false}
          />
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
