import { I18nManager } from 'react-native';

// Apply RTL/LTR direction based on language code.
// NOTE: Forcing a direction change typically requires an app reload to fully apply.
export function applyRtlIfNeeded(lang: string) {
  const shouldBeRTL = lang === 'ar' || lang === 'he';
  if (shouldBeRTL !== I18nManager.isRTL) {
    try {
      // Allow RTL always (harmless if already true)
      I18nManager.allowRTL(true);
      I18nManager.forceRTL(shouldBeRTL);
      // Developer hint: a reload is needed for changes to take effect everywhere.
      // In Expo, you can trigger a reload via Dev Menu or programmatically with Updates.reloadAsync().
      console.log('[i18n] RTL direction changed. Reload app to apply fully. currentRTL=', shouldBeRTL);
    } catch (e) {
      console.warn('[i18n] Failed to apply RTL settings', e);
    }
  }
}
