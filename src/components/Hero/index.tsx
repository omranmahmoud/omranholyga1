import React from 'react';
import { useStore } from '../../context/StoreContext';
import { LoadingFallback } from '../LoadingFallback';
import { ErrorFallback } from '../ErrorFallback';
import { Background } from './Background';
import { HeroContent } from './HeroContent';
import { HeroFallback } from './HeroFallback';
import type { Hero as HeroType } from '../../types/store';

interface HeroProps {}

export function Hero({}: HeroProps) {
  const { hero, loading, error, refreshData } = useStore();

  if (loading) {
    return <LoadingFallback message="Loading hero section..." />;
  }

  if (error) {
    return <ErrorFallback error={error} onRetry={refreshData} />;
  }

  if (!hero) {
    return <HeroFallback />;
  }

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-indigo-50 via-white to-white overflow-hidden">
      <div className="relative">
        <Background />
        <HeroContent hero={hero} />
      </div>
    </div>
  );
}
