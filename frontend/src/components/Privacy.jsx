import './Pages.css';

export default function Privacy() {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Privacy Policy</h1>
        <p className="page-subtitle">Your privacy is important to us. Here's how we protect and handle your data.</p>
      </div>

      <div className="content-card">
        <div className="privacy-section">
          <h2>🔒 Data Protection</h2>
          <p>
            At AutoDevelop.ai, we are committed to protecting your privacy and ensuring the security of your personal information. 
            This Privacy Policy explains how we collect, use, and safeguard your data when you use our AI development platform.
          </p>
        </div>

        <div className="privacy-section">
          <h3>Information We Collect</h3>
          <ul className="styled-list">
            <li><strong>Chat Interactions:</strong> Messages you send to our AI assistant to help improve our service</li>
            <li><strong>Usage Analytics:</strong> Anonymous data about how you interact with our platform</li>
            <li><strong>Technical Information:</strong> IP address, browser type, and device information for security purposes</li>
            <li><strong>Account Information:</strong> Email address and preferences if you create an account</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h3>How We Use Your Information</h3>
          <ul className="styled-list">
            <li>To provide and improve our AI development assistance services</li>
            <li>To personalize your experience and provide relevant suggestions</li>
            <li>To maintain and enhance the security of our platform</li>
            <li>To communicate with you about updates and new features</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h3>Data Security</h3>
          <p>
            We implement industry-standard security measures to protect your data, including:
          </p>
          <ul className="styled-list">
            <li>End-to-end encryption for all communications</li>
            <li>Secure data storage with regular backups</li>
            <li>Regular security audits and monitoring</li>
            <li>Limited access controls for our team members</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h3>Your Rights</h3>
          <p>You have the right to:</p>
          <ul className="styled-list">
            <li>Access your personal data that we have collected</li>
            <li>Request correction of inaccurate or incomplete data</li>
            <li>Request deletion of your personal data</li>
            <li>Opt-out of certain data collection practices</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h3>Cookies and Tracking</h3>
          <p>
            We use essential cookies to ensure our website functions properly. We do not use tracking cookies for advertising purposes. 
            You can disable cookies in your browser settings, though this may affect website functionality.
          </p>
        </div>

        <div className="privacy-section">
          <h3>Third-Party Services</h3>
          <p>
            Our platform may integrate with third-party AI services to provide you with the best development assistance. 
            We ensure that all third-party partners maintain similar privacy standards and data protection measures.
          </p>
        </div>

        <div className="privacy-section">
          <h3>Children's Privacy</h3>
          <p>
            Our service is not intended for children under 13 years of age. We do not knowingly collect personal information 
            from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
          </p>
        </div>

        <div className="privacy-section">
          <h3>Updates to This Policy</h3>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any significant changes by posting 
            the new Privacy Policy on this page and updating the "Last Updated" date below.
          </p>
        </div>

        <div className="privacy-section">
          <h3>Contact Us</h3>
          <p>
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <ul className="styled-list">
            <li><strong>Email:</strong> privacy@autodevelop.ai</li>
            <li><strong>Contact Form:</strong> <a href="/contact">Visit our Contact page</a></li>
          </ul>
        </div>

        <div className="last-updated">
          <p><em>Last Updated: January 2025</em></p>
        </div>
      </div>
    </div>
  );
}
