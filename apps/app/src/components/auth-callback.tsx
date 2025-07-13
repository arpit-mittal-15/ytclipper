import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch } from '@/store/hooks';
import { useAuth } from '@/hooks/useAuth';
import {
  handleAuthCallback,
  resetCallbackHandled,
} from '@/store/slices/authSlice';
import Loading from './loading';

export const AuthCallback = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, callbackHandled } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      dispatch(handleAuthCallback());
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      navigate('/auth', { replace: true });
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    if (callbackHandled) {
      if (isAuthenticated) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/auth', { replace: true });
      }
      dispatch(resetCallbackHandled());
    }
  }, [callbackHandled, isAuthenticated, dispatch, navigate]);

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-center'>
        <Loading />
        <p className='mt-4 text-gray-600'>Completing authentication...</p>
      </div>
    </div>
  );
};
