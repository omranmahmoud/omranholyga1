import { I18nManager } from 'react-native';
import i18n from '../i18n';

export function useRTL() {
  const isRTL = I18nManager.isRTL || /^(ar|he)/.test(i18n.language || '');
  return {
    isRTL,
    textAlign: isRTL ? 'right' : 'left' as const,
    writingDirection: isRTL ? 'rtl' : 'ltr' as const,
  };
}
