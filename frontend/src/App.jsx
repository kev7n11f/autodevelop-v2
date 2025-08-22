import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import BotUI from './components/BotUI';
import About from './components/About';
import Contact from './components/Contact';
import Privacy from './components/Privacy';
import TermsOfService from './components/TermsOfService';
import MailingListModal from './components/MailingListModal';
import NotificationBar from './components/NotificationBar';
import './App.css';

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Chat', icon: '💬' },
    { path: '/about', label: 'About', icon: '📖' },
    { path: '/contact', label: 'Contact', icon: '📧' },
    { path: '/privacy', label: 'Privacy', icon: '🔒' },
    { path: '/terms', label: 'Terms', icon: '📋' },
  ];

  return (
    <nav className="modern-nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🚀</span>
          <span className="logo-text">AutoDevelop.ai</span>
        </Link>
        
        <div className={`nav-menu ${isMenuOpen ? 'nav-menu-open' : ''}`}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'nav-link-active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <button 
          className="nav-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}

function FloatingActionButton() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button className="btn-floating" onClick={scrollToTop} aria-label="Scroll to top">
      ↑
    </button>
  );
}

export default function App() {
  const [isMailingModalOpen, setIsMailingModalOpen] = useState(false);

  // Check for URL parameters for confirmation states
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('confirmed') === 'true') {
      // Show success message - you could add a toast notification here
      console.log('Email confirmed successfully!');
    } else if (urlParams.get('unsubscribed') === 'true') {
      console.log('Successfully unsubscribed');
    }
  }, []);

  // Show modal after a delay for first-time visitors
  useEffect(() => {
    const hasSeenModal = localStorage.getItem('hasSeenMailingModal');
    if (!hasSeenModal) {
      const timer = setTimeout(() => {
        setIsMailingModalOpen(true);
        localStorage.setItem('hasSeenMailingModal', 'true');
      }, 3000); // Show after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Router>
      <div className="app">
        <NotificationBar />
        <Navigation />
        
        <main className="main-content">
          <div className="hero-section">
            <div className="container">
              <div className="hero-content">
                <h1 className="hero-title">
                  Transform Ideas into <span className="gradient-text">Reality</span>
                </h1>
                <p className="hero-subtitle">
                  Use AI to bring your vision to life — step by step, powered by you.
                </p>
                <div className="hero-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setIsMailingModalOpen(true)}
                  >
                    📧 Get Updates
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="content-section">
            <div className="container">
              <Routes>
                <Route path="/" element={<BotUI />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<TermsOfService />} />
              </Routes>
            </div>
          </div>
        </main>

        <footer className="modern-footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-section">
                <h3>AutoDevelop.ai</h3>
                <p>Transforming ideas into reality with AI-powered development.</p>
              </div>
              <div className="footer-section">
                <h4>Quick Links</h4>
                <div className="footer-links">
                  <Link to="/about">About</Link>
                  <Link to="/contact">Contact</Link>
                  <Link to="/privacy">Privacy Policy</Link>
                  <Link to="/terms">Terms of Service</Link>
                </div>
              </div>
              <div className="footer-section">
                <h4>Connect</h4>
                <p>Ready to build something amazing?</p>
                <Link to="/contact" className="btn btn-primary">Get Started</Link>
                <button 
                  className="btn btn-outline"
                  onClick={() => setIsMailingModalOpen(true)}
                  style={{ marginLeft: 'var(--space-2)' }}
                >
                  Subscribe to Updates
                </button>
              </div>
            </div>
            <div className="footer-bottom">
              <p>&copy; 2025 AutoDevelop.ai. All rights reserved.</p>
            </div>
          </div>
        </footer>

        <FloatingActionButton />
        
        <MailingListModal 
          isOpen={isMailingModalOpen}
          onClose={() => setIsMailingModalOpen(false)}
        />
        
        <Analytics />
        <SpeedInsights />
      </div>
    </Router>
  );
}