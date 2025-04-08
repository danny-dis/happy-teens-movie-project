import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import searchIcon from '../search.svg';
import micIcon from '../mic.svg'; // You'll need to add this SVG
import '../App.css';

const AdvancedSearch = ({ onSearch, initialQuery = '' }) => {
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    year: '',
    genre: '',
    rating: '',
    type: 'all'
  });
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const navigate = useNavigate();

  // Available genres for filter
  const genres = [
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 
    'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 
    'History', 'Horror', 'Music', 'Mystery', 'Romance', 
    'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'
  ];

  // Years for filter (current year down to 1900)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

  // Ratings for filter
  const ratings = ['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'];

  // Handle search submission
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    
    if (!searchTerm.trim() && !hasActiveFilters()) return;
    
    // Combine search term with filters
    const searchParams = {
      query: searchTerm.trim(),
      ...filters
    };
    
    // Remove empty filters
    Object.keys(searchParams).forEach(key => 
      !searchParams[key] && delete searchParams[key]
    );
    
    // Call the onSearch callback with search parameters
    if (onSearch) {
      onSearch(searchParams);
    }
    
    // Close suggestions
    setShowSuggestions(false);
    
    // Navigate to search results page with query parameters
    const queryString = new URLSearchParams(searchParams).toString();
    navigate(`/search?${queryString}`);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return Object.values(filters).some(value => value && value !== 'all');
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      year: '',
      genre: '',
      rating: '',
      type: 'all'
    });
  };

  // Handle voice search
  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice search is not supported in your browser');
      return;
    }
    
    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
    };
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      
      // Auto-submit after voice input
      setTimeout(() => {
        handleSearch();
      }, 500);
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  // Get search suggestions based on current input
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }
    
    // In a real implementation, this would call an API
    // For now, we'll use mock data
    const getMockSuggestions = () => {
      const mockMovies = [
        'The Avengers', 'Avengers: Endgame', 'Avengers: Infinity War',
        'The Dark Knight', 'The Dark Knight Rises', 'Batman Begins',
        'Inception', 'Interstellar', 'The Matrix',
        'Pulp Fiction', 'Fight Club', 'Forrest Gump',
        'The Shawshank Redemption', 'The Godfather', 'Goodfellas'
      ];
      
      return mockMovies
        .filter(movie => movie.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 5);
    };
    
    setSuggestions(getMockSuggestions());
  }, [searchTerm]);

  // Show/hide suggestions based on input focus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="advanced-search-container">
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-container">
          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search movies, actors, directors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
          />
          
          <button 
            type="button" 
            className={`voice-search-btn ${isListening ? 'listening' : ''}`}
            onClick={startVoiceSearch}
            title="Search with voice"
          >
            🎤
          </button>
          
          <button 
            type="submit" 
            className="search-btn"
            title="Search"
          >
            <img src={searchIcon} alt="Search" />
          </button>
          
          <button 
            type="button" 
            className="advanced-toggle-btn"
            onClick={() => setShowAdvanced(!showAdvanced)}
            title={showAdvanced ? "Hide advanced search" : "Show advanced search"}
          >
            {showAdvanced ? '▲' : '▼'}
          </button>
        </div>
        
        {/* Search suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="search-suggestions" ref={suggestionsRef}>
            {suggestions.map((suggestion, index) => (
              <div 
                key={index} 
                className="suggestion-item"
                onClick={() => {
                  setSearchTerm(suggestion);
                  setShowSuggestions(false);
                  handleSearch();
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
        
        {/* Advanced search filters */}
        {showAdvanced && (
          <div className="advanced-filters">
            <div className="filter-group">
              <label htmlFor="year-filter">Year</label>
              <select 
                id="year-filter"
                value={filters.year}
                onChange={(e) => setFilters({...filters, year: e.target.value})}
              >
                <option value="">Any Year</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="genre-filter">Genre</label>
              <select 
                id="genre-filter"
                value={filters.genre}
                onChange={(e) => setFilters({...filters, genre: e.target.value})}
              >
                <option value="">Any Genre</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="rating-filter">Rating</label>
              <select 
                id="rating-filter"
                value={filters.rating}
                onChange={(e) => setFilters({...filters, rating: e.target.value})}
              >
                <option value="">Any Rating</option>
                {ratings.map(rating => (
                  <option key={rating} value={rating}>{rating}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="type-filter">Type</label>
              <select 
                id="type-filter"
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
              >
                <option value="all">All</option>
                <option value="movie">Movies</option>
                <option value="series">TV Shows</option>
              </select>
            </div>
            
            <button 
              type="button" 
              className="reset-filters-btn"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default AdvancedSearch;
