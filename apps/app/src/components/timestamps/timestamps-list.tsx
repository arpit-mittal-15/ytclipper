import { type Timestamp } from '@/services';
import { TimestampCard } from './timestamp-card';

interface TimestampsListProps {
  timestamps: Timestamp[];
  onTimestampClick?: (timestampSeconds: number) => void;
}

export const TimestampsList = ({
  timestamps,
  onTimestampClick,
}: TimestampsListProps) => {
  const sortedTimestamps = [...timestamps].sort(
    (a, b) => a.timestamp - b.timestamp,
  );

  if (sortedTimestamps.length === 0) {
    return (
      <div className='text-center py-8'>
        <p className='text-gray-500'>No timestamps yet.</p>
        <p className='text-gray-400 text-sm mt-1'>
          Start adding timestamps to remember important moments!
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {sortedTimestamps.map((timestamp) => (
        <TimestampCard
          key={timestamp.id}
          timestamp={timestamp}
          onTimestampClick={onTimestampClick}
        />
      ))}
    </div>
  );
};
