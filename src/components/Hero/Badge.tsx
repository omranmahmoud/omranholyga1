import React from 'react';
import { Sparkles } from 'lucide-react';

export function Badge() {
  return (
    <div className="inline-flex items-center px-6 py-2.5 rounded-full text-sm font-medium bg-white shadow-xl shadow-indigo-100 text-indigo-800 border border-indigo-100/50">
      <Sparkles className="w-4 h-4 mr-2 text-indigo-600" />
      New Arrivals for Spring 2024
    </div>
  );
}