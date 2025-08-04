import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pb } from '../services/auth';

/**
 * Hook to set up PocketBase real-time subscriptions for financial data
 */
export function usePocketBaseRealtime() {
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    let unsubscribeFunctions: (() => void)[] = [];

    const setupSubscriptions = async () => {
      try {
        // Subscribe to transactions changes
        const unsubTransactions = await pb.collection('transactions').subscribe('*', (e) => {
          console.log('PocketBase transactions event:', e);
          
          // Invalidate transactions queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
          queryClient.invalidateQueries({ queryKey: ['category-breakdown'] });
        }, {
          filter: `userId = "${user.id}"` // Only listen to current user's transactions
        });

        // Subscribe to uploads changes
        const unsubUploads = await pb.collection('uploads').subscribe('*', (e) => {
          console.log('PocketBase uploads event:', e);
          
          // Invalidate upload history queries
          queryClient.invalidateQueries({ queryKey: ['upload-history'] });
          
          // If upload is completed, also refresh financial data
          if (e.record?.status === 'completed') {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
            queryClient.invalidateQueries({ queryKey: ['category-breakdown'] });
          }
        }, {
          filter: `userId = "${user.id}"` // Only listen to current user's uploads
        });

        unsubscribeFunctions = [unsubTransactions, unsubUploads];
        
        console.log('PocketBase real-time subscriptions established');
      } catch (error) {
        console.warn('Failed to establish PocketBase real-time subscriptions:', error);
        // Don't throw error - app should work without real-time updates
      }
    };

    setupSubscriptions();

    // Cleanup function
    return () => {
      unsubscribeFunctions.forEach(unsub => {
        try {
          unsub();
        } catch (error) {
          console.warn('Error unsubscribing from PocketBase:', error);
        }
      });
      console.log('PocketBase real-time subscriptions cleaned up');
    };
  }, [isAuthenticated, user, queryClient]);
}

/**
 * Hook to manually trigger real-time connection check
 */
export function usePocketBaseConnection() {
  const { isAuthenticated } = useAuth();

  const checkConnection = async (): Promise<boolean> => {
    if (!isAuthenticated) {
      return false;
    }

    try {
      // Try to fetch a simple record to test connection
      await pb.health.check();
      return true;
    } catch (error) {
      console.warn('PocketBase connection check failed:', error);
      return false;
    }
  };

  const reconnect = async (): Promise<boolean> => {
    try {
      // Force refresh the auth token
      if (pb.authStore.isValid) {
        await pb.collection('users').authRefresh();
      }
      return await checkConnection();
    } catch (error) {
      console.warn('PocketBase reconnection failed:', error);
      return false;
    }
  };

  return {
    checkConnection,
    reconnect,
    isConnected: pb.authStore.isValid,
  };
}