import * as Localization from 'expo-localization';

const SUPPORTED = ['en', 'ar', 'he'] as const;
export type SupportedLang = typeof SUPPORTED[number];

export function detectDeviceLanguage(fallback: SupportedLang = 'en'): SupportedLang {
  try {
    const locales = Localization.getLocales();
    if (!locales || locales.length === 0) return fallback;
    const first = locales[0];
    const code = (first.languageCode || first.languageTag?.split('-')[0] || '').toLowerCase();
    if (SUPPORTED.includes(code as SupportedLang)) return code as SupportedLang;
    return fallback;
  } catch (e) {
    return fallback;
  }
}

export const deviceLanguage = detectDeviceLanguage();
