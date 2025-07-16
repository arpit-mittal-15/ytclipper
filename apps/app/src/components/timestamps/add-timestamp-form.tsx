import { useCreateTimestamp } from '@/hooks/useTimestamps';
import { type CreateTimestampRequest } from '@/services';
import { Button } from '@ytclipper/ui';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

interface AddTimestampFormProps {
  videoId: string;
  onClose?: () => void;
}

export const AddTimestampForm = ({
  videoId,
  onClose,
}: AddTimestampFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    timestamp: '',
    title: '',
    note: '',
    tags: '',
  });

  const createTimestamp = useCreateTimestamp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse timestamp from MM:SS or HH:MM:SS format to seconds
    const timestampParts = formData.timestamp.split(':').map(Number);
    let timestampSeconds: number;

    if (timestampParts.length === 2) {
      // MM:SS format
      timestampSeconds = timestampParts[0] * 60 + timestampParts[1];
    } else if (timestampParts.length === 3) {
      // HH:MM:SS format
      timestampSeconds =
        timestampParts[0] * 3600 + timestampParts[1] * 60 + timestampParts[2];
    } else {
      // eslint-disable-next-line no-alert
      window.alert('Invalid timestamp format. Please use MM:SS or HH:MM:SS');
      return;
    }

    const data: CreateTimestampRequest = {
      video_id: videoId,
      timestamp: timestampSeconds,
      title: formData.title || undefined,
      note: formData.note || undefined,
      tags: formData.tags
        ? formData.tags.split(',').map((tag) => tag.trim())
        : undefined,
    };

    try {
      await createTimestamp.mutateAsync(data);
      setFormData({ timestamp: '', title: '', note: '', tags: '' });
      setIsOpen(false);
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to create timestamp:', error);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className='flex items-center gap-2'
      >
        <Plus className='h-4 w-4' />
        Add Timestamp
      </Button>
    );
  }

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-4'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='font-medium'>Add New Timestamp</h3>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => {
            setIsOpen(false);
            if (onClose) {
              onClose();
            }
          }}
        >
          <X className='h-4 w-4' />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label
            htmlFor='timestamp'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Timestamp (MM:SS or HH:MM:SS)
          </label>
          <input
            id='timestamp'
            type='text'
            value={formData.timestamp}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange('timestamp', e.target.value)
            }
            placeholder='2:30 or 1:02:30'
            required
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label
            htmlFor='title'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Title (optional)
          </label>
          <input
            id='title'
            type='text'
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange('title', e.target.value)
            }
            placeholder='Important concept'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label
            htmlFor='note'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Note (optional)
          </label>
          <textarea
            id='note'
            value={formData.note}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleInputChange('note', e.target.value)
            }
            placeholder='Add your notes here...'
            rows={3}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div>
          <label
            htmlFor='tags'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Tags (optional, comma-separated)
          </label>
          <input
            id='tags'
            type='text'
            value={formData.tags}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange('tags', e.target.value)
            }
            placeholder='concept, important, review'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          />
        </div>

        <div className='flex gap-2'>
          <Button
            type='submit'
            disabled={createTimestamp.isPending || !formData.timestamp}
          >
            {createTimestamp.isPending ? 'Adding...' : 'Add Timestamp'}
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              setIsOpen(false);
              if (onClose) {
                onClose();
              }
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
