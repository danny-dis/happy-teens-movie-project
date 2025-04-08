import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SocialSharing from './SocialSharing';
import '../App.css';

const MovieDetails = ({ isShared = false }) => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        // In a real implementation, this would be an API call
        // const response = await fetch(`http://www.omdbapi.com/?i=${id}&apikey=d856c93`);
        // const data = await response.json();

        // For now, use mock data
        const mockMovie = {
          imdbID: id,
          Title: ["The Avengers", "Inception", "The Dark Knight", "Interstellar", "The Matrix"][Math.floor(Math.random() * 5)],
          Year: ["2012", "2010", "2008", "2014", "1999"][Math.floor(Math.random() * 5)],
          Rated: ["PG-13", "PG-13", "PG-13", "PG-13", "R"][Math.floor(Math.random() * 5)],
          Released: ["04 May 2012", "16 Jul 2010", "18 Jul 2008", "07 Nov 2014", "31 Mar 1999"][Math.floor(Math.random() * 5)],
          Runtime: ["143 min", "148 min", "152 min", "169 min", "136 min"][Math.floor(Math.random() * 5)],
          Genre: ["Action, Adventure, Sci-Fi", "Action, Adventure, Sci-Fi", "Action, Crime, Drama", "Adventure, Drama, Sci-Fi", "Action, Sci-Fi"][Math.floor(Math.random() * 5)],
          Director: ["Joss Whedon", "Christopher Nolan", "Christopher Nolan", "Christopher Nolan", "Lana Wachowski, Lilly Wachowski"][Math.floor(Math.random() * 5)],
          Writer: ["Joss Whedon, Zak Penn", "Christopher Nolan, Jonathan Nolan", "Jonathan Nolan, Christopher Nolan", "Jonathan Nolan, Christopher Nolan", "Lana Wachowski, Lilly Wachowski"][Math.floor(Math.random() * 5)],
          Actors: ["Robert Downey Jr., Chris Evans, Scarlett Johansson", "Leonardo DiCaprio, Joseph Gordon-Levitt, Elliot Page", "Christian Bale, Heath Ledger, Aaron Eckhart", "Matthew McConaughey, Anne Hathaway, Jessica Chastain", "Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss"][Math.floor(Math.random() * 5)],
          Plot: [
            "Earth's mightiest heroes must come together and learn to fight as a team if they are going to stop the mischievous Loki and his alien army from enslaving humanity.",
            "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
            "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
            "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
            "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence."
          ][Math.floor(Math.random() * 5)],
          Language: "English",
          Country: "USA",
          Awards: ["Nominated for 1 Oscar. Another 38 wins & 79 nominations.", "Won 4 Oscars. Another 152 wins & 217 nominations.", "Won 2 Oscars. Another 153 wins & 159 nominations.", "Won 1 Oscar. Another 43 wins & 148 nominations.", "Won 4 Oscars. Another 37 wins & 51 nominations."][Math.floor(Math.random() * 5)],
          Poster: [
            "https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
            "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
            "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg",
            "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg",
            "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg"
          ][Math.floor(Math.random() * 5)],
          Ratings: [
            { Source: "Internet Movie Database", Value: "8.0/10" },
            { Source: "Rotten Tomatoes", Value: "91%" },
            { Source: "Metacritic", Value: "69/100" }
          ],
          Metascore: ["69", "74", "84", "74", "73"][Math.floor(Math.random() * 5)],
          imdbRating: ["8.0", "8.8", "9.0", "8.6", "8.7"][Math.floor(Math.random() * 5)],
          imdbVotes: ["1,263,208", "2,174,337", "2,303,232", "1,559,346", "1,676,759"][Math.floor(Math.random() * 5)],
          Type: "movie",
          DVD: ["25 Sep 2012", "07 Dec 2010", "09 Dec 2008", "31 Mar 2015", "21 Sep 1999"][Math.floor(Math.random() * 5)],
          BoxOffice: ["$623,357,910", "$292,576,195", "$534,858,444", "$188,020,017", "$171,479,930"][Math.floor(Math.random() * 5)],
          Production: ["Marvel Studios", "Warner Bros. Pictures", "Warner Bros. Pictures", "Paramount Pictures", "Warner Bros. Pictures"][Math.floor(Math.random() * 5)],
          Website: "N/A",
          Response: "True"
        };

        // Check if movie is in library
        // In a real implementation, this would be an API call
        // const libraryResponse = await fetch(`http://localhost:5000/api/check-library/${id}`);
        // const libraryData = await libraryResponse.json();
        // setIsInLibrary(libraryData.inLibrary);

        // For now, randomly determine if it's in the library
        setIsInLibrary(Math.random() > 0.5);

        setMovie(mockMovie);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching movie details:", error);
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]);

  const handleDownload = async () => {
    setIsDownloading(true);

    // Simulate download progress
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          setIsInLibrary(true);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    // In a real implementation, this would be an API call
    // try {
    //   const response = await fetch('http://localhost:5000/api/download-movie-info', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({ imdbID: id }),
    //   });
    //   const data = await response.json();
    //   if (data.success) {
    //     setIsInLibrary(true);
    //   }
    // } catch (error) {
    //   console.error('Error downloading movie:', error);
    // }
    // setIsDownloading(false);
  };

  if (loading) {
    return (
      <div className="movie-details">
        <div className="loading">
          <h2>Loading movie details...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="movie-details-page">
      {isShared && (
        <div className="shared-banner">
          <div className="shared-message">
            This movie was shared with you
          </div>
        </div>
      )}

      <div className="movie-details-header" style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.9)), url(${movie.Poster})` }}>
        <Link to={isShared ? "/local" : "/streaming"} className="back-btn">← Back to {isShared ? "Library" : "Discover"}</Link>
      </div>

      <div className="movie-details-content">
        <div className="movie-poster-container">
          <img src={movie.Poster} alt={movie.Title} className="movie-poster-large" />

          {isInLibrary ? (
            <Link to={`/play/${movie.imdbID}`} className="watch-btn">Watch Now</Link>
          ) : isDownloading ? (
            <div className="download-progress">
              <div className="progress-bar">
                <div
                  className="progress-filled"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <span>{downloadProgress}% Downloaded</span>
            </div>
          ) : (
            <button className="download-btn" onClick={handleDownload}>
              Download to Library
            </button>
          )}

          <button className="share-btn" onClick={() => setShowShareModal(true)}>
            Share
          </button>
        </div>

        <div className="movie-info-container">
          <h1>{movie.Title} <span className="movie-year">({movie.Year})</span></h1>

          <div className="movie-meta">
            <span className="movie-rating">{movie.Rated}</span>
            <span className="movie-runtime">{movie.Runtime}</span>
            <span className="movie-genre">{movie.Genre}</span>
            <span className="movie-release">{movie.Released}</span>
          </div>

          <div className="movie-ratings">
            {movie.Ratings.map((rating, index) => (
              <div key={index} className="rating-item">
                <span className="rating-source">{rating.Source}</span>
                <span className="rating-value">{rating.Value}</span>
              </div>
            ))}
          </div>

          <div className="movie-plot">
            <h3>Plot</h3>
            <p>{movie.Plot}</p>
          </div>

          <div className="movie-credits">
            <div className="credit-item">
              <h4>Director</h4>
              <p>{movie.Director}</p>
            </div>

            <div className="credit-item">
              <h4>Writers</h4>
              <p>{movie.Writer}</p>
            </div>

            <div className="credit-item">
              <h4>Stars</h4>
              <p>{movie.Actors}</p>
            </div>
          </div>

          <div className="movie-additional-info">
            <div className="info-item">
              <h4>Box Office</h4>
              <p>{movie.BoxOffice}</p>
            </div>

            <div className="info-item">
              <h4>Production</h4>
              <p>{movie.Production}</p>
            </div>

            <div className="info-item">
              <h4>Awards</h4>
              <p>{movie.Awards}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Sharing Modal */}
      {showShareModal && movie && (
        <SocialSharing
          movie={movie}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default MovieDetails;
