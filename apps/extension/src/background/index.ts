import { logger } from '@ytclipper/extension-dev-utils';

import { AuthMessage, AuthStorage } from '../types/auth';

logger.info('Background service worker started');

const MY_DOMAIN = 'http://localhost:5173';

function isTokenValid(tokenExpiry?: number): boolean {
  return !!tokenExpiry && Date.now() < tokenExpiry;
}

async function updatePopupState(): Promise<void> {
  const result = (await chrome.storage.sync.get([
    'auth_token',
    'user_info',
    'token_expiry',
  ])) as AuthStorage;

  logger.info('Updating popup state');
  console.log('Auth Storage:', result, result.auth_token, result.token_expiry);

  if (result.auth_token && isTokenValid(result.token_expiry)) {
    // await chrome.action.setPopup({ popup: 'src/popup/index.html' });
    logger.info('Popup enabled - user authenticated');
  } else {
    // await chrome.action.setPopup({ popup: '' });
    logger.info('Popup disabled - user not authenticated');
  }
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
async function getCookiesForFrontend() {
  try {
    const cookies = await chrome.cookies.getAll({
      url: 'http://localhost:5173',
    });
    return cookies;
  } catch (error) {
    console.error('Error getting cookies:', error);
    return [];
  }
}

chrome.runtime.onMessage.addListener(
  (
    message: AuthMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => {
    console.log('Received message:', message, sender);

    if (message.type === 'CHECK_AUTH') {
      // Get cookies from localhost:5173 using Chrome Extension API
      chrome.cookies
        .getAll({
          url: 'http://localhost:5173',
        })
        .then((cookies) => {
          // Format cookies for the request header
          const cookieHeader = cookies
            .map((cookie) => `${cookie.name}=${cookie.value}`)
            .join('; ');

          console.log('Cookies found:', cookieHeader);

          // Make the request with cookies included
          return fetch('http://localhost:8080/api/v1/auth/session', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Cookie: cookieHeader,
            },
            credentials: 'include', // This might still be needed for the backend
          });
        })
        .then((res) => res.json())
        .then((data) => {
          if (data.isAuthenticated) {
            sendResponse({ authenticated: true, user: data.user });
          } else {
            sendResponse({ authenticated: false });
          }
        })
        .catch((error) => {
          console.error('Auth check failed:', error);
          sendResponse({ authenticated: false });
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
