import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { reverseGeocode, getCountryCurrency } from '../utils/geolocation';
import { 
  CurrencyCode, 
  SUPPORTED_CURRENCIES,
  getCurrencySymbol
} from '../utils/currency';

interface CurrencyContextType {
  currency: CurrencyCode;
  symbol: string;
  setCurrency: (currency: CurrencyCode) => Promise<void>;
  availableCurrencies: typeof SUPPORTED_CURRENCIES;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => 
    (localStorage.getItem('currency') as CurrencyCode) || 'USD'
  );
  const [isLoading, setIsLoading] = useState(true);
  const { latitude, longitude, error: geoError } = useGeolocation();

  useEffect(() => {
    const initializeCurrency = async () => {
      try {
        setIsLoading(true);

        if (!localStorage.getItem('currency') && latitude && longitude) {
          const geoData = await reverseGeocode(latitude, longitude);
          const detectedCurrency = getCountryCurrency(geoData.countryCode);
          
          setCurrencyState(detectedCurrency);
          localStorage.setItem('currency', detectedCurrency);
        }
      } catch (error) {
        console.warn('Currency detection error:', error);
        if (!localStorage.getItem('currency')) {
          const browserLocale = navigator.language;
          const countryCode = browserLocale.split('-')[1];
          if (countryCode) {
            const fallbackCurrency = getCountryCurrency(countryCode);
            setCurrencyState(fallbackCurrency);
            localStorage.setItem('currency', fallbackCurrency);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeCurrency();
  }, [latitude, longitude]);

  useEffect(() => {
    if (geoError && !localStorage.getItem('currency')) {
      console.warn('Geolocation error:', geoError);
      const browserLocale = navigator.language;
      const countryCode = browserLocale.split('-')[1];
      if (countryCode) {
        const detectedCurrency = getCountryCurrency(countryCode);
        setCurrencyState(detectedCurrency);
        localStorage.setItem('currency', detectedCurrency);
      }
    }
  }, [geoError]);

  const setCurrency = async (newCurrency: CurrencyCode) => {
    try {
      if (!(newCurrency in SUPPORTED_CURRENCIES)) {
        throw new Error('Unsupported currency');
      }
      
      setCurrencyState(newCurrency);
      localStorage.setItem('currency', newCurrency);
    } catch (error) {
      console.error('Currency update error:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <CurrencyContext.Provider value={{
      currency,
      symbol: getCurrencySymbol(currency),
      setCurrency,
      availableCurrencies: SUPPORTED_CURRENCIES
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}