# AutoDevelop.ai v2 - GitHub Copilot Instructions

AutoDevelop.ai v2 is a full-stack AI-powered development platform built with Node.js, Express.js, React, and Vite. The platform features Google OAuth authentication, Stripe payment integration, OpenAI chat functionality, email services, and a comprehensive usage tracking system with paywall enforcement.

**ALWAYS follow these instructions first and fallback to additional search and context gathering only when the information provided here is incomplete or found to be in error.**

## Working Effectively

### Port Usage
- **Backend API**: http://localhost:8080 (production and development)
- **Frontend Dev**: http://localhost:5173 (development server with HMR)
- **Frontend Preview**: http://localhost:4173 (production build preview)

### Bootstrap and Dependencies
- Install all project dependencies:
  ```bash
  npm run install:all
  ```
  - **TIMING**: Takes ~14-21 seconds. NEVER CANCEL.
  - **DESCRIPTION**: Installs both root and frontend dependencies using npm
  - **EXPECTED**: May show deprecated package warnings - these are normal and non-blocking

### Build Commands
- Build frontend for production:
  ```bash
  npm run build
  ```
  - **TIMING**: Takes ~2 seconds. Very fast build process.
  - **DESCRIPTION**: Builds React frontend with Vite bundler into `frontend/dist/`

- Build frontend only (alternative):
  ```bash
  npm run build:frontend
  ```

### Development Server
- Start both backend and frontend in development mode:
  ```bash
  npm run dev
  ```
  - **TIMING**: Takes ~2-3 seconds to start both services. NEVER CANCEL.
  - **DESCRIPTION**: Uses concurrently to run nodemon for backend and Vite dev server for frontend
  - **ENDPOINTS**: 
    - Backend API: http://localhost:8080
    - Frontend: http://localhost:5173

- Start backend only:
  ```bash
  npm start
  ```
  - **TIMING**: Takes ~1-2 seconds to start. NEVER CANCEL.
  - **DESCRIPTION**: Runs backend server in production mode
  - **EXPECTED**: Will show database initialization messages - this is normal

### Code Quality and Validation
- Run linting:
  ```bash
  npm run lint
  ```
  - **TIMING**: Takes <1 second
  - **DESCRIPTION**: Runs ESLint on frontend code
  - **EXPECTED**: May show warning about AuthContext.jsx export - this is normal
  - **ALWAYS run before committing changes**

### Testing and Validation
- Run comprehensive paywall functionality test:
  ```bash
  node test-paywall-final.js
  ```
  - **TIMING**: Takes ~30-45 seconds due to rate limiting delays. NEVER CANCEL.
  - **DESCRIPTION**: Tests API endpoints, usage limits, and payment integration
  - **REQUIREMENT**: Backend server must be running first
  - **EXPECTED**: Will show "OpenAI API error" messages - this is normal with test keys

- Run slower paywall test (avoids rate limits):
  ```bash
  node test-paywall-slow.js
  ```
  - **TIMING**: Takes ~60-90 seconds. NEVER CANCEL.

### Preview Production Build
- Preview built frontend locally:
  ```bash
  npm run preview
  ```
  - **DESCRIPTION**: Serves the built frontend from `frontend/dist/`
  - **PORT**: Runs on http://localhost:4173 (different from dev server)

## Environment Setup

### Required Environment Variables
Copy `.env.example` to `.env` and configure:

**CRITICAL**: The following environment variables are required for full functionality:
```bash
# Copy the template first
cp .env.example .env
```

**Required for Chat Functionality**:
- `OPENAI_API_KEY` - OpenAI API key for chat functionality
- `JWT_SECRET` - Minimum 64 characters for secure tokens
- `SESSION_SECRET` - Secure session management

**Required for Authentication**:
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

**Optional but Recommended**:
- `STRIPE_SECRET_KEY` - Stripe integration for payments
- `SENDGRID_API_KEY` - Email functionality
- `ADMIN_KEY` - Access to admin monitoring endpoints

### Test Configuration
For development/testing, use placeholder values:
```bash
OPENAI_API_KEY=test-key-for-development
ADMIN_KEY=test-admin-key-12345
JWT_SECRET=test-jwt-secret-minimum-64-chars-for-secure-token-generation-12345
SESSION_SECRET=test-session-secret-change-in-production-environment-12345
```

## Validation and Testing Requirements

### Manual Validation Scenarios
**ALWAYS test these scenarios after making changes**:

1. **Server Health Check**:
   ```bash
   curl http://localhost:8080/
   ```
   - **EXPECTED**: JSON response with `"status":"healthy"`

2. **Frontend Loading**:
   - Navigate to http://localhost:5173
   - **EXPECTED**: Homepage loads with "Transform Ideas into Reality" header
   - **EXPECTED**: Navigation menu with Chat, About, Contact, Privacy, Terms links
   - **EXPECTED**: AI Development Assistant section visible

3. **API Functionality**:
   - **ALWAYS** run the comprehensive paywall test after backend changes:
   ```bash
   # Start server first (in background or separate terminal)
   npm start &
   # Wait 3 seconds for startup
   sleep 3
   # Run test
   node test-paywall-final.js
   # Clean up
   pkill -f "node backend/server.js"
   ```
   - **EXPECTED**: All tests pass with "QUALITY CONTROL PASSED" message

4. **Build Validation**:
   ```bash
   npm run build && npm run preview
   ```
   - **EXPECTED**: Build completes successfully and preview server starts

### Critical Testing Notes
- **NEVER CANCEL** long-running commands - builds and tests are designed to complete
- **ALWAYS** wait for server startup (1-2 seconds) before running tests
- **RATE LIMITING**: Test scripts include delays to avoid hitting rate limits
- **DATABASE**: SQLite database auto-initializes on first run

## Project Structure and Key Locations

### Backend (`backend/`)
- `server.js` - Main Express.js application entry point
- `controllers/` - API route handlers (bot, auth, payment, admin)
- `routes/` - Express route definitions
- `middleware/` - Security, rate limiting, and request processing
- `utils/` - Database, logging, authentication utilities

### Frontend (`frontend/`)
- `src/App.jsx` - Main React application component
- `src/components/` - Reusable React components
- `src/pages/` - Page-level components
- `src/bot/` - AI chat interface components
- `src/contexts/` - React context providers (auth, theme)
- `public/` - Static assets

### Configuration Files
- `package.json` - Root package configuration with npm scripts
- `frontend/package.json` - Frontend-specific dependencies
- `vercel.json` - Vercel deployment configuration
- `.env.example` - Environment variable template

### Important Files to Monitor
- **After changing authentication**: Always check `backend/utils/passport.js` and `backend/controllers/authController.js`
- **After changing API contracts**: Always check corresponding frontend API service files
- **After changing payment flow**: Always check `backend/controllers/paymentController.js` and run paywall tests
- **After changing database schema**: Always check `backend/utils/database.js`

## Common Development Tasks

### Adding New API Endpoints
1. Add route handler in `backend/controllers/`
2. Register route in `backend/routes/apiRoutes.js`
3. Update frontend API service if needed
4. Test endpoint with curl or browser
5. Run lint and build validation

### Modifying Frontend Components
1. Edit React components in `frontend/src/`
2. Test in development mode: `npm run dev`
3. Check browser console for errors
4. Build and preview: `npm run build && npm run preview`
5. Run linting: `npm run lint`

### Database Changes
1. Modify schema in `backend/utils/database.js`
2. Database auto-migrates on server startup
3. Test with fresh server start: `npm start`
4. Validate with paywall tests

## Deployment and Production

### Vercel Deployment
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/dist`
- **API Routes**: Handled by serverless functions

### Build Process
1. Frontend builds with Vite into `frontend/dist/`
2. Static files served directly
3. API routes proxy to backend or serverless functions

## Troubleshooting

### Common Issues and Solutions

**"Port 8080 already in use"**:
```bash
pkill -f "node backend/server.js" || pkill -f "nodemon" || true
# Wait a moment for cleanup
sleep 2
```

**"Dependencies not found"**:
```bash
npm run install:all
```

**"Build fails"**:
```bash
cd frontend && npm install && npm run build
```

**"Tests failing"**:
- Ensure server is running: `npm start`
- Wait 3 seconds for full startup
- Check .env configuration

**"OpenAI API errors in tests"**:
- This is expected behavior when using test API keys
- Paywall should still trigger correctly after 5 requests

### Performance Notes
- **Frontend build**: Extremely fast (~2 seconds)
- **Backend startup**: Very quick (~1-2 seconds) 
- **Test execution**: Designed with rate limiting delays
- **Dependencies**: Modern versions, well-maintained

## Package Management
- **CRITICAL**: This project uses **npm exclusively**
- **DO NOT** use yarn commands - they will cause conflicts
- All scripts in package.json use npm
- Frontend package.json also uses npm

## Security and Configuration
- **Rate limiting**: Built-in protection against abuse
- **CORS**: Configured for frontend-backend communication
- **Authentication**: Google OAuth with JWT tokens
- **Session management**: Express sessions with secure cookies
- **Environment variables**: Never commit secrets to git

---

**Remember**: Always validate your changes with the manual testing scenarios above. The comprehensive test suite and fast build times make it easy to verify that changes work correctly.