import i18n from '../i18n';
import { typography as buildTypography } from './fonts';

// Returns current typography styles based on active language (handles Arabic fonts/metrics if needed)
export function getTypography() {
  return buildTypography(i18n.language);
}

// Variant keys for convenience (extend as needed)
export type TypographyVariant = 'body' | 'bodyLarge' | 'title' | 'headline' | 'caption' | 'button';

// Derive base set then extend with additional variants not in base helper
export function getVariantStyle(variant: TypographyVariant) {
  const base = getTypography();
  switch (variant) {
    case 'body':
      return base.body;
    case 'bodyLarge':
      return base.bodyLarge;
    case 'title':
      return base.title;
    case 'headline':
      return base.headline;
    case 'caption':
      return { fontFamily: base.body.fontFamily, fontSize: 12, lineHeight: 16 };
    case 'button':
      return { fontFamily: base.title.fontFamily, fontSize: 14, lineHeight: 18, textTransform: 'uppercase' as const };
    default:
      return base.body;
  }
}
