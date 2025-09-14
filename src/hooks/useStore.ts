import { useState, useEffect, useCallback } from 'react';
import { storeService } from '../services/storeService';
import { toast } from 'react-hot-toast';

interface UseStoreOptions {
  autoFetch?: boolean;
  retryOnError?: boolean;
  maxRetries?: number;
}

export function useStore(options: UseStoreOptions = {}) {
  const {
    autoFetch = true,
    retryOnError = true,
    maxRetries = 3
  } = options;

  const [hero, setHero] = useState(null);
  const [settings, setSettings] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchStoreData = useCallback(async (retry = false) => {
    if (retry && retryCount >= maxRetries) {
      setError('Maximum retry attempts reached');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [heroData, settingsData, announcementsData] = await Promise.all([
        storeService.getActiveHero(),
        storeService.getSettings(),
        storeService.getActiveAnnouncements()
      ]);

      setHero(heroData);
      setSettings(settingsData);
      setAnnouncements(announcementsData);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error fetching store data:', error);
      setError('Failed to load store data');
      
      if (retryOnError && retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchStoreData(true);
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        toast.error('Failed to load store data');
        setLoading(false);
      }
    }
  }, [maxRetries, retryCount, retryOnError]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchStoreData();
    }
  }, [autoFetch, fetchStoreData]);

  const updateHero = async (heroData: any) => {
    try {
      if (hero?._id) {
        const updatedHero = await storeService.updateHero(hero._id, heroData);
        setHero(updatedHero);
      }
    } catch (error) {
      // Error is handled by service
      throw error;
    }
  };

  const updateSettings = async (settingsData: any) => {
    try {
      const updatedSettings = await storeService.updateSettings(settingsData);
      setSettings(updatedSettings);
    } catch (error) {
      // Error is handled by service
      throw error;
    }
  };

  const refreshData = () => {
    setRetryCount(0); // Reset retry count
    return fetchStoreData();
  };

  return {
    hero,
    settings,
    announcements,
    loading,
    error,
    updateHero,
    updateSettings,
    refreshData
  };
}
