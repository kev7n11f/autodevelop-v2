import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const { register, login, loading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Registration-specific validation
    if (!isLoginMode) {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      let result;
      if (isLoginMode) {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.email, formData.password, formData.name);
      }

      if (!result.success) {
        setErrors({ 
          general: result.error || 'Authentication failed',
          details: result.details 
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setErrors({ 
        general: 'An unexpected error occurred. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  return (
    <div className="login-container">
      <div className="content-card login-card">
        <div className="login-header">
          <h1>Welcome to AutoDevelop.ai</h1>
          <p>
            {isLoginMode 
              ? 'Sign in to access your personalized AI development assistant'
              : 'Create your account to get started with AI-powered development'
            }
          </p>
        </div>

        <div className="login-content">
          <div className="login-benefits">
            <div className="benefit-item">
              <span className="benefit-icon">💾</span>
              <div>
                <h3>Save Your Progress</h3>
                <p>Your conversations and project history are securely saved</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🎯</span>
              <div>
                <h3>Personalized Experience</h3>
                <p>Get AI recommendations tailored to your development style</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🚀</span>
              <div>
                <h3>Advanced Features</h3>
                <p>Access premium tools and accelerated development workflows</p>
              </div>
            </div>
          </div>

          <div className="auth-form-container">
            <form onSubmit={handleSubmit} className="auth-form">
              <h2>{isLoginMode ? 'Sign In' : 'Create Account'}</h2>
              
              {errors.general && (
                <div className="error-message">
                  <strong>{errors.general}</strong>
                  {errors.details && <div className="error-details">{errors.details}</div>}
                </div>
              )}

              {!isLoginMode && (
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={errors.name ? 'error' : ''}
                    placeholder="Enter your full name"
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="Enter your email"
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? 'error' : ''}
                  placeholder="Enter your password"
                  autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                />
                {errors.password && <span className="field-error">{errors.password}</span>}
                {!isLoginMode && (
                  <div className="password-requirements">
                    Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character.
                  </div>
                )}
              </div>

              {!isLoginMode && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'error' : ''}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                  {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                </div>
              )}

              <button 
                type="submit" 
                className="auth-submit-btn"
                disabled={isSubmitting || loading}
              >
                {isSubmitting 
                  ? (isLoginMode ? 'Signing In...' : 'Creating Account...') 
                  : (isLoginMode ? 'Sign In' : 'Create Account')
                }
              </button>
            </form>

            <div className="auth-toggle">
              <p>
                {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                {' '}
                <button 
                  type="button" 
                  onClick={toggleMode} 
                  className="toggle-link"
                  disabled={isSubmitting}
                >
                  {isLoginMode ? 'Create one here' : 'Sign in here'}
                </button>
              </p>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <p>
            Want to try without signing in?{' '}
            <a href="/" className="back-link">Continue as guest</a>
          </p>
        </div>
      </div>
    </div>
  );
}