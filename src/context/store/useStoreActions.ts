import { useCallback } from 'react';
import { storeService } from '../../services/storeService';
import { toast } from 'react-hot-toast';
import type { StoreState, StoreActions, Hero, StoreSettings } from './types';

interface UseStoreActionsProps {
  state: StoreState;
  setState: (newState: Partial<StoreState>) => void;
  refreshData: () => Promise<void>;
}

export function useStoreActions({
  state,
  setState,
  refreshData
}: UseStoreActionsProps): StoreActions {
  const updateHero = useCallback(async (heroData: Partial<Hero>) => {
    try {
      if (!state.hero?._id) {
        throw new Error('No active hero section found');
      }

      const updatedHero = await storeService.updateHero(state.hero._id, heroData);
      setState({ hero: updatedHero });
      await refreshData(); // Refresh all data after update
      toast.success('Hero section updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update hero section';
      toast.error(message);
      throw error;
    }
  }, [state.hero, setState, refreshData]);

  const updateSettings = useCallback(async (settingsData: Partial<StoreSettings>) => {
    try {
      const updatedSettings = await storeService.updateSettings(settingsData);
      setState({ settings: updatedSettings });
      await refreshData(); // Refresh all data after update
      toast.success('Store settings updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update store settings';
      toast.error(message);
      throw error;
    }
  }, [setState, refreshData]);

  return {
    updateHero,
    updateSettings,
    refreshData
  };
}
