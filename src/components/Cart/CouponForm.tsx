import React, { useState } from 'react';
import { Tag } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface CouponFormProps {
  onApply: (discount: number) => void;
  totalAmount: number;
}

export function CouponForm({ onApply, totalAmount }: CouponFormProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
  const response = await api.postWithRetry('/coupons/validate', {
        code: code.trim(),
        totalAmount
      }, { headers: { 'X-Suppress-Toast': '1' }, suppressToast: true as any });

      onApply(response.data.discount);
      setErrorMsg(null);
      toast.success('Coupon applied successfully!');
      setCode('');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Invalid or expired coupon code';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Have a coupon code?
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Applying...' : 'Apply'}
        </button>
      </div>
      {errorMsg && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
    </form>
  );
}