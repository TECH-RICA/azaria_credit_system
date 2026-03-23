import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

/**
 * Hook to guard actions during God Mode Preview.
 * Returns a function that blocks execution and shows a toast 
 * if the owner is in Preview mode (not 'Acting' mode).
 */
export const useGodModeGuard = () => {
  const { user, activeRole, godModeActing } = useAuth();
  
  const isGodMode = user?.is_owner && activeRole !== user?.role;
  
  const guardAction = (callback) => {
    if (isGodMode && !godModeActing) {
      toast.error('Actions disabled in Preview Mode. Enable "Act Mode" in the banner to proceed.', {
        icon: '🛡️',
        duration: 4000
      });
      return false;
    }
    
    if (callback && typeof callback === 'function') {
      callback();
    }
    return true;
  };

  return { 
    guardAction, 
    isRestricted: isGodMode && !godModeActing 
  };
};