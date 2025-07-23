import { authApi, extensionMessaging } from '@/services';
import type { User } from '@/types';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { purgeAuthState } from '@/lib/persist-helpers';
import { clearAuthQueries, invalidateAuthQueries } from '@/lib/react-query';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  callbackHandled?: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  isInitialized: false,
  callbackHandled: false,
};

export const checkSession = createAsyncThunk(
  'auth/checkSession',
  async (_, thunkAPI) => {
    try {
      const user = await authApi.getCurrentUser(); // a `GET /me` or similar
      return user; // valid session
    } catch (err) {
      console.warn('Session check failed:', err);
      return thunkAPI.rejectWithValue('Session invalid');
    }
  },
);

export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authApi.getCurrentUser();
      console.log('user', user);
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Authentication failed',
      );
    }
  },
);

export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      const { auth_url } = await authApi.loginWithGoogle();
      window.location.href = auth_url;
      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Google login failed',
      );
    }
  },
);

export const loginWithEmailPassword = createAsyncThunk(
  'auth/loginWithEmailPassword',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const user = await authApi.login({ email, password });
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Login failed',
      );
    }
  },
);

export const registerWithEmailPassword = createAsyncThunk(
  'auth/registerWithEmailPassword',
  async (
    {
      name,
      email,
      password,
    }: { name: string; email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const user = await authApi.register({ name, email, password });
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Registration failed',
      );
    }
  },
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const user = await authApi.refreshToken();
      return user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Token refresh failed',
      );
    }
  },
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Logout failed',
      );
    }
  },
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      await authApi.forgotPassword({ email });
      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to send reset email',
      );
    }
  },
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (
    { token, password }: { token: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      await authApi.resetPassword({ token, password });
      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Password reset failed',
      );
    }
  },
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async ({ token }: { token: string }, { rejectWithValue }) => {
    try {
      await authApi.verifyEmail({ token });
      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Email verification failed',
      );
    }
  },
);

export const addPassword = createAsyncThunk(
  'auth/addPassword',
  async ({ password }: { password: string }, { rejectWithValue }) => {
    try {
      await authApi.addPassword({ password });
      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to add password',
      );
    }
  },
);

export const handleAuthCallback = createAsyncThunk(
  'auth/handleAuthCallback',
  async (_, { rejectWithValue }) => {
    try {
      const success = await authApi.handleAuthCallback();
      if (success) {
        const user = await authApi.getCurrentUser();
        console.log('user', user);
        return user;
      }
      return null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Auth callback failed',
      );
    }
  },
);

/**
 * Helper function to notify extension of authentication state changes
 */
const notifyExtension = {
  authSuccess: (user: User, token?: string, expiry?: number) => {
    extensionMessaging
      .notifyAuthSuccess(
        {
          id: user.id,
          email: user.email,
          name: user.name || '',
          createdAt: user.created_at,
        },
        token,
        expiry,
      )
      .catch(console.warn);
  },

  authUpdate: (user: User, token?: string, expiry?: number) => {
    extensionMessaging
      .notifyAuthUpdate(
        {
          id: user.id,
          email: user.email,
          name: user.name || '',
          createdAt: user.created_at,
        },
        token,
        expiry,
      )
      .catch(console.warn);
  },

  logout: () => {
    extensionMessaging.notifyAuthLogout().catch(console.warn);
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetCallbackHandled: (state) => {
      state.callbackHandled = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = !!action.payload;
        state.isInitialized = true;
        state.error = null;
        state.callbackHandled = true;

        if (action.payload) {
          notifyExtension.authUpdate(action.payload);
        }

        invalidateAuthQueries();
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        state.callbackHandled = false;
        state.error = action.payload as string;

        purgeAuthState();
        clearAuthQueries();
      })

      .addCase(loginWithGoogle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(loginWithEmailPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithEmailPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;

        notifyExtension.authSuccess(action.payload);
      })
      .addCase(loginWithEmailPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(registerWithEmailPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerWithEmailPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;

        notifyExtension.authSuccess(action.payload);
      })
      .addCase(registerWithEmailPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(logout.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.isLoading = false;

        notifyExtension.logout();

        purgeAuthState();
        clearAuthQueries();
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(addPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(addPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;

        if (action.payload) {
          notifyExtension.authUpdate(action.payload);
        }
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;

        purgeAuthState();
        clearAuthQueries();
      })

      .addCase(handleAuthCallback.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(handleAuthCallback.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        state.callbackHandled = true;

        if (action.payload) {
          notifyExtension.authSuccess(action.payload);
        }
      })
      .addCase(handleAuthCallback.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.callbackHandled = true;
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isInitialized = true;
      })
      .addCase(checkSession.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
      });
  },
});

export const { setUser, clearError, resetCallbackHandled } = authSlice.actions;
export default authSlice.reducer;
