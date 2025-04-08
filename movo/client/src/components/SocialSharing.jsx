import React, { useState } from 'react';
import '../App.css';

const SocialSharing = ({ movie, onClose }) => {
  const [shareMethod, setShareMethod] = useState('link');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(`Check out "${movie.title || movie.Title}"! I think you'll like it.`);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [error, setError] = useState('');

  // Generate share link
  const generateShareLink = () => {
    // In a real implementation, this would generate a unique link
    // For now, we'll just use a mock URL
    const baseUrl = window.location.origin;
    const movieId = movie.id || movie.imdbID;
    return `${baseUrl}/shared/${movieId}`;
  };

  // Copy link to clipboard
  const copyToClipboard = () => {
    const link = generateShareLink();
    navigator.clipboard.writeText(link)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(err => {
        setError('Failed to copy link to clipboard');
        console.error('Failed to copy: ', err);
      });
  };

  // Share via email
  const shareViaEmail = (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter an email address');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // In a real implementation, this would send an email
    // For now, we'll just simulate success
    setShared(true);
    setError('');
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setShared(false);
      setEmail('');
      setMessage(`Check out "${movie.title || movie.Title}"! I think you'll like it.`);
    }, 3000);
  };

  // Share to social media
  const shareToSocial = (platform) => {
    const link = generateShareLink();
    const text = `Check out "${movie.title || movie.Title}" on Happy Teens!`;
    
    let url;
    switch (platform) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
        break;
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + link)}`;
        break;
      default:
        return;
    }
    
    // Open share dialog in a new window
    window.open(url, '_blank', 'width=600,height=400');
  };

  // Validate email format
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  return (
    <div className="social-sharing-overlay">
      <div className="social-sharing-modal">
        <button className="close-modal-btn" onClick={onClose}>×</button>
        
        <h2>Share "{movie.title || movie.Title}"</h2>
        
        <div className="movie-share-preview">
          <img 
            src={movie.posterUrl || movie.Poster} 
            alt={movie.title || movie.Title} 
            className="share-poster"
          />
          <div className="share-movie-info">
            <h3>{movie.title || movie.Title}</h3>
            <p>{movie.year || movie.Year}</p>
          </div>
        </div>
        
        <div className="share-tabs">
          <button 
            className={`share-tab-btn ${shareMethod === 'link' ? 'active' : ''}`}
            onClick={() => setShareMethod('link')}
          >
            Copy Link
          </button>
          <button 
            className={`share-tab-btn ${shareMethod === 'email' ? 'active' : ''}`}
            onClick={() => setShareMethod('email')}
          >
            Email
          </button>
          <button 
            className={`share-tab-btn ${shareMethod === 'social' ? 'active' : ''}`}
            onClick={() => setShareMethod('social')}
          >
            Social Media
          </button>
        </div>
        
        {error && <div className="share-error">{error}</div>}
        
        {/* Copy Link Tab */}
        {shareMethod === 'link' && (
          <div className="share-link-container">
            <div className="share-link-input">
              <input 
                type="text" 
                value={generateShareLink()} 
                readOnly
              />
              <button 
                className="copy-link-btn"
                onClick={copyToClipboard}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="share-note">
              Anyone with this link can view this movie if they have an account.
            </p>
          </div>
        )}
        
        {/* Email Tab */}
        {shareMethod === 'email' && (
          <form className="share-email-form" onSubmit={shareViaEmail}>
            <div className="form-group">
              <label htmlFor="email">Recipient Email</label>
              <input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea 
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows="3"
              />
            </div>
            
            <button 
              type="submit" 
              className="share-submit-btn"
              disabled={shared}
            >
              {shared ? 'Sent!' : 'Send Email'}
            </button>
          </form>
        )}
        
        {/* Social Media Tab */}
        {shareMethod === 'social' && (
          <div className="social-buttons">
            <button 
              className="social-btn facebook"
              onClick={() => shareToSocial('facebook')}
            >
              <span className="social-icon">f</span>
              Share on Facebook
            </button>
            
            <button 
              className="social-btn twitter"
              onClick={() => shareToSocial('twitter')}
            >
              <span className="social-icon">t</span>
              Share on Twitter
            </button>
            
            <button 
              className="social-btn whatsapp"
              onClick={() => shareToSocial('whatsapp')}
            >
              <span className="social-icon">w</span>
              Share on WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialSharing;
