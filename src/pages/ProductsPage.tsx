import React from 'react';
import { ProductGrid } from '../components/ProductGrid/ProductGrid';
import { Background } from '../components/Products/Background';
import { Header } from '../components/Products/Header';

export function ProductsPage() {
  return (
    <div className="relative min-h-screen bg-white">
      <Background />
      
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <Header />
        <ProductGrid />
      </div>
    </div>
  );
}