import { useEffect, useState } from 'react';

import { logger } from '@ytclipper/extension-dev-utils';

import { authService } from '../services/authService';
import type {
  AuthState,
  LoginCredentials,
  RegisterCredentials,
} from '../types/auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  // Check for stored authentication on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Use the new getCurrentAuth method that checks web app, storage, and backend
      const authResult = await authService.getCurrentAuth();

      setAuthState({
        isAuthenticated: authResult.isAuthenticated,
        user: authResult.user,
        token: authResult.token,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      logger.error('Failed to initialize auth:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: 'Failed to initialize authentication',
      });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    const result = await authService.login(credentials);

    if (result.success) {
      // Login redirects to web app, so we don't get immediate results
      // The auth state will be updated when the web app communicates back
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
      }));
    } else {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: result.error ?? 'Login failed',
      }));
    }

    return result;
  };

  const register = async (credentials: RegisterCredentials) => {
    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    const result = await authService.register(credentials);

    if (result.success) {
      // Registration redirects to web app, so we don't get immediate results
      // The auth state will be updated when the web app communicates back
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: null,
      }));
    } else {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: result.error ?? 'Registration failed',
      }));
    }

    return result;
  };

  const logout = async () => {
    setAuthState((prev) => ({ ...prev, isLoading: true }));

    await authService.logout();

    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
  };

  const clearError = () => {
    setAuthState((prev) => ({ ...prev, error: null }));
  };

  // Listen for auth changes from web app
  useEffect(() => {
    const handleStorageChange = () => {
      // Refresh auth state when storage changes (e.g., from web app)
      initializeAuth();
    };

    // Listen for storage changes
    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
    clearError,
    refresh: initializeAuth,
  };
};
