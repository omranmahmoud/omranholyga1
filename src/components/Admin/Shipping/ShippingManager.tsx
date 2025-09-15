import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ShippingZoneList } from './ShippingZoneList';
import { ShippingZoneModal } from './ShippingZoneModal';
import { ShippingRateModal } from './ShippingRateModal';
import { useShipping } from '../../../hooks/useShipping';
import { type ShippingZone, type ShippingRate, shippingService } from '../../../services/shippingService';
import { toast } from 'react-hot-toast';

export function ShippingManager() {
  const { zones, rates, loading } = useShipping();
  const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);

  const handleCreateZone = async (data: Omit<ShippingZone, '_id'>) => {
    try {
      await shippingService.createZone(data);
      setIsZoneModalOpen(false);
    } catch (error) {
      // Error is handled by service
    }
  };

  const handleUpdateZone = async (id: string, data: Partial<ShippingZone>) => {
    try {
      await shippingService.updateZone(id, data);
      setIsZoneModalOpen(false);
      setSelectedZone(null);
    } catch (error) {
      // Error is handled by service
    }
  };

  const handleCreateRate = async (data: Omit<ShippingRate, '_id'>) => {
    try {
      await shippingService.createRate(data);
      setIsRateModalOpen(false);
    } catch (error) {
      // Error is handled by service
    }
  };

  const handleUpdateRate = async (id: string, data: Partial<ShippingRate>) => {
    try {
      await shippingService.updateRate(id, data);
      setIsRateModalOpen(false);
      setSelectedRate(null);
    } catch (error) {
      // Error is handled by service
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shipping zone?')) return;

    try {
      await shippingService.deleteZone(id);
    } catch (error) {
      // Error is handled by service
    }
  };

  const handleDeleteRate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shipping rate?')) return;

    try {
      await shippingService.deleteRate(id);
    } catch (error) {
      // Error is handled by service
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage shipping zones and delivery rates
          </p>
        </div>
        <button
          onClick={() => setIsZoneModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Shipping Zone
        </button>
      </div>

      <ShippingZoneList
        zones={zones}
        rates={rates}
        onEditZone={(zone) => {
          setSelectedZone(zone);
          setIsZoneModalOpen(true);
        }}
        onDeleteZone={handleDeleteZone}
        onAddRate={(zone) => {
          setSelectedZone(zone);
          setIsRateModalOpen(true);
        }}
        onEditRate={(rate) => {
          setSelectedRate(rate);
          setIsRateModalOpen(true);
        }}
        onDeleteRate={handleDeleteRate}
      />

      <ShippingZoneModal
        isOpen={isZoneModalOpen}
        onClose={() => {
          setIsZoneModalOpen(false);
          setSelectedZone(null);
        }}
        onSubmit={selectedZone 
          ? (data) => handleUpdateZone(selectedZone._id, data)
          : handleCreateZone
        }
        zone={selectedZone}
      />

      <ShippingRateModal
        isOpen={isRateModalOpen}
        onClose={() => {
          setIsRateModalOpen(false);
          setSelectedRate(null);
        }}
        onSubmit={selectedRate
          ? (data) => handleUpdateRate(selectedRate._id, data)
          : handleCreateRate
        }
        rate={selectedRate}
        zone={selectedZone}
      />
    </div>
  );
}
