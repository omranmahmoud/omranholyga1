import { ShippingRateFormData } from '../types';

export function validateShippingRate(data: ShippingRateFormData): string[] {
  const errors: string[] = [];

  // Required fields
  if (!data.name.trim()) {
    errors.push('Rate name is required');
  }

  // Base rate validation
  if (typeof data.baseRate !== 'number' || data.baseRate < 0) {
    errors.push('Base rate must be a non-negative number');
  }

  // Additional fee validation
  if (typeof data.additionalFee !== 'number' || data.additionalFee < 0) {
    errors.push('Additional fee must be a non-negative number');
  }

  // Free shipping threshold validation
  if (data.freeShippingThreshold !== undefined && data.freeShippingThreshold < 0) {
    errors.push('Free shipping threshold must be a non-negative number');
  }

  // Delivery days validation
  if (data.estimatedDays.min < 0) {
    errors.push('Minimum delivery days must be non-negative');
  }

  if (data.estimatedDays.max < data.estimatedDays.min) {
    errors.push('Maximum delivery days must be greater than or equal to minimum days');
  }

  // Conditions validation
  if (data.type !== 'flat' && data.conditions.length === 0) {
    errors.push(`At least one condition is required for ${data.type} based rates`);
  }

  data.conditions.forEach((condition, index) => {
    if (condition.value < 0) {
      errors.push(`Condition ${index + 1} value must be non-negative`);
    }
  });

  return errors;
}
