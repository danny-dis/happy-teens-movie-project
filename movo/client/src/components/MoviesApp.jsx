import "../App.css";
import { useState, useEffect } from "react";
import searchIcon from "../search.svg";
import MovieCard from "./MovieCard";
import Recommendations from "./Recommendations";
import ContinueWatching from "./ContinueWatching";
import PersonalizedRecommendations from "./PersonalizedRecommendations";

// OMDB API key
const API_URL = "http://www.omdbapi.com/?apikey=d856c93";

const MoviesApp = ({ currentProfile, isOnline = true, chimeraMode = false }) => {
  const [movies, setMovies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [localMovies, setLocalMovies] = useState([]);
  const [showingLocalContent, setShowingLocalContent] = useState(!isOnline && chimeraMode);

  // Popular genres for the filter
  const popularGenres = ['All', 'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Adventure'];

  // Load local movies for Chimera Mode
  useEffect(() => {
    if (chimeraMode) {
      const fetchLocalMovies = async () => {
        try {
          // In a real implementation, this would be an API call
          // For now, use mock data
          const mockMovies = [
            {
              id: 1,
              title: "The Avengers",
              year: "2012",
              category: "Action",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
              introStart: 0,
              introEnd: 120,
              outroStart: 7200,
              downloaded: true,
              genres: ["Action", "Adventure", "Sci-Fi"]
            },
            {
              id: 2,
              title: "Inception",
              year: "2010",
              category: "Sci-Fi",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
              introStart: 0,
              introEnd: 90,
              outroStart: 8400,
              downloaded: true,
              genres: ["Action", "Adventure", "Sci-Fi"]
            },
            {
              id: 3,
              title: "The Dark Knight",
              year: "2008",
              category: "Action",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg",
              introStart: 0,
              introEnd: 60,
              outroStart: 7800,
              downloaded: true,
              genres: ["Action", "Crime", "Drama"]
            },
            {
              id: 4,
              title: "Toy Story",
              year: "1995",
              category: "Animation",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BMDU2ZWJlMjktMTRhMy00ZTA5LWEzNDgtYmNmZTEwZTViZWJkXkEyXkFqcGdeQXVyNDQ2OTk4MzI@._V1_SX300.jpg",
              introStart: 0,
              introEnd: 30,
              outroStart: 4800,
              downloaded: true,
              genres: ["Animation", "Adventure", "Comedy"]
            },
            {
              id: 5,
              title: "The Shawshank Redemption",
              year: "1994",
              category: "Drama",
              posterUrl: "https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
              introStart: 0,
              introEnd: 150,
              outroStart: 8100,
              downloaded: true,
              genres: ["Drama"]
            }
          ];

          setLocalMovies(mockMovies);

          // Extract unique genres from local movies
          const allGenres = mockMovies.flatMap(movie => movie.genres || []);
          const uniqueGenres = [...new Set(allGenres)];
          setGenres(['All', ...uniqueGenres]);

          // If offline in Chimera Mode, use local movies as the main content
          if (!isOnline) {
            setMovies(mockMovies);
            setShowingLocalContent(true);
            setLoading(false);
          }
        } catch (error) {
          console.error("Error fetching local movies:", error);
          setLoading(false);
        }
      };

      fetchLocalMovies();
    }
  }, [chimeraMode, isOnline]);

  const searchMovies = async (title) => {
    setLoading(true);

    // If offline in Chimera Mode, search local movies instead
    if (!isOnline && chimeraMode) {
      const results = localMovies.filter(movie =>
        movie.title.toLowerCase().includes(title.toLowerCase())
      );
      setMovies(results);
      setShowingLocalContent(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}&s=${title}`);
      const data = await response.json();

      if (data.Search) {
        // Get more details for each movie to get genre information
        const moviesWithDetails = await Promise.all(
          data.Search.map(async (movie) => {
            const detailResponse = await fetch(`${API_URL}&i=${movie.imdbID}`);
            const detailData = await detailResponse.json();
            return { ...movie, genres: detailData.Genre ? detailData.Genre.split(', ') : [] };
          })
        );

        setMovies(moviesWithDetails);
        setShowingLocalContent(false);

        // Extract all genres from the movies
        const allGenres = moviesWithDetails.flatMap(movie => movie.genres);
        const uniqueGenres = [...new Set(allGenres)];
        setGenres(['All', ...uniqueGenres]);
      } else {
        setMovies([]);
      }
    } catch (error) {
      console.error('Error searching movies:', error);

      // If search fails and in Chimera Mode, fall back to local content
      if (chimeraMode) {
        const results = localMovies.filter(movie =>
          movie.title.toLowerCase().includes(title.toLowerCase())
        );
        setMovies(results);
        setShowingLocalContent(true);
      } else {
        setMovies([]);
      }
    }
    setLoading(false);
  };

  // Filter movies by genre
  const filteredMovies = selectedGenre === 'All'
    ? movies
    : movies.filter(movie => {
        if (showingLocalContent) {
          return movie.genres && movie.genres.includes(selectedGenre);
        } else {
          return movie.genres && movie.genres.includes(selectedGenre);
        }
      });

  useEffect(() => {
    // If online or in Chimera Mode with online, start with popular movies
    if (isOnline) {
      searchMovies("Avengers");
    }
    // If offline and not in Chimera Mode, the component won't render due to the route guard
  }, [isOnline]);

  return (
    <div className="content-container streaming-container">
      <div className="content-header">
        <h1>{showingLocalContent ? "My Library" : "Discover Movies"}</h1>

        <div className="search">
          <input
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchMovies(searchTerm)}
          />
          <button className="search-button" onClick={() => searchMovies(searchTerm)}>
            <img src={searchIcon} alt="search" />
          </button>
        </div>
      </div>

      {/* Show Chimera Mode indicator if active */}
      {chimeraMode && !isOnline && (
        <div className="chimera-mode-indicator">
          <span className="chimera-icon">🔄</span> Chimera Mode Active - Showing Downloaded Content
        </div>
      )}

      {/* Continue Watching section (always show in Chimera Mode) */}
      {(chimeraMode || !searchTerm) && <ContinueWatching />}

      {/* Personalized Recommendations (show in Chimera Mode or when online) */}
      {(chimeraMode || (!searchTerm && isOnline)) && <PersonalizedRecommendations />}

      {/* Trending recommendations (only when online and not searching) */}
      {!searchTerm && isOnline && <Recommendations type="trending" />}

      <div className="search-results-section">
        {searchTerm && <h2 className="section-title">Search Results</h2>}
        {!searchTerm && showingLocalContent && <h2 className="section-title">All Movies</h2>}

        <div className="genre-filter">
          {genres.map(genre => (
            <button
              key={genre}
              className={`genre-btn ${selectedGenre === genre ? 'active' : ''}`}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading">
            <h2>Loading movies...</h2>
          </div>
        ) : filteredMovies?.length > 0 ? (
          <div className="movies-grid">
            {filteredMovies.map((movie, index) => (
              <MovieCard
                key={movie.id || `${movie.imdbID}-${index}`}
                movie={movie}
                isLocal={showingLocalContent}
              />
            ))}
          </div>
        ) : (
          <div className="empty">
            <h2>No movies found</h2>
            <p>Try searching for something else</p>
          </div>
        )}
      </div>

      {/* General recommendations (only when online and not searching) */}
      {!searchTerm && isOnline && <Recommendations type="general" />}
    </div>
  );
};

export default MoviesApp;
