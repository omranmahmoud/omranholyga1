import React from 'react';
import { FacebookPixelForm } from './FacebookPixelForm';
import { useFacebookPixel } from './hooks/useFacebookPixel';
import { LoadingSpinner } from '../../../LoadingSpinner';
import { AdminPageHeader } from '../../Layout/AdminPageHeader';

export function FacebookPixelSettings() {
  const { config, loading, updateConfig } = useFacebookPixel();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Facebook Pixel"
        description="Configure Facebook Pixel tracking for your store"
      />

      <div className="bg-white rounded-xl shadow-sm">
        <FacebookPixelForm
          config={config}
          onSubmit={updateConfig}
          loading={loading}
        />
      </div>
    </div>
  );
}
