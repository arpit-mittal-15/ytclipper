import { Card, CardContent } from '@ytclipper/ui';

const Loading = () => {
  return (
    <div className='flex justify-center items-center min-h-screen'>
      <Card className='max-w-sm'>
        <CardContent className='p-6 text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4' />
          <p className='text-gray-600'>Loading...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Loading;
