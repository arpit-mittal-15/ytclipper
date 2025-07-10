import { logger } from '@ytclipper/extension-dev-utils';

// Background service worker for YTClipper Chrome Extension
logger.info('Background service worker started');

// TypeScript interfaces
interface Timestamp {
  id: string;
  timestamp: number;
  title: string;
  note: string;
  tags: string[];
  createdAt: string;
}

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

// Save timestamp to local storage and sync with backend
async function handleSaveTimestamp(data: {
  videoId: string;
  timestamp: number;
  title: string;
  note?: string;
  tags?: string[];
}) {
  try {
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

    // Sync with backend if API is available
    try {
      await syncWithBackend(data.videoId, newTimestamp);
    } catch (error) {
      logger.warn('Backend sync failed, saved locally:', error);
    }

    return { success: true, timestamp: newTimestamp };
  } catch (error) {
    throw new Error(`Failed to save timestamp: ${error}`);
  }
}

// Get timestamps for a video
async function handleGetTimestamps(data: { videoId: string }) {
  try {
    const result = await chrome.storage.local.get(['timestamps']);
    const timestamps = result.timestamps ?? {};

    return {
      success: true,
      timestamps: timestamps[data.videoId] ?? [],
    };
  } catch (error) {
    throw new Error(`Failed to get timestamps: ${error}`);
  }
}

// Sync local data with backend
async function handleSyncData() {
  try {
    const settings = await chrome.storage.sync.get(['apiEndpoint']);
    const localData = await chrome.storage.local.get(['timestamps']);

    if (!settings.apiEndpoint || !localData.timestamps) {
      return { success: true, message: 'Nothing to sync' };
    }

    // Here you would implement the actual backend sync logic
    logger.info('Syncing data with backend...', settings.apiEndpoint);

    return { success: true, message: 'Data synced successfully' };
  } catch (error) {
    throw new Error(`Failed to sync data: ${error}`);
  }
}

// Sync single timestamp with backend
async function syncWithBackend(videoId: string, timestamp: Timestamp) {
  const settings = await chrome.storage.sync.get(['apiEndpoint']);
  const authData = await chrome.storage.local.get(['authToken']);

  if (!settings.apiEndpoint) {
    throw new Error('API endpoint not configured');
  }

  if (!authData.authToken) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${settings.apiEndpoint}/timestamps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authData.authToken}`,
    },
    body: JSON.stringify({
      videoId,
      ...timestamp,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired, clear auth data
      await chrome.storage.local.remove([
        'authToken',
        'currentUser',
        'loginTimestamp',
      ]);
      throw new Error('Authentication expired. Please login again.');
    }
    throw new Error(`Backend sync failed: ${response.statusText}`);
  }

  return response.json();
}
