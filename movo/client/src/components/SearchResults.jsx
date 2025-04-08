import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import MovieCard from './MovieCard';
import AdvancedSearch from './AdvancedSearch';
import '../App.css';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Get search parameters from URL
  const query = searchParams.get('query') || '';
  const year = searchParams.get('year') || '';
  const genre = searchParams.get('genre') || '';
  const rating = searchParams.get('rating') || '';
  const type = searchParams.get('type') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Handle search submission from the advanced search component
  const handleSearch = (searchParams) => {
    setSearchParams(searchParams);
    setCurrentPage(1);
  };

  // Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      
      try {
        // In a real implementation, this would call an API
        // For now, we'll use mock data
        setTimeout(() => {
          // Generate mock results based on search parameters
          const mockResults = generateMockResults(query, year, genre, rating, type, page);
          
          setResults(mockResults.results);
          setTotalResults(mockResults.totalResults);
          setTotalPages(mockResults.totalPages);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setResults([]);
        setTotalResults(0);
        setTotalPages(1);
        setLoading(false);
      }
    };
    
    if (query || year || genre || rating || type !== 'all') {
      fetchResults();
    } else {
      setResults([]);
      setTotalResults(0);
      setLoading(false);
    }
  }, [query, year, genre, rating, type, page]);

  // Generate mock search results
  const generateMockResults = (query, year, genre, rating, type, page) => {
    // Mock movie data
    const allMockMovies = [
      {
        imdbID: "tt0848228",
        Title: "The Avengers",
        Year: "2012",
        Type: "movie",
        Poster: "https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
        Genre: "Action, Adventure, Sci-Fi",
        Rating: "PG-13"
      },
      {
        imdbID: "tt4154756",
        Title: "Avengers: Infinity War",
        Year: "2018",
        Type: "movie",
        Poster: "https://m.media-amazon.com/images/M/MV5BMjMxNjY2MDU1OV5BMl5BanBnXkFtZTgwNzY1MTUwNTM@._V1_SX300.jpg",
        Genre: "Action, Adventure, Sci-Fi",
        Rating: "PG-13"
      },
      {
        imdbID: "tt4154796",
        Title: "Avengers: Endgame",
        Year: "2019",
        Type: "movie",
        Poster: "https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_SX300.jpg",
        Genre: "Action, Adventure, Drama",
        Rating: "PG-13"
      },
      {
        imdbID: "tt0468569",
        Title: "The Dark Knight",
        Year: "2008",
        Type: "movie",
        Poster: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg",
        Genre: "Action, Crime, Drama",
        Rating: "PG-13"
      },
      {
        imdbID: "tt1375666",
        Title: "Inception",
        Year: "2010",
        Type: "movie",
        Poster: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
        Genre: "Action, Adventure, Sci-Fi",
        Rating: "PG-13"
      },
      {
        imdbID: "tt0816692",
        Title: "Interstellar",
        Year: "2014",
        Type: "movie",
        Poster: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
        Genre: "Adventure, Drama, Sci-Fi",
        Rating: "PG-13"
      },
      {
        imdbID: "tt0133093",
        Title: "The Matrix",
        Year: "1999",
        Type: "movie",
        Poster: "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
        Genre: "Action, Sci-Fi",
        Rating: "R"
      },
      {
        imdbID: "tt0109830",
        Title: "Forrest Gump",
        Year: "1994",
        Type: "movie",
        Poster: "https://m.media-amazon.com/images/M/MV5BNWIwODRlZTUtY2U3ZS00Yzg1LWJhNzYtMmZiYmEyNmU1NjMzXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg",
        Genre: "Drama, Romance",
        Rating: "PG-13"
      },
      {
        imdbID: "tt0110912",
        Title: "Pulp Fiction",
        Year: "1994",
        Type: "movie",
        Poster: "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
        Genre: "Crime, Drama",
        Rating: "R"
      },
      {
        imdbID: "tt0111161",
        Title: "The Shawshank Redemption",
        Year: "1994",
        Type: "movie",
        Poster: "https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
        Genre: "Drama",
        Rating: "R"
      },
      {
        imdbID: "tt0068646",
        Title: "The Godfather",
        Year: "1972",
        Type: "movie",
        Poster: "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
        Genre: "Crime, Drama",
        Rating: "R"
      },
      {
        imdbID: "tt0137523",
        Title: "Fight Club",
        Year: "1999",
        Type: "movie",
        Poster: "https://m.media-amazon.com/images/M/MV5BMmEzNTkxYjQtZTc0MC00YTVjLTg5ZTEtZWMwOWVlYzY0NWIwXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
        Genre: "Drama",
        Rating: "R"
      },
      // TV Shows
      {
        imdbID: "tt0944947",
        Title: "Game of Thrones",
        Year: "2011–2019",
        Type: "series",
        Poster: "https://m.media-amazon.com/images/M/MV5BYTRiNDQwYzAtMzVlZS00NTI5LWJjYjUtMzkwNTUzMWMxZTllXkEyXkFqcGdeQXVyNDIzMzcwNjc@._V1_SX300.jpg",
        Genre: "Action, Adventure, Drama",
        Rating: "TV-MA"
      },
      {
        imdbID: "tt0903747",
        Title: "Breaking Bad",
        Year: "2008–2013",
        Type: "series",
        Poster: "https://m.media-amazon.com/images/M/MV5BMjhiMzgxZTctNDc1Ni00OTIxLTlhMTYtZTA3ZWFkODRkNmE2XkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
        Genre: "Crime, Drama, Thriller",
        Rating: "TV-MA"
      },
      {
        imdbID: "tt1475582",
        Title: "Sherlock",
        Year: "2010–2017",
        Type: "series",
        Poster: "https://m.media-amazon.com/images/M/MV5BMWY3NTljMjEtYzRiMi00NWM2LTkzNjItZTVmZjE0ODdjM2IzXkEyXkFqcGdeQXVyNTQ4NTc5OTU@._V1_SX300.jpg",
        Genre: "Crime, Drama, Mystery",
        Rating: "TV-14"
      }
    ];
    
    // Filter movies based on search parameters
    let filteredMovies = [...allMockMovies];
    
    if (query) {
      const queryLower = query.toLowerCase();
      filteredMovies = filteredMovies.filter(movie => 
        movie.Title.toLowerCase().includes(queryLower)
      );
    }
    
    if (year) {
      filteredMovies = filteredMovies.filter(movie => 
        movie.Year.includes(year)
      );
    }
    
    if (genre) {
      filteredMovies = filteredMovies.filter(movie => 
        movie.Genre.includes(genre)
      );
    }
    
    if (rating) {
      filteredMovies = filteredMovies.filter(movie => 
        movie.Rating === rating
      );
    }
    
    if (type !== 'all') {
      filteredMovies = filteredMovies.filter(movie => 
        movie.Type === type
      );
    }
    
    // Calculate pagination
    const totalResults = filteredMovies.length;
    const resultsPerPage = 10;
    const totalPages = Math.ceil(totalResults / resultsPerPage);
    
    // Get results for current page
    const startIndex = (page - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;
    const paginatedResults = filteredMovies.slice(startIndex, endIndex);
    
    return {
      results: paginatedResults,
      totalResults,
      totalPages
    };
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    
    setCurrentPage(newPage);
    
    // Update URL with new page parameter
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    setSearchParams(newParams);
  };

  return (
    <div className="content-container search-results-container">
      <div className="content-header">
        <h1>Search Results</h1>
        
        <AdvancedSearch 
          onSearch={handleSearch} 
          initialQuery={query}
        />
      </div>
      
      {loading ? (
        <div className="loading">
          <h2>Searching...</h2>
        </div>
      ) : results.length > 0 ? (
        <>
          <div className="search-summary">
            <p>
              Found {totalResults} results
              {query && ` for "${query}"`}
              {year && ` from ${year}`}
              {genre && ` in ${genre}`}
              {rating && ` rated ${rating}`}
              {type !== 'all' && ` (${type === 'movie' ? 'Movies' : 'TV Shows'})`}
            </p>
          </div>
          
          <div className="movies-grid">
            {results.map((movie) => (
              <MovieCard 
                key={movie.imdbID} 
                movie={movie} 
                isLocal={false} 
              />
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button 
                      key={pageNum}
                      className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="page-ellipsis">...</span>
                    <button 
                      className="page-number"
                      onClick={() => handlePageChange(totalPages)}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button 
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty">
          <h2>No results found</h2>
          <p>Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
