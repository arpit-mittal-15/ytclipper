/**
 * Extension Messaging Service
 *
 * Handles communication between the web app and Chrome extension
 * using the Externally Connectable API for secure messaging.
 */

export interface ExtensionUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface ExtensionAuthMessage {
  type: 'WEB_AUTH_SUCCESS' | 'WEB_AUTH_LOGOUT' | 'WEB_AUTH_UPDATE';
  user?: ExtensionUser;
  token?: string;
  expiry?: number;
  timestamp: number;
}

export interface ExtensionResponse {
  success: boolean;
  error?: string;
  data?: unknown;
}

class ExtensionMessagingService {
  private extensionId: string;
  private isExtensionAvailable: boolean = false;

  constructor() {
    // Try to detect the extension ID
    this.extensionId = this.getExtensionId();
    this.checkExtensionAvailability();
  }

  /**
   * Get the extension ID based on environment
   */
  private getExtensionId(): string {
    const isDev = window.location.hostname === 'localhost';

    if (isDev) {
      return import.meta.env.VITE_DEV_EXTENSION_ID || '';
    }

    return import.meta.env.VITE_EXTENSION_ID || '';
  }

  private async checkExtensionAvailability(): Promise<void> {
    try {
      // If no extension ID is configured, mark as unavailable
      if (!this.extensionId) {
        this.isExtensionAvailable = false;
        return;
      }

      if (
        typeof chrome === 'undefined' ||
        !chrome.runtime ||
        !chrome.runtime.sendMessage
      ) {
        // console.log('🔍 Chrome extension API not available');
        this.isExtensionAvailable = false;
        return;
      }

      // Mark as potentially available - actual availability will be tested during first message
      this.isExtensionAvailable = true;
    } catch (error) {
      console.warn('Extension availability check failed:', error);
      this.isExtensionAvailable = false;
    }
  }

  /**
   * Send a message to the extension
   */
  private async sendMessage(
    message: ExtensionAuthMessage,
  ): Promise<ExtensionResponse | null> {
    return new Promise((resolve) => {
      try {
        // Check if extension ID is available
        if (!this.extensionId) {
          resolve(null);
          return;
        }

        // Use chrome.runtime.sendMessage for externally connectable extensions
        if (
          typeof chrome !== 'undefined' &&
          chrome.runtime &&
          chrome.runtime.sendMessage
        ) {
          chrome.runtime.sendMessage(
            this.extensionId,
            message,
            (response: ExtensionResponse) => {
              if (chrome.runtime.lastError) {
                console.warn(
                  'Extension messaging error:',
                  chrome.runtime.lastError.message,
                );
                // Mark extension as unavailable if we get a connection error
                if (
                  chrome.runtime.lastError.message?.includes(
                    'Invalid extension id',
                  )
                ) {
                  this.isExtensionAvailable = false;
                }
                resolve(null);
              } else {
                resolve(response || { success: true });
              }
            },
          );
        } else {
          console.warn('Chrome extension API not available');
          resolve(null);
        }
      } catch (error) {
        console.warn('Failed to send message to extension:', error);
        resolve(null);
      }
    });
  }

  /**
   * Notify extension of successful authentication
   */
  async notifyAuthSuccess(
    user: ExtensionUser,
    token?: string,
    expiry?: number,
  ): Promise<boolean> {
    try {
      console.log('🔄 Notifying extension of auth success:', {
        user: user.email,
      });

      const message: ExtensionAuthMessage = {
        type: 'WEB_AUTH_SUCCESS',
        user,
        token,
        expiry,
        timestamp: Date.now(),
      };

      const response = await this.sendMessage(message);

      if (response?.success) {
        console.log('✅ Extension notified of auth success');
        return true;
      }
      console.log('❌ Extension notification failed:', response?.error);
      return false;
    } catch (error) {
      console.error('Failed to notify extension of auth success:', error);
      return false;
    }
  }

  /**
   * Notify extension of logout
   */
  async notifyAuthLogout(): Promise<boolean> {
    try {
      const message: ExtensionAuthMessage = {
        type: 'WEB_AUTH_LOGOUT',
        timestamp: Date.now(),
      };

      const response = await this.sendMessage(message);

      if (response?.success) {
        return true;
      }
      // console.log('❌ Extension logout notification failed:', response?.error);
      return false;
    } catch (error) {
      console.error('Failed to notify extension of logout:', error);
      return false;
    }
  }

  /**
   * Notify extension of auth state update (e.g., token refresh)
   */
  async notifyAuthUpdate(
    user: ExtensionUser,
    token?: string,
    expiry?: number,
  ): Promise<boolean> {
    try {
      //   console.log('🔄 Notifying extension of auth update');

      const message: ExtensionAuthMessage = {
        type: 'WEB_AUTH_UPDATE',
        user,
        token,
        expiry,
        timestamp: Date.now(),
      };

      const response = await this.sendMessage(message);

      if (response?.success) {
        // console.log('✅ Extension notified of auth update');
        return true;
      }
      //   console.log('❌ Extension update notification failed:', response?.error);
      return false;
    } catch (error) {
      console.error('Failed to notify extension of auth update:', error);
      return false;
    }
  }

  /**
   * Check if extension is available for messaging
   */
  isAvailable(): boolean {
    return this.isExtensionAvailable;
  }

  /**
   * Get extension status information
   */
  getStatus(): { available: boolean; extensionId: string } {
    return {
      available: this.isExtensionAvailable,
      extensionId: this.extensionId,
    };
  }
}

// Export singleton instance
export const extensionMessaging = new ExtensionMessagingService();
