import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CartHeader() {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-between mb-8">
      <button
        onClick={() => navigate(-1)}
        className="p-2 -ml-2 rounded-full hover:bg-gray-100 lg:hidden"
      >
        <ArrowLeft className="w-5 h-5 text-gray-600" />
      </button>
      <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
      <div className="w-10" /> {/* Spacer for alignment */}
    </div>
  );
}