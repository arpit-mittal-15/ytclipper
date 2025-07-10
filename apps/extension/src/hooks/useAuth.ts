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

      const { token, user } = await authService.getStoredAuthData();

      if (token && user) {
        // Verify token is still valid
        const verification = await authService.verifyToken(token);

        if (verification.success && verification.user && verification.token) {
          setAuthState({
            isAuthenticated: true,
            user: verification.user,
            token: verification.token,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false,
            error: verification.error ?? null,
          });
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
          error: null,
        });
      }
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

    if (result.success && result.user && result.token) {
      setAuthState({
        isAuthenticated: true,
        user: result.user,
        token: result.token,
        isLoading: false,
        error: null,
      });
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

    if (result.success && result.user && result.token) {
      setAuthState({
        isAuthenticated: true,
        user: result.user,
        token: result.token,
        isLoading: false,
        error: null,
      });
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

  return {
    ...authState,
    login,
    register,
    logout,
    clearError,
    refresh: initializeAuth,
  };
};
