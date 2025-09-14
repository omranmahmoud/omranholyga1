import React from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { MapPin, Loader } from 'lucide-react';

interface LocationAwareProps {
  children: (location: {
    latitude: number | null;
    longitude: number | null;
    loading: boolean;
    error: string | null;
  }) => React.ReactNode;
  showError?: boolean;
  showLoading?: boolean;
}

export function LocationAware({ 
  children, 
  showError = true, 
  showLoading = true 
}: LocationAwareProps) {
  const { latitude, longitude, loading, error } = useGeolocation();

  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-500">
        <Loader className="w-4 h-4 animate-spin" />
        <span>Getting location...</span>
      </div>
    );
  }

  if (error && showError) {
    return (
      <div className="flex items-center justify-center gap-2 text-red-500">
        <MapPin className="w-4 h-4" />
        <span>{error}</span>
      </div>
    );
  }

  return <>{children({ latitude, longitude, loading, error })}</>;
}