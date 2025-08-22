import React, { createContext, useContext, useEffect, useState } from 'react';
import AuthService from '../services/AuthService';

// Create authentication context
const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  loading: true,
  loginWithGoogle: () => {},
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
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const handleAuthChange = (authenticated, userData) => {
      setIsAuthenticated(authenticated);
      setUser(userData);
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
      return authStatus;
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setIsAuthenticated(false);
      setUser(null);
      return { authenticated: false, user: null };
    }
  };

  // Login with Google
  const loginWithGoogle = () => {
    AuthService.loginWithGoogle();
  };

  // Logout
  const logout = async () => {
    try {
      const success = await AuthService.logout();
      if (success) {
        setIsAuthenticated(false);
        setUser(null);
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
    loginWithGoogle,
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