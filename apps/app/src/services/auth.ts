import { useEffect } from 'react';

import { useAuth0 } from '@auth0/auth0-react';

import config from '@/config';

export function useAuthMessageListener() {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently } =
    useAuth0();

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin &&
        !event.origin.startsWith('chrome-extension://')
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

          if (event.source) {
            event.source.postMessage(response, { targetOrigin: event.origin });
          } else {
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
            event.source.postMessage(errorResponse, {
              targetOrigin: event.origin,
            });
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
