import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface HeroActionsProps {
  primaryText: string;
  secondaryText: string;
  onPrimaryClick: () => void;
  onSecondaryClick: () => void;
}

export function HeroActions({
  primaryText,
  secondaryText,
  onPrimaryClick,
  onSecondaryClick
}: HeroActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
      <button 
        onClick={onPrimaryClick}
        className="group relative overflow-hidden px-8 py-4 bg-indigo-600 text-white rounded-full text-lg font-semibold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200 transition-all duration-300 hover:-translate-y-0.5"
      >
        <div className="absolute inset-0 w-3/12 bg-gradient-to-r from-white/0 via-white/40 to-white/0 skew-x-[30deg] group-hover:animate-[shine_1s_ease-in-out_infinite] opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="relative flex items-center justify-center">
          {primaryText}
          <ShoppingBag className="ml-2 w-5 h-5 transition-transform group-hover:scale-110 group-hover:-rotate-12" />
        </span>
      </button>

      <button 
        onClick={onSecondaryClick}
        className="group relative px-8 py-4 bg-white text-gray-900 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 border border-gray-100 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-violet-50 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        <span className="relative flex items-center justify-center">
          {secondaryText}
          <ArrowRight className="ml-2 w-5 h-5 transition-all duration-300 group-hover:translate-x-1" />
        </span>
      </button>
    </div>
  );
}
