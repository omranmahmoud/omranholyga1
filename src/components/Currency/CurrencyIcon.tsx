import React from 'react';
import { 
  DollarSign, 
  CircleDollarSign,
  CandlestickChart,
  Banknote
} from 'lucide-react';
import { CurrencyCode } from '../../utils/currency';

interface CurrencyIconProps {
  currency: CurrencyCode;
  className?: string;
}

export function CurrencyIcon({ currency, className = '' }: CurrencyIconProps) {
  const getIcon = () => {
    switch (currency) {
      // Global Currencies
      case 'USD':
        return <DollarSign className={className} />;
      case 'EUR':
        return (
          <div className={`relative ${className}`}>
            <Banknote className="absolute inset-0" />
            <span className="absolute inset-0 flex items-center justify-center text-[0.6em] font-bold">
              €
            </span>
          </div>
        );
      case 'GBP':
        return (
          <div className={`relative ${className}`}>
            <Banknote className="absolute inset-0" />
            <span className="absolute inset-0 flex items-center justify-center text-[0.6em] font-bold">
              £
            </span>
          </div>
        );
      
      // Middle Eastern Currencies
      case 'AED':
      case 'SAR':
      case 'QAR':
      case 'KWD':
      case 'BHD':
      case 'OMR':
      case 'JOD':
      case 'PAB': // Palestine
        return (
          <div className={`relative ${className}`}>
            <CircleDollarSign className="absolute inset-0" />
            <span className="absolute inset-0 flex items-center justify-center text-[0.6em] font-bold">
              {currency.slice(0, 2)}
            </span>
          </div>
        );
      
      // Other Regional Currencies
      case 'LBP':
      case 'EGP':
      case 'IQD':
      case 'ILS':
      case 'SYP': // Syria
        return <CandlestickChart className={className} />;
      
      default:
        return <DollarSign className={className} />;
    }
  };

  const getCurrencyName = () => {
    switch (currency) {
      case 'USD': return 'US Dollar';
      case 'EUR': return 'Euro';
      case 'GBP': return 'British Pound';
      case 'AED': return 'UAE Dirham';
      case 'SAR': return 'Saudi Riyal';
      case 'QAR': return 'Qatari Riyal';
      case 'KWD': return 'Kuwaiti Dinar';
      case 'BHD': return 'Bahraini Dinar';
      case 'OMR': return 'Omani Rial';
      case 'JOD': return 'Jordanian Dinar';
      case 'LBP': return 'Lebanese Pound';
      case 'EGP': return 'Egyptian Pound';
      case 'IQD': return 'Iraqi Dinar';
      case 'ILS': return 'Israeli Shekel';
      case 'SYP': return 'Syrian Pound';
      case 'PAB': return 'Palestinian Balboa';
      default: return currency;
    }
  };

  return (
    <div className="relative" title={`Currency: ${getCurrencyName()}`}>
      {getIcon()}
    </div>
  );
}