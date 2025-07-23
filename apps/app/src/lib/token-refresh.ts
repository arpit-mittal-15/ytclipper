import { store } from '@/store';
import { refreshToken } from '@/store/slices/authSlice';
import { addNotification } from '@/store/slices/uiSlice';

export function setupTokenRefresh() {
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  function scheduleRefresh() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }

    const state = store.getState();
    const { isAuthenticated } = state.auth;

    // If there's no access token but user is authenticated, try to refresh immediately
    if (isAuthenticated) {
      console.log('No access token but authenticated, refreshing immediately');
      performTokenRefresh();
      return;
    }

    if (!isAuthenticated) {
      console.log('Token refresh not scheduled: ', {
        isAuthenticated,
      });
    }
  }

  // Function to perform the token refresh
  async function performTokenRefresh() {
    try {
      console.log('Refreshing token...');
      await store.dispatch(refreshToken()).unwrap();
      console.log('Token refreshed successfully');

      // Schedule the next refresh
      scheduleRefresh();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      store.dispatch(
        addNotification({
          type: 'error',
          title: 'Session Error',
          message: 'Your session has expired. Please log in again.',
        }),
      );
    }
  }

  // Set up a store subscription to watch for auth state changes
  const unsubscribe = store.subscribe(() => {
    const state = store.getState();
    const { isAuthenticated } = state.auth;

    if (isAuthenticated) {
      scheduleRefresh();
    } else if (!isAuthenticated && refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  });

  // Initial schedule if already authenticated
  scheduleRefresh();

  return () => {
    unsubscribe();
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
  };
}

/**
 * Check if the current token is about to expire and needs refresh
 * @returns {boolean} True if token should be refreshed
 */

/**
 * Manually trigger a token refresh
 * This will work even if there's no access token but a refresh token is present
 * @returns {Promise<void>}
 */
export async function manualTokenRefresh(): Promise<void> {
  try {
    await store.dispatch(refreshToken()).unwrap();
  } catch (error) {
    console.error('Manual token refresh failed:', error);
    store.dispatch(
      addNotification({
        type: 'error',
        title: 'Session Error',
        message: 'Failed to refresh your session. Please log in again.',
      }),
    );
  }
}
