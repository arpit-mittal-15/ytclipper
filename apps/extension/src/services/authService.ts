import { logger } from '@ytclipper/extension-dev-utils';

import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '../types/auth';

class AuthService {
  // No backend endpoint needed for now
  private apiEndpoint: string = '';

  // Login user with email and password (accept any credentials)
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 400));
    const fakeUser: User = {
      id: credentials.email,
      email: credentials.email,
      name: credentials.email.split('@')[0],
      createdAt: new Date().toISOString(),
    };
    const fakeToken = `fake-token-${Math.random().toString(36).slice(2)}`;

    await this.storeAuthData(fakeToken, fakeUser);

    return {
      success: true,
      user: fakeUser,
      token: fakeToken,
      message: 'Login successful (dev mode)',
    };
  }

  // Register new user (accept any credentials)
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 400));
    const fakeUser: User = {
      id: credentials.email,
      email: credentials.email,
      name: credentials.name || credentials.email.split('@')[0],
      createdAt: new Date().toISOString(),
    };
    const fakeToken = `fake-token-${Math.random().toString(36).slice(2)}`;

    await this.storeAuthData(fakeToken, fakeUser);

    return {
      success: true,
      user: fakeUser,
      token: fakeToken,
      message: 'Registration successful (dev mode)',
    };
  }

  // Always verify token as valid in dev mode
  async verifyToken(token: string): Promise<AuthResponse> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    const { user } = await this.getStoredAuthData();

    if (user) {
      return {
        success: true,
        user,
        token,
      };
    }

    return {
      success: false,
      error: 'No user found',
    };
  }

  // Store authentication data in Chrome storage
  private async storeAuthData(token: string, user: User): Promise<void> {
    try {
      await chrome.storage.local.set({
        authToken: token,
        currentUser: user,
        loginTimestamp: Date.now(),
      });
      logger.info('Authentication data stored');
    } catch (error) {
      logger.error('Failed to store auth data:', error);
    }
  }

  // Get stored authentication data
  async getStoredAuthData(): Promise<{
    token: string | null;
    user: User | null;
  }> {
    try {
      const result = await chrome.storage.local.get([
        'authToken',
        'currentUser',
        'loginTimestamp',
      ]);
      // Check if token is too old (7 days)
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      if (result.loginTimestamp && result.loginTimestamp < sevenDaysAgo) {
        await this.clearAuthData();

        return { token: null, user: null };
      }

      return {
        token: result.authToken || null,
        user: result.currentUser || null,
      };
    } catch (error) {
      logger.error('Failed to get stored auth data:', error);

      return { token: null, user: null };
    }
  }

  // Clear stored authentication data
  async clearAuthData(): Promise<void> {
    try {
      await chrome.storage.local.remove([
        'authToken',
        'currentUser',
        'loginTimestamp',
      ]);
      logger.info('Authentication data cleared');
    } catch (error) {
      logger.error('Failed to clear auth data:', error);
    }
  }

  // Logout user
  async logout(): Promise<void> {
    await this.clearAuthData();
  }

  // Get authorization header for API requests
  getAuthHeader(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }
}

export const authService = new AuthService();
