import { useEffect } from 'react';

import { useAuth0 } from '@auth0/auth0-react';

import config from '@/config';

export function useAuthMessageListener() {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently, logout } =
    useAuth0();

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Accept messages from extension and same origin
      if (
        event.origin !== window.location.origin &&
        !event.origin.startsWith('chrome-extension://') &&
        !event.origin.startsWith('moz-extension://')
      ) {
        return;
      }

      if (event.data.type === 'CHECK_AUTH_STATUS') {
        try {
          let accessToken = null;

          if (isAuthenticated && !isLoading) {
            try {
              accessToken = await getAccessTokenSilently({
                authorizationParams: {
                  audience: config.auth0Audience,
                  scope: 'openid profile email',
                },
              });
            } catch (tokenError) {
              console.error('Error getting access token:', tokenError);
            }
          }

          const response = {
            type: 'AUTH_STATUS_RESPONSE',
            isAuthenticated: isAuthenticated && !isLoading,
            isLoading,
            user: user || null,
            accessToken,
            timestamp: Date.now(),
          };

          // Send response back to extension
          if (event.source && 'postMessage' in event.source) {
            (event.source as Window).postMessage(response, event.origin);
          }
        } catch (error) {
          console.error('Error handling auth status request:', error);
          const errorResponse = {
            type: 'AUTH_STATUS_RESPONSE',
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
          };

          if (event.source && 'postMessage' in event.source) {
            (event.source as Window).postMessage(errorResponse, event.origin);
          }
        }
      }

      if (event.data.type === 'LOGOUT_REQUEST') {
        try {
          // Logout from Auth0
          await logout({
            logoutParams: {
              returnTo: window.location.origin,
            },
          });

          // Send confirmation back to extension
          const response = {
            type: 'LOGOUT_RESPONSE',
            success: true,
            timestamp: Date.now(),
          };

          if (event.source && 'postMessage' in event.source) {
            (event.source as Window).postMessage(response, event.origin);
          }
        } catch (error) {
          console.error('Error during logout:', error);
          const errorResponse = {
            type: 'LOGOUT_RESPONSE',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
          };

          if (event.source && 'postMessage' in event.source) {
            (event.source as Window).postMessage(errorResponse, event.origin);
          }
        }
      }

      if (event.data.type === 'EXTENSION_AUTH_SUCCESS') {
        // Extension completed authentication, refresh our state
        console.log('Extension authentication completed successfully');

        // Send current auth status to extension
        try {
          let accessToken = null;

          if (isAuthenticated && !isLoading) {
            accessToken = await getAccessTokenSilently({
              authorizationParams: {
                audience: config.auth0Audience,
                scope: 'openid profile email',
              },
            });
          }

          const response = {
            type: 'AUTH_UPDATE_RESPONSE',
            isAuthenticated: isAuthenticated && !isLoading,
            user: user || null,
            accessToken,
            timestamp: Date.now(),
          };

          if (event.source && 'postMessage' in event.source) {
            (event.source as Window).postMessage(response, event.origin);
          }
        } catch (error) {
          console.error('Error sending auth update:', error);
        }
      }
    };

    // Listen for messages from extension
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isAuthenticated, isLoading, user, getAccessTokenSilently, logout]);
}

// Hook to notify extension when authentication state changes
export function useExtensionAuthNotification() {
  const { isAuthenticated, user } = useAuth0();

  useEffect(() => {
    // Post message for any extension listening
    window.postMessage(
      {
        type: 'AUTH_STATE_CHANGED',
        isAuthenticated,
        user,
        timestamp: Date.now(),
      },
      '*',
    );
  }, [isAuthenticated, user]);
}
