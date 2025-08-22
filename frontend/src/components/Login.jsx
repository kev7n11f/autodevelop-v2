import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const { loginWithGoogle, loading } = useAuth();

  const handleGoogleLogin = () => {
    if (!loading) {
      loginWithGoogle();
    }
  };

  return (
    <div className="login-container">
      <div className="content-card login-card">
        <div className="login-header">
          <h1>Welcome to AutoDevelop.ai</h1>
          <p>Sign in to access your personalized AI development assistant</p>
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

          <div className="login-actions">
            <button 
              className="google-login-btn"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Loading...' : 'Continue with Google'}
            </button>
            
            <p className="login-terms">
              By signing in, you agree to our{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            </p>
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