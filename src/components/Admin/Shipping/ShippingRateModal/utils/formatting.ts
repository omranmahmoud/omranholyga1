export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatWeight(weight: number): string {
  return `${weight.toFixed(2)} kg`;
}

export function formatDeliveryTime(min: number, max: number): string {
  if (min === max) {
    return `${min} business day${min === 1 ? '' : 's'}`;
  }
  return `${min}-${max} business days`;
}
```