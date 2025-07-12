import React, { useCallback, useEffect, useState } from 'react';

interface UserInfo {
  name?: string;
  email?: string;
  picture?: string;
}

interface StorageResult {
  auth0_token?: string;
  user_info?: UserInfo;
  token_expiry?: number;
  clipper_enabled?: boolean;
}

const MY_DOMAIN = 'http://localhost:5173';

const Popup: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clipperEnabled, setClipperEnabled] = useState<boolean>(true);

  const checkAuthStatus = useCallback(async () => {
    try {
      const result = (await chrome.storage.sync.get([
        'auth0_token',
        'user_info',
        'token_expiry',
        'clipper_enabled',
      ])) as StorageResult;

      if (
        result.auth0_token &&
        result.user_info &&
        isTokenValid(result.token_expiry)
      ) {
        setUserInfo(result.user_info);
      } else if (result.auth0_token && !isTokenValid(result.token_expiry)) {
        await chrome.storage.sync.remove([
          'auth0_token',
          'token_expiry',
          'user_info',
        ]);
      }
      setClipperEnabled(result.clipper_enabled ?? true);
    } catch (err) {
      console.error('Error checking auth status:', err);
      setError('Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const isTokenValid = (tokenExpiry?: number): boolean => {
    return tokenExpiry ? Date.now() < tokenExpiry : false;
  };

  const toggleClipper = async () => {
    const newState = !clipperEnabled;
    setClipperEnabled(newState);

    try {
      await chrome.storage.sync.set({
        clipper_enabled: newState,
      });
      const [currentTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (currentTab?.id && currentTab.url?.includes('youtube.com')) {
        try {
          await chrome.tabs.sendMessage(currentTab.id, {
            type: 'TOGGLE_CLIPPER',
            enabled: newState,
          });
        } catch (err) {
          console.error('Error sending message to content script:', err);
        }
      }
    } catch (err) {
      console.error('Error toggling clipper:', err);
      setError('Failed to toggle clipper');
    }
  };

  if (loading) {
    return (
      <div className='popup-container'>
        <div className='loading'>
          <h3>YT Clipper</h3>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='popup-container'>
        <div className='error'>
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => window.close()}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className='popup-container'>
      <div className='authenticated'>
        <div className='user-info'>
          {userInfo?.picture ? (
            <img src={userInfo.picture} alt='Profile' className='profile-pic' />
          ) : null}
          <div>
            <h3>Welcome!</h3>
            <p>{userInfo?.name || userInfo?.email || 'User'}</p>
          </div>
        </div>
        <div className='clipper-toggle'>
          <label htmlFor='clipper-toggle'>Enable YouTube Clipper</label>
          <div className='toggle-switch'>
            <input
              type='checkbox'
              id='clipper-toggle'
              checked={clipperEnabled}
              onChange={toggleClipper}
            />
            <span className='slider' />
          </div>
        </div>

        <div className='clipper-actions'>
          <button
            onClick={() => chrome.tabs.create({ url: MY_DOMAIN })}
            className='btn-secondary'
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
