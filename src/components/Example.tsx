import React, { useEffect, useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { reverseGeocode } from '../utils/geolocation';
import { MapPin, Loader } from 'lucide-react';

export function LocationExample() {
  const { latitude, longitude, accuracy, error, loading } = useGeolocation();
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (latitude && longitude) {
      reverseGeocode(latitude, longitude)
        .then(result => setAddress(result.formattedAddress))
        .catch(error => console.error('Error getting address:', error));
    }
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-lg">
        <Loader className="w-5 h-5 animate-spin text-indigo-600" />
        <span className="text-gray-600">Getting your location...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-lg">
        <MapPin className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 bg-white rounded-xl shadow-sm">
      <div className="flex items-center gap-2 text-indigo-600">
        <MapPin className="w-6 h-6" />
        <h2 className="text-lg font-semibold">Your Location</h2>
      </div>

      <div className="space-y-2">
        <p className="text-gray-600">
          <span className="font-medium">Latitude:</span> {latitude?.toFixed(6)}
        </p>
        <p className="text-gray-600">
          <span className="font-medium">Longitude:</span> {longitude?.toFixed(6)}
        </p>
        <p className="text-gray-600">
          <span className="font-medium">Accuracy:</span> {accuracy ? `±${Math.round(accuracy)}m` : 'N/A'}
        </p>
        {address && (
          <p className="text-gray-600">
            <span className="font-medium">Address:</span> {address}
          </p>
        )}
      </div>
    </div>
  );
}