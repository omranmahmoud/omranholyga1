import React from 'react';
import { HeroForm } from './HeroForm';
import { useStore } from '../../../context/store';
import { LoadingSpinner } from '../../LoadingSpinner';
import { ErrorFallback } from '../../ErrorFallback';

export function Hero() {
  const { hero, loading, error, refreshData } = useStore();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorFallback error={error} onRetry={refreshData} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hero Section</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your homepage hero section content and appearance.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <HeroForm hero={hero} />
      </div>
    </div>
  );
}
