// Mock DynamoDB implementation for testing without AWS credentials
const logger = require('../../backend/utils/logger');

class MockDynamoDBService {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.subscriptions = new Map();
  }

  // User operations
  async createUser(userData) {
    // Check if user already exists
    for (const [id, user] of this.users) {
      if (user.email === userData.email) {
        throw new Error('User with this email already exists');
      }
    }

    const user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      passwordHash: userData.passwordHash,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      isVerified: false,
      ...userData
    };

    this.users.set(user.id, user);
    return user;
  }

  async getUserById(userId) {
    return this.users.get(userId) || null;
  }

  async getUserByEmail(email) {
    for (const [id, user] of this.users) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async updateUserLastLogin(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      this.users.set(userId, user);
    }
  }

  // Session operations
  async createSession(sessionData) {
    const session = {
      sessionId: sessionData.sessionId,
      userId: sessionData.userId,
      refreshToken: sessionData.refreshToken,
      createdAt: new Date().toISOString(),
      expiresAt: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days TTL
      ipAddress: sessionData.ipAddress,
      userAgent: sessionData.userAgent
    };

    this.sessions.set(session.sessionId, session);
    return session;
  }

  async getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  async deleteSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  async deleteUserSessions(userId) {
    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
      }
    }
  }

  // Subscription operations
  async createSubscription(subscriptionData) {
    const subscription = {
      userId: subscriptionData.userId,
      stripeCustomerId: subscriptionData.stripeCustomerId,
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
      planId: subscriptionData.planId,
      status: subscriptionData.status,
      currentPeriodStart: subscriptionData.currentPeriodStart,
      currentPeriodEnd: subscriptionData.currentPeriodEnd,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...subscriptionData
    };

    this.subscriptions.set(subscription.userId, subscription);
    return subscription;
  }

  async getSubscription(userId) {
    return this.subscriptions.get(userId) || null;
  }

  async getSubscriptionByCustomerId(stripeCustomerId) {
    for (const [userId, subscription] of this.subscriptions) {
      if (subscription.stripeCustomerId === stripeCustomerId) {
        return subscription;
      }
    }
    return null;
  }

  async updateSubscription(userId, updateData) {
    const subscription = this.subscriptions.get(userId);
    if (subscription) {
      const updated = {
        ...subscription,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      this.subscriptions.set(userId, updated);
      return updated;
    }
    return null;
  }

  // Health check
  async healthCheck() {
    return { healthy: true, database: 'Mock DynamoDB' };
  }
}

module.exports = new MockDynamoDBService();