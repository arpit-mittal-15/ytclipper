import { Route, Routes } from 'react-router';

import { AuthRouteGuard, ProtectedRouteGuard } from '@/components/guards';
import { DashboardPage, HomePage, ProfilePage } from './pages';
import { GoogleCallback } from './pages/google-callback';
import { AuthRoutes } from './routes';

const App = () => {
  // useEffect(() => {
  //   if (isInitialized) {
  //     syncAuthState(isAuthenticated, user)
  //       .then((result) => {
  //         if (result.success) {
  //           console.log('✅ App-level extension sync successful');
  //         } else {
  //           console.warn('❌ App-level extension sync failed:', result.error);
  //         }
  //       })
  //       .catch((error) => {
  //         console.warn('❌ App-level extension sync error:', error);
  //       });
  //   }
  // }, [isInitialized, isAuthenticated, user, token, tokenExpiry]);
  //
  // useEffect(() => {
  //   if (isInitialized && isAuthenticated && !token) {
  //     const cleanup = setupTokenRefresh();
  //     return cleanup;
  //   }
  //   return undefined;
  // }, [isInitialized, isAuthenticated, token]);
  //
  // useEffect(() => {
  //   const handleMessage = (event: MessageEvent) => {
  //     if (event.source !== window) {
  //       return;
  //     }
  //     if (event.data.type === 'CHECK_AUTH_STATUS') {
  //       syncAuthState(isAuthenticated, user).catch(console.warn);
  //     }
  //   };
  //
  //   window.addEventListener('message', handleMessage);
  //   return () => window.removeEventListener('message', handleMessage);
  // }, [user, isAuthenticated, tokenExpiry, token]);
  //
  // if (!isInitialized) {
  //   return <Loading />;
  // }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Routes>
        <Route
          path='/'
          element={
            <AuthRouteGuard>
              <HomePage />
            </AuthRouteGuard>
          }
        />
        <Route
          path='/*'
          element={
            <AuthRouteGuard>
              <AuthRoutes />
            </AuthRouteGuard>
          }
        />
        <Route path='/auth/callback' element={<GoogleCallback />} />
        <Route
          path='/dashboard'
          element={
            <ProtectedRouteGuard>
              <DashboardPage />
            </ProtectedRouteGuard>
          }
        />
        <Route
          path='/profile'
          element={
            <ProtectedRouteGuard>
              <ProfilePage />
            </ProtectedRouteGuard>
          }
        />

        {/*         <Route
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
        /> */}
      </Routes>
    </div>
  );
};

export default App;
