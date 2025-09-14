import React, { createContext, useContext, useState, useEffect } from 'react';
import { storeService } from '../services/storeService';
import { withRetry, RetryOptions } from '../utils/retry';

interface Background {
  _id: string;
  name: string;
  type: 'color' | 'gradient' | 'pattern';
  value: string;
  isActive: boolean;
}

interface BackgroundContextType {
  activeBackground: Background | null;
  loading: boolean;
  error: string | null;
  refreshBackground: () => Promise<void>;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

const retryOptions: RetryOptions = {
  maxRetries: 3,
  retryDelay: 1000,
  onError: (error) => {
    console.error('Error fetching background:', error);
  }
};

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
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

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}
