import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthService from '../services/AuthService';

// Create authentication context
const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  loading: true,
  register: () => {},
  login: () => {},
  logout: () => {},
  refreshAuth: () => {}
});

// Hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const authStatus = await AuthService.checkAuthStatus();
        setIsAuthenticated(authStatus.authenticated);
        setUser(authStatus.user);
        
        // Update localStorage if user is authenticated
        if (authStatus.authenticated && authStatus.user) {
          localStorage.setItem('userId', authStatus.user.id.toString());
          localStorage.setItem('userEmail', authStatus.user.email);
          localStorage.setItem('userName', authStatus.user.name);
        } else {
          // Clear localStorage if not authenticated
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          localStorage.removeItem('userName');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsAuthenticated(false);
        setUser(null);
        
        // Clear localStorage on error
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const handleAuthChange = (authenticated, userData) => {
      setIsAuthenticated(authenticated);
      setUser(userData);
      
      // Sync localStorage with auth state changes
      if (authenticated && userData) {
        localStorage.setItem('userId', userData.id.toString());
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userName', userData.name);
      } else {
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
      }
    };

    AuthService.addAuthListener(handleAuthChange);

    // Cleanup listener on unmount
    return () => {
      AuthService.removeAuthListener(handleAuthChange);
    };
  }, []);

  // Handle successful authentication (e.g., after OAuth redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    const authError = urlParams.get('error');

    if (authSuccess === 'success') {
      // Remove the auth parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Refresh auth status to get user data
      refreshAuth();
    } else if (authError) {
      console.error('Authentication error:', authError);
      // You could show a toast notification here
    }
  }, []);

  // Function to refresh authentication state
  const refreshAuth = async () => {
    try {
      const authStatus = await AuthService.checkAuthStatus();
      setIsAuthenticated(authStatus.authenticated);
      setUser(authStatus.user);
      
      // Update localStorage if user is authenticated
      if (authStatus.authenticated && authStatus.user) {
        localStorage.setItem('userId', authStatus.user.id.toString());
        localStorage.setItem('userEmail', authStatus.user.email);
        localStorage.setItem('userName', authStatus.user.name);
      } else {
        // Clear localStorage if not authenticated
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
      }
      
      return authStatus;
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setIsAuthenticated(false);
      setUser(null);
      
      // Clear localStorage on error
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      
      return { authenticated: false, user: null };
    }
  };

  // Register new user
  const register = async (email, password, name) => {
    try {
      const result = await AuthService.register(email, password, name);
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
        
        // Store user data in localStorage for subscription/upgrade flows
        localStorage.setItem('userId', result.user.id.toString());
        localStorage.setItem('userEmail', result.user.email);
        localStorage.setItem('userName', result.user.name);
      }
      return result;
    } catch (error) {
      console.error('Error during registration:', error);
      return { 
        success: false, 
        error: 'Registration failed',
        details: 'An unexpected error occurred' 
      };
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const result = await AuthService.login(email, password);
      if (result.success) {
        setIsAuthenticated(true);
        setUser(result.user);
        
        // Store user data in localStorage for subscription/upgrade flows
        localStorage.setItem('userId', result.user.id.toString());
        localStorage.setItem('userEmail', result.user.email);
        localStorage.setItem('userName', result.user.name);
      }
      return result;
    } catch (error) {
      console.error('Error during login:', error);
      return { 
        success: false, 
        error: 'Login failed',
        details: 'An unexpected error occurred' 
      };
    }
  };

  /*
   * ARCHIVED GOOGLE OAUTH METHOD (for future restoration)
   * To re-enable Google OAuth:
   * 1. Uncomment this method
   * 2. Update Login component to use this method
   * 3. Ensure backend Google OAuth is enabled
   */

  /*
  // Login with Google
  const loginWithGoogle = () => {
    AuthService.loginWithGoogle();
  };
  */

  // Logout
  const logout = async () => {
    try {
      const success = await AuthService.logout();
      if (success) {
        setIsAuthenticated(false);
        setUser(null);
        
        // Clear user data from localStorage
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
      }
      return success;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    register,
    login,
    logout,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;