import React, { createContext, useState, useEffect } from 'react';
import { storeService } from '../../services/storeService';
import { withRetry } from '../../utils/retry';
import type { Background, BackgroundContextType, BackgroundProviderProps } from './types';

export const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

const retryOptions = {
  maxRetries: 3,
  retryDelay: 1000,
  onError: (error: unknown) => {
    console.error('Error fetching background:', error);
  }
};

export function BackgroundProvider({ children }: BackgroundProviderProps) {
  const [activeBackground, setActiveBackground] = useState<Background | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveBackground = async () => {
    try {
      setLoading(true);
      setError(null);

      const background = await withRetry(
        () => storeService.getActiveBackground(),
        retryOptions
      );

      setActiveBackground(background);
    } catch (error) {
      setError('Failed to load background');
      console.error('Background fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveBackground();
  }, []);

  const refreshBackground = async () => {
    await fetchActiveBackground();
  };

  return (
    <BackgroundContext.Provider value={{
      activeBackground,
      loading,
      error,
      refreshBackground
    }}>
      {children}
    </BackgroundContext.Provider>
  );
}
