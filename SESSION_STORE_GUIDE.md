# Session Store Configuration Guide

This document provides instructions for configuring and swapping session stores in the AutoDevelop.ai application.

## Current Configuration

The application currently uses **SQLite** as the session store via `connect-sqlite3`. This provides persistence across server restarts while maintaining simplicity and requiring no external dependencies.

### Default Setup
- **Store Type**: SQLite
- **Database File**: `backend/sessions.db`
- **Table Name**: `sessions`
- **Session TTL**: 10 minutes (for OAuth flow)

## Swapping Session Stores

The session store is configured in `backend/config/sessionStore.js` and can be easily swapped by following these steps:

### 1. Using Environment Variables (Recommended)

Set the `SESSION_STORE` environment variable:

```bash
# For SQLite (default)
SESSION_STORE=sqlite

# For Redis (future)
SESSION_STORE=redis

# For MongoDB (future)
SESSION_STORE=mongo

# For development only
SESSION_STORE=memory
```

### 2. Available Session Stores

#### SQLite (Current - Recommended)
- **Pros**: No external dependencies, persistent, simple setup
- **Cons**: Single server only (not suitable for multi-instance deployments)
- **Use Case**: Single server deployments, development

```javascript
// Already configured - no changes needed
```

#### Redis (Future Implementation)
- **Pros**: High performance, supports clustering, shared across multiple servers
- **Cons**: Requires Redis server
- **Use Case**: Production with multiple server instances

To implement Redis support:

1. Install dependencies:
```bash
npm install connect-redis redis
```

2. Uncomment and configure the Redis case in `sessionStore.js`:
```javascript
case 'redis': {
  const RedisStore = require('connect-redis')(session);
  const redis = require('redis');
  const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  });
  
  client.on('error', (err) => {
    logger.error('Redis session store error', { error: err.message });
  });
  
  return new RedisStore({ client });
}
```

3. Set environment variables:
```bash
SESSION_STORE=redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

#### MongoDB (Future Implementation)
- **Pros**: Document-based storage, good for complex session data
- **Cons**: Requires MongoDB server
- **Use Case**: When already using MongoDB for other data

To implement MongoDB support:

1. Install dependencies:
```bash
npm install connect-mongo
```

2. Uncomment and configure the MongoDB case in `sessionStore.js`:
```javascript
case 'mongo':
case 'mongodb': {
  const MongoStore = require('connect-mongo');
  return MongoStore.create({
    mongoUrl: process.env.MONGODB_SESSION_URL || 'mongodb://localhost:27017/sessions',
    touchAfter: 24 * 3600 // lazy session update
  });
}
```

3. Set environment variables:
```bash
SESSION_STORE=mongo
MONGODB_SESSION_URL=mongodb://localhost:27017/sessions
```

#### Memory Store (Development Only)
- **Pros**: Simple, no setup required
- **Cons**: Lost on server restart, memory leaks in production
- **Use Case**: Development only

```bash
SESSION_STORE=memory
```

### 3. Custom Configuration

For more advanced configurations, modify `backend/config/sessionStore.js`:

```javascript
// Example: Custom TTL per environment
const config = {
  storeType: 'sqlite',
  options: {
    ttl: process.env.NODE_ENV === 'production' ? 
      24 * 60 * 60 * 1000 : // 24 hours in production
      10 * 60 * 1000,       // 10 minutes in development
    sqlite: {
      // Custom SQLite options
      table: 'custom_sessions',
      db: 'custom_sessions.db'
    }
  }
};
```

## Testing Session Store Changes

After changing the session store:

1. Restart the server:
```bash
npm start
```

2. Check the logs for session store initialization:
```
info: Initializing session store {"storeType":"sqlite","environment":"development"}
info: Creating SQLite session store {"dbPath":"...","table":"sessions"}
```

3. Test OAuth functionality (if using OAuth):
   - Visit `/api/auth/google` (or other OAuth endpoints)
   - Verify sessions persist correctly

4. Verify session persistence:
   - Create a session (login or OAuth)
   - Restart the server
   - Verify the session still exists (should work with SQLite, Redis, MongoDB - not with Memory)

## Production Recommendations

### Single Server Deployment
- **Use SQLite**: Simple, reliable, no external dependencies
- Set `SESSION_STORE=sqlite`

### Multi-Server Deployment (Load Balanced)
- **Use Redis**: Shared sessions across all server instances
- Set up Redis cluster for high availability
- Set `SESSION_STORE=redis`

### When Using MongoDB Already
- **Use MongoDB**: Consolidate session storage with existing MongoDB infrastructure
- Set `SESSION_STORE=mongo`

## Troubleshooting

### SQLite Issues
```bash
# Check if database file is writable
ls -la backend/sessions.db

# Check database content
sqlite3 backend/sessions.db ".tables"
sqlite3 backend/sessions.db "SELECT * FROM sessions LIMIT 5;"
```

### Redis Issues
```bash
# Test Redis connection
redis-cli ping

# Check Redis memory usage
redis-cli info memory
```

### MongoDB Issues
```bash
# Test MongoDB connection
mongosh "mongodb://localhost:27017/sessions"

# Check collections
db.sessions.find().limit(5)
```

## Migration Between Stores

When switching session stores, existing sessions will be lost. To minimize impact:

1. **Planned Maintenance**: Schedule during low-traffic periods
2. **Gradual Migration**: For production, consider implementing session copying logic
3. **User Communication**: Inform users they may need to re-authenticate

## Security Considerations

1. **Session Secret**: Always set `SESSION_SECRET` environment variable
2. **Secure Cookies**: Automatically enabled in production (`secure: true`)
3. **HttpOnly**: Always enabled to prevent XSS attacks
4. **Database Security**: Secure access to session database (file permissions for SQLite, authentication for Redis/MongoDB)

---

For more information, see:
- `backend/config/sessionStore.js` - Session store implementation
- `backend/server.js` - Session middleware configuration
- Express Session documentation: https://github.com/expressjs/session