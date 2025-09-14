import React from 'react';
import { Sparkles } from 'lucide-react';

export function Header() {
  return (
    <div className="text-center mb-12 space-y-6 relative z-10">
      <div className="inline-flex items-center px-6 py-2.5 rounded-full text-sm font-medium bg-indigo-50 text-indigo-800 border border-indigo-100/50">
        <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
        New Arrivals for Spring 2024
      </div>
      
      <div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
          Discover Your Style
          <span className="block mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Elevate Your Wardrobe
          </span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
          Explore our curated collection of premium fashion pieces, where timeless elegance meets contemporary design. Each piece is thoughtfully selected to help you express your unique style.
        </p>
      </div>
    </div>
  );
}