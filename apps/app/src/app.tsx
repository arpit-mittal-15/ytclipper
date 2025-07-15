import { Route, Routes } from 'react-router';

import Loading from './components/loading';
import { NotificationSystem } from './components/NotificationSystem';
import { ProtectedRoute } from './components/protected-route';
import { useAuth } from './hooks/useAuth';
import {
  DashboardPage,
  HomePage,
  LoginPage,
  ProfilePage,
  VideoDetailPage,
  VideosPage,
} from './pages';
import { AuthCallback } from './components/auth-callback';
import { useEffect } from 'react';

import type { User } from '@/types';

const App = () => {
  const { isInitialized, isAuthenticated, user, token, tokenExpiry } =
    useAuth();

  const notifyExtensionAuthUpdate = (
    authToken: string | null,
    expiry: number | null,
    userInfo: User,
  ) => {
    window.postMessage(
      {
        type: 'AUTH_TOKEN_UPDATE',
        token: authToken,
        expiry,
        user: userInfo,
      },
      'http://localhost:5173',
    );
  };

  const notifyExtensionLogout = () => {
    window.postMessage(
      {
        type: 'AUTH_LOGOUT',
      },
      'http://localhost:5173',
    );
  };

  // Handle auth state changes
  useEffect(() => {
    if (isInitialized) {
      if (isAuthenticated && user) {
        // Send real auth data to extension
        notifyExtensionAuthUpdate(token, tokenExpiry, user);
      } else {
        // User logged out
        notifyExtensionLogout();
      }
    }
  }, [isInitialized, isAuthenticated, user, token, tokenExpiry]);

  // Handle extension requests for auth status
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) {
        return;
      }
      if (event.data.type === 'CHECK_AUTH_STATUS') {
        if (isAuthenticated && user) {
          notifyExtensionAuthUpdate(token, tokenExpiry, user);
        } else {
          notifyExtensionLogout();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [user, isAuthenticated, tokenExpiry, token]);

  if (!isInitialized) {
    return <Loading />;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/auth' element={<LoginPage />} />
        <Route path='/auth/callback' element={<AuthCallback />} />

        <Route
          path='/dashboard'
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/profile'
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/videos'
          element={
            <ProtectedRoute>
              <VideosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/videos/:id'
          element={
            <ProtectedRoute>
              <VideoDetailPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <NotificationSystem />
    </div>
  );
};

export default App;
