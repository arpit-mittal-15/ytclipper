import Loading from '@/components/loading';
import { AddTimestampForm } from '@/components/timestamps/add-timestamp-form';
import { TimestampsList } from '@/components/timestamps/timestamps-list';
import { useTimestamps } from '@/hooks/useTimestamps';
import { Card, CardContent, CardHeader, CardTitle } from '@ytclipper/ui';
import { useParams } from 'react-router';

export const TimestampsPage = () => {
  const { videoId } = useParams<{ videoId: string }>();

  const {
    data: timestampsData,
    isLoading,
    error,
  } = useTimestamps(videoId || '');

  const handleTimestampClick = (timestampSeconds: number) => {
    // In a real app, this would seek to the timestamp in the video player
    console.log('Seeking to timestamp:', timestampSeconds);
    // For now, we'll just log it
    const minutes = Math.floor(timestampSeconds / 60);
    const seconds = timestampSeconds % 60;
    console.log(`Would seek to ${minutes}:${String(seconds).padStart(2, '0')}`);
  };

  if (!videoId) {
    return (
      <div className='p-8'>
        <h1 className='text-2xl font-bold text-red-600'>
          Error: Video ID not found
        </h1>
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
          Error loading timestamps
        </h1>
        <p className='text-gray-600 mt-2'>{error.message}</p>
      </div>
    );
  }

  return (
    <div className='p-8 max-w-4xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold mb-2'>Video Timestamps</h1>
        <p className='text-gray-600'>Video ID: {videoId}</p>
      </div>

      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Add New Timestamp</CardTitle>
          </CardHeader>
          <CardContent>
            <AddTimestampForm videoId={videoId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Timestamps ({timestampsData?.timestamps?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimestampsList
              timestamps={timestampsData?.timestamps || []}
              onTimestampClick={handleTimestampClick}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
