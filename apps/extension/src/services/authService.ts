import { logger } from '@ytclipper/extension-dev-utils';

import type { AuthResponse, User } from '@/types/auth';

interface WebAppAuthResponse {
  type: 'AUTH_STATUS_RESPONSE';
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  accessToken: string | null;
  timestamp: number;
  error?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface BackendVerifyResponse {
  success: boolean;
  data?: {
    user: User;
    valid: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

class AuthService {
  private apiEndpoint: string = 'http://localhost:8080/api/v1';
  private webAppUrl: string = 'http://localhost:5173';
  private authCheckTimeout: number = 10000; // 10 seconds

  // Check authentication status by communicating with web app
  async checkWebAppAuth(): Promise<{
    isAuthenticated: boolean;
    user: User | null;
    accessToken: string | null;
  }> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          isAuthenticated: false,
          user: null,
          accessToken: null,
        });
      }, this.authCheckTimeout);

      // Try to get current tab and check if it's our web app
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];

        if (
          currentTab?.url?.includes('localhost:5173') ||
          currentTab?.url?.includes('app.ytclipper.com')
        ) {
          if (currentTab.id) {
            this.requestAuthFromWebApp(currentTab.id, timeout, resolve);
          } else {
            clearTimeout(timeout);
            resolve({
              isAuthenticated: false,
              user: null,
              accessToken: null,
            });
          }
        } else {
          // Check if web app is open in another tab
          chrome.tabs.query(
            { url: [`${this.webAppUrl}/*`, 'https://app.ytclipper.com/*'] },
            (webAppTabs) => {
              if (webAppTabs.length > 0) {
                if (webAppTabs[0].id) {
                  this.requestAuthFromWebApp(
                    webAppTabs[0].id,
                    timeout,
                    resolve,
                  );
                } else {
                  clearTimeout(timeout);
                  this.getStoredAuthData().then(({ token, user }) => {
                    resolve({
                      isAuthenticated: !!(token && user),
                      user,
                      accessToken: token,
                    });
                  });
                }
              } else {
                // No web app open, check stored credentials
                clearTimeout(timeout);
                this.getStoredAuthData().then(({ token, user }) => {
                  resolve({
                    isAuthenticated: !!(token && user),
                    user,
                    accessToken: token,
                  });
                });
              }
            },
          );
        }
      });
    });
  }

  private requestAuthFromWebApp(
    tabId: number,
    timeout: NodeJS.Timeout,
    resolve: (value: {
      isAuthenticated: boolean;
      user: User | null;
      accessToken: string | null;
    }) => void,
  ) {
    const messageListener = (
      message: any, // eslint-disable-line @typescript-eslint/no-explicit-any
      sender: chrome.runtime.MessageSender,
    ) => {
      console.log('Received message from web app authService:', message);
      if (sender.tab?.id === tabId && message.type === 'AUTH_STATUS_RESPONSE') {
        clearTimeout(timeout);
        chrome.runtime.onMessage.removeListener(messageListener);

        const authResponse = message as WebAppAuthResponse;

        resolve({
          isAuthenticated: authResponse.isAuthenticated,
          user: authResponse.user,
          accessToken: authResponse.accessToken,
        });
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const iframe: HTMLIFrameElement | null = document.querySelector(
          'iframe[src*="auth-bridge"]',
        );
        iframe?.contentWindow?.postMessage({ type: 'CHECK_AUTH_STATUS' }, '*');
      },
    });
  }

  // Verify token with backend
  async verifyTokenWithBackend(
    token: string,
  ): Promise<{ valid: boolean; user?: User }> {
    try {
      const response = await fetch(`${this.apiEndpoint}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data: BackendVerifyResponse = await response.json();

      if (data.success && data.data) {
        return {
          valid: data.data.valid,
          user: data.data.user,
        };
      }

      return { valid: false };
    } catch (error) {
      logger.error('Backend token verification failed:', error);

      return { valid: false };
    }
  }

  // Login by redirecting to web app
  async login(): Promise<AuthResponse> {
    try {
      // Open web app login page
      const authUrl = `${this.webAppUrl}/login?extension=true`;

      await chrome.tabs.create({ url: authUrl });

      return {
        success: true,
        message: 'Please complete authentication in the opened tab',
      };
    } catch (error) {
      logger.error('Login failed:', error);

      return {
        success: false,
        error: 'Failed to open login page',
      };
    }
  }

  // Register by redirecting to web app
  async register(): Promise<AuthResponse> {
    try {
      // Open web app registration page
      const authUrl = `${this.webAppUrl}/register?extension=true`;

      await chrome.tabs.create({ url: authUrl });

      return {
        success: true,
        message: 'Please complete registration in the opened tab',
      };
    } catch (error) {
      logger.error('Registration failed:', error);

      return {
        success: false,
        error: 'Failed to open registration page',
      };
    }
  }

  // Verify token (checks both storage and backend)
  async verifyToken(token: string): Promise<AuthResponse> {
    try {
      // First check if we have the token stored
      const { user } = await this.getStoredAuthData();

      if (!user) {
        return {
          success: false,
          error: 'No user data found',
        };
      }

      // Verify with backend for additional security
      const backendVerification = await this.verifyTokenWithBackend(token);

      if (backendVerification.valid) {
        return {
          success: true,
          user: backendVerification.user || user,
          token,
        };
      }

      // Token is invalid, clear stored data
      await this.clearAuthData();

      return {
        success: false,
        error: 'Token verification failed',
      };
    } catch (error) {
      logger.error('Token verification failed:', error);

      return {
        success: false,
        error: 'Token verification error',
      };
    }
  }

  // Store authentication data from web app
  async storeAuthFromWebApp(token: string, user: User): Promise<void> {
    try {
      await chrome.storage.local.set({
        authToken: token,
        currentUser: user,
        loginTimestamp: Date.now(),
        authSource: 'webapp',
      });
      logger.info('Authentication data stored from web app');
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
        'authSource',
      ]);
      logger.info('Authentication data cleared');
    } catch (error) {
      logger.error('Failed to clear auth data:', error);
    }
  }

  // Logout user
  async logout(): Promise<void> {
    await this.clearAuthData();

    // Also try to logout from web app if it's open
    try {
      chrome.tabs.query(
        { url: [`${this.webAppUrl}/*`, 'https://app.ytclipper.com/*'] },
        (tabs) => {
          if (tabs.length > 0 && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: 'LOGOUT_REQUEST',
              timestamp: Date.now(),
            });
          }
        },
      );
    } catch (error) {
      logger.warn('Could not send logout message to web app:', error);
    }
  }

  // Get current authentication status (checks web app, then storage, then backend)
  async getCurrentAuth(): Promise<{
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
  }> {
    try {
      // First try to get auth from web app
      const webAppAuth = await this.checkWebAppAuth();

      if (webAppAuth.isAuthenticated && webAppAuth.accessToken) {
        // Store the fresh token from web app
        if (webAppAuth.user) {
          await this.storeAuthFromWebApp(
            webAppAuth.accessToken,
            webAppAuth.user,
          );
        }

        return {
          isAuthenticated: webAppAuth.isAuthenticated,
          user: webAppAuth.user,
          token: webAppAuth.accessToken,
        };
      }

      // Fallback to stored auth
      const { token, user } = await this.getStoredAuthData();

      if (token && user) {
        // Verify with backend
        const verification = await this.verifyTokenWithBackend(token);

        if (verification.valid) {
          return {
            isAuthenticated: true,
            user: verification.user || user,
            token,
          };
        }
        // Token invalid, clear it
        await this.clearAuthData();
      }

      return {
        isAuthenticated: false,
        user: null,
        token: null,
      };
    } catch (error) {
      logger.error('Failed to get current auth status:', error);

      return {
        isAuthenticated: false,
        user: null,
        token: null,
      };
    }
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
