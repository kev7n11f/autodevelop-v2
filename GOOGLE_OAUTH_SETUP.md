# Google OAuth Setup Guide for AutoDevelop.ai (ARCHIVED)

> **⚠️ IMPORTANT**: This authentication method has been replaced with a custom email/password system. This documentation is preserved for future reference and restoration if needed. See `CUSTOM_AUTH_SYSTEM.md` for the current authentication system.

## Restoration Status

Google OAuth has been **archived** but not deleted. To restore it:

1. Follow the restoration guide in `CUSTOM_AUTH_SYSTEM.md`
2. Uncomment the archived code in the backend and frontend
3. Configure the environment variables below
4. Update the frontend to include Google OAuth alongside custom authentication

---

## Original Documentation (ARCHIVED)

This guide explains how to set up Google OAuth authentication for the AutoDevelop.ai application.

## Overview

The application previously included a complete Google OAuth 2.0 authentication system with:

- **Backend**: Express.js with Passport.js for OAuth handling
- **Frontend**: React with authentication context and components
- **Database**: SQLite with users and sessions tables
- **Security**: JWT tokens, secure cookies, CSRF protection

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Node.js and npm installed
3. The AutoDevelop.ai application running locally

## Step 1: Create Google OAuth Credentials

### 1.1 Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Enter project name: `autodevelop-oauth`
4. Click "Create"

### 1.2 Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API" and enable it
3. Also enable "People API" for profile access

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (for public access) or "Internal" (for organization only)
3. Fill in the required fields:
   - **App name**: AutoDevelop.ai
   - **User support email**: Your email
   - **Developer contact email**: Your email
   - **Authorized domains**: Add `localhost` for development
4. Add scopes: `../auth/userinfo.email` and `../auth/userinfo.profile`
5. Save and continue

### 1.4 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Name: "AutoDevelop.ai Web Client"
5. **Authorized JavaScript origins**:
   - `http://localhost:5173` (frontend)
   - `http://localhost:8080` (backend)
6. **Authorized redirect URIs**:
   - `http://localhost:8080/api/auth/google/callback`
7. Click "Create"
8. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Environment Variables

Create or update your `.env` file in the project root:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret_minimum_64_characters_recommended
JWT_EXPIRES_IN=7d

# Session Configuration
SESSION_SECRET=your_secure_session_secret_change_in_production

# Frontend URL (for CORS and redirects)
FRONTEND_URL=http://localhost:5173

# Other existing environment variables...
OPENAI_API_KEY=your_openai_key_here
# ... rest of your config
```

## Step 3: Production Deployment

For production deployment, update your environment variables:

### 3.1 Update Redirect URIs

In your Google Cloud Console OAuth credentials:

1. Add your production domains to **Authorized JavaScript origins**:
   - `https://yourdomain.com`
   - `https://api.yourdomain.com`

2. Add your production callback to **Authorized redirect URIs**:
   - `https://api.yourdomain.com/api/auth/google/callback`

### 3.2 Update Environment Variables

```bash
# Production Google OAuth
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/auth/google/callback
FRONTEND_URL=https://yourdomain.com

# Generate secure secrets
JWT_SECRET=your_production_jwt_secret_64_chars_minimum
SESSION_SECRET=your_production_session_secret
```

## Step 4: Test the Authentication Flow

1. Start your backend server:
   ```bash
   npm run dev
   # or
   npm start
   ```

2. Navigate to `http://localhost:5173`

3. Click "Sign In" in the navigation

4. Click "Continue with Google"

5. Complete the Google OAuth flow

6. You should be redirected back with user authentication

## Authentication Flow Details

### Backend Endpoints

- `GET /api/auth/google` - Initiates Google OAuth
- `GET /api/auth/google/callback` - Handles OAuth callback
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/logout` - Log out user
- `POST /api/auth/refresh` - Refresh JWT token

### Frontend Components

- `AuthContext` - React context for authentication state
- `Login` - Login page with Google OAuth button
- `UserProfile` - User profile dropdown with logout
- `AuthService` - API service for authentication calls

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  locale TEXT,
  verified_email BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table
CREATE TABLE user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Security Features

### Implemented Security Measures

1. **CSRF Protection**: State parameter validation in OAuth flow
2. **Secure Cookies**: HTTP-only, secure, SameSite cookies
3. **JWT Tokens**: Signed tokens with expiration
4. **Session Management**: Database-stored sessions with cleanup
5. **Rate Limiting**: Existing rate limiting applies to auth endpoints
6. **CORS Configuration**: Proper CORS setup for frontend-backend communication

### Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS in Production**: Always use HTTPS for OAuth in production
3. **Token Rotation**: Implement refresh token rotation
4. **Session Cleanup**: Regular cleanup of expired sessions
5. **Audit Logging**: Log authentication events for security monitoring

## Troubleshooting

### Common Issues

1. **"invalid_client" Error**:
   - Check that Client ID and Secret are correct
   - Verify authorized origins and redirect URIs
   - Ensure the Google+ API is enabled

2. **CORS Errors**:
   - Check FRONTEND_URL environment variable
   - Verify CORS configuration in server.js

3. **Session Issues**:
   - Check JWT_SECRET is set and consistent
   - Verify database tables are created
   - Check cookie settings for your domain

### Debug Mode

Enable debug logging by setting:
```bash
LOG_LEVEL=debug
```

### Testing Authentication

Test the auth status endpoint:
```bash
curl http://localhost:8080/api/auth/status
```

Should return:
```json
{
  "authenticated": false,
  "user": null
}
```

## Next Steps

1. **Email Verification**: Add email verification for new users
2. **Profile Management**: Allow users to update their profiles  
3. **Two-Factor Authentication**: Add 2FA for enhanced security
4. **Social Login**: Add other OAuth providers (GitHub, LinkedIn)
5. **Admin Panel**: User management interface for administrators

## Support

For issues with Google OAuth setup:
1. Check the [Google OAuth 2.0 documentation](https://developers.google.com/identity/protocols/oauth2)
2. Review the [Google Cloud Console](https://console.cloud.google.com) settings
3. Verify your redirect URIs match exactly (including http/https and ports)

The authentication system is now fully functional and ready for production use with proper Google OAuth credentials!