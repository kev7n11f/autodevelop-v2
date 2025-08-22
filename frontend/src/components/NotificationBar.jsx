import React, { useState, useEffect } from 'react';
import NotificationService from '../services/NotificationService';
import './NotificationBar.css';

const NotificationBar = () => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for notifications on component mount
    const checkNotifications = () => {
      // Get mock notifications for demo
      const mockNotifications = NotificationService.generateMockNotifications();
      const dismissedIds = NotificationService.getDismissedNotifications();
      
      // Filter out already dismissed notifications
      const activeNotifications = mockNotifications.filter(n => !dismissedIds.includes(n.id));
      
      if (activeNotifications.length > 0) {
        setNotifications(activeNotifications);
        setIsVisible(true);
      }
    };

    // Check notifications after a short delay to simulate real-world behavior
    const timer = setTimeout(checkNotifications, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const dismissNotification = (id) => {
    // Mark as dismissed in service
    NotificationService.markNotificationsAsRead([id]);
    
    // Update local state
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notifications.length <= 1) {
      setIsVisible(false);
    }
  };

  const dismissAll = () => {
    // Mark all as dismissed in service
    const allIds = notifications.map(n => n.id);
    NotificationService.markNotificationsAsRead(allIds);
    
    // Update local state
    setNotifications([]);
    setIsVisible(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment_success':
        return '✅';
      case 'payment_failed':
        return '❌';
      case 'renewal_upcoming':
        return '📅';
      case 'subscription_cancelled':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationClass = (type) => {
    switch (type) {
      case 'payment_success':
        return 'notification-success';
      case 'payment_failed':
        return 'notification-error';
      case 'renewal_upcoming':
        return 'notification-info';
      case 'subscription_cancelled':
        return 'notification-warning';
      default:
        return 'notification-info';
    }
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div 
          key={notification.id} 
          className={`notification-bar ${getNotificationClass(notification.type)}`}
        >
          <div className="notification-content">
            <span className="notification-icon">
              {getNotificationIcon(notification.type)}
            </span>
            <span className="notification-message">
              {notification.message}
            </span>
          </div>
          <div className="notification-actions">
            <button 
              className="notification-dismiss"
              onClick={() => dismissNotification(notification.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        </div>
      ))}
      
      {notifications.length > 1 && (
        <div className="notification-footer">
          <button 
            className="dismiss-all-btn"
            onClick={dismissAll}
          >
            Dismiss All
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBar;