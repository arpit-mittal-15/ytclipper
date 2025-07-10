import React from 'react';

import { Button } from '@ytclipper/ui';

import type { LoginCredentials, RegisterCredentials } from '../types/auth';

interface LoginScreenProps {
  onLogin: (
    credentials: LoginCredentials,
  ) => Promise<{ success: boolean; error?: string }>;
  onRegister: (
    credentials: RegisterCredentials,
  ) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  isLoading,
  error,
  onClearError,
}) => {
  const handleWebAppLogin = async () => {
    onClearError();

    try {
      // This will open the web app for authentication
      await onLogin({ email: '', password: '' });
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleWebAppSignup = async () => {
    onClearError();

    // Open web app signup page
    chrome.tabs.create({
      url: 'http://localhost:5173/register?extension=true',
    });
  };

  return (
    <div className='login-container'>
      <div className='login-header'>
        <div className='login-logo'>
          <span>⏱️</span>
          <h1>YTClipper</h1>
        </div>
        <p className='login-subtitle'>
          Collect and organize YouTube timestamps
        </p>
      </div>

      <div className='login-content'>
        {error ? (
          <div className='error-message'>
            <p>{error}</p>
            <button onClick={onClearError} className='error-dismiss'>
              ×
            </button>
          </div>
        ) : null}

        <div className='auth-actions'>
          <Button
            onClick={handleWebAppLogin}
            disabled={isLoading}
            className='auth-button primary'
          >
            {isLoading ? 'Opening...' : 'Sign In'}
          </Button>

          <Button
            onClick={handleWebAppSignup}
            disabled={isLoading}
            variant='outline'
            className='auth-button secondary'
          >
            Create Account
          </Button>
        </div>

        <div className='auth-info'>
          <p>
            Authentication is handled securely through our web app. Your session
            will sync automatically.
          </p>
        </div>
      </div>

      <div className='login-footer'>
        <p>
          After signing in on the web app, return here to start collecting
          timestamps
        </p>
      </div>
    </div>
  );
};
