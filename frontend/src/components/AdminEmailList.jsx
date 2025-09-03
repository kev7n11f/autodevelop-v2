import { useState, useEffect } from 'react';
import './AdminEmailList.css';
import SEO, { composeTitle } from './SEO';

export default function AdminEmailList() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminKey, setAdminKey] = useState('');

  const fetchEmailListStats = async (key) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fixed endpoint path (removed erroneous 'payments' segment)
      const response = await fetch('/api/mailing-list/stats', {
        headers: {
          'x-admin-key': key
        }
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Invalid admin key. Please check your credentials.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait and try again.');
        } else {
          throw new Error(`Failed to fetch email list: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Email list fetch error:', err);
      setError(err.message || 'Failed to load email list. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if admin key is provided
    if (adminKey && adminKey.length > 0) {
      fetchEmailListStats(adminKey);
    } else {
      setLoading(false);
    }
  }, [adminKey]);

  const handleAdminKeySubmit = (e) => {
    e.preventDefault();
    if (adminKey.trim()) {
      fetchEmailListStats(adminKey.trim());
    }
  };

  return (
    <div className="admin-email-list">
  <SEO title={composeTitle('Admin - Email List')} description="Admin interface for mailing list statistics and subscriber management." pathname="/admin/email-list" />
      <div className="admin-header">
        <h2>📧 Email List Administration</h2>
        <p>View mailing list statistics and subscriber information.</p>
      </div>

      {!adminKey && (
        <div className="admin-auth">
          <form onSubmit={handleAdminKeySubmit} className="admin-form">
            <div className="form-group">
              <label htmlFor="admin-key">Admin Key</label>
              <input
                type="password"
                id="admin-key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter admin key to access email list"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={!adminKey.trim()}>
              Access Email List
            </button>
          </form>
        </div>
      )}

      {adminKey && (
        <div className="admin-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading email list statistics...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <div>
                  <h3>Network Error</h3>
                  <p>{error}</p>
                </div>
              </div>
              <div className="error-actions">
                <button 
                  onClick={() => fetchEmailListStats(adminKey)} 
                  className="btn btn-secondary"
                >
                  Retry
                </button>
                <button 
                  onClick={() => {
                    setAdminKey('');
                    setError(null);
                  }} 
                  className="btn btn-outline"
                >
                  Change Admin Key
                </button>
              </div>
            </div>
          )}

          {stats && !loading && !error && (
            <div className="stats-display">
              <div className="stats-card">
                <div className="stat-item">
                  <div className="stat-value">{stats.totalConfirmedSubscribers}</div>
                  <div className="stat-label">Confirmed Subscribers</div>
                </div>
                <div className="stat-meta">
                  <p>Last updated: {new Date(stats.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <div className="admin-note">
                <p><strong>Note:</strong> This interface shows aggregate statistics only. Individual subscriber data is protected for privacy.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}