import React, { useState } from 'react';
import SEO, { composeTitle } from './SEO';
import './Pages.css';

export default function TutorialVideos() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const videoCategories = [
    { id: 'all', label: 'All Videos', icon: '🎥' },
    { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
    { id: 'web-development', label: 'Web Development', icon: '🌐' },
    { id: 'mobile-apps', label: 'Mobile Apps', icon: '📱' },
    { id: 'ai-integration', label: 'AI Integration', icon: '🤖' },
    { id: 'deployment', label: 'Deployment', icon: '☁️' }
  ];

  const tutorials = [
    {
      id: 1,
      title: "Welcome to AutoDevelop.ai - Getting Started",
      description: "Learn the basics of AutoDevelop.ai and how to start your first project in under 5 minutes.",
      duration: "4:32",
      category: "getting-started",
      difficulty: "Beginner",
      featured: true,
      thumbnail: "🎬",
      views: "12.5K"
    },
    {
      id: 2,
      title: "Building Your First React App with AI Assistance",
      description: "Step-by-step tutorial on creating a React application using AutoDevelop.ai's intelligent code generation.",
      duration: "15:20",
      category: "web-development",
      difficulty: "Beginner",
      featured: true,
      thumbnail: "⚛️",
      views: "8.2K"
    },
    {
      id: 3,
      title: "Creating REST APIs with AI-Powered Code Generation",
      description: "Learn how to build robust REST APIs quickly using AutoDevelop.ai's backend code generation capabilities.",
      duration: "12:45",
      category: "web-development",
      difficulty: "Intermediate",
      featured: false,
      thumbnail: "🔌",
      views: "6.8K"
    },
    {
      id: 4,
      title: "Mobile App Development: React Native with AI",
      description: "Build cross-platform mobile applications using React Native and AutoDevelop.ai's mobile development tools.",
      duration: "22:18",
      category: "mobile-apps",
      difficulty: "Intermediate",
      featured: true,
      thumbnail: "📱",
      views: "5.4K"
    },
    {
      id: 5,
      title: "Integrating OpenAI APIs into Your Applications",
      description: "Learn how to add AI capabilities to your projects by integrating OpenAI APIs with AutoDevelop.ai.",
      duration: "18:35",
      category: "ai-integration",
      difficulty: "Advanced",
      featured: false,
      thumbnail: "🧠",
      views: "4.9K"
    },
    {
      id: 6,
      title: "Deploying Applications with Vercel and Netlify",
      description: "Master deployment strategies and learn how to deploy your applications to production platforms.",
      duration: "14:52",
      category: "deployment",
      difficulty: "Intermediate",
      featured: false,
      thumbnail: "🚀",
      views: "7.1K"
    },
    {
      id: 7,
      title: "Database Design and Integration Patterns",
      description: "Learn best practices for database design and how to integrate databases into your AutoDevelop.ai projects.",
      duration: "19:43",
      category: "web-development",
      difficulty: "Advanced",
      featured: false,
      thumbnail: "🗄️",
      views: "3.6K"
    },
    {
      id: 8,
      title: "Building Progressive Web Apps (PWAs)",
      description: "Create modern PWAs that work offline and provide native app-like experiences using AutoDevelop.ai.",
      duration: "25:17",
      category: "web-development",
      difficulty: "Advanced",
      featured: false,
      thumbnail: "📲",
      views: "2.8K"
    }
  ];

  const filteredTutorials = selectedCategory === 'all' 
    ? tutorials 
    : tutorials.filter(tutorial => tutorial.category === selectedCategory);

  const featuredTutorials = tutorials.filter(tutorial => tutorial.featured);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#10B981';
      case 'Intermediate': return '#F59E0B';
      case 'Advanced': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div className="page-container">
      <SEO 
        title={composeTitle('Tutorial Videos')} 
        description="Learn AutoDevelop.ai with our comprehensive video tutorials. From beginner guides to advanced techniques." 
        pathname="/tutorials" 
      />
      
      {/* Header Section */}
      <section className="tutorials-header">
        <div className="container">
          <h1 className="page-title">Tutorial Videos</h1>
          <p className="page-subtitle">
            Master AutoDevelop.ai with our comprehensive video library. 
            From beginner-friendly introductions to advanced development techniques.
          </p>
          <div className="tutorials-stats">
            <div className="stat-item">
              <span className="stat-number">{tutorials.length}</span>
              <span className="stat-label">Video Tutorials</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Hours of Content</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">Weekly</span>
              <span className="stat-label">New Videos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tutorials */}
      {featuredTutorials.length > 0 && (
        <section className="featured-tutorials-section">
          <div className="container">
            <h2 className="section-title">Featured Tutorials</h2>
            <div className="featured-tutorials-grid">
              {featuredTutorials.map(tutorial => (
                <div key={tutorial.id} className="featured-tutorial-card">
                  <div className="tutorial-thumbnail">
                    <span className="thumbnail-icon">{tutorial.thumbnail}</span>
                    <span className="tutorial-duration">{tutorial.duration}</span>
                  </div>
                  <div className="tutorial-content">
                    <div className="tutorial-meta">
                      <span 
                        className="difficulty-badge" 
                        style={{ backgroundColor: getDifficultyColor(tutorial.difficulty) }}
                      >
                        {tutorial.difficulty}
                      </span>
                      <span className="view-count">{tutorial.views} views</span>
                    </div>
                    <h3 className="tutorial-title">{tutorial.title}</h3>
                    <p className="tutorial-description">{tutorial.description}</p>
                    <button
                      className={`watch-btn${tutorial.url ? '' : ' watch-btn--disabled'}`}
                      onClick={tutorial.url ? () => window.open(tutorial.url, '_blank', 'noopener,noreferrer') : undefined}
                      disabled={!tutorial.url}
                    >
                      ▶️ Watch Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="tutorials-filter-section">
        <div className="container">
          <div className="category-filters">
            {videoCategories.map(category => (
              <button
                key={category.id}
                className={`category-filter ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <span className="category-icon">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tutorial Grid */}
      <section className="tutorials-grid-section">
        <div className="container">
          <div className="tutorials-grid">
            {filteredTutorials.map(tutorial => (
              <div key={tutorial.id} className="tutorial-card">
                <div className="tutorial-thumbnail">
                  <span className="thumbnail-icon">{tutorial.thumbnail}</span>
                  <span className="tutorial-duration">{tutorial.duration}</span>
                </div>
                <div className="tutorial-info">
                  <div className="tutorial-meta">
                    <span 
                      className="difficulty-badge" 
                      style={{ backgroundColor: getDifficultyColor(tutorial.difficulty) }}
                    >
                      {tutorial.difficulty}
                    </span>
                    <span className="view-count">{tutorial.views} views</span>
                  </div>
                  <h3 className="tutorial-title">{tutorial.title}</h3>
                  <p className="tutorial-description">{tutorial.description}</p>
                  <button
                    className="watch-btn"
                    onClick={() => tutorial.url && window.open(tutorial.url, '_blank')}
                    disabled={!tutorial.url}
                  >
                    ▶️ Watch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Path */}
      <section className="learning-path-section">
        <div className="container">
          <h2 className="section-title">Recommended Learning Path</h2>
          <div className="learning-path">
            <div className="path-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Start with Basics</h3>
                <p>Get familiar with AutoDevelop.ai interface and core concepts</p>
              </div>
            </div>
            <div className="path-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Build Your First Project</h3>
                <p>Follow along with our guided project tutorials</p>
              </div>
            </div>
            <div className="path-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Explore Advanced Features</h3>
                <p>Learn AI integration and advanced development patterns</p>
              </div>
            </div>
            <div className="path-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Deploy to Production</h3>
                <p>Master deployment strategies and best practices</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="tutorial-newsletter">
        <div className="container">
          <div className="newsletter-content">
            <h2>Stay Updated</h2>
            <p>Get notified when we release new tutorials and learning materials.</p>
            <button className="btn btn-primary">
              📧 Subscribe to Updates
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}