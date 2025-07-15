import { Button } from '@ytclipper/ui';
import { useAuth } from '../hooks/useAuth';
import { syncLogout } from '../services/extension-sync';

const LogoutButton = () => {
  const { logout, isAuthenticated, isLoading } = useAuth();

  const handleLogout = async () => {
    try {
      const result = await syncLogout();
      if (result.success) {
        console.log('✅ Extension notified of logout');
      } else {
        console.warn('❌ Extension logout sync failed:', result.error);
      }
    } catch (error) {
      console.warn('❌ Failed to sync logout with extension:', error);
    }

    logout();
  };

  if (isLoading) {
    return <Button disabled>Loading...</Button>;
  }

  if (!isAuthenticated) {
    return null; // Don't show logout button if not authenticated
  }

  return (
    <Button
      onClick={handleLogout}
      variant='outline'
      className='border-red-500 text-red-500 hover:bg-red-50'
    >
      Log Out
    </Button>
  );
};

export default LogoutButton;
