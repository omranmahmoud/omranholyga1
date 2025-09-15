import { useState, useEffect, useCallback } from 'react';
import { storeService } from '../../services/storeService';
import { toast } from 'react-hot-toast';
import type { StoreState } from './types';

interface UseStoreDataProps {
  retryCount: number;
  setRetryCount: (count: number) => void;
  maxRetries: number;
  retryDelay: number;
}

const initialState: StoreState = {
  hero: null,
  settings: null,
  announcements: [],
  loading: true,
  error: null
};

export function useStoreData({ 
  retryCount, 
  setRetryCount, 
  maxRetries, 
  retryDelay 
}: UseStoreDataProps) {
  const [state, setState] = useState<StoreState>(initialState);

  const fetchData = useCallback(async (retry = false) => {
    if (retry && retryCount >= maxRetries) {
      setState(prev => ({
        ...prev,
        error: 'Maximum retry attempts reached',
        loading: false
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const [heroData, settingsData, announcementsData] = await Promise.all([
        storeService.getActiveHero(),
        storeService.getSettings(),
        storeService.getActiveAnnouncements()
      ]);

      setState({
        hero: heroData,
        settings: settingsData,
        announcements: Array.isArray(announcementsData) ? announcementsData : [],
        loading: false,
        error: null
      });

      setRetryCount(0);
    } catch (error) {
      console.error('Error fetching store data:', error);
      
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        const delay = retryDelay * Math.pow(2, retryCount);
        setTimeout(() => fetchData(true), delay);
      } else {
        setState(prev => ({
          ...prev,
          error: 'Failed to load store data',
          loading: false,
          announcements: [] // Ensure announcements is always an array
        }));
        toast.error('Failed to load store data');
      }
    }
  }, [retryCount, maxRetries, retryDelay, setRetryCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { state, fetchData };
}
]