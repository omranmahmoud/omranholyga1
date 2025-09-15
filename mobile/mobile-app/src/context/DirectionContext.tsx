import React, { createContext, useContext, useMemo, useState, ReactNode, useCallback } from 'react';
import i18n from '../i18n';

interface DirectionState {
  isRTL: boolean;
  direction: 'rtl' | 'ltr';
  setLanguageAndMaybeFlip: (lng: string) => Promise<void>;
  runtimeFlip: (rtl: boolean) => void;
}

const DirectionContext = createContext<DirectionState | undefined>(undefined);

export const DirectionProvider = ({ children }: { children: ReactNode }) => {
  const initialRTL = i18n.language === 'ar' || i18n.language === 'he';
  const [isRTL, setIsRTL] = useState(initialRTL);
  const [direction, setDirection] = useState<'rtl' | 'ltr'>(initialRTL ? 'rtl' : 'ltr');

  const setLanguageAndMaybeFlip = useCallback(async (lng: string) => {
    await i18n.changeLanguage(lng);
    const rtl = lng === 'ar' || lng === 'he';
    // Soft flip (no forceRTL to avoid reload). Components using context will adapt.
    setIsRTL(rtl);
    setDirection(rtl ? 'rtl' : 'ltr');
  }, []);

  const runtimeFlip = useCallback((rtl: boolean) => {
    setIsRTL(rtl);
    setDirection(rtl ? 'rtl' : 'ltr');
  }, []);

  const value = useMemo(() => ({ isRTL, direction, setLanguageAndMaybeFlip, runtimeFlip }), [isRTL, direction, setLanguageAndMaybeFlip, runtimeFlip]);
  return <DirectionContext.Provider value={value}>{children}</DirectionContext.Provider>;
};

export function useDirection() {
  const ctx = useContext(DirectionContext);
  if (!ctx) throw new Error('useDirection must be used inside DirectionProvider');
  return ctx;
}
