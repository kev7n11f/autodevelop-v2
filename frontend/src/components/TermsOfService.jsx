import './Pages.css';

export default function TermsOfService() {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Terms of Service</h1>
        <p className="page-subtitle">These terms govern your use of AutoDevelop.ai and our AI-powered development platform.</p>
      </div>

      <div className="content-card">
        <div className="privacy-section">
          <h2>🤝 Agreement to Terms</h2>
          <p>
            By accessing or using AutoDevelop.ai, you agree to be bound by these Terms of Service and our Privacy Policy. 
            If you do not agree to these terms, please do not use our services.
          </p>
        </div>

        <div className="privacy-section">
          <h3>Service Description</h3>
          <p>AutoDevelop.ai provides an AI-powered development platform that assists users in building software applications through:</p>
          <ul className="styled-list">
            <li>AI-guided development assistance and code generation</li>
            <li>Project templates and development frameworks</li>
            <li>Best practices guidance and recommendations</li>
            <li>Interactive chat-based development support</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h3>User Accounts and Responsibilities</h3>
          <ul className="styled-list">
            <li>You must provide accurate information when creating an account</li>
            <li>You are responsible for maintaining the security of your credentials</li>
            <li>You must be at least 13 years old to use our services</li>
            <li>You are responsible for all activities under your account</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h3>Acceptable Use Policy</h3>
          <p><strong>Permitted Uses:</strong></p>
          <ul className="styled-list">
            <li>Legitimate software development and learning projects</li>
            <li>Building commercial applications (subject to license terms)</li>
            <li>Educational and research purposes</li>
          </ul>
          <p><strong>Prohibited Uses:</strong></p>
          <ul className="styled-list">
            <li>Generating malicious code, malware, or security exploits</li>
            <li>Creating applications that violate laws or infringe IP rights</li>
            <li>Attempting to reverse engineer or compromise our systems</li>
            <li>Using the service to harass, abuse, or harm others</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h3>Intellectual Property Rights</h3>
          <p><strong>Your Content:</strong></p>
          <ul className="styled-list">
            <li>You retain ownership of code and content you create</li>
            <li>We process your content only to provide our services</li>
            <li>We do not claim ownership of your projects</li>
          </ul>
          <p><strong>Generated Content:</strong></p>
          <ul className="styled-list">
            <li>AI-generated code is provided under the MIT License</li>
            <li>You are responsible for ensuring compliance with applicable laws</li>
            <li>We make no warranties about originality or non-infringement</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h3>Service Availability and Limitations</h3>
          <ul className="styled-list">
            <li>We strive for high availability but cannot guarantee 100% uptime</li>
            <li>Free tier users are subject to rate limits and usage quotas</li>
            <li>We may perform maintenance that temporarily interrupts service</li>
            <li>We reserve the right to modify features with appropriate notice</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h3>Privacy and Data Protection</h3>
          <p>
            Your privacy is important to us. Please review our <a href="/privacy">Privacy Policy</a>, which explains 
            how we collect, use, and protect your information. By using our services, you consent to our data 
            practices as described in the Privacy Policy.
          </p>
        </div>

        <div className="privacy-section">
          <h3>Disclaimers and Limitations</h3>
          <ul className="styled-list">
            <li>Our services are provided "as is" without warranties</li>
            <li>We do not guarantee accuracy of AI-generated content</li>
            <li>You are responsible for testing and validating generated code</li>
            <li>Our liability is limited to the amount you paid for the service</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h3>Third-Party Services</h3>
          <p>
            Our platform integrates with third-party AI services (such as OpenAI) to provide enhanced functionality. 
            These services are governed by their own terms and policies. We are not responsible for third-party 
            service availability or performance.
          </p>
        </div>

        <div className="privacy-section">
          <h3>Account Termination</h3>
          <p>
            You may terminate your account at any time. We may suspend or terminate accounts that violate these Terms, 
            engage in fraudulent activities, or fail to pay required fees. Termination does not relieve you of obligations 
            incurred prior to termination.
          </p>
        </div>

        <div className="privacy-section">
          <h3>Modifications to Terms</h3>
          <p>
            We may update these Terms from time to time. Significant changes will be communicated via email or platform 
            notification. Continued use after changes constitutes acceptance of new Terms.
          </p>
        </div>

        <div className="privacy-section">
          <h3>Governing Law</h3>
          <p>
            These Terms are governed by applicable laws, without regard to conflict of law principles. 
            We encourage resolving disputes through direct communication.
          </p>
        </div>

        <div className="privacy-section">
          <h3>Contact Information</h3>
          <p>For questions about these Terms of Service, please contact us:</p>
          <ul className="styled-list">
            <li><strong>Legal:</strong> legal@autodevelop.ai</li>
            <li><strong>Support:</strong> <a href="mailto:support@autodevelop.ai">support@autodevelop.ai</a></li>
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
