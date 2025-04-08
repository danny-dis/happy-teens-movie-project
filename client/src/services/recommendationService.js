/**
 * Recommendation Service
 * Provides personalized movie recommendations based on user viewing history and preferences
 */

// Mock movie database for recommendations
const movieDatabase = [
  {
    imdbID: "tt0468569",
    Title: "The Dark Knight",
    Year: "2008",
    Poster: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg",
    Type: "movie",
    genres: ["Action", "Crime", "Drama"],
    director: "Christopher Nolan",
    actors: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
    rating: 9.0,
    popularity: 95
  },
  {
    imdbID: "tt0816692",
    Title: "Interstellar",
    Year: "2014",
    Poster: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
    Type: "movie",
    genres: ["Adventure", "Drama", "Sci-Fi"],
    director: "Christopher Nolan",
    actors: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"],
    rating: 8.6,
    popularity: 90
  },
  {
    imdbID: "tt0133093",
    Title: "The Matrix",
    Year: "1999",
    Poster: "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
    Type: "movie",
    genres: ["Action", "Sci-Fi"],
    director: "Lana Wachowski",
    actors: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"],
    rating: 8.7,
    popularity: 92
  },
  {
    imdbID: "tt0109830",
    Title: "Forrest Gump",
    Year: "1994",
    Poster: "https://m.media-amazon.com/images/M/MV5BNWIwODRlZTUtY2U3ZS00Yzg1LWJhNzYtMmZiYmEyNmU1NjMzXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg",
    Type: "movie",
    genres: ["Drama", "Romance"],
    director: "Robert Zemeckis",
    actors: ["Tom Hanks", "Robin Wright", "Gary Sinise"],
    rating: 8.8,
    popularity: 88
  },
  {
    imdbID: "tt0110912",
    Title: "Pulp Fiction",
    Year: "1994",
    Poster: "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
    Type: "movie",
    genres: ["Crime", "Drama"],
    director: "Quentin Tarantino",
    actors: ["John Travolta", "Uma Thurman", "Samuel L. Jackson"],
    rating: 8.9,
    popularity: 91
  },
  {
    imdbID: "tt0137523",
    Title: "Fight Club",
    Year: "1999",
    Poster: "https://m.media-amazon.com/images/M/MV5BMmEzNTkxYjQtZTc0MC00YTVjLTg5ZTEtZWMwOWVlYzY0NWIwXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
    Type: "movie",
    genres: ["Drama", "Thriller"],
    director: "David Fincher",
    actors: ["Brad Pitt", "Edward Norton", "Meat Loaf"],
    rating: 8.8,
    popularity: 89
  },
  {
    imdbID: "tt0114369",
    Title: "Se7en",
    Year: "1995",
    Poster: "https://m.media-amazon.com/images/M/MV5BOTUwODM5MTctZjczMi00OTk4LTg3NWUtNmVhMTAzNTNjYjcyXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
    Type: "movie",
    genres: ["Crime", "Drama", "Mystery"],
    director: "David Fincher",
    actors: ["Morgan Freeman", "Brad Pitt", "Kevin Spacey"],
    rating: 8.6,
    popularity: 87
  },
  {
    imdbID: "tt0172495",
    Title: "Gladiator",
    Year: "2000",
    Poster: "https://m.media-amazon.com/images/M/MV5BMDliMmNhNDEtODUyOS00MjNlLTgxODEtN2U3NzIxMGVkZTA1L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
    Type: "movie",
    genres: ["Action", "Adventure", "Drama"],
    director: "Ridley Scott",
    actors: ["Russell Crowe", "Joaquin Phoenix", "Connie Nielsen"],
    rating: 8.5,
    popularity: 86
  },
  {
    imdbID: "tt1375666",
    Title: "Inception",
    Year: "2010",
    Poster: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
    Type: "movie",
    genres: ["Action", "Adventure", "Sci-Fi"],
    director: "Christopher Nolan",
    actors: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Ellen Page"],
    rating: 8.8,
    popularity: 93
  },
  {
    imdbID: "tt0111161",
    Title: "The Shawshank Redemption",
    Year: "1994",
    Poster: "https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
    Type: "movie",
    genres: ["Drama"],
    director: "Frank Darabont",
    actors: ["Tim Robbins", "Morgan Freeman", "Bob Gunton"],
    rating: 9.3,
    popularity: 96
  },
  {
    imdbID: "tt0068646",
    Title: "The Godfather",
    Year: "1972",
    Poster: "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
    Type: "movie",
    genres: ["Crime", "Drama"],
    director: "Francis Ford Coppola",
    actors: ["Marlon Brando", "Al Pacino", "James Caan"],
    rating: 9.2,
    popularity: 94
  },
  {
    imdbID: "tt0120737",
    Title: "The Lord of the Rings: The Fellowship of the Ring",
    Year: "2001",
    Poster: "https://m.media-amazon.com/images/M/MV5BN2EyZjM3NzUtNWUzMi00MTgxLWI0NTctMzY4M2VlOTdjZWRiXkEyXkFqcGdeQXVyNDUzOTQ5MjY@._V1_SX300.jpg",
    Type: "movie",
    genres: ["Adventure", "Drama", "Fantasy"],
    director: "Peter Jackson",
    actors: ["Elijah Wood", "Ian McKellen", "Orlando Bloom"],
    rating: 8.8,
    popularity: 92
  },
  {
    imdbID: "tt0167260",
    Title: "The Lord of the Rings: The Return of the King",
    Year: "2003",
    Poster: "https://m.media-amazon.com/images/M/MV5BNzA5ZDNlZWMtM2NhNS00NDJjLTk4NDItYTRmY2EwMWZlMTY3XkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
    Type: "movie",
    genres: ["Adventure", "Drama", "Fantasy"],
    director: "Peter Jackson",
    actors: ["Elijah Wood", "Viggo Mortensen", "Ian McKellen"],
    rating: 9.0,
    popularity: 93
  },
  {
    imdbID: "tt0167261",
    Title: "The Lord of the Rings: The Two Towers",
    Year: "2002",
    Poster: "https://m.media-amazon.com/images/M/MV5BNGE5MzIyNTAtNWFlMC00NDA2LWJiMjItMjc4Yjg1OWM5NzhhXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
    Type: "movie",
    genres: ["Adventure", "Drama", "Fantasy"],
    director: "Peter Jackson",
    actors: ["Elijah Wood", "Ian McKellen", "Viggo Mortensen"],
    rating: 8.7,
    popularity: 91
  },
  {
    imdbID: "tt0080684",
    Title: "Star Wars: Episode V - The Empire Strikes Back",
    Year: "1980",
    Poster: "https://m.media-amazon.com/images/M/MV5BYmU1NDRjNDgtMzhiMi00NjZmLTg5NGItZDNiZjU5NTU4OTE0XkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
    Type: "movie",
    genres: ["Action", "Adventure", "Fantasy"],
    director: "Irvin Kershner",
    actors: ["Mark Hamill", "Harrison Ford", "Carrie Fisher"],
    rating: 8.7,
    popularity: 90
  }
];

/**
 * Get user's viewing history from localStorage
 * @returns {Array} Array of watched movies with metadata
 */
const getViewingHistory = () => {
  try {
    const continueWatching = localStorage.getItem('continueWatching');
    if (continueWatching) {
      return JSON.parse(continueWatching);
    }
    return [];
  } catch (error) {
    console.error('Error getting viewing history:', error);
    return [];
  }
};

/**
 * Get user's favorite genres based on viewing history
 * @returns {Object} Object with genre counts and sorted genres
 */
const getFavoriteGenres = () => {
  const viewingHistory = getViewingHistory();
  const genreCounts = {};

  // Count genres from viewing history
  viewingHistory.forEach(item => {
    const genres = item.genres || [];
    genres.forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
  });

  // Sort genres by count
  const sortedGenres = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);

  return {
    genreCounts,
    sortedGenres
  };
};

/**
 * Get user's favorite actors based on viewing history
 * @returns {Array} Array of favorite actors sorted by frequency
 */
const getFavoriteActors = () => {
  const viewingHistory = getViewingHistory();
  const actorCounts = {};

  // Count actors from viewing history
  viewingHistory.forEach(item => {
    const actors = item.actors || [];
    actors.forEach(actor => {
      actorCounts[actor] = (actorCounts[actor] || 0) + 1;
    });
  });

  // Sort actors by count
  return Object.keys(actorCounts)
    .sort((a, b) => actorCounts[b] - actorCounts[a])
    .slice(0, 5); // Top 5 actors
};

/**
 * Get user's favorite directors based on viewing history
 * @returns {Array} Array of favorite directors sorted by frequency
 */
const getFavoriteDirectors = () => {
  const viewingHistory = getViewingHistory();
  const directorCounts = {};

  // Count directors from viewing history
  viewingHistory.forEach(item => {
    const director = item.director;
    if (director) {
      directorCounts[director] = (directorCounts[director] || 0) + 1;
    }
  });

  // Sort directors by count
  return Object.keys(directorCounts)
    .sort((a, b) => directorCounts[b] - directorCounts[a])
    .slice(0, 3); // Top 3 directors
};

/**
 * Calculate similarity score between two movies
 * @param {Object} movie1 - First movie
 * @param {Object} movie2 - Second movie
 * @returns {number} Similarity score (0-1)
 */
const calculateMovieSimilarity = (movie1, movie2) => {
  let score = 0;

  // Genre similarity (most important)
  const genres1 = movie1.genres || [];
  const genres2 = movie2.genres || [];
  const commonGenres = genres1.filter(g => genres2.includes(g));
  score += (commonGenres.length / Math.max(genres1.length, genres2.length)) * 0.5;

  // Director similarity
  if (movie1.director && movie2.director && movie1.director === movie2.director) {
    score += 0.3;
  }

  // Actor similarity
  const actors1 = movie1.actors || [];
  const actors2 = movie2.actors || [];
  const commonActors = actors1.filter(a => actors2.includes(a));
  score += (commonActors.length / Math.max(actors1.length, 1)) * 0.2;

  return score;
};

/**
 * Get personalized recommendations based on viewing history
 * @param {number} limit - Number of recommendations to return
 * @param {string} contentType - Type of content (movies, tv, documentaries, music)
 * @returns {Array} Array of recommended content
 */
const getPersonalizedRecommendations = (limit = 5, contentType = 'movies') => {
  const viewingHistory = getViewingHistory();

  // If no viewing history, return popular movies
  if (viewingHistory.length === 0) {
    return movieDatabase
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  // Calculate scores for each movie in the database
  const movieScores = movieDatabase.map(movie => {
    // Skip movies already in viewing history
    const alreadyWatched = viewingHistory.some(item =>
      (item.id && item.id === movie.imdbID) ||
      (item.imdbID && item.imdbID === movie.imdbID)
    );

    if (alreadyWatched) {
      return { movie, score: -1 }; // Negative score to filter out later
    }

    // Calculate similarity to each watched movie
    let totalSimilarity = 0;
    viewingHistory.forEach(watchedItem => {
      // Find the full movie data for the watched item
      const watchedMovie = movieDatabase.find(m =>
        m.imdbID === (watchedItem.id || watchedItem.imdbID)
      );

      if (watchedMovie) {
        const similarity = calculateMovieSimilarity(watchedMovie, movie);
        totalSimilarity += similarity;
      }
    });

    // Average similarity score
    const similarityScore = totalSimilarity / viewingHistory.length;

    // Final score combines similarity and popularity
    const finalScore = (similarityScore * 0.7) + ((movie.popularity / 100) * 0.3);

    return { movie, score: finalScore };
  });

  // Sort by score and return top recommendations
  return movieScores
    .filter(item => item.score > 0) // Remove already watched movies
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.movie);
};

/**
 * Get recommendations based on a specific movie
 * @param {Object} baseMovie - Movie to base recommendations on
 * @param {number} limit - Number of recommendations to return
 * @param {string} contentType - Type of content (movies, tv, documentaries, music)
 * @returns {Array} Array of similar content
 */
const getSimilarMovies = (baseMovie, limit = 3, contentType = 'movies') => {
  // Find the full movie data
  const fullMovieData = movieDatabase.find(m =>
    m.imdbID === (baseMovie.id || baseMovie.imdbID)
  ) || baseMovie;

  // Calculate similarity scores
  const similarMovies = movieDatabase
    .filter(movie => movie.imdbID !== fullMovieData.imdbID) // Exclude the base movie
    .map(movie => ({
      movie,
      score: calculateMovieSimilarity(fullMovieData, movie)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.movie);

  return similarMovies;
};

/**
 * Get trending content based on popularity
 * @param {number} limit - Number of trending items to return
 * @param {string} contentType - Type of content (movies, tv, documentaries, music)
 * @returns {Array} Array of trending content
 */
const getTrendingMovies = (limit = 5, contentType = 'movies') => {
  return movieDatabase
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
};

/**
 * Get recommendations by genre
 * @param {string} genre - Genre to filter by
 * @param {number} limit - Number of recommendations to return
 * @param {string} contentType - Type of content (movies, tv, documentaries, music)
 * @returns {Array} Array of content in the specified genre
 */
const getMoviesByGenre = (genre, limit = 5, contentType = 'movies') => {
  return movieDatabase
    .filter(movie => (movie.genres || []).includes(genre))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
};

/**
 * Get "Because You Watched" recommendations
 * @param {number} limit - Number of sections to return
 * @returns {Array} Array of recommendation sections
 */
const getBecauseYouWatchedRecommendations = (limit = 2) => {
  const viewingHistory = getViewingHistory();

  // If no viewing history, return empty array
  if (viewingHistory.length === 0) {
    return [];
  }

  // Sort viewing history by lastWatched (most recent first)
  const sortedHistory = [...viewingHistory].sort((a, b) => {
    const dateA = new Date(a.lastWatched || 0);
    const dateB = new Date(b.lastWatched || 0);
    return dateB - dateA;
  });

  // Get recommendations for the most recently watched movies
  return sortedHistory.slice(0, limit).map(watchedItem => {
    const baseMovie = movieDatabase.find(m =>
      m.imdbID === (watchedItem.id || watchedItem.imdbID)
    ) || watchedItem;

    return {
      baseMovie,
      recommendations: getSimilarMovies(baseMovie, 5)
    };
  });
};

export default {
  getPersonalizedRecommendations,
  getSimilarMovies,
  getTrendingMovies,
  getMoviesByGenre,
  getFavoriteGenres,
  getFavoriteActors,
  getFavoriteDirectors,
  getBecauseYouWatchedRecommendations
};
