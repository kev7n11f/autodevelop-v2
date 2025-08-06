import './Pages.css';

export default function About() {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1>About AutoDevelop.ai</h1>
        <p className="page-subtitle">Empowering developers and entrepreneurs to bring their ideas to life with AI-powered assistance.</p>
      </div>

      <div className="about-hero">
        <div className="content-card">
          <div className="hero-content">
            <div className="hero-text">
              <h2>🚀 Our Mission</h2>
              <p>
                At AutoDevelop.ai, we believe that great ideas shouldn't be limited by technical barriers. 
                Our AI-powered platform democratizes software development, making it accessible to everyone 
                from seasoned developers to entrepreneurs with no coding experience.
              </p>
              <p>
                We're not just building tools – we're creating a future where anyone can transform 
                their vision into reality with the power of artificial intelligence as their guide.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2 className="section-title">What Makes Us Different</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered Guidance</h3>
            <p>Our advanced AI understands your goals and provides step-by-step guidance, code examples, and best practices tailored to your specific project.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Rapid Prototyping</h3>
            <p>Go from idea to working prototype in hours, not weeks. Our AI helps you build faster while maintaining code quality and best practices.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Personalized Learning</h3>
            <p>Learn as you build. Our AI adapts to your skill level and provides explanations, tutorials, and resources that match your learning style.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔧</div>
            <h3>Full-Stack Support</h3>
            <p>From frontend design to backend architecture, database design to deployment – we support every aspect of modern application development.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Security First</h3>
            <p>Built with security and privacy in mind. Your code and ideas are protected with enterprise-grade security measures.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🌍</div>
            <h3>Community Driven</h3>
            <p>Join a growing community of builders, entrepreneurs, and developers who are shaping the future of AI-assisted development.</p>
          </div>
        </div>
      </div>

      <div className="story-section">
        <div className="content-card">
          <h2>Our Story</h2>
          <p>
            AutoDevelop.ai was born from the frustration of seeing great ideas never come to life due to technical barriers. 
            Our founders, a team of experienced developers and AI researchers, witnessed countless entrepreneurs and creators 
            struggle to translate their visions into working applications.
          </p>
          <p>
            We realized that while AI was becoming incredibly powerful, it wasn't being used to its full potential to 
            democratize software development. That's when we decided to build a platform that could bridge the gap 
            between imagination and implementation.
          </p>
          <p>
            Today, AutoDevelop.ai is helping thousands of users worldwide turn their ideas into reality, from simple 
            websites to complex applications. We're just getting started on our mission to make development accessible to everyone.
          </p>
        </div>
      </div>

      <div className="values-section">
        <h2 className="section-title">Our Values</h2>
        <div className="values-grid">
          <div className="value-item">
            <h3>🎯 User-Centric</h3>
            <p>Every feature we build starts with understanding our users' needs and challenges.</p>
          </div>
          <div className="value-item">
            <h3>🚀 Innovation</h3>
            <p>We constantly push the boundaries of what's possible with AI and development tools.</p>
          </div>
          <div className="value-item">
            <h3>🤝 Accessibility</h3>
            <p>Technology should be accessible to everyone, regardless of their technical background.</p>
          </div>
          <div className="value-item">
            <h3>🔒 Privacy</h3>
            <p>Your ideas and code are yours. We're committed to protecting your privacy and intellectual property.</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="content-card cta-card">
          <h2>Ready to Build Something Amazing?</h2>
          <p>Join thousands of creators who are already using AutoDevelop.ai to bring their ideas to life.</p>
          <div className="cta-buttons">
            <a href="/" className="btn btn-primary">Start Building Now</a>
            <a href="/contact" className="btn btn-secondary">Get in Touch</a>
          </div>
        </div>
      </div>
    </div>
  );
}
