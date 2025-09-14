export interface ShippingRateFormData {
  name: string;
  type: 'flat' | 'weight' | 'price';
  baseRate: number;
  conditions: Array<{
    type: 'min_weight' | 'max_weight' | 'min_price' | 'max_price';
    value: number;
  }>;
  additionalFee: number;
  freeShippingThreshold?: number;
  isActive: boolean;
  estimatedDays: {
    min: number;
    max: number;
  };
}

export interface ShippingRateValidation {
  isValid: boolean;
  errors: string[];
}
