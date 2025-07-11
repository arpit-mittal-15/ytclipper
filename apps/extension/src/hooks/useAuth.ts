import { useEffect, useState } from 'react';

import type { User } from '@/types/auth';

import { authService } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    const result = await authService.login();
    if (!result.success) setError(result.error || 'Login failed');
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  const clearError = () => setError(null);

  useEffect(() => {
    (async () => {
      setIsLoading(true);

      try {
        const result = await authService.getCurrentAuth();

        if (result.isAuthenticated) {
          setUser(result.user);
          setToken(result.token);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        setError('Failed to check auth');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return {
    isAuthenticated,
    user,
    token,
    isLoading,
    error,
    login,
    logout,
    clearError,
  };
};
