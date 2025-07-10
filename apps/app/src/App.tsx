import { useAuth0 } from '@auth0/auth0-react';
import { Route, BrowserRouter as Router, Routes } from 'react-router';

import Loading from './components/loading';
import ProtectedRoute from './components/protected-route';
import DashboardPage from './pages/dashboard';
import HomePage from './pages/home';
import LoginPage from './pages/login';
import ProfilePage from './pages/profile';
import { useAuthMessageListener } from './services/auth';

const App = () => {
  const { isLoading } = useAuth0();

  // Enable communication with extension
  useAuthMessageListener();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Router>
      <Routes>
        <Route path='/' element={<HomePage />} />
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
    </Router>
  );
};

export default App;
