import { useEffect, useState, useCallback } from 'react';
import { I18nManager } from 'react-native';
import i18n from '../i18n';

/**
 * Provides current direction (rtl/ltr) without forcing a full app reload.
 * NOTE: React Native only fully mirrors built‑in components on reload after forceRTL().
 * We approximate a live flip by exposing direction + isRTL so styled views/text
 * can respond immediately. For complete accuracy (e.g. FlatList inversion), a reload is still ideal.
 */
export function useRuntimeDirection() {
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);
  const [direction, setDirection] = useState<'rtl' | 'ltr'>(I18nManager.isRTL ? 'rtl' : 'ltr');

  useEffect(() => {
    const handler = () => {
      const rtl = i18n.language === 'ar' || i18n.language === 'he';
      setIsRTL(rtl);
      setDirection(rtl ? 'rtl' : 'ltr');
    };
    i18n.on('languageChanged', handler);
    return () => { i18n.off('languageChanged', handler); };
  }, []);

  const flipRuntime = useCallback((rtl: boolean) => {
    // Do not call forceRTL here (would need reload). Only update local state.
    setIsRTL(rtl);
    setDirection(rtl ? 'rtl' : 'ltr');
  }, []);

  return { isRTL, direction, flipRuntime };
}
