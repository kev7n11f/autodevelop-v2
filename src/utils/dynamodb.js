const AWS = require('aws-sdk');
const logger = require('../../backend/utils/logger');

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1'
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const TABLES = {
  USERS: process.env.DYNAMODB_TABLE_USERS || 'autodevelop-v2-dev-users',
  SESSIONS: process.env.DYNAMODB_TABLE_SESSIONS || 'autodevelop-v2-dev-sessions',
  SUBSCRIPTIONS: process.env.DYNAMODB_TABLE_SUBSCRIPTIONS || 'autodevelop-v2-dev-subscriptions'
};

class DynamoDBService {
  constructor() {
    this.client = dynamoDB;
    this.tables = TABLES;
  }

  // User operations
  async createUser(userData) {
    const params = {
      TableName: this.tables.USERS,
      Item: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        passwordHash: userData.passwordHash,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
        isVerified: false,
        ...userData
      },
      ConditionExpression: 'attribute_not_exists(email)'
    };

    try {
      await this.client.put(params).promise();
      return params.Item;
    } catch (error) {
      if (error.code === 'ConditionalCheckFailedException') {
        throw new Error('User with this email already exists');
      }
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    const params = {
      TableName: this.tables.USERS,
      Key: { id: userId }
    };

    try {
      const result = await this.client.get(params).promise();
      return result.Item;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    const params = {
      TableName: this.tables.USERS,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    };

    try {
      const result = await this.client.query(params).promise();
      return result.Items[0];
    } catch (error) {
      logger.error('Error getting user by email:', error);
      throw error;
    }
  }

  async updateUserLastLogin(userId) {
    const params = {
      TableName: this.tables.USERS,
      Key: { id: userId },
      UpdateExpression: 'SET lastLoginAt = :timestamp',
      ExpressionAttributeValues: {
        ':timestamp': new Date().toISOString()
      }
    };

    try {
      await this.client.update(params).promise();
    } catch (error) {
      logger.error('Error updating user last login:', error);
      throw error;
    }
  }

  // Session operations
  async createSession(sessionData) {
    const params = {
      TableName: this.tables.SESSIONS,
      Item: {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        refreshToken: sessionData.refreshToken,
        createdAt: new Date().toISOString(),
        expiresAt: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days TTL
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent
      }
    };

    try {
      await this.client.put(params).promise();
      return params.Item;
    } catch (error) {
      logger.error('Error creating session:', error);
      throw error;
    }
  }

  async getSession(sessionId) {
    const params = {
      TableName: this.tables.SESSIONS,
      Key: { sessionId }
    };

    try {
      const result = await this.client.get(params).promise();
      return result.Item;
    } catch (error) {
      logger.error('Error getting session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId) {
    const params = {
      TableName: this.tables.SESSIONS,
      Key: { sessionId }
    };

    try {
      await this.client.delete(params).promise();
    } catch (error) {
      logger.error('Error deleting session:', error);
      throw error;
    }
  }

  async deleteUserSessions(userId) {
    try {
      // First, get all sessions for the user
      const params = {
        TableName: this.tables.SESSIONS,
        IndexName: 'UserIdIndex',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      };

      const result = await this.client.query(params).promise();
      
      // Delete each session
      for (const session of result.Items) {
        await this.deleteSession(session.sessionId);
      }
    } catch (error) {
      logger.error('Error deleting user sessions:', error);
      throw error;
    }
  }

  // Subscription operations
  async createSubscription(subscriptionData) {
    const params = {
      TableName: this.tables.SUBSCRIPTIONS,
      Item: {
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
      }
    };

    try {
      await this.client.put(params).promise();
      return params.Item;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  async getSubscription(userId) {
    const params = {
      TableName: this.tables.SUBSCRIPTIONS,
      Key: { userId }
    };

    try {
      const result = await this.client.get(params).promise();
      return result.Item;
    } catch (error) {
      logger.error('Error getting subscription:', error);
      throw error;
    }
  }

  async getSubscriptionByCustomerId(stripeCustomerId) {
    const params = {
      TableName: this.tables.SUBSCRIPTIONS,
      IndexName: 'StripeCustomerIndex',
      KeyConditionExpression: 'stripeCustomerId = :customerId',
      ExpressionAttributeValues: {
        ':customerId': stripeCustomerId
      }
    };

    try {
      const result = await this.client.query(params).promise();
      return result.Items[0];
    } catch (error) {
      logger.error('Error getting subscription by customer ID:', error);
      throw error;
    }
  }

  async updateSubscription(userId, updateData) {
    const updateExpression = [];
    const expressionAttributeValues = {};
    
    Object.keys(updateData).forEach(key => {
      updateExpression.push(`${key} = :${key}`);
      expressionAttributeValues[`:${key}`] = updateData[key];
    });
    
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    updateExpression.push('updatedAt = :updatedAt');

    const params = {
      TableName: this.tables.SUBSCRIPTIONS,
      Key: { userId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues
    };

    try {
      const result = await this.client.update(params).promise();
      return result.Attributes;
    } catch (error) {
      logger.error('Error updating subscription:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      // Simple health check - list tables
      const params = {
        TableName: this.tables.USERS,
        Limit: 1
      };
      
      await this.client.scan(params).promise();
      return { healthy: true, database: 'DynamoDB' };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return { healthy: false, database: 'DynamoDB', error: error.message };
    }
  }
}

module.exports = new DynamoDBService();