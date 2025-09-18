# AutoDevelop.ai v2 - Serverless Architecture

This repository contains the serverless implementation of AutoDevelop.ai, built with modern JWT-based authentication, Stripe billing, and scalable cloud architecture.

## 🚀 Architecture Overview

- **Authentication**: JWT-based stateless authentication with Argon2 password hashing
- **Database**: DynamoDB for user data, sessions, and subscriptions
- **Payments**: Stripe integration with webhooks for subscription management
- **Deployment**: AWS Lambda functions via Serverless Framework
- **API Gateway**: RESTful endpoints with CORS support
- **Validation**: Joi-based input validation and sanitization

## 📦 Project Structure

```
src/
├── functions/          # AWS Lambda functions
│   ├── auth.js        # Authentication endpoints
│   ├── payments.js    # Stripe payment handling
│   ├── stripe-webhook.js # Stripe webhook processor
│   └── api.js         # Protected API endpoints
├── utils/             # Shared utilities
│   ├── dynamodb.js    # Database operations
│   ├── jwt.js         # JWT token management
│   ├── password.js    # Password hashing & validation
│   ├── stripe.js      # Stripe service integration
│   └── validation.js  # Input validation schemas
└── middleware/        # Express-style middleware
    └── auth.js        # Authentication middleware

backend/               # Legacy Express.js backend (for comparison)
frontend/              # React frontend application
tests/                 # Test suites
serverless.yml         # AWS deployment configuration
```

## 🛠 Setup & Installation

### Prerequisites

- Node.js 18+
- AWS Account (for deployment)
- Stripe Account (for payments)
- OpenAI API Key (for chat functionality)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd autodevelop-v2
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Required environment variables:**
   ```env
   # Authentication
   JWT_SECRET=your-64-character-secret
   
   # Database (for AWS deployment)
   AWS_REGION=us-east-1
   DYNAMODB_TABLE_USERS=autodevelop-v2-dev-users
   DYNAMODB_TABLE_SESSIONS=autodevelop-v2-dev-sessions
   DYNAMODB_TABLE_SUBSCRIPTIONS=autodevelop-v2-dev-subscriptions
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRO_PRICE_ID=price_...
   
   # OpenAI
   OPENAI_API_KEY=sk-...
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

4. **Run tests:**
   ```bash
   npm run test:serverless     # Unit tests
   npm run test:integration    # Integration tests
   ```

5. **Start development server:**
   ```bash
   npm run dev:serverless      # Serverless offline
   # OR
   npm run dev                 # Traditional Express server
   ```

## 🚀 Deployment

### AWS Lambda Deployment

1. **Configure AWS credentials:**
   ```bash
   aws configure
   # OR set environment variables:
   # AWS_ACCESS_KEY_ID=...
   # AWS_SECRET_ACCESS_KEY=...
   ```

2. **Deploy to development:**
   ```bash
   npm run deploy:dev
   ```

3. **Deploy to production:**
   ```bash
   npm run deploy:prod
   ```

### Vercel Deployment (Alternative)

For simpler deployment without AWS Lambda:

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Configure environment variables in Vercel dashboard**

## 📋 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout
- `GET /auth/status` - Authentication status

### Payments
- `GET /payments/tiers` - Get pricing tiers
- `POST /payments/checkout` - Create checkout session
- `GET /payments/subscription` - Get user subscription
- `POST /payments/portal` - Create billing portal session

### Protected API
- `GET /api/health` - Health check
- `POST /api/chat` - AI chat (requires auth)
- `GET /api/chat/suggestions` - Chat suggestions
- `GET /api/profile` - User profile (requires auth)

### Webhooks
- `POST /payments/stripe/webhook` - Stripe webhook handler

## 🧪 Testing

### Unit Tests
```bash
npm run test:serverless
```
Tests core utilities (JWT, password hashing, validation)

### Integration Tests
```bash
npm run test:integration
```
Tests complete authentication and payment flows

### Manual Testing
```bash
# Test authentication flow
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","name":"Test User"}'

curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```

## 🔒 Security Features

- **JWT Authentication**: Stateless tokens with configurable expiration
- **Password Security**: Argon2 hashing with strong validation rules
- **Input Validation**: Joi schemas with XSS protection
- **Rate Limiting**: Per-user request throttling
- **CORS Configuration**: Secure cross-origin resource sharing
- **Webhook Verification**: Stripe signature validation
- **Environment Security**: Secure secret management

## 🏗 Database Schema

### DynamoDB Tables

**Users Table:**
- Primary Key: `id` (String)
- GSI: `email` (String)
- Attributes: `name`, `passwordHash`, `isVerified`, `createdAt`, `lastLoginAt`

**Sessions Table:**
- Primary Key: `sessionId` (String)  
- GSI: `userId` (String)
- TTL: `expiresAt` (Number)
- Attributes: `refreshToken`, `createdAt`, `ipAddress`, `userAgent`

**Subscriptions Table:**
- Primary Key: `userId` (String)
- GSI: `stripeCustomerId` (String)
- Attributes: `stripeSubscriptionId`, `planId`, `status`, `currentPeriodStart`, `currentPeriodEnd`

## 📈 Monitoring & Logging

- **CloudWatch**: AWS Lambda function logs
- **Structured Logging**: JSON format with correlation IDs
- **Error Tracking**: Comprehensive error handling
- **Performance Metrics**: Request duration and success rates
- **Health Checks**: Database and service connectivity

## 🔄 Migration from Express.js

The serverless implementation maintains API compatibility with the original Express.js backend:

- Same endpoint URLs and request/response formats
- JWT tokens work interchangeably
- Database schema migration tools included
- Gradual migration path available

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and add tests
4. Run tests: `npm run test:serverless && npm run test:integration`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Documentation: [Wiki](link-to-wiki)
- Issues: [GitHub Issues](link-to-issues)
- Community: [Discord Server](link-to-discord)

---

Built with ❤️ for the developer community