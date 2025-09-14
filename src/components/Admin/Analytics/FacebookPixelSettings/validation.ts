
import type { FacebookPixelFormData, FacebookPixelValidation } from './types';

export function validateFacebookPixelConfig(data: FacebookPixelFormData): FacebookPixelValidation {
  const errors: string[] = [];

  if (data.enabled) {
    // Validate Pixel ID format (15-16 digits)
    if (!/^\d{15,16}$/.test(data.pixelId)) {
      errors.push('Facebook Pixel ID must be 15-16 digits');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
