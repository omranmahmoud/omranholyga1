import { Platform } from 'react-native';
import i18n from '../i18n';

// Extend or replace with actual custom font families once added under assets/fonts.
// For Arabic it's common to use Cairo, Tajawal, NotoSansArabic, etc.
// After adding font files, map weight -> loaded font name here.

type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

interface FontConfig {
  regular: string;
  medium: string;
  semibold: string;
  bold: string;
}

// System fallback sets. You can swap these when custom fonts are integrated.
const latinSystem: FontConfig = {
  regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' })!,
  medium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' })!,
  semibold: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' })!,
  bold: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' })!,
};

const arabicSystem: FontConfig = {
  // Geeza Pro (iOS) or Droid Arabic Naskh (older Android) may not exist everywhere; keep generic.
  regular: Platform.select({ ios: 'Geeza Pro', android: 'sans-serif', default: 'System' })!,
  medium: Platform.select({ ios: 'Geeza Pro', android: 'sans-serif-medium', default: 'System' })!,
  semibold: Platform.select({ ios: 'Geeza Pro', android: 'sans-serif-medium', default: 'System' })!,
  bold: Platform.select({ ios: 'Geeza Pro', android: 'sans-serif', default: 'System' })!,
};

export function isArabic(lang?: string) {
  const l = (lang || i18n.language || '').toLowerCase();
  return l.startsWith('ar');
}

export function isHebrew(lang?: string) {
  const l = (lang || i18n.language || '').toLowerCase();
  return l.startsWith('he');
}

export function getFontFamily(weight: Weight = 'regular', lang?: string) {
  const cfg = (isArabic(lang) || isHebrew(lang)) ? arabicSystem : latinSystem;
  return cfg[weight];
}

export function typography(lang?: string) {
  return {
    body: { fontFamily: getFontFamily('regular', lang), fontSize: 14, lineHeight: 20 },
    bodyLarge: { fontFamily: getFontFamily('regular', lang), fontSize: 16, lineHeight: 24 },
    title: { fontFamily: getFontFamily('bold', lang), fontSize: 18, lineHeight: 26 },
    headline: { fontFamily: getFontFamily('bold', lang), fontSize: 22, lineHeight: 30 },
  } as const;
}

// Instructions for adding custom Arabic fonts (example Cairo):
// 1. Place Cairo-Regular.ttf, Cairo-Bold.ttf etc under assets/fonts/
// 2. In App.tsx (or a fonts hook) load with expo-font: useFonts({ 'Cairo-Regular': require('../../assets/fonts/Cairo-Regular.ttf') })
// 3. Replace arabicSystem mapping with the custom names, e.g. regular: 'Cairo-Regular', bold: 'Cairo-Bold'
// 4. Reload app (expo start -c if cache issues)
