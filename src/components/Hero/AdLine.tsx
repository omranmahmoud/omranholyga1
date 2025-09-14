import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export function AdLine() {
  return (
    <div className="hidden lg:block absolute -right-32 top-1/2 -translate-y-1/2 transform">
      <div className="relative flex items-center justify-center">
        {/* Vertical Line */}
        <div className="absolute left-1/2 -translate-x-1/2 h-[300px] w-[1px] bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>
        
        {/* Ad Content */}
        <div className="absolute top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap">
          <div className="flex items-center gap-8">
            <div className="w-24 h-[1px] bg-gradient-to-r from-transparent to-gray-300"></div>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
              <span className="text-sm font-medium bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Special Spring Collection
              </span>
              <ArrowRight className="w-4 h-4 text-indigo-600 animate-bounce" />
            </div>
            <div className="w-24 h-[1px] bg-gradient-to-l from-transparent to-gray-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
}