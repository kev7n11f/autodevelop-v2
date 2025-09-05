# Custom Authentication System

This document describes the new custom authentication system that has replaced Google OAuth as the primary authentication method for AutoDevelop.ai.

## Overview

The application now uses a custom email/password authentication system instead of Google OAuth. The Google OAuth code has been preserved and can be easily restored if needed in the future.

## Features

### User Registration
- Email and password-based registration
- Password strength validation (minimum 8 characters, uppercase, lowercase, number, special character)
- Secure password hashing using bcrypt with 12 salt rounds
- Email format validation
- Duplicate email detection

### User Login
- Email and password authentication
- Secure password verification
- JWT token generation for session management
- HTTP-only secure cookies for token storage
- Session management with refresh token support

### Security Features
- **Password Hashing**: Uses bcrypt with 12 salt rounds
- **JWT Tokens**: Signed tokens with configurable expiration (default 7 days)
- **Secure Cookies**: HTTP-only, secure (in production), SameSite protection
- **Session Management**: Database-stored sessions with automatic cleanup
- **Input Validation**: Server-side validation for all user inputs
- **CSRF Protection**: Protected against cross-site request forgery

## API Endpoints

### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/refresh` - Refresh JWT token

### Request/Response Examples

#### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": null,
    "verifiedEmail": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": null,
    "verifiedEmail": false,
    "lastLoginAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Database Schema Changes

The `users` table has been updated to support both authentication methods:

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE,              -- Optional, for Google OAuth users
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,                 -- For custom auth users
  name TEXT NOT NULL,
  avatar_url TEXT,
  locale TEXT,
  verified_email BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Frontend Changes

### Login Component
- Complete redesign with registration and login forms
- Form validation with real-time error feedback
- Toggle between login and registration modes
- Password strength requirements display
- Error handling with user-friendly messages

### AuthService
- New methods: `register()` and `login()`
- Removed `loginWithGoogle()` method (preserved in comments)
- Enhanced error handling and response formatting

### AuthContext
- Updated to support custom authentication
- New methods: `register()` and `login()`
- Preserved Google OAuth method in comments for future restoration

## Restoring Google OAuth

If you need to restore Google OAuth functionality in the future, follow these steps:

### Backend Changes
1. **Uncomment Google OAuth strategy** in `backend/utils/passport.js`
2. **Uncomment Google OAuth routes** in `backend/routes/authRoutes.js`
3. **Uncomment Google OAuth callback handler** in `backend/controllers/authController.js`
4. **Update import statements** to include the `googleCallback` function

### Frontend Changes
1. **Uncomment Google OAuth methods** in `frontend/src/services/AuthService.js`
2. **Uncomment Google OAuth methods** in `frontend/src/contexts/AuthContext.jsx`
3. **Update Login component** to include Google OAuth button alongside custom forms
4. **Update AuthContext** to include `loginWithGoogle` in the context value

### Environment Variables
Ensure these environment variables are set:
```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:8080/api/auth/google/callback
```

### Database Compatibility
The current database schema supports both authentication methods. Users created with custom authentication will have `google_id` as NULL, while Google OAuth users will have `password_hash` as NULL.

## Migration Notes

### Existing Users
- Google OAuth users can continue to use their existing accounts
- The system supports both authentication methods simultaneously
- No data migration is required

### Development
- The development server includes both backend and frontend automatically
- Use `npm run dev` to start both servers
- Authentication endpoints are available at `http://localhost:8080/api/auth/`

### Production Deployment
- Ensure secure environment variables are set
- Use HTTPS in production for secure cookie transmission
- Consider implementing email verification for new registrations
- Set up proper session cleanup and monitoring

## Testing

### Backend Testing
Run the authentication test script:
```bash
node test-auth.js
```

This will test:
- User registration with validation
- User login with credentials
- Error handling for invalid inputs

### Frontend Testing
1. Start the development server: `npm run dev`
2. Navigate to `http://localhost:5173`
3. Test registration with various inputs
4. Test login with created credentials
5. Verify form validation and error messages

## Security Considerations

1. **Password Storage**: Never store plain text passwords
2. **Token Security**: Use HTTP-only cookies for token storage
3. **Session Management**: Implement proper session cleanup
4. **Input Validation**: Always validate inputs on both client and server
5. **Rate Limiting**: Consider implementing rate limiting for auth endpoints
6. **HTTPS**: Always use HTTPS in production
7. **Environment Variables**: Keep secrets secure and never commit them

## Support

For questions about the authentication system:
- Check the code comments in the auth-related files
- Review the API endpoint documentation above
- Test with the provided test scripts
- Consult the Google OAuth restoration guide if needed