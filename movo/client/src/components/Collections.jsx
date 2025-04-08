import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MovieCard from './MovieCard';
import '../App.css';

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDescription, setNewCollectionDescription] = useState('');
  const [availableMovies, setAvailableMovies] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load collections from localStorage
  useEffect(() => {
    const loadCollections = () => {
      try {
        const savedCollections = localStorage.getItem('movieCollections');
        if (savedCollections) {
          setCollections(JSON.parse(savedCollections));
        } else {
          // Create default collections if none exist
          const defaultCollections = [
            {
              id: 'favorites',
              name: 'Favorites',
              description: 'Your favorite movies',
              movies: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'watchlist',
              name: 'Watch Later',
              description: 'Movies you want to watch',
              movies: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          setCollections(defaultCollections);
          localStorage.setItem('movieCollections', JSON.stringify(defaultCollections));
        }
        
        // Load available movies (from local library)
        const loadAvailableMovies = () => {
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
          
          setAvailableMovies(mockMovies);
        };
        
        loadAvailableMovies();
        setLoading(false);
      } catch (error) {
        console.error('Error loading collections:', error);
        setLoading(false);
      }
    };
    
    loadCollections();
  }, []);

  // Save collections to localStorage
  const saveCollections = (updatedCollections) => {
    setCollections(updatedCollections);
    localStorage.setItem('movieCollections', JSON.stringify(updatedCollections));
  };

  // Create a new collection
  const createCollection = (e) => {
    e.preventDefault();
    
    if (!newCollectionName.trim()) {
      alert('Please enter a collection name');
      return;
    }
    
    const newCollection = {
      id: `collection-${Date.now()}`,
      name: newCollectionName,
      description: newCollectionDescription,
      movies: selectedMovies,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedCollections = [...collections, newCollection];
    saveCollections(updatedCollections);
    
    // Reset form
    setNewCollectionName('');
    setNewCollectionDescription('');
    setSelectedMovies([]);
    setShowCreateForm(false);
    
    // Set the new collection as active
    setActiveCollection(newCollection);
  };

  // Delete a collection
  const deleteCollection = (collectionId) => {
    if (window.confirm('Are you sure you want to delete this collection?')) {
      const updatedCollections = collections.filter(c => c.id !== collectionId);
      saveCollections(updatedCollections);
      
      if (activeCollection && activeCollection.id === collectionId) {
        setActiveCollection(null);
      }
    }
  };

  // Add a movie to a collection
  const addMovieToCollection = (collectionId, movie) => {
    const updatedCollections = collections.map(collection => {
      if (collection.id === collectionId) {
        // Check if movie is already in the collection
        if (collection.movies.some(m => m.id === movie.id)) {
          return collection;
        }
        
        return {
          ...collection,
          movies: [...collection.movies, movie],
          updatedAt: new Date().toISOString()
        };
      }
      return collection;
    });
    
    saveCollections(updatedCollections);
    
    // Update active collection if needed
    if (activeCollection && activeCollection.id === collectionId) {
      const updatedCollection = updatedCollections.find(c => c.id === collectionId);
      setActiveCollection(updatedCollection);
    }
  };

  // Remove a movie from a collection
  const removeMovieFromCollection = (collectionId, movieId) => {
    const updatedCollections = collections.map(collection => {
      if (collection.id === collectionId) {
        return {
          ...collection,
          movies: collection.movies.filter(movie => movie.id !== movieId),
          updatedAt: new Date().toISOString()
        };
      }
      return collection;
    });
    
    saveCollections(updatedCollections);
    
    // Update active collection if needed
    if (activeCollection && activeCollection.id === collectionId) {
      const updatedCollection = updatedCollections.find(c => c.id === collectionId);
      setActiveCollection(updatedCollection);
    }
  };

  // Toggle movie selection for new collection
  const toggleMovieSelection = (movie) => {
    if (selectedMovies.some(m => m.id === movie.id)) {
      setSelectedMovies(selectedMovies.filter(m => m.id !== movie.id));
    } else {
      setSelectedMovies([...selectedMovies, movie]);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="content-container collections-container">
        <div className="loading">
          <h2>Loading collections...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container collections-container">
      <div className="content-header">
        <h1>My Collections</h1>
        <div className="header-actions">
          <button 
            className="create-collection-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create Collection'}
          </button>
          <Link to="/local" className="back-btn">← Back to Library</Link>
        </div>
      </div>
      
      {showCreateForm && (
        <div className="create-collection-form">
          <h2>Create New Collection</h2>
          <form onSubmit={createCollection}>
            <div className="form-group">
              <label htmlFor="collectionName">Collection Name</label>
              <input 
                type="text" 
                id="collectionName" 
                value={newCollectionName} 
                onChange={(e) => setNewCollectionName(e.target.value)} 
                placeholder="Enter collection name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="collectionDescription">Description (optional)</label>
              <textarea 
                id="collectionDescription" 
                value={newCollectionDescription} 
                onChange={(e) => setNewCollectionDescription(e.target.value)} 
                placeholder="Enter collection description"
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label>Select Movies</label>
              <div className="movie-selection-grid">
                {availableMovies.map(movie => (
                  <div 
                    key={movie.id} 
                    className={`movie-selection-item ${selectedMovies.some(m => m.id === movie.id) ? 'selected' : ''}`}
                    onClick={() => toggleMovieSelection(movie)}
                  >
                    <img src={movie.posterUrl} alt={movie.title} />
                    <div className="movie-selection-overlay">
                      <span className="movie-selection-title">{movie.title}</span>
                      {selectedMovies.some(m => m.id === movie.id) && (
                        <span className="movie-selected-icon">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowCreateForm(false)}>
                Cancel
              </button>
              <button type="submit" className="create-btn">
                Create Collection
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="collections-layout">
        <div className="collections-sidebar">
          <h2>My Collections</h2>
          <ul className="collections-list">
            {collections.map(collection => (
              <li 
                key={collection.id} 
                className={`collection-item ${activeCollection && activeCollection.id === collection.id ? 'active' : ''}`}
                onClick={() => setActiveCollection(collection)}
              >
                <div className="collection-item-info">
                  <h3>{collection.name}</h3>
                  <span className="movie-count">{collection.movies.length} movies</span>
                </div>
                {collection.id !== 'favorites' && collection.id !== 'watchlist' && (
                  <button 
                    className="delete-collection-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCollection(collection.id);
                    }}
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="collection-content">
          {activeCollection ? (
            <>
              <div className="collection-header">
                <div className="collection-info">
                  <h2>{activeCollection.name}</h2>
                  {activeCollection.description && (
                    <p className="collection-description">{activeCollection.description}</p>
                  )}
                  <div className="collection-meta">
                    <span>Created: {formatDate(activeCollection.createdAt)}</span>
                    <span>Updated: {formatDate(activeCollection.updatedAt)}</span>
                    <span>{activeCollection.movies.length} movies</span>
                  </div>
                </div>
                
                <div className="collection-actions">
                  <button className="add-to-collection-btn" onClick={() => {
                    // Show a modal or dropdown to select movies to add
                    alert('This feature would show a modal to add more movies to the collection');
                  }}>
                    Add Movies
                  </button>
                </div>
              </div>
              
              {activeCollection.movies.length === 0 ? (
                <div className="empty-collection">
                  <p>This collection is empty</p>
                  <button className="add-movies-btn" onClick={() => {
                    // Show a modal or dropdown to select movies to add
                    alert('This feature would show a modal to add movies to the collection');
                  }}>
                    Add Movies
                  </button>
                </div>
              ) : (
                <div className="collection-movies">
                  <div className="movies-grid">
                    {activeCollection.movies.map(movie => (
                      <div key={movie.id} className="movie-with-actions">
                        <MovieCard movie={movie} isLocal={true} />
                        <button 
                          className="remove-from-collection-btn"
                          onClick={() => removeMovieFromCollection(activeCollection.id, movie.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-collection-selected">
              <h2>Select a collection</h2>
              <p>Choose a collection from the sidebar or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Collections;
