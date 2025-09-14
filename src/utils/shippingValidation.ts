
import { z } from 'zod';
import type { ShippingZone, ShippingRate } from '../types/shipping';

const ShippingZoneSchema = z.object({
  name: z.string().min(1, 'Zone name is required'),
  countries: z.array(z.string().length(2, 'Invalid country code')).min(1, 'At least one country is required'),
  regions: z.array(z.string()),
  isActive: z.boolean().optional().default(true),
  order: z.number().optional().default(0)
});

const ShippingRateSchema = z.object({
  zone: z.string().min(1, 'Shipping zone is required'),
  name: z.string().min(1, 'Rate name is required'),
  type: z.enum(['flat', 'weight', 'price']),
  baseRate: z.number().min(0, 'Base rate must be non-negative'),
  conditions: z.array(z.object({
    type: z.enum(['min_weight', 'max_weight', 'min_price', 'max_price']),
    value: z.number().min(0, 'Condition value must be non-negative')
  })),
  additionalFee: z.number().min(0, 'Additional fee must be non-negative'),
  freeShippingThreshold: z.number().optional(),
  isActive: z.boolean().optional().default(true),
  estimatedDays: z.object({
    min: z.number().min(0, 'Minimum days must be non-negative'),
    max: z.number().min(0, 'Maximum days must be non-negative')
  })
});

export function validateShippingZone(data: Partial<ShippingZone>): string[] {
  try {
    ShippingZoneSchema.parse(data);
    return [];
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors.map(err => err.message);
    }
    return ['Invalid shipping zone data'];
  }
}

export function validateShippingRate(data: Partial<ShippingRate>): string[] {
  try {
    ShippingRateSchema.parse(data);
    
    // Additional validation
    if (data.estimatedDays && data.estimatedDays.min > data.estimatedDays.max) {
      return ['Minimum delivery days cannot be greater than maximum'];
    }

    return [];
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors.map(err => err.message);
    }
    return ['Invalid shipping rate data'];
  }
}
