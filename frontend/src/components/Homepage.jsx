import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO, { composeTitle } from './SEO';
import './Pages.css';

export default function Homepage() {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigation = (path, action = 'navigate') => {
    setIsNavigating(true);
    
    // Add a small delay for better UX feedback
    setTimeout(() => {
      if (action === 'navigate') {
        navigate(path);
      } else {
        window.location.href = path;
      }
      setIsNavigating(false);
    }, 300);
  };
  return (
    <div className="page-container">
      <SEO 
        title={composeTitle('AI-Powered Development Platform')} 
        description="Transform your ideas into reality with AutoDevelop.ai. Build applications, websites, and tools with AI assistance." 
        pathname="/" 
      />
      
      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose AutoDevelop.ai?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>AI-Powered Development</h3>
              <p>Leverage cutting-edge AI to accelerate your development process and bring ideas to life faster than ever.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🛠️</div>
              <h3>Step-by-Step Guidance</h3>
              <p>Get personalized guidance through every stage of development, from concept to deployment.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Privacy-First Approach</h3>
              <p>Your data stays secure. We prioritize privacy and give you full control over your projects.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>Optimized for speed and efficiency. Build and deploy applications in record time.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Goal-Oriented</h3>
              <p>Focus on what matters most - achieving your development goals with intelligent automation.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌟</div>
              <h3>Beginner Friendly</h3>
              <p>Whether you're new to coding or an expert, our platform adapts to your skill level.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases-section">
        <div className="container">
          <h2 className="section-title">What Can You Build?</h2>
          <div className="use-cases-grid">
            <div className="use-case-card">
              <h3>🌐 Web Applications</h3>
              <p>Create responsive, modern web applications with the latest frameworks and best practices.</p>
            </div>
            <div className="use-case-card">
              <h3>📱 Mobile Apps</h3>
              <p>Develop cross-platform mobile applications that work seamlessly on iOS and Android.</p>
            </div>
            <div className="use-case-card">
              <h3>🔌 APIs & Services</h3>
              <p>Build robust APIs and microservices to power your applications and integrations.</p>
            </div>
            <div className="use-case-card">
              <h3>🤖 AI Integrations</h3>
              <p>Integrate AI capabilities into your projects with smart recommendations and automation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community & Learning Section */}
      <section className="community-section">
        <div className="container">
          <div className="community-content">
            <div className="community-text">
              <h2>Join Our Growing Community</h2>
              <p>Connect with fellow developers, share your projects, and learn from the community. Get the latest updates, tips, and discussions about AI-powered development.</p>
              <div className="community-actions">
                <a href="/blog" className="btn btn-primary">
                  📝 Community Blog
                </a>
                <a href="/tutorials" className="btn btn-secondary">
                  🎥 Watch Tutorials
                </a>
              </div>
            </div>
            <div className="community-stats">
              <div className="stat-card">
                <div className="stat-number">10K+</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">500+</div>
                <div className="stat-label">Projects Built</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">24/7</div>
                <div className="stat-label">AI Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Building?</h2>
            <p>Join thousands of developers who are already using AutoDevelop.ai to bring their ideas to life.</p>
            <div className="cta-actions">
              <button 
                className={`btn btn-primary btn-large ${isNavigating ? 'loading' : ''}`} 
                onClick={() => handleNavigation('/chat')}
                disabled={isNavigating}
              >
                {isNavigating ? '⏳ Loading...' : '🚀 Start Building Now'}
              </button>
              <button 
                className={`btn btn-secondary btn-large ${isNavigating ? 'loading' : ''}`} 
                onClick={() => handleNavigation('/tutorials')}
                disabled={isNavigating}
              >
                {isNavigating ? '⏳ Loading...' : '📚 Learn How It Works'}
              </button>
            </div>
            <p className="cta-note">No credit card required • Free to start • Upgrade anytime</p>
          </div>
        </div>
      </section>
    </div>
  );
}