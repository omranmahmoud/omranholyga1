import { useContext } from 'react';
import { BackgroundContext } from './BackgroundContext';

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}
