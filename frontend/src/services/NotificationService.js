// NotificationService for handling payment notifications

class NotificationService {
  constructor() {
    // Use environment variable if available, otherwise fallback to localhost
    this.apiBase = (typeof process !== 'undefined' && process.env?.REACT_APP_API_URL) || 'http://localhost:8080/api';
  }

  // Get user's subscription status
  async getSubscription(userId) {
    try {
      const response = await fetch(`${this.apiBase}/payments/subscription/${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        return data.subscription;
      } else {
        console.error('Failed to get subscription:', data.error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }
  }

  // Create a new subscription
  async createSubscription(subscriptionData) {
    try {
      const response = await fetch(`${this.apiBase}/payments/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return data.subscription;
      } else {
        throw new Error(data.details || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Simulate payment webhook (for demo purposes)
  async simulatePaymentEvent(eventData) {
    try {
      const response = await fetch(`${this.apiBase}/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return data;
      } else {
        throw new Error(data.details || 'Failed to process payment event');
      }
    } catch (error) {
      console.error('Error simulating payment event:', error);
      throw error;
    }
  }

  // Generate mock notifications for demo purposes
  generateMockNotifications() {
    const mockEvents = [
      {
        type: 'payment_success',
        message: 'Your payment of $29.99 for Pro plan has been processed successfully.',
        timestamp: Date.now(),
      },
      {
        type: 'renewal_upcoming',
        message: 'Your subscription will renew in 3 days on January 20th, 2025.',
        timestamp: Date.now() - 3600000, // 1 hour ago
      },
      {
        type: 'payment_failed',
        message: 'Payment failed for your Pro subscription. Please update your payment method.',
        timestamp: Date.now() - 7200000, // 2 hours ago
      }
    ];

    // Randomly select 1-2 notifications to show
    const numNotifications = Math.floor(Math.random() * 2) + 1;
    return mockEvents.slice(0, numNotifications).map((event, index) => ({
      id: index + 1,
      ...event,
      read: false
    }));
  }

  // Store notification preferences in localStorage
  setNotificationPreferences(preferences) {
    localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
  }

  getNotificationPreferences() {
    const stored = localStorage.getItem('notificationPreferences');
    return stored ? JSON.parse(stored) : {
      paymentSuccess: true,
      paymentFailed: true,
      renewalReminder: true,
      emailNotifications: true
    };
  }

  // Mark notifications as read
  markNotificationsAsRead(notificationIds) {
    const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
    const updated = [...new Set([...dismissed, ...notificationIds])];
    localStorage.setItem('dismissedNotifications', JSON.stringify(updated));
  }

  getDismissedNotifications() {
    return JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
  }

  // Clear all dismissed notifications (useful for demo reset)
  clearDismissedNotifications() {
    localStorage.removeItem('dismissedNotifications');
  }
}

export default new NotificationService();