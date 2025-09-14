import React from 'react';
import { FacebookPixelSettings } from './FacebookPixelSettings';
import { AdminPageHeader } from '../Layout/AdminPageHeader';

export function AnalyticsSettings() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Analytics Settings"
        description="Configure analytics and tracking for your store"
      />

      <FacebookPixelSettings />

      {/* Add other analytics settings components here */}
    </div>
  );
}
