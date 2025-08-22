import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Helmet } from 'react-helmet';
import BotUI from './components/BotUI';
import About from './components/About';
import Contact from './components/Contact';
import Privacy from './components/Privacy';
import TermsOfService from './components/TermsOfService';
import MailingListModal from './components/MailingListModal';
import NotificationBar from './components/NotificationBar';
import AdminEmailList from './components/AdminEmailList';
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

function SEO({ title, description }) {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
    </Helmet>
  );
}

function FloatingUpgradeButton() {
  async function handleUpgrade() {
    const userId = localStorage.getItem('userId') || 'demo-user';
    const email = localStorage.getItem('userEmail') || 'demo@autodevelop.ai';
    const name = localStorage.getItem('userName') || 'Demo User';
    try {
      const res = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email, name })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Failed to start checkout. Please try again.');
      }
    } catch (e) {
      alert('Network error. Please try again.');
    }
  }
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

async function handleUpgrade() {
  // In a real app, get userId/email from auth/user context
  const userId = localStorage.getItem('userId') || 'demo-user';
  const email = localStorage.getItem('userEmail') || 'demo@autodevelop.ai';
  const name = localStorage.getItem('userName') || 'Demo User';
  try {
    const res = await fetch('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email, name })
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Failed to start checkout. Please try again.');
    }
  } catch (e) {
    alert('Network error. Please try again.');
  }
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

  const location = window.location.pathname;
  let seoTitle = 'AutoDevelop.ai – AI-Powered App Builder & Coding Assistant';
  let seoDesc = 'Turn your ideas into reality with AI-powered coding, rapid prototyping, and secure, privacy-first development.';
  if (location === '/about') {
    seoTitle = 'About – AutoDevelop.ai';
    seoDesc = 'Learn about AutoDevelop.ai, our mission, and how we empower developers and entrepreneurs with AI.';
  } else if (location === '/contact') {
    seoTitle = 'Contact – AutoDevelop.ai';
    seoDesc = 'Contact AutoDevelop.ai for support, partnership, or questions about our AI-powered development platform.';
  } else if (location === '/privacy') {
    seoTitle = 'Privacy Policy – AutoDevelop.ai';
    seoDesc = 'Read the privacy policy for AutoDevelop.ai. Learn how we protect your data and respect your privacy.';
  } else if (location === '/terms') {
    seoTitle = 'Terms of Service – AutoDevelop.ai';
    seoDesc = 'Review the terms of service for using AutoDevelop.ai and our AI-powered development tools.';
  }

  return (
    <Router>
      <SEO title={seoTitle} description={seoDesc} />
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
        <FloatingUpgradeButton />
      </div>
    </Router>
  );
}