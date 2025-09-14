import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { type ShippingZone } from '../../../services/shippingService';

interface ShippingZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<ShippingZone, '_id'>) => Promise<void>;
  zone?: ShippingZone | null;
}

export function ShippingZoneModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  zone 
}: ShippingZoneModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    countries: [] as string[],
    regions: [] as string[],
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [newCountry, setNewCountry] = useState('');
  const [newRegion, setNewRegion] = useState('');

  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name,
        countries: zone.countries,
        regions: zone.regions,
        isActive: zone.isActive
      });
    } else {
      setFormData({
        name: '',
        countries: [],
        regions: [],
        isActive: true
      });
    }
  }, [zone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setLoading(false);
    }
  };

  const addCountry = () => {
    if (newCountry && !formData.countries.includes(newCountry)) {
      setFormData(prev => ({
        ...prev,
        countries: [...prev.countries, newCountry.toUpperCase()]
      }));
      setNewCountry('');
    }
  };

  const removeCountry = (country: string) => {
    setFormData(prev => ({
      ...prev,
      countries: prev.countries.filter(c => c !== country)
    }));
  };

  const addRegion = () => {
    if (newRegion && !formData.regions.includes(newRegion)) {
      setFormData(prev => ({
        ...prev,
        regions: [...prev.regions, newRegion]
      }));
      setNewRegion('');
    }
  };

  const removeRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.filter(r => r !== region)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {zone ? 'Edit Shipping Zone' : 'Add Shipping Zone'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Zone Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter zone name"
              />
            </div>

            {/* Countries */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Countries
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value.toUpperCase())}
                  placeholder="Enter country code (e.g., US)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  maxLength={2}
                />
                <button
                  type="button"
                  onClick={addCountry}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.countries.map((country) => (
                  <span
                    key={country}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {country}
                    <button
                      type="button"
                      onClick={() => removeCountry(country)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Regions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Regions (Optional)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  placeholder="Enter region name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addRegion}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.regions.map((region) => (
                  <span
                    key={region}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {region}
                    <button
                      type="button"
                      onClick={() => removeRegion(region)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active Zone
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || formData.countries.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : zone ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
