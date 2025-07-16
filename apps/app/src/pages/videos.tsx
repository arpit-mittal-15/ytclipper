import Loading from '@/components/loading';
import { useAuth } from '@/hooks/useAuth';
import { useUserVideos } from '@/hooks/useVideos';
import { formatTimestamp } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@ytclipper/ui';
import { Calendar, Clock, Play } from 'lucide-react';
import { Link } from 'react-router';

export const VideosPage = () => {
  const { isAuthenticated } = useAuth();
  const { data: videosData, isLoading, error } = useUserVideos();

  if (!isAuthenticated) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='p-8'>
          <h1 className='text-2xl font-bold text-red-600'>Access Denied</h1>
          <p className='text-gray-600 mt-2'>
            Please log in to view your videos.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className='p-8'>
        <h1 className='text-2xl font-bold text-red-600'>
          Error loading videos
        </h1>
        <p className='text-gray-600 mt-2'>{error.message}</p>
      </div>
    );
  }

  const videos = videosData?.videos || [];

  return (
    <div className='p-8 max-w-6xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold mb-2'>Your Videos</h1>
        <p className='text-gray-600'>
          Videos you&apos;ve created timestamps for
        </p>
      </div>

      {videos.length === 0 ? (
        <div className='text-center py-12'>
          <p className='text-gray-500 text-lg'>No videos found.</p>
          <p className='text-gray-400 text-sm mt-2'>
            Start adding timestamps to YouTube videos to see them here!
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {videos.map((video) => (
            <Link
              key={video.video_id}
              to={`/timestamps/${video.video_id}`}
              className='block group'
            >
              <Card className='overflow-hidden hover:shadow-lg transition-all duration-200 group-hover:scale-[1.02]'>
                <div className='relative w-full h-48 bg-gray-300 flex items-center justify-center'>
                  <img
                    src={`https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`}
                    alt={`Video ${video.video_id}`}
                    className='absolute inset-0 w-full h-full object-cover'
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src.includes('hqdefault')) {
                        target.src = `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`;
                      } else if (target.src.includes('mqdefault')) {
                        target.src = `https://img.youtube.com/vi/${video.video_id}/default.jpg`;
                      } else {
                        // If all thumbnails fail, hide the image and show placeholder
                        target.style.display = 'none';
                      }
                    }}
                    loading='lazy'
                  />
                  {/* Fallback content when image fails */}
                  <div className='text-gray-500 text-center z-10'>
                    <Play className='w-16 h-16 mx-auto mb-2 opacity-50' />
                    <p className='text-sm'>Video Thumbnail</p>
                  </div>
                  <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center z-20'>
                    <Play className='w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                  </div>
                  <div className='absolute top-2 right-2 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-sm z-30'>
                    {video.timestamp_count} timestamps
                  </div>
                </div>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-lg line-clamp-2 group-hover:text-blue-600 transition-colors'>
                    Video: {video.video_id}
                  </CardTitle>
                </CardHeader>
                <CardContent className='pt-0'>
                  <div className='space-y-2 text-sm text-gray-600'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-1'>
                        <Clock className='w-4 h-4' />
                        <span>{video.timestamp_count} timestamps</span>
                      </div>
                      <div className='flex items-center space-x-1'>
                        <Calendar className='w-4 h-4' />
                        <span>
                          {new Date(video.latest_created).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {video.first_timestamp !== undefined &&
                      video.last_timestamp !== undefined && (
                        <div className='text-xs text-gray-500'>
                          Duration:{' '}
                          {formatTimestamp(Math.floor(video.first_timestamp))} -{' '}
                          {formatTimestamp(Math.floor(video.last_timestamp))}
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
