import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  
  const [formValues, setFormValues] = useState({
    username: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formValues.username.trim()) {
      newErrors.username = 'Username or email is required';
    }
    
    if (!formValues.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    try {
      await login(formValues.username, formValues.password);
      console.log('User logged in successfully');
      navigate('/'); // Redirect to home page after successful login
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error codes
      if (error.code === 'VALIDATION_ERROR') {
        setSubmitError('Invalid input. Please check your credentials.');
      } else if (error.code === 'AUTHENTICATION_ERROR') {
        setSubmitError('Invalid username or password.');
      } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
        setSubmitError('Too many login attempts. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR') {
        setSubmitError('Network error. Please check your internet connection.');
      } else {
        setSubmitError(error.message || 'An error occurred during login. Please try again.');
      }
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Welcome back to Movo</h2>
      
      {submitError && (
        <div className="error-message" role="alert">
          {submitError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <input
            type="text"
            className={`form-input ${errors.username ? 'error' : ''}`}
            name="username"
            placeholder="Username or Email"
            value={formValues.username}
            onChange={handleChange}
            disabled={isLoading}
            autoComplete="username"
          />
          {errors.username && <span className="field-error">{errors.username}</span>}
        </div>
        
        <div className="form-group">
          <input
            type="password"
            className={`form-input ${errors.password ? 'error' : ''}`}
            name="password"
            placeholder="Password"
            value={formValues.password}
            onChange={handleChange}
            disabled={isLoading}
            autoComplete="current-password"
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </div>
        
        <button 
          type="submit" 
          className="btn"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      
      <div className="auth-links">
        <p>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
