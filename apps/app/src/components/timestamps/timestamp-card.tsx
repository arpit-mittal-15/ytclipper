import { useDeleteTimestamp } from '@/hooks/useTimestamps';
import { formatTimestamp } from '@/lib/utils';
import { type Timestamp } from '@/services';
import { Button } from '@ytclipper/ui';
import { Trash2 } from 'lucide-react';

interface TimestampCardProps {
  timestamp: Timestamp;
  onTimestampClick?: (timestampSeconds: number) => void;
}

export const TimestampCard = ({
  timestamp,
  onTimestampClick,
}: TimestampCardProps) => {
  const deleteTimestamp = useDeleteTimestamp();

  const handleTimestampClick = () => {
    if (onTimestampClick) {
      onTimestampClick(timestamp.timestamp);
    }
  };

  const handleDelete = async () => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Are you sure you want to delete this timestamp?')) {
      deleteTimestamp.mutate(timestamp.id);
    }
  };

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow'>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-2'>
            <button
              onClick={handleTimestampClick}
              className='text-blue-600 hover:text-blue-800 font-mono text-sm bg-blue-50 px-2 py-1 rounded'
            >
              {formatTimestamp(Math.floor(timestamp.timestamp))}
            </button>
            {timestamp.title ? (
              <h3 className='font-medium text-gray-900'>{timestamp.title}</h3>
            ) : null}
          </div>

          {timestamp.note ? (
            <p className='text-gray-700 text-sm mb-2'>{timestamp.note}</p>
          ) : null}

          {timestamp.tags && timestamp.tags.length > 0 ? (
            <div className='flex flex-wrap gap-1 mb-2'>
              {timestamp.tags.map((tag) => (
                <span
                  key={tag}
                  className='inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs'
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className='text-xs text-gray-500'>
            {new Date(timestamp.created_at).toLocaleDateString()}
          </div>
        </div>

        <Button
          variant='ghost'
          size='sm'
          onClick={handleDelete}
          disabled={deleteTimestamp.isPending}
          className='text-red-600 hover:text-red-800 hover:bg-red-50'
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
};
