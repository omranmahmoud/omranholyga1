import { toast } from 'react-hot-toast';

export type CurrencyCode = 
  | 'USD' | 'EUR' | 'GBP'  // Global currencies
  | 'AED' | 'SAR' | 'QAR'  // Gulf currencies
  | 'KWD' | 'BHD' | 'OMR'  // Gulf currencies
  | 'JOD' | 'LBP' | 'EGP'  // Levant & North Africa
  | 'IQD' | 'ILS' | 'SYP' | 'PAB';  // Other Middle East

interface CurrencyDetails {
  name: string;
  symbol: string;
  locale: string;
  decimalPlaces: number;
  exchangeRate: number;
  symbolPosition?: 'before' | 'after';
  spaceBetween?: boolean;
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyDetails> = {
  // Global Currencies
  USD: { name: 'US Dollar', symbol: '$', locale: 'en-US', decimalPlaces: 2, exchangeRate: 1, symbolPosition: 'before' },
  EUR: { name: 'Euro', symbol: '€', locale: 'en-EU', decimalPlaces: 2, exchangeRate: 1, symbolPosition: 'before' },
  GBP: { name: 'British Pound', symbol: '£', locale: 'en-GB', decimalPlaces: 2, exchangeRate: 0.86, symbolPosition: 'before' },
  
  // Gulf Currencies
  AED: { name: 'UAE Dirham', symbol: 'د.إ', locale: 'ar-AE', decimalPlaces: 2, exchangeRate: 3.97, symbolPosition: 'after', spaceBetween: true },
  SAR: { name: 'Saudi Riyal', symbol: 'ر.س', locale: 'ar-SA', decimalPlaces: 2, exchangeRate: 4.05, symbolPosition: 'after', spaceBetween: true },
  QAR: { name: 'Qatari Riyal', symbol: 'ر.ق', locale: 'ar-QA', decimalPlaces: 2, exchangeRate: 3.93, symbolPosition: 'after', spaceBetween: true },
  KWD: { name: 'Kuwaiti Dinar', symbol: 'د.ك', locale: 'ar-KW', decimalPlaces: 3, exchangeRate: 0.33, symbolPosition: 'after', spaceBetween: true },
  BHD: { name: 'Bahraini Dinar', symbol: 'د.ب', locale: 'ar-BH', decimalPlaces: 3, exchangeRate: 0.41, symbolPosition: 'after', spaceBetween: true },
  OMR: { name: 'Omani Rial', symbol: 'ر.ع', locale: 'ar-OM', decimalPlaces: 3, exchangeRate: 0.42, symbolPosition: 'after', spaceBetween: true },
  
  // Levant & North Africa
  JOD: { name: 'Jordanian Dinar', symbol: 'د.ا', locale: 'ar-JO', decimalPlaces: 3, exchangeRate: 0.77, symbolPosition: 'after', spaceBetween: true },
  LBP: { name: 'Lebanese Pound', symbol: 'ل.ل', locale: 'ar-LB', decimalPlaces: 0, exchangeRate: 16200, symbolPosition: 'after', spaceBetween: true },
  EGP: { name: 'Egyptian Pound', symbol: 'ج.م', locale: 'ar-EG', decimalPlaces: 2, exchangeRate: 33.37, symbolPosition: 'after', spaceBetween: true },
  
  // Other Middle East
  IQD: { name: 'Iraqi Dinar', symbol: 'ع.د', locale: 'ar-IQ', decimalPlaces: 0, exchangeRate: 1415, symbolPosition: 'after', spaceBetween: true },
  ILS: { name: 'Israeli Shekel', symbol: '₪', locale: 'he-IL', decimalPlaces: 2, exchangeRate: 3.89, symbolPosition: 'after', spaceBetween: true },
  SYP: { name: 'Syrian Pound', symbol: 'ل.س', locale: 'ar-SY', decimalPlaces: 0, exchangeRate: 13175, symbolPosition: 'after', spaceBetween: true },
  PAB: { name: 'Palestinian Balboa', symbol: 'د.ف', locale: 'ar-PS', decimalPlaces: 2, exchangeRate: 1.08, symbolPosition: 'after', spaceBetween: true }
};

function validateAmount(amount: any): { isValid: boolean; value: number } {
  // Handle null/undefined
  if (amount == null) {
    return { isValid: false, value: 0 };
  }

  // Convert string to number if needed
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Validate numeric value
  if (typeof numericAmount !== 'number' || isNaN(numericAmount)) {
    return { isValid: false, value: 0 };
  }

  // Ensure amount is positive
  if (numericAmount < 0) {
    return { isValid: false, value: 0 };
  }

  return { isValid: true, value: numericAmount };
}

export function formatPrice(amount: number | null | undefined, currency: CurrencyCode): string {
  try {
    const { isValid, value } = validateAmount(amount);
    if (!isValid) {
      return SUPPORTED_CURRENCIES[currency].symbol + '0';
    }

    const currencyDetails = SUPPORTED_CURRENCIES[currency];
    if (!currencyDetails) {
      console.error('Unsupported currency:', currency);
      return value.toString();
    }

    const formattedNumber = new Intl.NumberFormat(currencyDetails.locale, {
      minimumFractionDigits: currencyDetails.decimalPlaces,
      maximumFractionDigits: currencyDetails.decimalPlaces
    }).format(value);

    const { symbol, symbolPosition, spaceBetween } = currencyDetails;
    const space = spaceBetween ? ' ' : '';

    return symbolPosition === 'after' 
      ? `${formattedNumber}${space}${symbol}`
      : `${symbol}${space}${formattedNumber}`;
  } catch (error) {
    console.error('Price formatting error:', error);
    return `${SUPPORTED_CURRENCIES[currency].symbol}0`;
  }
}

export async function convertPrice(
  amount: number | null | undefined,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): Promise<number> {
  try {
    const { isValid, value } = validateAmount(amount);
    if (!isValid) {
      return 0;
    }

    if (fromCurrency === toCurrency) return value;

    if (!(fromCurrency in SUPPORTED_CURRENCIES) || !(toCurrency in SUPPORTED_CURRENCIES)) {
      console.error('Unsupported currency conversion:', { fromCurrency, toCurrency });
      return 0;
    }

    // Convert using exchange rates
    const fromRate = SUPPORTED_CURRENCIES[fromCurrency].exchangeRate;
    const toRate = SUPPORTED_CURRENCIES[toCurrency].exchangeRate;
    const convertedAmount = (value * toRate) / fromRate;

    // Round to appropriate decimal places
    const decimalPlaces = SUPPORTED_CURRENCIES[toCurrency].decimalPlaces;
    return Number(convertedAmount.toFixed(decimalPlaces));
  } catch (error) {
    console.error('Currency conversion error:', error);
    return 0;
  }
}

export function getCurrencySymbol(currency: CurrencyCode): string {
  return SUPPORTED_CURRENCIES[currency]?.symbol || '$';
}

export function isRTL(currency: CurrencyCode): boolean {
  return SUPPORTED_CURRENCIES[currency].locale.startsWith('ar-') || 
         SUPPORTED_CURRENCIES[currency].locale === 'he-IL';
}