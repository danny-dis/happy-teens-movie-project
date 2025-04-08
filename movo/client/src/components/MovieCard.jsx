import React from 'react';

const MovieCard = ({ movie, isLocal = false }) => {
    // Handle different property names between local and streaming movies
    const title = isLocal ? movie.title : movie.Title;
    const year = isLocal ? movie.year : movie.Year;
    const poster = isLocal ? movie.posterUrl : (
        movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/400"
    );
    const type = isLocal ? movie.category : movie.Type;

    const handleClick = () => {
        // Open movie details or play the movie
        if (isLocal) {
            // For local movies, we might want to play directly
            window.location.href = `/play/${movie.id}`;
        } else {
            // For streaming movies, show details
            window.location.href = `/details/${movie.imdbID}`;
        }
    };

    return (
        <div className="movie" onClick={handleClick}>
            <div className="movie-year">
                <p>{year}</p>
            </div>

            <div className="movie-poster">
                <img src={poster} alt={title} />
                <div className="movie-overlay">
                    <button className="play-btn">▶ Play</button>
                </div>
            </div>

            <div className="movie-info">
                <span className="movie-type">{type}</span>
                <h3 className="movie-title">{title}</h3>
            </div>
        </div>
    );
};

export default MovieCard;