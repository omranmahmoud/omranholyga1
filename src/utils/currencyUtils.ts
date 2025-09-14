import { CurrencyCode } from '../types/currency';

export async function validateAndConvertPrice(
  price: string | number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode = 'USD'
): Promise<number> {
  // Parse price to number if string
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  // Validate price
  if (isNaN(numericPrice) || numericPrice < 0) {
    throw new Error('Invalid price value');
  }

  try {
    // Convert price to target currency
    const response = await fetch(`/api/currency/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: numericPrice,
        from: fromCurrency,
        to: toCurrency,
      }),
    });

    if (!response.ok) {
      throw new Error('Currency conversion failed');
    }

    const { convertedAmount } = await response.json();
    return Number(convertedAmount.toFixed(2));
  } catch (error) {
    console.error('Price conversion error:', error);
    throw error;
  }
}

export function formatPriceWithCurrency(
  price: number,
  currency: CurrencyCode
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
}