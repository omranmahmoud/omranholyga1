export type CurrencyCode = 
  | 'USD' | 'EUR' | 'GBP'  // Global currencies
  | 'AED' | 'SAR' | 'QAR'  // Gulf currencies
  | 'KWD' | 'BHD' | 'OMR'  // Gulf currencies
  | 'JOD' | 'LBP' | 'EGP'  // Levant & North Africa
  | 'IQD' | 'ILS';         // Other Middle East

export interface CurrencyDetails {
  name: string;
  symbol: string;
  locale: string;
  decimalPlaces: number;
  exchangeRate: number;
  symbolPosition?: 'before' | 'after';
  spaceBetween?: boolean;
}

export interface CurrencyConversionResponse {
  convertedAmount: number;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  exchangeRate: number;
}