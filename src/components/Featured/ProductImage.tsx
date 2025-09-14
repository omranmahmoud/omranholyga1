import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ProductImage() {
  return (
    <div className="relative group">
      <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
        <img
          src="https://images.unsplash.com/photo-1475178626620-a4d074967452?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=986&q=80"
          alt="Elegant wool coat"
          className="w-full h-full object-cover object-center"
        />
      </div>
      
      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {[...Array(4)].map((_, i) => (
          <button
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === 0 ? 'bg-indigo-600 w-4' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <ChevronLeft className="w-6 h-6 text-gray-800" />
      </button>
      
      <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <ChevronRight className="w-6 h-6 text-gray-800" />
      </button>
    </div>
  );
}