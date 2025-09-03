import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { HelmetProvider } from 'react-helmet-async';
import SEO from './components/SEO';
import { AuthProvider } from './contexts/AuthContext';
import BotUI from './components/BotUI';
import About from './components/About';
import Contact from './components/Contact';
import Privacy from './components/Privacy';
import TermsOfService from './components/TermsOfService';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import MailingListModal from './components/MailingListModal';
import NotificationBar from './components/NotificationBar';
import AdminEmailList from './components/AdminEmailList';
import { useAuth } from './contexts/AuthContext';
import { handleUpgrade } from './utils/upgradeUtils';
import './App.css';

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

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
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
          
          <div className="nav-auth">
            {loading ? (
              <div className="nav-loading">Loading...</div>
            ) : isAuthenticated ? (
              <UserProfile />
            ) : (
              <Login />
            )}
          </div>
        </div>

        <button
          className="nav-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
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
  return (
    <button 
      className="floating-action-btn"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
    >
      ↑
    </button>
  );
}

// SEO handled by `components/SEO.jsx`

function FloatingUpgradeButton() {
  return (
    <button
      className="btn btn-primary floating-upgrade-btn"
      style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}
      onClick={handleUpgrade}
      aria-label="Upgrade or Subscribe"
    >
      🚀 Upgrade / Subscribe
    </button>
  );
}

function AppContent() {
  const [isMailingModalOpen, setIsMailingModalOpen] = useState(false);
  const location = useLocation();

  // Check for URL parameters for confirmation states
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    // remove noisy console logs — rely on UI/notification system instead
    if (urlParams.get('confirmed') === 'true') {
      // could fire a notification event here in future
    } else if (urlParams.get('unsubscribed') === 'true') {
      // silent acknowledgement
    }
  }, []);

  // Show modal after a delay for first-time visitors
  useEffect(() => {
    const hasSeenModal = localStorage.getItem('hasSeenMailingModal');
    if (!hasSeenModal) {
      const timer = setTimeout(() => {
        setIsMailingModalOpen(true);
        localStorage.setItem('hasSeenMailingModal', 'true');
      }, 10000); // Show after 10 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  // Dynamic SEO content based on route
  let seoTitle = 'AutoDevelop.ai – AI-Powered Development Platform';
  let seoDesc = 'Transform your ideas into reality with AutoDevelop.ai. Use AI to build applications, websites, and tools step by step.';

  if (location.pathname === '/about') {
    seoTitle = 'About – AutoDevelop.ai';
    seoDesc = 'Learn about AutoDevelop.ai and how our AI-powered platform helps developers and creators build amazing projects.';
  } else if (location.pathname === '/contact') {
    seoTitle = 'Contact – AutoDevelop.ai';
    seoDesc = 'Contact AutoDevelop.ai for support, partnership, or questions about our AI-powered development platform.';
  } else if (location.pathname === '/privacy') {
    seoTitle = 'Privacy Policy – AutoDevelop.ai';
    seoDesc = 'Read the privacy policy for AutoDevelop.ai. Learn how we protect your data and respect your privacy.';
  } else if (location.pathname === '/terms') {
    seoTitle = 'Terms of Service – AutoDevelop.ai';
    seoDesc = 'Review the terms of service for using AutoDevelop.ai and our AI-powered development tools.';
  }

  return (
    <div className="app">
      <SEO title={seoTitle} description={seoDesc} pathname={location.pathname} />
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
                <button
                  className="btn btn-primary"
                  style={{ marginLeft: '1rem' }}
                  onClick={handleUpgrade}
                >
                  🚀 Upgrade / Subscribe
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
              <Route path="/admin/email-list" element={<AdminEmailList />} />
            </Routes>
          </div>
        </div>
      </main>

      <footer className="modern-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <span className="footer-logo">🚀 AutoDevelop.ai</span>
              <p className="footer-tagline">AI-powered development for everyone</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <Link to="/about">About</Link>
                <Link to="/contact">Contact</Link>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/terms">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 AutoDevelop.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <FloatingActionButton />
      <FloatingUpgradeButton />
      
      <MailingListModal 
        isOpen={isMailingModalOpen}
        onClose={() => setIsMailingModalOpen(false)}
      />
      
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}
