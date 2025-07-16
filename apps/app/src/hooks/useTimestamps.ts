import { timestampsQueries } from '@/lib/react-query';
import {
  timestampsApi,
  type CreateTimestampRequest,
  type GetTimestampsResponse,
  type Timestamp,
} from '@/services';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useTimestamps = (videoId: string) => {
  return useQuery(timestampsQueries.byVideo(videoId));
};

export const useCreateTimestamp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTimestampRequest) =>
      timestampsApi.createTimestamp(data),
    onSuccess: (newTimestamp: Timestamp) => {
      // Update the cache with the new timestamp
      queryClient.setQueryData(
        timestampsQueries.byVideo(newTimestamp.video_id).queryKey,
        (old: GetTimestampsResponse | undefined) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            timestamps: [...(old.timestamps || []), newTimestamp].sort(
              (a, b) => a.timestamp - b.timestamp,
            ),
          };
        },
      );
    },
    onError: (error) => {
      console.error('Failed to create timestamp:', error);
    },
  });
};

export const useDeleteTimestamp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (timestampId: string) =>
      timestampsApi.deleteTimestamp(timestampId),
    onSuccess: (_response, timestampId) => {
      // Remove the deleted timestamp from all relevant caches
      queryClient.setQueriesData(
        { queryKey: ['timestamps', 'video'] },
        (old: GetTimestampsResponse | undefined) => {
          if (!old?.timestamps) {
            return old;
          }
          return {
            ...old,
            timestamps: old.timestamps.filter(
              (t: Timestamp) => t.id !== timestampId,
            ),
          };
        },
      );
    },
    onError: (error) => {
      console.error('Failed to delete timestamp:', error);
    },
  });
};
