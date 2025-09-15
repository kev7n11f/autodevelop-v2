import React, { useState } from 'react';
import SEO, { composeTitle } from './SEO';
import './Pages.css';

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const blogPosts = [
    {
      id: 1,
      title: "Getting Started with AI-Powered Development",
      excerpt: "Learn the fundamentals of using AI to accelerate your development workflow and build better applications.",
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
                  <button className="read-more-btn">Read More →</button>
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
              <button className="btn btn-primary" disabled title="Coming Soon">
                ✍️ Write a Post (Coming Soon)
              </button>
              <button className="btn btn-secondary" disabled title="Coming Soon">
                💬 Join Discussions (Coming Soon)
              </button>
              <button className="btn btn-secondary" disabled title="Coming Soon">
                🎯 Share Your Project (Coming Soon)
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}