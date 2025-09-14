import type { ShippingRate } from '../types/shipping';

export function calculateShippingFee(
  rate: ShippingRate,
  subtotal: number,
  weight: number
): number {
  // Check for free shipping threshold
  if (rate.freeShippingThreshold && subtotal >= rate.freeShippingThreshold) {
    return 0;
  }

  let fee = rate.baseRate;

  // Apply conditions based on rate type
  switch (rate.type) {
    case 'weight':
      // Add additional fee for each weight unit above threshold
      const weightCondition = rate.conditions.find(c => 
        c.type === 'min_weight' || c.type === 'max_weight'
      );
      if (weightCondition && weight > weightCondition.value) {
        const extraWeight = weight - weightCondition.value;
        fee += (extraWeight * rate.additionalFee);
      }
      break;

    case 'price':
      // Add additional fee for order value above threshold
      const priceCondition = rate.conditions.find(c => 
        c.type === 'min_price' || c.type === 'max_price'
      );
      if (priceCondition && subtotal > priceCondition.value) {
        const extraValue = subtotal - priceCondition.value;
        fee += (extraValue * rate.additionalFee);
      }
      break;
  }

  return Math.max(0, fee); // Ensure fee is not negative
}

export function getEstimatedDeliveryDate(rate: ShippingRate): { min: Date; max: Date } {
  const now = new Date();
  const min = new Date(now.setDate(now.getDate() + rate.estimatedDays.min));
  const max = new Date(now.setDate(now.getDate() + rate.estimatedDays.max));
  return { min, max };
}

export function formatShippingEstimate(rate: ShippingRate): string {
  const { min, max } = rate.estimatedDays;
  if (min === max) {
    return `${min} business days`;
  }
  return `${min}-${max} business days`;
}
