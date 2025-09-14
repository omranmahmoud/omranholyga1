import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { CouponList } from './CouponList';
import { CouponModal } from './CouponModal';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';

interface Coupon {
  _id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  description?: string;
}

export function CouponManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await api.get('/coupons');
      setCoupons(response.data);
    } catch (error) {
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (data: Partial<Coupon>) => {
    try {
      const response = await api.post('/coupons', data);
      setCoupons(prev => [...prev, response.data]);
      toast.success('Coupon created successfully');
    } catch (error) {
      toast.error('Failed to create coupon');
      throw error;
    }
  };

  const handleUpdateCoupon = async (id: string, data: Partial<Coupon>) => {
    try {
      const response = await api.put(`/coupons/${id}`, data);
      setCoupons(prev => prev.map(coupon => 
        coupon._id === id ? response.data : coupon
      ));
      toast.success('Coupon updated successfully');
    } catch (error) {
      toast.error('Failed to update coupon');
      throw error;
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await api.delete(`/coupons/${id}`);
      setCoupons(prev => prev.filter(coupon => coupon._id !== id));
      toast.success('Coupon deleted successfully');
    } catch (error) {
      toast.error('Failed to delete coupon');
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
          <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage discount coupons for your store.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedCoupon(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Coupon
        </button>
      </div>

      <CouponList
        coupons={coupons}
        onEdit={(coupon) => {
          setSelectedCoupon(coupon);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteCoupon}
      />

      <CouponModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCoupon(null);
        }}
        onSubmit={selectedCoupon 
          ? (data) => handleUpdateCoupon(selectedCoupon._id, data)
          : handleCreateCoupon
        }
        coupon={selectedCoupon}
      />
    </div>
  );
}