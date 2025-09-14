import { useState, useEffect } from 'react';
import { ShippingRateFormData } from '../types';
import { validateShippingRateForm } from '../validation';
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

export function useRateForm(onSubmit: (data: ShippingRateFormData) => Promise<void>) {
  const [formData, setFormData] = useState<ShippingRateFormData>(initialFormData);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateShippingRateForm(formData);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
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

  const resetForm = () => {
    setFormData(initialFormData);
  };

  return {
    formData,
    loading,
    handleSubmit,
    handleInputChange,
    resetForm
  };
}
