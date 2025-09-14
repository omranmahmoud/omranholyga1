import { useState, useCallback } from 'react';
import { useStoreData } from './useStoreData';
import { useStoreActions } from './useStoreActions';
import type { StoreContextType } from './types';

export function useStoreState(): StoreContextType {
  const [retryCount, setRetryCount] = useState(0);
  
  const { state, fetchData } = useStoreData({
    retryCount,
    setRetryCount,
    maxRetries: 3,
    retryDelay: 1000
  });

  const refreshData = useCallback(async () => {
    setRetryCount(0);
    return fetchData();
  }, [fetchData]);

  const actions = useStoreActions({
    state,
    setState: (newState) => {
      Object.entries(newState).forEach(([key, value]) => {
        state[key as keyof typeof state] = value;
      });
    },
    refreshData
  });

  return {
    ...state,
    ...actions,
    refreshData
  };
}
