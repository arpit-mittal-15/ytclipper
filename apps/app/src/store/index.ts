import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { ENV } from '@/config';
import authSlice from './slices/authSlice';
import timestampSlice from './slices/timestampSlice';
import uiSlice from './slices/uiSlice';
import videoSlice from './slices/videoSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'],
  blacklist: ['ui', 'videos', 'timestamps'],
};

const rootReducer = combineReducers({
  auth: authSlice,
  ui: uiSlice,
  videos: videoSlice,
  timestamps: timestampSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
