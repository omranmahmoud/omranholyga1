import React, { useState } from 'react';
import { Gift, ArrowRight } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { formatPrice } from '../../utils/currency';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface GiftCardRedemptionProps {
  onApply: (amount: number) => void;
  orderTotal: number;
}

export function GiftCardRedemption({ onApply, orderTotal }: GiftCardRedemptionProps) {
  const { currency } = useCurrency();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [giftCard, setGiftCard] = useState<{
    code: string;
    balance: number;
    currency: string;
  } | null>(null);

  const handleCheck = async () => {
    if (!code) return;

    setLoading(true);
    try {
      const response = await api.get(`/gift-cards/balance/${code}`);
      setGiftCard(response.data);
    } catch (error) {
      toast.error('Invalid gift card code');
      setGiftCard(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!giftCard) return;

    const amountToApply = Math.min(giftCard.balance, orderTotal);
    onApply(amountToApply);
    setCode('');
    setGiftCard(null);
    toast.success(`${formatPrice(amountToApply, currency)} applied to your order`);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter gift card code"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleCheck}
          disabled={!code || loading}
          className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
      </div>

      {giftCard && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-indigo-600" />
              <span className="font-medium text-gray-900">Gift Card Balance</span>
            </div>
            <span className="font-medium text-indigo-600">
              {formatPrice(giftCard.balance, giftCard.currency)}
            </span>
          </div>
          <button
            onClick={handleApply}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            Apply to Order
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}