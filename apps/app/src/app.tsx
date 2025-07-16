import { Route, Routes } from 'react-router';

import { useEffect } from 'react';
import { AuthCallback } from './components/auth-callback';
import Loading from './components/loading';
import { NotificationSystem } from './components/NotificationSystem';
import { ProtectedRoute } from './components/protected-route';
import { useAuth } from './hooks/useAuth';
import {
  DashboardPage,
  HomePage,
  LoginPage,
  ProfilePage,
  TimestampsPage,
  VideoDetailPage,
  VideosPage,
} from './pages';
import { syncAuthState } from './services/extension-sync';

const App = () => {
  const { isInitialized, isAuthenticated, user, token, tokenExpiry } =
    useAuth();

  useEffect(() => {
    if (isInitialized) {
      syncAuthState(isAuthenticated, user)
        .then((result) => {
          if (result.success) {
            console.log('✅ App-level extension sync successful');
          } else {
            console.warn('❌ App-level extension sync failed:', result.error);
          }
        })
        .catch((error) => {
          console.warn('❌ App-level extension sync error:', error);
        });
    }
  }, [isInitialized, isAuthenticated, user, token, tokenExpiry]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window) {
        return;
      }
      if (event.data.type === 'CHECK_AUTH_STATUS') {
        syncAuthState(isAuthenticated, user).catch(console.warn);
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
        <Route
          path='/timestamps/:videoId'
          element={
            <ProtectedRoute>
              <TimestampsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <NotificationSystem />
    </div>
  );
};

export default App;
