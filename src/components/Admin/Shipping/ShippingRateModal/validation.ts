// src/components/Admin/Shipping/ShippingRateModal/validation.ts
import { ShippingRateFormData, ShippingRateValidation } from './types';

export function validateShippingRateForm(data: ShippingRateFormData): ShippingRateValidation {
  const errors: string[] = [];

  // Validate name
  if (!data.name.trim()) {
    errors.push('Rate name is required');
  }

  // Validate base rate
  if (data.baseRate < 0) {
    errors.push('Base rate cannot be negative');
  }

  // Validate additional fee
  if (data.additionalFee < 0) {
    errors.push('Additional fee cannot be negative');
  }

  // Validate free shipping threshold
  if (data.freeShippingThreshold !== undefined && data.freeShippingThreshold < 0) {
    errors.push('Free shipping threshold cannot be negative');
  }

  // Validate estimated days
  if (data.estimatedDays.min < 0) {
    errors.push('Minimum delivery days cannot be negative');
  }
  if (data.estimatedDays.max < data.estimatedDays.min) {
    errors.push('Maximum delivery days must be greater than or equal to minimum days');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
