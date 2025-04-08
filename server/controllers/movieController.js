const mysql = require("mysql");

// Create MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "",
  password: "",
  database: "happyteens",
});

// Get all local movies
const getLocalMovies = (req, res) => {
  // In a real implementation, this would query the database
  // For now, we'll return a success message with mock data
  
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
  
  res.status(200).json({
    success: true,
    movies: mockMovies
  });
};

// Download movie information
const downloadMovieInfo = async (req, res) => {
  const { imdbID } = req.body;
  
  if (!imdbID) {
    return res.status(400).json({
      success: false,
      message: "Movie ID is required"
    });
  }
  
  try {
    // In a real implementation, this would:
    // 1. Fetch movie details from an API
    // 2. Download and store the poster image
    // 3. Save the movie metadata to the database
    // 4. Analyze the video file to detect intro/outro timestamps
    
    // For now, we'll just return a success message
    res.status(200).json({
      success: true,
      message: `Movie information for ${imdbID} downloaded successfully`,
      introEnd: 120, // Mock intro end time (2 minutes)
      outroStart: 7200 // Mock outro start time (2 hours)
    });
  } catch (error) {
    console.error("Error downloading movie information:", error);
    res.status(500).json({
      success: false,
      message: "Error downloading movie information"
    });
  }
};

module.exports = {
  getLocalMovies,
  downloadMovieInfo
};
