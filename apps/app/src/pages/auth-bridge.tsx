import { useAuth0 } from '@auth0/auth0-react';

import config from '@/config';

export const AuthBridge = () => {
  console.log('AuthBridge initialized');
  const { isAuthenticated, isLoading, user, getAccessTokenSilently } =
    useAuth0();

  window.addEventListener('message', async (event) => {
    console.log('Received message from extension:', event.data);
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

        console.log('Sending auth status response:', response);
        window.parent.postMessage(response, '*');
      } catch (error) {
        console.error('Error handling auth status request:', error);
        const errorResponse = {
          type: 'AUTH_STATUS_RESPONSE',
          isAuthenticated: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        };
        window.parent.postMessage(errorResponse, '*');
      }
    }
  });
  return <h1>Auth bridge</h1>;
};
