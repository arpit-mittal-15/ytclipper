import { useAuth0 } from '@auth0/auth0-react';
import { Route, Routes } from 'react-router';

import Loading from '@/components/loading';
import ProtectedRoute from '@/components/protected-route';
import {
  AuthBridge,
  DashboardPage,
  HomePage,
  LoginPage,
  ProfilePage,
} from '@/pages';

const App = () => {
  const { isLoading } = useAuth0();

  // Enable communication with extension
  // useAuthMessageListener();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route path='/' element={<HomePage />} />
      <Route path='/auth-bridge' element={<AuthBridge />} />
      <Route path='/login' element={<LoginPage />} />
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
    </Routes>
  );
};

export default App;
