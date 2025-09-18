// Authentication service for frontend
class AuthService {
  constructor() {
    // Allow overriding the API base in development via Vite env var VITE_API_BASE.
    // When not set, default to the proxied path used by the frontend dev server.
    // Example for local development: VITE_API_BASE=http://localhost:3001/api/auth
    const apiBaseFromEnv = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) || null;

    // If a Vite env var is provided, use it. Otherwise, in local development
    // prefer the direct backend URL to avoid dev-proxy or CORS surprises.
    const isLocalhost = (typeof window !== 'undefined' && window.location.hostname === 'localhost') || process.env.NODE_ENV !== 'production';

    if (apiBaseFromEnv) {
      this.apiBase = apiBaseFromEnv;
    } else if (isLocalhost) {
      this.apiBase = 'http://localhost:3001/api/auth';
    } else {
      this.apiBase = '/api/auth';
    }
    this.user = null;
    this.isAuthenticated = false;
    this.listeners = [];
  }

  // Add listener for auth state changes
  addAuthListener(callback) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeAuthListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners of auth state change
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.isAuthenticated, this.user));
  }

  // Check authentication status
  async checkAuthStatus() {
    try {
      const response = await fetch(`${this.apiBase}/status`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.isAuthenticated = data.authenticated;
        this.user = data.user;
        this.notifyListeners();
        return { authenticated: data.authenticated, user: data.user };
      } else {
        this.isAuthenticated = false;
        this.user = null;
        this.notifyListeners();
        return { authenticated: false, user: null };
      }
    } catch (error) {
      console.warn('Error checking auth status:', error);
      this.isAuthenticated = false;
      this.user = null;
      this.notifyListeners();
      return { authenticated: false, user: null };
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.apiBase}/me`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        this.isAuthenticated = true;
        this.notifyListeners();
        return data.user;
      } else {
        this.user = null;
        this.isAuthenticated = false;
        this.notifyListeners();
        return null;
      }
    } catch (error) {
      console.warn('Error getting current user:', error);
      this.user = null;
      this.isAuthenticated = false;
      this.notifyListeners();
      return null;
    }
  }

  // Custom authentication - Register new user
  async register(email, password, name) {
    try {
      const response = await fetch(`${this.apiBase}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, name })
      });

      const data = await response.json();

      if (response.ok) {
        this.user = data.user;
        this.isAuthenticated = true;
        this.notifyListeners();
        return { success: true, user: data.user };
      } else {
        return { 
          success: false, 
          error: data.error, 
          details: data.details 
        };
      }
    } catch (error) {
      console.error('Error during registration:', error);
      return { 
        success: false, 
        error: 'Registration failed',
        details: 'Network error or server unavailable' 
      };
    }
  }

  // Custom authentication - Login user
  async login(email, password) {
    try {
      const response = await fetch(`${this.apiBase}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        this.user = data.user;
        this.isAuthenticated = true;
        this.notifyListeners();
        return { success: true, user: data.user };
      } else {
        return { 
          success: false, 
          error: data.error, 
          details: data.details 
        };
      }
    } catch (error) {
      console.error('Error during login:', error);
      return { 
        success: false, 
        error: 'Login failed',
        details: 'Network error or server unavailable' 
      };
    }
  }

  /*
   * ARCHIVED GOOGLE OAUTH METHOD (for future restoration)
   * To re-enable Google OAuth:
   * 1. Uncomment this method
   * 2. Update AuthContext to use this method
   * 3. Update Login component to include Google OAuth button
   * 4. Ensure backend Google OAuth routes are enabled
   */

  /*
  // Initiate Google OAuth login
  loginWithGoogle() {
    // Redirect to Google OAuth
    window.location.href = `${this.apiBase}/google`;
  }
  */

  // Logout user
  async logout() {
    try {
      const response = await fetch(`${this.apiBase}/logout`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        this.user = null;
        this.isAuthenticated = false;
        this.notifyListeners();
        return true;
      } else {
        console.error('Logout failed');
        return false;
      }
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      const response = await fetch(`${this.apiBase}/refresh`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        // Re-check auth status after refresh
        return await this.checkAuthStatus();
      } else {
        this.user = null;
        this.isAuthenticated = false;
        this.notifyListeners();
        return { authenticated: false, user: null };
      }
    } catch (error) {
      console.warn('Error refreshing token:', error);
      this.user = null;
      this.isAuthenticated = false;
      this.notifyListeners();
      return { authenticated: false, user: null };
    }
  }

  // Get user info (current state)
  getUserInfo() {
    return {
      isAuthenticated: this.isAuthenticated,
      user: this.user
    };
  }
}

export default new AuthService();