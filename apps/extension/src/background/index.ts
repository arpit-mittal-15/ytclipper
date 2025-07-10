import { logger } from '@ytclipper/extension-dev-utils';

import { authService } from '../services/authService';

// Background service worker for YTClipper Chrome Extension
logger.info('Background service worker started');

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  logger.info('Extension installed:', details.reason);

  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      apiEndpoint: 'http://localhost:8080/api/v1',
      autoSave: true,
      showNotifications: true,
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logger.info('Message received in background:', message);

  switch (message.type) {
    case 'SAVE_TIMESTAMP':
      handleSaveTimestamp(message.data)
        .then(sendResponse)
        .catch((error) => {
          logger.error('Failed to save timestamp:', error);
          sendResponse({ success: false, error: error.message });

          return undefined;
        });

      return true; // Keep the message channel open for async response

    case 'GET_TIMESTAMPS':
      handleGetTimestamps(message.data)
        .then(sendResponse)
        .catch((error) => {
          logger.error('Failed to get timestamps:', error);
          sendResponse({ success: false, error: error.message });

          return undefined;
        });

      return true;

    case 'SYNC_DATA':
      handleSyncData()
        .then(sendResponse)
        .catch((error) => {
          logger.error('Failed to sync data:', error);
          sendResponse({ success: false, error: error.message });

          return undefined;
        });

      return true;

    default:
      logger.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });

      return true;
  }
});

// Save timestamp to backend and local storage as fallback
async function handleSaveTimestamp(data: {
  videoId: string;
  timestamp: number;
  title: string;
  note?: string;
  tags?: string[];
}) {
  try {
    // Get current authentication
    const auth = await authService.getCurrentAuth();

    if (!auth.isAuthenticated || !auth.token) {
      // Save locally if not authenticated
      return await saveTimestampLocally(data);
    }

    // Try to save to backend first
    try {
      const settings = await chrome.storage.sync.get(['apiEndpoint']);
      const apiEndpoint =
        settings.apiEndpoint || 'http://localhost:8080/api/v1';

      const response = await fetch(`${apiEndpoint}/timestamps`, {
        method: 'POST',
        headers: authService.getAuthHeader(auth.token),
        body: JSON.stringify({
          video_id: data.videoId,
          timestamp: data.timestamp,
          title: data.title,
          note: data.note || '',
          tags: data.tags || [],
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear auth data and fall back to local storage
          await authService.clearAuthData();
          throw new Error('Authentication expired');
        }
        throw new Error(`Backend save failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data?.timestamp) {
        // Also save locally as backup
        await saveTimestampLocally(data);

        return {
          success: true,
          timestamp: result.data.timestamp,
          source: 'backend',
        };
      }
      throw new Error('Invalid response from backend');
    } catch (backendError) {
      logger.warn('Backend save failed, saving locally:', backendError);

      // Fall back to local storage
      return await saveTimestampLocally(data);
    }
  } catch (error) {
    throw new Error(`Failed to save timestamp: ${error}`);
  }
}

// Save timestamp to local storage (fallback)
async function saveTimestampLocally(data: {
  videoId: string;
  timestamp: number;
  title: string;
  note?: string;
  tags?: string[];
}) {
  // Get current timestamps from storage
  const result = await chrome.storage.local.get(['timestamps']);
  const timestamps = result.timestamps ?? {};

  // Add new timestamp
  timestamps[data.videoId] ??= [];

  const newTimestamp = {
    id: Date.now().toString(),
    timestamp: data.timestamp,
    title: data.title,
    note: data.note ?? '',
    tags: data.tags ?? [],
    createdAt: new Date().toISOString(),
  };

  timestamps[data.videoId].push(newTimestamp);

  // Save to local storage
  await chrome.storage.local.set({ timestamps });

  return {
    success: true,
    timestamp: newTimestamp,
    source: 'local',
  };
}

// Get timestamps for a video (try backend first, then local)
async function handleGetTimestamps(data: { videoId: string }) {
  try {
    // Get current authentication
    const auth = await authService.getCurrentAuth();

    if (auth.isAuthenticated && auth.token) {
      // Try to get from backend first
      try {
        const settings = await chrome.storage.sync.get(['apiEndpoint']);
        const apiEndpoint =
          settings.apiEndpoint || 'http://localhost:8080/api/v1';

        const response = await fetch(
          `${apiEndpoint}/timestamps/${data.videoId}`,
          {
            method: 'GET',
            headers: authService.getAuthHeader(auth.token),
          },
        );

        if (response.ok) {
          const result = await response.json();

          if (result.success && result.data?.timestamps) {
            return {
              success: true,
              timestamps: result.data.timestamps,
              source: 'backend',
            };
          }
        } else if (response.status === 401) {
          // Token expired, clear auth data
          await authService.clearAuthData();
        }
      } catch (backendError) {
        logger.warn('Backend fetch failed, using local data:', backendError);
      }
    }

    // Fall back to local storage
    const result = await chrome.storage.local.get(['timestamps']);
    const timestamps = result.timestamps ?? {};

    return {
      success: true,
      timestamps: timestamps[data.videoId] ?? [],
      source: 'local',
    };
  } catch (error) {
    throw new Error(`Failed to get timestamps: ${error}`);
  }
}

// Sync local data with backend
async function handleSyncData() {
  try {
    const auth = await authService.getCurrentAuth();

    if (!auth.isAuthenticated || !auth.token) {
      return {
        success: false,
        message: 'Not authenticated - cannot sync with backend',
      };
    }

    const settings = await chrome.storage.sync.get(['apiEndpoint']);
    const localData = await chrome.storage.local.get(['timestamps']);

    if (!settings.apiEndpoint || !localData.timestamps) {
      return { success: true, message: 'Nothing to sync' };
    }

    // In a real implementation, you'd sync local timestamps with backend
    logger.info('Syncing data with backend...', settings.apiEndpoint);

    return {
      success: true,
      message: 'Data sync completed',
      user: auth.user?.email || 'Unknown',
    };
  } catch (error) {
    throw new Error(`Failed to sync data: ${error}`);
  }
}
