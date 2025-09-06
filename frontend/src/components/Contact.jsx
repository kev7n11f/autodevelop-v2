import { useState } from 'react';
import './Pages.css';
import SEO, { composeTitle } from './SEO';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (submitError) setSubmitError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // Simulate API call - in production this would be a real endpoint
      const response = await fetch('/api/email/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        console.log('Contact form submitted successfully');
        
        // Reset form after 5 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setFormData({ name: '', email: '', subject: '', message: '' });
        }, 5000);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitError('Failed to send message. Please try again or contact us directly at support@autodevelop.ai');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content">
  <SEO title={composeTitle('Contact')} description="Contact AutoDevelop.ai for support, partnership, or questions about our AI-powered development platform." url="https://autodevelop.ai/contact" />
      <div className="page-header">
        <h1>Contact Us</h1>
        <p className="page-subtitle">Ready to bring your ideas to life? Get in touch with our team.</p>
      </div>

      <div className="contact-container">
        <div className="contact-info">
          <div className="info-card">
            <div className="info-icon">💬</div>
            <h3>Chat with AI</h3>
            <p>Get instant help with your development questions using our AI assistant.</p>
            <a href="/" className="btn btn-secondary">Start Chat</a>
          </div>

          <div className="info-card">
            <div className="info-icon">📧</div>
            <h3>Email Support</h3>
            <p>Send us a detailed message and we'll get back to you within 24 hours.</p>
            <a href="mailto:support@autodevelop.ai" className="contact-link">support@autodevelop.ai</a>
          </div>

          <div className="info-card">
            <div className="info-icon">🚀</div>
            <h3>Enterprise Solutions</h3>
            <p>Looking for custom AI development solutions for your business?</p>
            <a href="mailto:enterprise@autodevelop.ai" className="contact-link">enterprise@autodevelop.ai</a>
          </div>

          <div className="info-card">
            <div className="info-icon">🐛</div>
            <h3>Bug Reports</h3>
            <p>Found an issue? Help us improve by reporting bugs and technical problems.</p>
            <a href="mailto:bugs@autodevelop.ai" className="contact-link">bugs@autodevelop.ai</a>
          </div>
        </div>

        <div className="contact-form-container">
          <div className="content-card">
            <h2>Send us a Message</h2>
            <p>Fill out the form below and we'll get back to you as soon as possible.</p>

            {isSubmitted ? (
              <div className="success-message">
                <div className="success-icon">✅</div>
                <h3>Message Sent Successfully!</h3>
                <p>Thank you for reaching out. We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                {submitError && (
                  <div className="error-message">
                    <strong>Error:</strong> {submitError}
                  </div>
                )}
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="feature">Feature Request</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="feedback">Feedback</option>
                    <option value="bug">Bug Report</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows="6"
                    placeholder="Tell us about your project, question, or how we can help you..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary submit-btn ${isSubmitting ? 'submitting' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <span>🚀</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="faq-section">
        <div className="content-card">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>How does AutoDevelop.ai work?</h3>
              <p>Our AI assistant helps you build applications step-by-step, providing code, guidance, and best practices tailored to your specific needs.</p>
            </div>
            <div className="faq-item">
              <h3>Is AutoDevelop.ai free to use?</h3>
              <p>We offer a free tier with basic features. Premium plans provide advanced capabilities and priority support.</p>
            </div>
            <div className="faq-item">
              <h3>What programming languages do you support?</h3>
              <p>We support all major programming languages including JavaScript, Python, React, Node.js, and many more.</p>
            </div>
            <div className="faq-item">
              <h3>How can I get faster responses?</h3>
              <p>Premium subscribers get priority support with faster response times and access to advanced AI features.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
