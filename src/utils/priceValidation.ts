export function validatePrice(price: any): { isValid: boolean; value: number } {
  // Handle null/undefined
  if (price == null) {
    return { isValid: false, value: 0 };
  }

  // Convert string to number if needed
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  // Validate numeric value
  if (typeof numericPrice !== 'number' || isNaN(numericPrice)) {
    return { isValid: false, value: 0 };
  }

  // Ensure price is positive
  if (numericPrice < 0) {
    return { isValid: false, value: 0 };
  }

  // Round to 2 decimal places
  const roundedPrice = Math.round(numericPrice * 100) / 100;

  return { isValid: true, value: roundedPrice };
}

export function formatPriceForDisplay(price: number): string {
  return price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export function parsePriceInput(input: string): number {
  // Remove any non-numeric characters except decimal point
  const cleanInput = input.replace(/[^\d.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleanInput.split('.');
  const result = parts[0] + (parts.length > 1 ? '.' + parts[1] : '');
  
  return parseFloat(result) || 0;
}