import { useEffect } from 'react';

import { useAuth0 } from '@auth0/auth0-react';

export function useAuthMessageListener() {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently } =
    useAuth0();

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Security: Only respond to messages from same origin or your extension
      if (
        event.origin !== window.location.origin &&
        !event.origin.startsWith('chrome-extension://')
      ) {
        return;
      }

      if (event.data.type === 'CHECK_AUTH_STATUS') {
        try {
          let accessToken = null;

          // Only get token if user is authenticated and not loading
          if (isAuthenticated && !isLoading) {
            try {
              accessToken = await getAccessTokenSilently({
                authorizationParams: {
                  audience: 'your-auth0-audience', // Replace with your Auth0 audience
                  scope: 'openid profile email',
                },
              });
            } catch (tokenError) {
              console.error('Error getting access token:', tokenError);
            }
          }

          // Send back auth status
          const response = {
            type: 'AUTH_STATUS_RESPONSE',
            isAuthenticated: isAuthenticated && !isLoading,
            isLoading,
            user: user || null,
            accessToken,
            timestamp: Date.now(),
          };

          // Handle both window.postMessage and chrome.runtime.sendMessage
          if (event.source) {
            event.source.postMessage(response, event.origin);
          } else {
            // For extension communication
            window.postMessage(response, '*');
          }
        } catch (error) {
          console.error('Error handling auth status request:', error);
          const errorResponse = {
            type: 'AUTH_STATUS_RESPONSE',
            isAuthenticated: false,
            isLoading: false,
            error,
            timestamp: Date.now(),
          };

          if (event.source) {
            event.source.postMessage(errorResponse, event.origin);
          } else {
            window.postMessage(errorResponse, '*');
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [isAuthenticated, isLoading, user, getAccessTokenSilently]);
}
