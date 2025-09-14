import React, { useState } from 'react';
import { CurrencyIcon } from '../Currency/CurrencyIcon';
import { useCurrency } from '../../context/CurrencyContext';
import type { CurrencyCode } from '../../utils/currency';

export function CurrencySelector() {
  const { currency, setCurrency, availableCurrencies } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);

  const currencyGroups = {
    'Middle East': [
      'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 
      'JOD', 'LBP', 'EGP', 'IQD', 'ILS'
    ],
    'Global': ['USD', 'EUR', 'GBP']
  };

  const handleCurrencyChange = async (newCurrency: CurrencyCode) => {
    try {
      await setCurrency(newCurrency);
      setIsOpen(false);
    } catch (error) {
      console.error('Error changing currency:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <CurrencyIcon currency={currency} className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{currency}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-40">
            <div className="p-2 space-y-2">
              {Object.entries(currencyGroups).map(([region, codes]) => (
                <div key={region}>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 rounded-lg">
                    {region}
                  </div>
                  <div className="mt-1 space-y-1">
                    {codes.map((code) => {
                      const details = availableCurrencies[code as CurrencyCode];
                      return (
                        <button
                          key={code}
                          onClick={() => handleCurrencyChange(code as CurrencyCode)}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${
                            code === currency
                              ? 'bg-indigo-50 text-indigo-600'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          dir={details.locale.startsWith('ar-') || details.locale === 'he-IL' ? 'rtl' : 'ltr'}
                        >
                          <CurrencyIcon 
                            currency={code as CurrencyCode} 
                            className={`w-4 h-4 ${
                              code === currency ? 'text-indigo-600' : 'text-gray-500'
                            }`}
                          />
                          <span className="flex-1 text-left">
                            {details.name}
                          </span>
                          <span className="font-medium">
                            {details.symbol}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}