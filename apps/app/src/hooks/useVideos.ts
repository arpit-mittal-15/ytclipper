import { videosQueries } from '@/lib/react-query';
import { useQuery } from '@tanstack/react-query';

export const useUserVideos = () => {
  return useQuery(videosQueries.userVideos());
};
