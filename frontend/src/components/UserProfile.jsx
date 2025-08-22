import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserProfile.css';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="user-profile">
      <div className="profile-trigger" onClick={toggleDropdown}>
        <img 
          src={user.avatarUrl || '/default-avatar.png'} 
          alt={user.name}
          className="profile-avatar"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f46e5&color=ffffff&size=32`;
          }}
        />
        <span className="profile-name">{user.name}</span>
        <svg 
          className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} 
          width="16" 
          height="16" 
          viewBox="0 0 16 16"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
        </svg>
      </div>

      {isDropdownOpen && (
        <>
          <div className="dropdown-overlay" onClick={() => setIsDropdownOpen(false)} />
          <div className="profile-dropdown">
            <div className="dropdown-header">
              <img 
                src={user.avatarUrl || '/default-avatar.png'} 
                alt={user.name}
                className="dropdown-avatar"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f46e5&color=ffffff&size=48`;
                }}
              />
              <div className="dropdown-user-info">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                {user.verifiedEmail && (
                  <span className="verified-badge">
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <path d="M4.5 7.5L2 5l-1 1 3.5 3.5L10 4l-1-1-4.5 4.5z" fill="currentColor"/>
                    </svg>
                    Verified
                  </span>
                )}
              </div>
            </div>

            <div className="dropdown-content">
              <div className="account-details">
                <div className="detail-item">
                  <span className="detail-label">Member since:</span>
                  <span className="detail-value">{formatDate(user.createdAt)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Last login:</span>
                  <span className="detail-value">{formatDate(user.lastLoginAt)}</span>
                </div>
                {user.locale && (
                  <div className="detail-item">
                    <span className="detail-label">Locale:</span>
                    <span className="detail-value">{user.locale}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="dropdown-actions">
              <button className="dropdown-action-btn secondary">
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <path d="M8 2a6 6 0 110 12 6 6 0 010-12zm0 1a5 5 0 100 10 5 5 0 000-10zm0 2a1 1 0 011 1v2h2a1 1 0 010 2H9v2a1 1 0 01-2 0V8H5a1 1 0 010-2h2V4a1 1 0 011-1z" fill="currentColor"/>
                </svg>
                Account Settings
              </button>
              <button className="dropdown-action-btn danger" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 16 16">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l2-4A1 1 0 0016 6H6.28l-.31-1.243A1 1 0 005 4H3zM7 12a2 2 0 11-4 0 2 2 0 014 0zM15 12a2 2 0 11-4 0 2 2 0 014 0z" fill="currentColor"/>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}