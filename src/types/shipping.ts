export interface ShippingZone {
  _id: string;
  name: string;
  countries: string[];
  regions: string[];
  isActive: boolean;
  order: number;
}

export interface ShippingRate {
  _id: string;
  zone: string | ShippingZone;
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

export interface ShippingCalculation {
  subtotal: number;
  weight: number;
  country: string;
  region?: string;
}
