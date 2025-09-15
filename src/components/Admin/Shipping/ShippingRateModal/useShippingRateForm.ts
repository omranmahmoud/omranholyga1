// src/components/Admin/Shipping/ShippingRateModal/useShippingRateForm.ts
import { useState, useEffect } from 'react';
import { ShippingRateFormData } from './types';
import { validateShippingRateForm } from './validation';
import { toast } from 'react-hot-toast';

const initialFormData: ShippingRateFormData = {
  name: '',
  type: 'flat',
  baseRate: 0,
  conditions: [],
  additionalFee: 0,
  freeShippingThreshold: undefined,
  isActive: true,
  estimatedDays: {
    min: 1,
    max: 3
  }
};

export function useShippingRateForm(
  rate: ShippingRate | null | undefined,
  zone: ShippingZone | null | undefined,
  onSubmit: (data: Omit<ShippingRate, '_id'>) => Promise<void>,
  onClose: () => void
) {
  const [formData, setFormData] = useState<ShippingRateFormData>(initialFormData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rate) {
      setFormData({
        name: rate.name,
        type: rate.type,
        baseRate: rate.baseRate,
        conditions: rate.conditions,
        additionalFee: rate.additionalFee,
        freeShippingThreshold: rate.freeShippingThreshold,
        isActive: rate.isActive,
        estimatedDays: rate.estimatedDays
      });
    } else {
      setFormData(initialFormData);
    }
  }, [rate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone) {
      toast.error('No shipping zone selected');
      return;
    }

    const validation = validateShippingRateForm(formData);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        zone: zone._id
      });
      onClose();
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  return {
    formData,
    loading,
    handleSubmit,
    handleInputChange,
    handleCheckboxChange
  };
}
