import { CurrencyCode } from './currency';

interface GeocodeResult {
  country: string;
  countryCode: string;
  city: string;
  state: string;
  formattedAddress: string;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = await response.json();
    
    return {
      country: data.countryName,
      countryCode: data.countryCode,
      city: data.city,
      state: data.principalSubdivision,
      formattedAddress: `${data.city}, ${data.countryName}`
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}

export function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location access was denied. Currency will be based on your browser settings.';
    case error.POSITION_UNAVAILABLE:
      return 'Location information is unavailable. Using default currency settings.';
    case error.TIMEOUT:
      return 'Location request timed out. Using default currency settings.';
    default:
      return 'An error occurred while detecting your location. Using default currency settings.';
  }
}

export function getCountryCurrency(countryCode: string): CurrencyCode {
  const countryCurrencyMap: { [key: string]: CurrencyCode } = {
    // Middle East
    AE: 'AED', // UAE
    SA: 'SAR', // Saudi Arabia
    QA: 'QAR', // Qatar
    KW: 'KWD', // Kuwait
    BH: 'BHD', // Bahrain
    OM: 'OMR', // Oman
    JO: 'JOD', // Jordan
    LB: 'LBP', // Lebanon
    EG: 'EGP', // Egypt
    IQ: 'IQD', // Iraq
    IL: 'ILS', // Israel
    SY: 'SYP', // Syria
    PS: 'PAB', // Palestine
    
    // Europe
    GB: 'GBP', // United Kingdom
    // EU Countries
    DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR',
    BE: 'EUR', IE: 'EUR', FI: 'EUR', AT: 'EUR', GR: 'EUR',
    PT: 'EUR', LU: 'EUR', SK: 'EUR', SI: 'EUR', LT: 'EUR',
    LV: 'EUR', EE: 'EUR', CY: 'EUR', MT: 'EUR'
  };

  return countryCurrencyMap[countryCode] || 'USD';
}