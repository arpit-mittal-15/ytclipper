import { authApi, timestampsApi, videosApi } from '@/services';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('401')) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

export const queryKeys = {
  auth: {
    user: ['auth', 'user'] as const,
    profile: ['auth', 'profile'] as const,
  },
  videos: {
    all: ['videos'] as const,
    list: (filters?: Record<string, unknown>) =>
      ['videos', 'list', filters] as const,
    detail: (id: string) => ['videos', 'detail', id] as const,
  },
  timestamps: {
    all: ['timestamps'] as const,
    byVideo: (videoId: string) => ['timestamps', 'video', videoId] as const,
  },
} as const;

export const authQueries = {
  user: () => ({
    queryKey: queryKeys.auth.user,
    queryFn: () => authApi.getCurrentUser(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  }),
  profile: () => ({
    queryKey: queryKeys.auth.profile,
    queryFn: () => authApi.getCurrentUser(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  }),
};

export const timestampsQueries = {
  byVideo: (videoId: string) => ({
    queryKey: queryKeys.timestamps.byVideo(videoId),
    queryFn: () => timestampsApi.getTimestamps(videoId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  }),
};

export const videosQueries = {
  userVideos: () => ({
    queryKey: queryKeys.videos.all,
    queryFn: () => videosApi.getUserVideos(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  }),
};

queryClient.setMutationDefaults(['auth'], {
  onError: (error) => {
    console.error('Auth mutation error:', error);
  },
});

export const invalidateAuthQueries = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
  queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile });
};

export const clearAuthQueries = () => {
  queryClient.removeQueries({ queryKey: queryKeys.auth.user });
  queryClient.removeQueries({ queryKey: queryKeys.auth.profile });
};
