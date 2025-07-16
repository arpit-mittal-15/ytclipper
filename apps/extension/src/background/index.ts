import { logger } from '@ytclipper/extension-dev-utils';

import { AuthMessage, AuthStorage, UserInfo } from '../types/auth';

logger.info('Background service worker started');

const MY_DOMAIN = 'http://localhost:5173';

const API_URL = 'http://localhost:8080/api/v1';

interface ExternalAuthMessage {
  type: 'WEB_AUTH_SUCCESS' | 'WEB_AUTH_LOGOUT' | 'WEB_AUTH_UPDATE';
  user?: UserInfo;
  token?: string;
  expiry?: number;
  timestamp: number;
}

interface ExternalMessageResponse {
  success: boolean;
  error?: string;
  data?: unknown;
}

function isTokenValid(tokenExpiry?: number): boolean {
  if (!tokenExpiry) {
    return false;
  }

  // Add a 5-minute buffer to account for clock skew
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  const currentTime = Date.now();
  const expiryTime = tokenExpiry * 1000; // Convert to milliseconds

  return currentTime < expiryTime - bufferTime;
}

async function updatePopupState(): Promise<void> {
  const result = (await chrome.storage.sync.get([
    'auth_token',
    'user_info',
    'token_expiry',
  ])) as AuthStorage;

  logger.info('Updating popup state');
  console.log('Auth Storage:', {
    hasToken: !!result.auth_token,
    hasUser: !!result.user_info,
    tokenExpiry: result.token_expiry,
    isTokenValid: isTokenValid(result.token_expiry),
  });

  if (result.auth_token && isTokenValid(result.token_expiry)) {
    logger.info('Popup enabled - user authenticated');
  } else {
    logger.info('Popup disabled - user not authenticated');

    // If we have expired or invalid auth data, clear it
    if (result.auth_token && !isTokenValid(result.token_expiry)) {
      logger.info('Clearing expired auth data');
      await chrome.storage.sync.remove([
        'auth_token',
        'token_expiry',
        'user_info',
      ]);
    }
  }
}

/**
 * Handle external messages from the web app (externally connectable)
 */
function handleExternalMessage(
  message: ExternalAuthMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: ExternalMessageResponse) => void,
): boolean {
  logger.info('Received external message:', message, 'from:', sender.url);

  // Verify sender is from allowed domains
  const allowedDomains = [
    'https://app.ytclipper.com',
    'https://ytclipper.com',
    'http://localhost:5173',
    'http://localhost:8080',
  ];

  const senderUrl = sender.url || sender.tab?.url;
  const isAllowedSender = allowedDomains.some((domain) =>
    senderUrl?.startsWith(domain),
  );

  if (!isAllowedSender) {
    logger.warn('Message from unauthorized domain:', senderUrl);
    sendResponse({ success: false, error: 'Unauthorized domain' });
    return true;
  }

  // Handle different message types from web app
  switch (message.type) {
    case 'WEB_AUTH_SUCCESS':
      return handleWebAuthSuccess(message, sendResponse);

    case 'WEB_AUTH_LOGOUT':
      return handleWebAuthLogout(message, sendResponse);

    case 'WEB_AUTH_UPDATE':
      return handleWebAuthUpdate(message, sendResponse);

    default:
      logger.warn('Unknown external message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
      return true;
  }
}

/**
 * Handle successful authentication from web app
 */
function handleWebAuthSuccess(
  message: ExternalAuthMessage,
  sendResponse: (response?: ExternalMessageResponse) => void,
): boolean {
  logger.info('🔄 Processing web auth success');

  const { user, token, expiry, timestamp } = message;

  if (!user || !user.id || !user.email) {
    logger.error('Invalid user data in auth success message');
    sendResponse({ success: false, error: 'Invalid user data' });
    return true;
  }

  // Validate timestamp to prevent replay attacks
  const messageAge = Date.now() - timestamp;
  if (messageAge > 30000) {
    // 30 seconds max age
    logger.warn('Auth message too old, ignoring');
    sendResponse({ success: false, error: 'Message expired' });
    return true;
  }

  const dataToStore = {
    auth_token: token,
    token_expiry: expiry,
    user_info: user,
    last_sync: Date.now(),
  };

  chrome.storage.sync
    .set(dataToStore)
    .then(() => {
      logger.info('✅ Extension auth state updated from web app');
      updatePopupState();
      sendResponse({ success: true });
    })
    .catch((error) => {
      logger.error('Failed to store auth data:', error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // Indicates async response
}

/**
 * Handle authentication update from web app
 */
function handleWebAuthUpdate(
  message: ExternalAuthMessage,
  sendResponse: (response?: ExternalMessageResponse) => void,
): boolean {
  logger.info('🔄 Processing web auth update');

  const { user, token, expiry, timestamp } = message;

  // For updates, we can handle cases where there's no user (just a ping)
  if (!timestamp) {
    sendResponse({ success: false, error: 'Missing timestamp' });
    return true;
  }

  // Validate timestamp
  const messageAge = Date.now() - timestamp;
  if (messageAge > 30000) {
    // 30 seconds max age
    logger.warn('Auth update message too old, ignoring');
    sendResponse({ success: false, error: 'Message expired' });
    return true;
  }

  // If this is just a ping (no user data), respond positively
  if (!user) {
    sendResponse({ success: true });
    return true;
  }

  const dataToStore: Record<string, unknown> = {
    last_sync: Date.now(),
  };

  if (token !== undefined) {
    dataToStore.auth_token = token;
  }
  if (expiry !== undefined) {
    dataToStore.token_expiry = expiry;
  }
  if (user) {
    dataToStore.user_info = user;
  }

  chrome.storage.sync
    .set(dataToStore)
    .then(() => {
      logger.info('✅ Extension auth state updated');
      updatePopupState();
      sendResponse({ success: true });
    })
    .catch((error) => {
      logger.error('Failed to update auth data:', error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // Indicates async response
}

/**
 * Handle logout from web app
 */
function handleWebAuthLogout(
  message: ExternalAuthMessage,
  sendResponse: (response?: ExternalMessageResponse) => void,
): boolean {
  logger.info('🔄 Processing web auth logout');

  const { timestamp } = message;

  // Validate timestamp
  if (timestamp) {
    const messageAge = Date.now() - timestamp;
    if (messageAge > 30000) {
      // 30 seconds max age
      logger.warn('Logout message too old, ignoring');
      sendResponse({ success: false, error: 'Message expired' });
      return true;
    }
  }

  chrome.storage.sync
    .remove(['auth_token', 'token_expiry', 'user_info'])
    .then(() => {
      logger.info('✅ Extension auth state cleared');
      updatePopupState();
      sendResponse({ success: true });
    })
    .catch((error) => {
      logger.error('Failed to clear auth data:', error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // Indicates async response
}

async function debugAuthState() {
  const result = await chrome.storage.sync.get(null); // Get all storage
  logger.info('All storage data:', result);

  const popupState = await chrome.action.getPopup({});
  logger.info('Current popup state:', popupState);
}

debugAuthState();

updatePopupState().catch((error) => {
  logger.error('Error updating popup state:', error);
});

chrome.action.onClicked.addListener(async () => {
  const result = (await chrome.storage.sync.get([
    'auth_token',
    'token_expiry',
  ])) as Pick<AuthStorage, 'auth_token' | 'token_expiry'>;

  if (!result.auth_token || !isTokenValid(result.token_expiry)) {
    logger.info('User not authenticated, redirecting to login page');
    chrome.tabs.create({
      url: MY_DOMAIN,
    });
  }
});

async function postToBackend<T = any>(
  url: string,
  data: any,
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    console.log('Post to backend');
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errRes = await res.json().catch(() => null);
      return {
        success: false,
        error: errRes?.error || `HTTP ${res.status}`,
      };
    }

    const json = await res.json();
    return { success: true, data: json };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

// Handle external messages (from web app via externally_connectable)
chrome.runtime.onMessageExternal.addListener(handleExternalMessage);

// Handle internal messages (from content scripts, popup, etc.)
chrome.runtime.onMessage.addListener(
  (
    message: AuthMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    console.log('Received internal message:', message, sender);

    if (message.type === 'CHECK_AUTH') {
      // Get auth token from storage to validate session
      const checkAuth = async () => {
        try {
          const result = await chrome.storage.sync.get([
            'auth_token',
            'token_expiry',
            'user_info',
          ]);
          const { auth_token, token_expiry, user_info } = result as Pick<
            AuthStorage,
            'auth_token' | 'token_expiry' | 'user_info'
          >;
          console.log('Auth check result:', {
            auth_token,
            token_expiry,
            user_info,
          });

          if (!auth_token || !isTokenValid(token_expiry)) {
            sendResponse({ authenticated: false });
            return;
          }

          // Make the request with auth_token in Authorization header
          const response = await fetch(
            'http://localhost:8080/api/v1/auth/session',
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${auth_token}`,
              },
            },
          );

          if (response.status === 200) {
            const data = await response.json();

            if (data.success) {
              sendResponse({ authenticated: true, user: user_info });
            } else {
              sendResponse({ authenticated: false });
            }
          } else {
            // Clear stored auth data for invalid tokens
            try {
              const errorData = await response.json();

              // If token claims not found or token is invalid, clear stored auth data
              if (
                errorData?.error?.code === 'NO_CLAIMS' ||
                errorData?.error?.code === 'INVALID_TOKEN' ||
                response.status === 401
              ) {
                await chrome.storage.sync.remove([
                  'auth_token',
                  'token_expiry',
                  'user_info',
                ]);
              }
            } catch {
              // Silently handle parse errors
            }

            sendResponse({ authenticated: false });
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          sendResponse({ authenticated: false });
        }
      };

      checkAuth();
      return true;
    }

    if (message.type === 'SAVE_TIMESTAMP') {
      const { videoId, timestamp, title, note, tags } = message.data;

      postToBackend(`${API_URL}/timestamps`, {
        video_id: videoId,
        timestamp,
        title,
        note,
        tags,
      }).then((res) => {
        sendResponse(res);
      });

      return true;
    }

    if (message.type === 'AUTH_TOKEN_UPDATE') {
      const dataToStore = {
        auth_token: message.token,
        token_expiry: message.expiry,
        user_info: message.user,
      };
      chrome.storage.sync
        .set(dataToStore)
        .then(() => {
          updatePopupState();
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error });
        });
      return true;
    }

    if (message.type === 'AUTH_LOGOUT') {
      chrome.storage.sync
        .remove(['auth_token', 'token_expiry', 'user_info'])
        .then(() => {
          logger.info('User logged out, updating popup state');
          updatePopupState();
        })
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          logger.error('Error during logout:', error);
          sendResponse({ success: false, error });
        });
      return true;
    }

    logger.warn('Unknown message type:', message);
    sendResponse({ success: false, error: 'Unknown message type' });
    return true;
  },
);

async function initatializeClipperState() {
  const result = await chrome.storage.sync.get('clipper_enabled');

  if (result.clipper_enabled === undefined) {
    await chrome.storage.sync.set({ clipper_enabled: true });
    logger.info('Clipper state initialized to enabled');
  }
}

initatializeClipperState().catch((error) => {
  logger.error('Error initializing clipper state:', error);
});

setInterval(
  () => {
    updatePopupState().catch((error) => {
      logger.error('Error updating popup state in interval:', error);
    });
  },
  5 * 60 * 1000,
);
