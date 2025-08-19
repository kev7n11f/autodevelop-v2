import { useState } from 'react';
import './MailingListModal.css';

export default function MailingListModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    optIn: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/mailing-list/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        // Auto-close modal after 3 seconds
        setTimeout(() => {
          onClose();
          setIsSubmitted(false);
          setFormData({ name: '', email: '', optIn: false });
        }, 3000);
      } else {
        setError(data.details || data.error || 'Subscription failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setError('');
      setFormData({ name: '', email: '', optIn: false });
      setIsSubmitted(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose} aria-label="Close modal">
          ×
        </button>
        
        <div className="modal-header">
          <div className="modal-icon">📧</div>
          <h2>Stay Updated with AutoDevelop.ai</h2>
          <p>Join our mailing list to receive the latest updates, features, and AI development insights.</p>
        </div>

        {isSubmitted ? (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h3>Thank you for subscribing!</h3>
            <p>Please check your email to confirm your subscription. You'll receive our latest updates and insights soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="modal-name">Full Name *</label>
              <input
                type="text"
                id="modal-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter your full name"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="modal-email">Email Address *</label>
              <input
                type="email"
                id="modal-email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email address"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="optIn"
                  checked={formData.optIn}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitting}
                />
                <span className="checkmark"></span>
                <span className="checkbox-text">
                  I agree to receive updates and promotional emails from AutoDevelop.ai. 
                  You can unsubscribe at any time. View our{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
                </span>
              </label>
            </div>

            <div className="modal-benefits">
              <h4>What you'll receive:</h4>
              <ul>
                <li>🚀 Product updates and new feature announcements</li>
                <li>💡 AI development tips and best practices</li>
                <li>🔐 Early access to beta features</li>
                <li>📈 Community insights and success stories</li>
              </ul>
            </div>

            <button
              type="submit"
              className={`btn btn-primary submit-btn ${isSubmitting ? 'submitting' : ''}`}
              disabled={isSubmitting || !formData.optIn}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner"></span>
                  Subscribing...
                </>
              ) : (
                'Subscribe to Updates'
              )}
            </button>

            <p className="privacy-note">
              We respect your privacy. No spam, and you can unsubscribe at any time.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}