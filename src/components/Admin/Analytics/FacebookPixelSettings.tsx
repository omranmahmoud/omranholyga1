// src/components/Admin/Analytics/FacebookPixelSettings.tsx
import React from 'react';
import { FacebookPixelForm } from './FacebookPixelForm';
import { useFacebookPixel } from './hooks/useFacebookPixel';
import { LoadingSpinner } from '../../LoadingSpinner';

export function FacebookPixelSettings() {
  const { config, loading, updateConfig } = useFacebookPixel();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <FacebookPixelForm
        config={config}
        onSubmit={updateConfig}
        loading={loading}
      />
    </div>
  );
}
