// src/components/Admin/Shipping/ShippingManager/index.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import { useShipping } from '../../../../hooks/useShipping';
import { ShippingZoneList } from './ShippingZoneList';
import { ShippingZoneModal } from './ShippingZoneModal';
import { ShippingRateModal } from './ShippingRateModal';
import { LoadingSpinner } from '../../../LoadingSpinner';
import { ErrorMessage } from '../../../ErrorMessage';
import { PageHeader } from '../../../PageHeader';

export function ShippingManager() {
  const { 
    zones, 
    rates, 
    loading, 
    error,
    createZone,
    updateZone,
    deleteZone,
    createRate,
    updateRate,
    deleteRate
  } = useShipping();

  const [selectedZone, setSelectedZone] = React.useState(null);
  const [selectedRate, setSelectedRate] = React.useState(null);
  const [isZoneModalOpen, setIsZoneModalOpen] = React.useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = React.useState(false);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shipping Management"
        description="Manage shipping zones and delivery rates"
        action={{
          label: "Add Shipping Zone",
          icon: Plus,
          onClick: () => setIsZoneModalOpen(true)
        }}
      />

      <ShippingZoneList
        zones={zones}
        rates={rates}
        onEditZone={setSelectedZone}
        onDeleteZone={deleteZone}
        onAddRate={(zone) => {
          setSelectedZone(zone);
          setIsRateModalOpen(true);
        }}
        onEditRate={setSelectedRate}
        onDeleteRate={deleteRate}
      />

      <ShippingZoneModal
        isOpen={isZoneModalOpen}
        onClose={() => {
          setIsZoneModalOpen(false);
          setSelectedZone(null);
        }}
        onSubmit={selectedZone ? updateZone : createZone}
        zone={selectedZone}
      />

      <ShippingRateModal
        isOpen={isRateModalOpen}
        onClose={() => {
          setIsRateModalOpen(false);
          setSelectedRate(null);
        }}
        onSubmit={selectedRate ? updateRate : createRate}
        rate={selectedRate}
        zone={selectedZone}
      />
    </div>
  );
}
