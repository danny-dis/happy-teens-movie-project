import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import '../App.css';

const AnalyticsDashboard = ({ currentProfile }) => {
  const [timeframe, setTimeframe] = useState('week');
  const [viewingData, setViewingData] = useState([]);
  const [genreData, setGenreData] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [watchTimeStats, setWatchTimeStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Colors for charts
  const COLORS = ['#e50914', '#ff5722', '#ff9800', '#ffc107', '#8bc34a', '#4caf50', '#009688', '#00bcd4', '#03a9f4', '#2196f3'];

  useEffect(() => {
    // In a real implementation, this would fetch from an API
    // For now, we'll use mock data
    const fetchAnalyticsData = () => {
      setLoading(true);
      
      // Simulate API delay
      setTimeout(() => {
        // Generate mock data based on timeframe
        generateMockData(timeframe);
        setLoading(false);
      }, 1000);
    };
    
    fetchAnalyticsData();
  }, [timeframe, currentProfile]);

  // Generate mock data for analytics
  const generateMockData = (timeframe) => {
    // Mock viewing history data
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 365;
    const viewingHistory = Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutes: Math.floor(Math.random() * 180) + 10, // 10-190 minutes
        count: Math.floor(Math.random() * 5) + 1, // 1-5 movies
      };
    });
    
    // Mock genre distribution data
    const genres = [
      { name: 'Action', value: Math.floor(Math.random() * 40) + 10 },
      { name: 'Drama', value: Math.floor(Math.random() * 30) + 5 },
      { name: 'Comedy', value: Math.floor(Math.random() * 25) + 5 },
      { name: 'Sci-Fi', value: Math.floor(Math.random() * 20) + 5 },
      { name: 'Horror', value: Math.floor(Math.random() * 15) + 5 },
      { name: 'Romance', value: Math.floor(Math.random() * 15) + 5 },
      { name: 'Thriller', value: Math.floor(Math.random() * 15) + 5 },
    ];
    
    // Mock popular movies
    const movies = [
      {
        id: 1,
        title: 'The Avengers',
        views: Math.floor(Math.random() * 10) + 1,
        watchTime: Math.floor(Math.random() * 150) + 30,
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg'
      },
      {
        id: 2,
        title: 'Inception',
        views: Math.floor(Math.random() * 10) + 1,
        watchTime: Math.floor(Math.random() * 150) + 30,
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg'
      },
      {
        id: 3,
        title: 'The Dark Knight',
        views: Math.floor(Math.random() * 10) + 1,
        watchTime: Math.floor(Math.random() * 150) + 30,
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg'
      },
      {
        id: 4,
        title: 'Pulp Fiction',
        views: Math.floor(Math.random() * 10) + 1,
        watchTime: Math.floor(Math.random() * 150) + 30,
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg'
      },
      {
        id: 5,
        title: 'Forrest Gump',
        views: Math.floor(Math.random() * 10) + 1,
        watchTime: Math.floor(Math.random() * 150) + 30,
        posterUrl: 'https://m.media-amazon.com/images/M/MV5BNWIwODRlZTUtY2U3ZS00Yzg1LWJhNzYtMmZiYmEyNmU1NjMzXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg'
      }
    ];
    
    // Sort by views (descending)
    movies.sort((a, b) => b.views - a.views);
    
    // Calculate watch time statistics
    const totalMinutes = viewingHistory.reduce((sum, day) => sum + day.minutes, 0);
    const totalMovies = viewingHistory.reduce((sum, day) => sum + day.count, 0);
    const avgMinutesPerDay = Math.round(totalMinutes / days);
    const avgMoviesPerWeek = Math.round((totalMovies / days) * 7);
    
    // Set the data
    setViewingData(viewingHistory);
    setGenreData(genres);
    setPopularMovies(movies);
    setWatchTimeStats({
      totalMinutes,
      totalMovies,
      avgMinutesPerDay,
      avgMoviesPerWeek,
      timeframe
    });
  };

  // Format minutes as hours and minutes
  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">{label}</p>
          <p className="tooltip-time">
            <span className="tooltip-label">Watch time:</span> {formatMinutes(payload[0].value)}
          </p>
          <p className="tooltip-count">
            <span className="tooltip-label">Movies watched:</span> {payload[1].value}
          </p>
        </div>
      );
    }
    return null;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="content-container analytics-container">
        <div className="content-header">
          <h1>Your Viewing Analytics</h1>
          <Link to="/preferences" className="back-btn">← Back to Preferences</Link>
        </div>
        <div className="loading">
          <h2>Loading analytics data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container analytics-container">
      <div className="content-header">
        <h1>Your Viewing Analytics</h1>
        <Link to="/preferences" className="back-btn">← Back to Preferences</Link>
      </div>
      
      <div className="analytics-controls">
        <div className="timeframe-selector">
          <button 
            className={`timeframe-btn ${timeframe === 'week' ? 'active' : ''}`}
            onClick={() => setTimeframe('week')}
          >
            Last Week
          </button>
          <button 
            className={`timeframe-btn ${timeframe === 'month' ? 'active' : ''}`}
            onClick={() => setTimeframe('month')}
          >
            Last Month
          </button>
          <button 
            className={`timeframe-btn ${timeframe === 'year' ? 'active' : ''}`}
            onClick={() => setTimeframe('year')}
          >
            Last Year
          </button>
        </div>
        
        <div className="analytics-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'genres' ? 'active' : ''}`}
            onClick={() => setActiveTab('genres')}
          >
            Genres
          </button>
          <button 
            className={`tab-btn ${activeTab === 'popular' ? 'active' : ''}`}
            onClick={() => setActiveTab('popular')}
          >
            Most Watched
          </button>
        </div>
      </div>
      
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="analytics-overview">
          <div className="stats-cards">
            <div className="stat-card">
              <h3>Total Watch Time</h3>
              <div className="stat-value">{formatMinutes(watchTimeStats.totalMinutes)}</div>
              <div className="stat-label">in the last {timeframe}</div>
            </div>
            
            <div className="stat-card">
              <h3>Movies Watched</h3>
              <div className="stat-value">{watchTimeStats.totalMovies}</div>
              <div className="stat-label">in the last {timeframe}</div>
            </div>
            
            <div className="stat-card">
              <h3>Daily Average</h3>
              <div className="stat-value">{formatMinutes(watchTimeStats.avgMinutesPerDay)}</div>
              <div className="stat-label">per day</div>
            </div>
            
            <div className="stat-card">
              <h3>Weekly Average</h3>
              <div className="stat-value">{watchTimeStats.avgMoviesPerWeek}</div>
              <div className="stat-label">movies per week</div>
            </div>
          </div>
          
          <div className="chart-container">
            <h3>Viewing Activity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={viewingData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" stroke="#e50914" />
                <YAxis yAxisId="right" orientation="right" stroke="#03a9f4" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="minutes" 
                  name="Watch Time (minutes)" 
                  stroke="#e50914" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="count" 
                  name="Movies Watched" 
                  stroke="#03a9f4" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Genres Tab */}
      {activeTab === 'genres' && (
        <div className="analytics-genres">
          <div className="chart-container">
            <h3>Genre Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genreData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {genreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} movies`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="genre-stats">
            <h3>Your Top Genres</h3>
            <div className="genre-bars">
              {genreData
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
                .map((genre, index) => (
                  <div key={genre.name} className="genre-bar-item">
                    <div className="genre-bar-label">
                      <span className="genre-name">{genre.name}</span>
                      <span className="genre-value">{genre.value} movies</span>
                    </div>
                    <div className="genre-bar-container">
                      <div 
                        className="genre-bar-fill" 
                        style={{ 
                          width: `${(genre.value / genreData[0].value) * 100}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                ))
              }
            </div>
            
            <div className="genre-recommendations">
              <h3>Recommended Based on Your Taste</h3>
              <div className="genre-recommendation-list">
                <div className="genre-recommendation">
                  <span className="recommendation-genre">Action</span>
                  <span className="recommendation-title">John Wick</span>
                </div>
                <div className="genre-recommendation">
                  <span className="recommendation-genre">Drama</span>
                  <span className="recommendation-title">The Shawshank Redemption</span>
                </div>
                <div className="genre-recommendation">
                  <span className="recommendation-genre">Sci-Fi</span>
                  <span className="recommendation-title">Blade Runner 2049</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Popular Tab */}
      {activeTab === 'popular' && (
        <div className="analytics-popular">
          <div className="popular-movies">
            <h3>Your Most Watched Movies</h3>
            <div className="popular-movies-list">
              {popularMovies.map((movie, index) => (
                <div key={movie.id} className="popular-movie-item">
                  <div className="popular-movie-rank">{index + 1}</div>
                  <div className="popular-movie-poster">
                    <img src={movie.posterUrl} alt={movie.title} />
                  </div>
                  <div className="popular-movie-info">
                    <h4>{movie.title}</h4>
                    <div className="popular-movie-stats">
                      <div className="popular-movie-views">
                        <span className="stat-label">Views:</span> {movie.views}
                      </div>
                      <div className="popular-movie-time">
                        <span className="stat-label">Watch Time:</span> {formatMinutes(movie.watchTime)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="chart-container">
            <h3>Watch Time by Movie</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={popularMovies}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" />
                <YAxis />
                <Tooltip formatter={(value, name) => [formatMinutes(value), 'Watch Time']} />
                <Legend />
                <Bar dataKey="watchTime" name="Watch Time (minutes)" fill="#e50914" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      <div className="analytics-footer">
        <p>Data shown is for demonstration purposes only.</p>
        <button className="export-btn">Export Data</button>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
