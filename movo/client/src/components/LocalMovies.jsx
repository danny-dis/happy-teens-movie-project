import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../App.css";
import MovieCard from "./MovieCard";
import ContinueWatching from "./ContinueWatching";
import PersonalizedRecommendations from "./PersonalizedRecommendations";

const LocalMovies = ({ isOnline, currentProfile, contentType = "movies" }) => {
  const [localMovies, setLocalMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Get content type title
  const getContentTypeTitle = () => {
    switch (contentType) {
      case "tv":
        return "TV Shows";
      case "documentaries":
        return "Documentaries";
      case "music":
        return "Music";
      default:
        return "Movies";
    }
  };

  useEffect(() => {
    // Fetch local content from the server or use mock data for now
    const fetchLocalContent = async () => {
      try {
        // In a real implementation, this would be an API call based on contentType
        // const response = await fetch(`http://localhost:5000/api/local-${contentType}`);
        // const data = await response.json();

        // For now, use mock data based on content type
        let mockContent = [];

        if (contentType === "movies") {
          mockContent = [
            {
              id: 1,
              title: "The Avengers",
              year: "2012",
              category: "Action",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
              introStart: 0,
              introEnd: 120, // 2 minutes intro
              outroStart: 7200, // 2 hours into the movie
              downloaded: true
            },
            {
              id: 2,
              title: "Inception",
              year: "2010",
              category: "Sci-Fi",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
              introStart: 0,
              introEnd: 90, // 1.5 minutes intro
              outroStart: 8400, // 2 hours 20 minutes into the movie
              downloaded: true
            },
            {
              id: 3,
              title: "The Dark Knight",
              year: "2008",
              category: "Action",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg",
              introStart: 0,
              introEnd: 60, // 1 minute intro
              outroStart: 7800, // 2 hours 10 minutes into the movie
              downloaded: true
            },
            {
              id: 4,
              title: "Toy Story",
              year: "1995",
              category: "Animation",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BMDU2ZWJlMjktMTRhMy00ZTA5LWEzNDgtYmNmZTEwZTViZWJkXkEyXkFqcGdeQXVyNDQ2OTk4MzI@._V1_SX300.jpg",
              introStart: 0,
              introEnd: 30, // 30 seconds intro
              outroStart: 4800, // 1 hour 20 minutes into the movie
              downloaded: true
            },
            {
              id: 5,
              title: "The Shawshank Redemption",
              year: "1994",
              category: "Drama",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
              introStart: 0,
              introEnd: 150, // 2.5 minutes intro
              outroStart: 8100, // 2 hours 15 minutes into the movie
              downloaded: true
            }
          ];
        } else if (contentType === "tv") {
          mockContent = [
            {
              id: 101,
              title: "Stranger Things",
              year: "2016",
              category: "Sci-Fi",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BN2ZmYjg1YmItNWQ4OC00YWM0LWE0ZDktYThjOTZiZjhhN2Q2XkEyXkFqcGdeQXVyNjgxNTQ3Mjk@._V1_SX300.jpg",
              seasons: 4,
              episodes: 34,
              introStart: 0,
              introEnd: 60,
              downloaded: true
            },
            {
              id: 102,
              title: "Breaking Bad",
              year: "2008",
              category: "Drama",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BMjhiMzgxZTctNDc1Ni00OTIxLTlhMTYtZTA3ZWFkODRkNmE2XkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
              seasons: 5,
              episodes: 62,
              introStart: 0,
              introEnd: 45,
              downloaded: true
            },
            {
              id: 103,
              title: "Game of Thrones",
              year: "2011",
              category: "Fantasy",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BYTRiNDQwYzAtMzVlZS00NTI5LWJjYjUtMzkwNTUzMWMxZTllXkEyXkFqcGdeQXVyNDIzMzcwNjc@._V1_SX300.jpg",
              seasons: 8,
              episodes: 73,
              introStart: 0,
              introEnd: 120,
              downloaded: true
            }
          ];
        } else if (contentType === "documentaries") {
          mockContent = [
            {
              id: 201,
              title: "Planet Earth",
              year: "2006",
              category: "Nature",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BNmZlYzIzMTItY2EzYS00YTEyLTg0ZjEtMDMzZjM3ODdhN2UzXkEyXkFqcGdeQXVyNjI0MDg2NzE@._V1_SX300.jpg",
              episodes: 11,
              introStart: 0,
              introEnd: 90,
              downloaded: true
            },
            {
              id: 202,
              title: "The Social Dilemma",
              year: "2020",
              category: "Technology",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BNzY5ODI1ODEtOTVmMS00ZTA5LTk2ZTEtNjdhYjZhMDA5ZTRhXkEyXkFqcGdeQXVyMTA2OTQ3MTUy._V1_SX300.jpg",
              introStart: 0,
              introEnd: 60,
              downloaded: true
            },
            {
              id: 203,
              title: "Free Solo",
              year: "2018",
              category: "Sports",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BMjMwYjcwNWQtNTQ5YS00MzVlLTkxYzMtNDIwZWIxZTE4Zjg2XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg",
              introStart: 0,
              introEnd: 45,
              downloaded: true
            }
          ];
        } else if (contentType === "music") {
          mockContent = [
            {
              id: 301,
              title: "Queen - Live at Wembley",
              year: "1986",
              category: "Rock",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BNDRkMTNiYjItZWRhNy00NTY1LWJhNzUtOGMxNjU1NjQwYWVhXkEyXkFqcGdeQXVyMjQ0NzcxNjM@._V1_SX300.jpg",
              duration: 120,
              downloaded: true
            },
            {
              id: 302,
              title: "Michael Jackson - Thriller",
              year: "1983",
              category: "Pop",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BODk5NjA0MDc0MF5BMl5BanBnXkFtZTgwMDk0OTI2MDE@._V1_SX300.jpg",
              duration: 14,
              downloaded: true
            },
            {
              id: 303,
              title: "Daft Punk - Random Access Memories",
              year: "2013",
              category: "Electronic",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BMjA1NDE1MjM1NV5BMl5BanBnXkFtZTgwODkzMzI0MDE@._V1_SX300.jpg",
              duration: 74,
              downloaded: true
            }
          ];
        }

        setLocalMovies(mockContent);

        // Extract unique categories
        const uniqueCategories = ["All", ...new Set(mockContent.map(item => item.category))];
        setCategories(uniqueCategories);

        setLoading(false);
      } catch (error) {
        console.error(`Error fetching local ${contentType}:`, error);
        setLoading(false);
      }
    };

    fetchLocalContent();
  }, [contentType]);

  // Filter movies by selected category
  const filteredMovies = selectedCategory === "All"
    ? localMovies
    : localMovies.filter(movie => movie.category === selectedCategory);

  return (
    <div className="content-container local-container">
      <div className="content-header">
        <h1>My {getContentTypeTitle()}</h1>
        <div className="library-actions">
          <div className="category-selector">
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <Link to="/collections" className="collections-link">My Collections</Link>
        </div>
      </div>

      {/* Continue Watching section */}
      <ContinueWatching contentType={contentType} />

      {/* Personalized Recommendations */}
      <PersonalizedRecommendations contentType={contentType} />

      <div className="library-section">
        <h2 className="section-title">All {getContentTypeTitle()}</h2>
        {loading ? (
          <div className="loading">
            <h2>Loading your library...</h2>
          </div>
        ) : filteredMovies.length > 0 ? (
          <div className="movies-grid">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} isLocal={true} />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h2>No local {contentType} found</h2>
            <p>Add {contentType} to your library to see them here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalMovies;
