import React, { useEffect, useState } from 'react';

import { Button } from '@ytclipper/ui';

import { LoginScreen } from '../components/LoginScreen';
import { useAuth } from '../hooks/useAuth';

interface TabInfo {
  id: number;
  url: string;
  title: string;
  videoId: string | null;
}

interface StoredTimestamp {
  id: string;
  timestamp: number;
  title: string;
  note: string;
  tags: string[];
  createdAt: string;
}

const extractVideoId = (url: string): string | null => {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );

  return match ? match[1] : null;
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const Popup: React.FC = () => {
  const {
    isAuthenticated,
    user,
    token,
    isLoading,
    error,
    login,
    logout,
    clearError,
  } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabInfo | null>(null);
  const [timestamps, setTimestamps] = useState<StoredTimestamp[]>([]);
  const [isLoadingTimestamps, setIsLoadingTimestamps] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Get current tab information
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];

      if (tab?.url && tab.url.includes('youtube.com/watch')) {
        const videoId = extractVideoId(tab.url);

        setCurrentTab({
          id: tab.id ?? 0,
          url: tab.url,
          title: tab.title ?? 'YouTube Video',
          videoId,
        });
      } else {
        setCurrentTab(null);
      }
    });
  }, []);

  // Load timestamps when tab changes
  useEffect(() => {
    if (currentTab?.videoId) {
      loadTimestamps(currentTab.videoId);
    }
  }, [currentTab?.videoId]);

  const loadTimestamps = async (videoId: string) => {
    setIsLoadingTimestamps(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_TIMESTAMPS',
        data: { videoId },
      });

      if (response.success) {
        setTimestamps(response.timestamps);
      } else {
        console.error('Failed to load timestamps:', response.error);
      }
    } catch (error) {
      console.error('Error loading timestamps:', error);
    } finally {
      setIsLoadingTimestamps(false);
    }
  };

  const handleSyncData = async () => {
    setIsSyncing(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SYNC_DATA',
      });

      if (response.success) {
        // Refresh timestamps after sync
        if (currentTab?.videoId) {
          await loadTimestamps(currentTab.videoId);
        }

        // Show success message briefly
        console.log('Sync completed:', response.message);
      } else {
        console.error('Sync failed:', response.error);
      }
    } catch (error) {
      console.error('Error syncing data:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Not on YouTube
  if (!currentTab) {
    return (
      <div className='popup-container'>
        <div className='popup-header'>
          <h1>YTClipper</h1>
        </div>
        <div className='popup-content'>
          <p>Navigate to a YouTube video to start collecting timestamps.</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className='popup-container'>
        <LoginScreen
          onLogin={login}
          onRegister={async () => ({ success: true })} // Not used in new flow
          isLoading={isLoading}
          error={error}
          onClearError={clearError}
        />
      </div>
    );
  }

  return (
    <div className='popup-container'>
      <div className='popup-header'>
        <div className='header-content'>
          <h1>YTClipper</h1>
          <div className='user-info'>
            <span className='user-email'>{user?.email}</span>
            {token ? (
              <Button
                onClick={handleSyncData}
                disabled={isSyncing}
                size='sm'
                variant='outline'
                className='sync-button'
              >
                {isSyncing ? 'Syncing...' : 'Sync'}
              </Button>
            ) : null}
            <Button onClick={logout} size='sm' variant='destructive'>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className='popup-content'>
        <div className='video-info'>
          <h3>{currentTab.title}</h3>
          <p className='video-id'>Video ID: {currentTab.videoId}</p>
        </div>

        <div className='timestamps-section'>
          <div className='section-header'>
            <h4>Timestamps</h4>
            <Button
              onClick={() =>
                currentTab.videoId && loadTimestamps(currentTab.videoId)
              }
              disabled={isLoadingTimestamps}
              size='sm'
              variant='outline'
            >
              {isLoadingTimestamps ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
          {isLoadingTimestamps ? (
            <div className='loading'>Loading timestamps...</div>
          ) : null}

          {!isLoadingTimestamps && timestamps.length > 0 ? (
            <div className='timestamps-list'>
              {timestamps.map((timestamp) => (
                <div key={timestamp.id} className='timestamp-item'>
                  <div className='timestamp-time'>
                    {formatTime(timestamp.timestamp)}
                  </div>
                  <div className='timestamp-content'>
                    <div className='timestamp-title'>{timestamp.title}</div>
                    {timestamp.note ? (
                      <div className='timestamp-note'>{timestamp.note}</div>
                    ) : null}
                    {timestamp.tags.length > 0 && (
                      <div className='timestamp-tags'>
                        {timestamp.tags.map((tag) => (
                          <span key={tag} className='tag'>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!isLoadingTimestamps && timestamps.length === 0 ? (
            <div className='no-timestamps'>
              <p>No timestamps saved for this video yet.</p>
              <p>Use the floating button on the video to create timestamps.</p>
            </div>
          ) : null}
        </div>

        <div className='popup-footer'>
          <p>Authentication: {token ? '🔒 Secure' : '⚠️ Local only'}</p>
        </div>
      </div>
    </div>
  );
};

export default Popup;
