import React, { useState } from 'react';
import SEO, { composeTitle } from './SEO';
import './Pages.css';

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const blogPosts = [
    {
      id: 1,
      title: "Getting Started with AI-Powered Development",
      excerpt: "Learn the fundamentals of using AI to accelerate your development workflow and build better applications.",
      content: `
        <p>Welcome to the exciting world of AI-powered development! In this comprehensive guide, we'll walk you through the fundamentals of leveraging artificial intelligence to accelerate your development workflow and build better applications.</p>
        
        <h3>What is AI-Powered Development?</h3>
        <p>AI-powered development refers to the integration of artificial intelligence tools and techniques into the software development lifecycle. This includes code generation, automated testing, intelligent debugging, and much more.</p>
        
        <h3>Getting Started with AutoDevelop.ai</h3>
        <p>AutoDevelop.ai provides an intuitive platform that makes AI-powered development accessible to developers of all skill levels. Here's how to get started:</p>
        
        <ol>
          <li><strong>Sign up for a free account</strong> - No credit card required</li>
          <li><strong>Explore the chat interface</strong> - Start with simple prompts to understand the capabilities</li>
          <li><strong>Try building a small project</strong> - Follow our step-by-step tutorials</li>
          <li><strong>Join the community</strong> - Connect with other developers and share your experiences</li>
        </ol>
        
        <h3>Best Practices</h3>
        <p>To get the most out of AI-powered development, follow these best practices:</p>
        <ul>
          <li>Start with clear, specific prompts</li>
          <li>Always review and test generated code</li>
          <li>Use version control for all your projects</li>
          <li>Continuously learn and adapt your approach</li>
        </ul>
        
        <p>Ready to start your AI-powered development journey? <a href="/chat">Try AutoDevelop.ai now</a> and see the difference it can make in your workflow!</p>
      `,
      author: "AutoDevelop Team",
      date: "2024-12-15",
      category: "tutorials",
      readTime: "5 min read",
      featured: true
    },
    {
      id: 2,
      title: "Community Showcase: Amazing Projects Built with AutoDevelop.ai",
      excerpt: "Explore inspiring projects created by our community members and get ideas for your next build.",
      content: `
        <p>Our community continues to amaze us with the incredible projects they're building using AutoDevelop.ai. Today, we're showcasing some of the most innovative and inspiring creations from our users.</p>
        
        <h3>Featured Projects</h3>
        
        <h4>🌱 EcoTracker - Environmental Impact Dashboard</h4>
        <p>Built by Sarah M., this web application helps users track their daily environmental impact. The app features real-time data visualization, personalized recommendations, and social sharing capabilities.</p>
        <p><em>"AutoDevelop.ai helped me prototype this idea in just a few hours. The AI suggestions for data visualization were particularly helpful!"</em> - Sarah</p>
        
        <h4>🎵 MelodyMaker - AI Music Composition Tool</h4>
        <p>Created by the duo Alex and Jamie, this innovative tool uses AI to help musicians compose melodies and harmonies. It includes MIDI export and integration with popular DAWs.</p>
        
        <h4>📚 StudyBuddy - Collaborative Learning Platform</h4>
        <p>Developed by a team of college students, this platform connects learners worldwide and provides AI-powered study recommendations based on learning patterns.</p>
        
        <h3>Community Stats</h3>
        <ul>
          <li>Over 10,000 projects created</li>
          <li>50+ countries represented</li>
          <li>Average project completion time: 3 days</li>
          <li>95% user satisfaction rate</li>
        </ul>
        
        <p>Want to showcase your project? <a href="/contact">Contact us</a> or share it in our community discussions!</p>
      `,
      author: "Community",
      date: "2024-12-12",
      category: "showcase",
      readTime: "8 min read",
      featured: false
    },
    {
      id: 3,
      title: "Best Practices for AI-Assisted Code Reviews",
      excerpt: "Discover how to leverage AI for more effective code reviews and maintain high-quality codebases.",
      content: `
        <p>Code reviews are a critical part of the development process, and AI can significantly enhance their effectiveness. In this article, we'll explore best practices for incorporating AI into your code review workflow.</p>
        
        <h3>Why AI-Assisted Code Reviews?</h3>
        <p>AI-assisted code reviews offer several advantages:</p>
        <ul>
          <li>Faster identification of potential issues</li>
          <li>Consistent review standards across the team</li>
          <li>Reduced human bias in reviews</li>
          <li>Better learning opportunities for junior developers</li>
        </ul>
        
        <h3>Implementation Strategies</h3>
        
        <h4>1. Automated Static Analysis</h4>
        <p>Use AI tools to automatically scan code for common issues like security vulnerabilities, performance bottlenecks, and style violations.</p>
        
        <h4>2. Intelligent Suggestions</h4>
        <p>Leverage AI to provide contextual suggestions for code improvements, including refactoring opportunities and optimization techniques.</p>
        
        <h4>3. Learning from History</h4>
        <p>Train AI models on your team's previous code reviews to understand your specific standards and preferences.</p>
        
        <h3>Human-AI Collaboration</h3>
        <p>Remember that AI should augment, not replace, human reviewers. The best results come from combining AI efficiency with human creativity and domain expertise.</p>
        
        <p>Ready to implement AI-assisted code reviews in your workflow? <a href="/tutorials">Check out our detailed tutorials</a> for step-by-step guidance.</p>
      `,
      author: "Dev Team",
      date: "2024-12-10",
      category: "best-practices",
      readTime: "6 min read",
      featured: false
    },
    {
      id: 4,
      title: "Building Your First Web App: A Step-by-Step Guide",
      excerpt: "Complete walkthrough of creating a web application from concept to deployment using AutoDevelop.ai.",
      content: `
        <p>Ready to build your first web application with AutoDevelop.ai? This comprehensive guide will take you through every step of the process, from initial concept to live deployment.</p>
        
        <h3>Step 1: Planning Your Application</h3>
        <p>Before writing any code, it's important to plan your application. Consider:</p>
        <ul>
          <li>What problem does your app solve?</li>
          <li>Who is your target audience?</li>
          <li>What features are essential vs. nice-to-have?</li>
          <li>What technology stack makes sense?</li>
        </ul>
        
        <h3>Step 2: Setting Up Your Development Environment</h3>
        <p>AutoDevelop.ai makes this process incredibly simple. Just start a conversation and describe what you want to build!</p>
        
        <h3>Step 3: Building Core Features</h3>
        <p>Work iteratively, building one feature at a time:</p>
        <ol>
          <li>User authentication and registration</li>
          <li>Core application logic</li>
          <li>User interface and user experience</li>
          <li>Data storage and management</li>
          <li>API integrations (if needed)</li>
        </ol>
        
        <h3>Step 4: Testing and Debugging</h3>
        <p>Use AI-powered testing tools to ensure your application works correctly across different scenarios and edge cases.</p>
        
        <h3>Step 5: Deployment</h3>
        <p>Choose a hosting platform and deploy your application. Popular options include Vercel, Netlify, and Heroku.</p>
        
        <h3>Example Project: Todo List App</h3>
        <p>Let's build a simple todo list application to demonstrate these concepts in action. This app will include user authentication, task management, and real-time updates.</p>
        
        <p>Ready to start building? <a href="/chat">Launch AutoDevelop.ai</a> and begin your web development journey today!</p>
      `,
      author: "AutoDevelop Team",
      date: "2024-12-08",
      category: "tutorials",
      readTime: "12 min read",
      featured: true
    },
    {
      id: 5,
      title: "Community Discussion: Future of AI in Development",
      excerpt: "Join the conversation about where AI development tools are heading and share your thoughts.",
      content: `
        <p>The landscape of software development is rapidly evolving with the integration of artificial intelligence. As we look toward the future, it's important to discuss where AI development tools are heading and what this means for developers worldwide.</p>
        
        <h3>Current Trends in AI Development</h3>
        <p>We're seeing several exciting trends emerge:</p>
        <ul>
          <li><strong>Code Generation</strong> - AI can now generate complete functions and even entire applications</li>
          <li><strong>Intelligent Debugging</strong> - AI helps identify and fix bugs faster than ever</li>
          <li><strong>Automated Testing</strong> - Comprehensive test suites generated automatically</li>
          <li><strong>Documentation</strong> - AI creates clear, helpful documentation as you code</li>
        </ul>
        
        <h3>What's Next?</h3>
        <p>Looking ahead, we anticipate several breakthrough developments:</p>
        
        <h4>Natural Language Programming</h4>
        <p>Soon, developers might describe complex applications in plain English, and AI will handle the implementation details.</p>
        
        <h4>Predictive Development</h4>
        <p>AI will anticipate what features you need before you even think of them, based on user behavior and industry trends.</p>
        
        <h4>Cross-Platform Intelligence</h4>
        <p>AI will seamlessly translate ideas across different platforms and programming languages.</p>
        
        <h3>Community Perspectives</h3>
        <p>We want to hear from you! What are your thoughts on the future of AI in development? What challenges do you see? What opportunities excite you most?</p>
        
        <h3>Join the Discussion</h3>
        <p>Share your thoughts in the comments below or join our community forum to engage with other developers from around the world.</p>
        
        <p><strong>Discussion Questions:</strong></p>
        <ul>
          <li>How has AI already changed your development workflow?</li>
          <li>What concerns do you have about increasing AI automation?</li>
          <li>What AI development features would you like to see next?</li>
        </ul>
      `,
      author: "Community",
      date: "2024-12-05",
      category: "discussions",
      readTime: "3 min read",
      featured: false
    }
  ];

  const categories = [
    { id: 'all', label: 'All Posts', icon: '📝' },
    { id: 'tutorials', label: 'Tutorials', icon: '📚' },
    { id: 'showcase', label: 'Showcase', icon: '🌟' },
    { id: 'discussions', label: 'Discussions', icon: '💬' },
    { id: 'best-practices', label: 'Best Practices', icon: '⚡' }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPosts = blogPosts.filter(post => post.featured);

  const handleReadMore = (post) => {
    setSelectedPost(post);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPost(null);
  };

  const handleWritePost = () => {
    alert('Write a Post feature coming soon! This will allow community members to contribute their own blog posts and tutorials.');
  };

  const handleJoinDiscussions = () => {
    alert('Join Discussions feature coming soon! This will provide a forum-style interface for community discussions.');
  };

  const handleShareProject = () => {
    alert('Share Your Project feature coming soon! This will allow you to showcase your AutoDevelop.ai projects to the community.');
  };

  return (
    <div className="page-container">
      <SEO 
        title={composeTitle('Community Blog')} 
        description="Join the AutoDevelop.ai community. Read tutorials, share projects, and engage in discussions about AI-powered development." 
        pathname="/blog" 
      />
      
      {/* Header Section */}
      <section className="blog-header">
        <div className="container">
          <h1 className="page-title">Community Blog</h1>
          <p className="page-subtitle">
            Connect, learn, and share with the AutoDevelop.ai community. 
            Discover tutorials, project showcases, and join discussions about the future of AI development.
          </p>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="featured-posts-section">
          <div className="container">
            <h2 className="section-title">Featured Posts</h2>
            <div className="featured-posts-grid">
              {featuredPosts.map(post => (
                <article key={post.id} className="featured-post-card">
                  <div className="post-content">
                    <div className="post-meta">
                      <span className="post-category">{post.category}</span>
                      <span className="post-read-time">{post.readTime}</span>
                    </div>
                    <h3 className="post-title">{post.title}</h3>
                    <p className="post-excerpt">{post.excerpt}</p>
                    <div className="post-footer">
                      <span className="post-author">By {post.author}</span>
                      <span className="post-date">{new Date(post.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Filter */}
      <section className="blog-filter-section">
        <div className="container">
          <div className="category-filters">
            {categories.map(category => (
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

      {/* Blog Posts */}
      <section className="blog-posts-section">
        <div className="container">
          <div className="blog-posts-grid">
            {filteredPosts.map(post => (
              <article key={post.id} className="blog-post-card">
                <div className="post-content">
                  <div className="post-meta">
                    <span className="post-category">{post.category}</span>
                    <span className="post-read-time">{post.readTime}</span>
                  </div>
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-excerpt">{post.excerpt}</p>
                  <div className="post-footer">
                    <span className="post-author">By {post.author}</span>
                    <span className="post-date">{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                  <button className="read-more-btn" onClick={() => handleReadMore(post)}>Read More →</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Community Participation */}
      <section className="community-participation">
        <div className="container">
          <div className="participation-content">
            <h2>Join the Conversation</h2>
            <p>Have something to share? We'd love to hear from you!</p>
            <div className="participation-actions">
              <button className="btn btn-primary" onClick={handleWritePost}>
                ✍️ Write a Post
              </button>
              <button className="btn btn-secondary" onClick={handleJoinDiscussions}>
                💬 Join Discussions
              </button>
              <button className="btn btn-secondary" onClick={handleShareProject}>
                🎯 Share Your Project
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Post Modal */}
      {showModal && selectedPost && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content blog-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h1>{selectedPost.title}</h1>
              <button className="modal-close" onClick={closeModal} aria-label="Close modal">
                ✕
              </button>
            </div>
            <div className="modal-meta">
              <span className="post-author">By {selectedPost.author}</span>
              <span className="post-date">{new Date(selectedPost.date).toLocaleDateString()}</span>
              <span className="post-read-time">{selectedPost.readTime}</span>
              <span className="post-category">{selectedPost.category}</span>
            </div>
            <div className="modal-body">
              <div 
                className="blog-content" 
                dangerouslySetInnerHTML={{ __html: selectedPost.content }}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>
                ← Back to Blog
              </button>
              <div className="post-actions">
                <button className="btn btn-primary" onClick={handleJoinDiscussions}>
                  💬 Discuss This Post
                </button>
                <button className="btn btn-secondary" onClick={handleShareProject}>
                  🔗 Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}