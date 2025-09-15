import React, { useState } from 'react';
import { Gift, Mail, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { formatPrice } from '../../utils/currency';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const PREDEFINED_AMOUNTS = [50, 100, 200, 500];

export function GiftCardPurchase() {
  const { isAuthenticated } = useAuth();
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    recipientName: '',
    recipientEmail: '',
    message: ''
  });
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setFormData(prev => ({ ...prev, amount: amount.toString() }));
  };

  const handleCustomAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setSelectedAmount(null);
      setFormData(prev => ({ ...prev, amount: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please log in to purchase a gift card');
      return;
    }

    const amount = Number(formData.amount);
    if (amount < 10) {
      toast.error('Minimum gift card amount is $10');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/gift-cards/purchase', {
        amount,
        recipientName: formData.recipientName,
        recipientEmail: formData.recipientEmail,
        message: formData.message,
        currency
      });

      toast.success(
        formData.recipientEmail
          ? 'Gift card sent successfully!'
          : 'Gift card purchased successfully!'
      );

      // Reset form
      setFormData({
        amount: '',
        recipientName: '',
        recipientEmail: '',
        message: ''
      });
      setSelectedAmount(null);
    } catch (error) {
      toast.error('Failed to purchase gift card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Purchase a Gift Card</h1>
        <p className="text-gray-600">
          Give the gift of choice with our digital gift cards.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Amount
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {PREDEFINED_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleAmountSelect(amount)}
                className={`p-4 text-center rounded-lg border-2 transition-all ${
                  selectedAmount === amount
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg font-semibold">
                  {formatPrice(amount, currency)}
                </div>
              </button>
            ))}
          </div>
          <div className="relative mt-4">
            <input
              type="text"
              value={formData.amount}
              onChange={handleCustomAmount}
              placeholder="Enter custom amount"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <span className="text-gray-500">{currency}</span>
            </div>
          </div>
        </div>

        {/* Recipient Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Recipient Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Name
              </label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter recipient's name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Email
              </label>
              <input
                type="email"
                value={formData.recipientEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, recipientEmail: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter recipient's email"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text ```tsx
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Message (Optional)
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Add a personal message to your gift card"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !formData.amount}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>Processing...</>
          ) : formData.recipientEmail ? (
            <>
              <Send className="w-5 h-5" />
              Send Gift Card
            </>
          ) : (
            <>
              <Gift className="w-5 h-5" />
              Purchase Gift Card
            </>
          )}
        </button>

        {/* Terms */}
        <p className="text-sm text-gray-500 text-center">
          Gift cards are valid for one year from the date of purchase and can be used across multiple orders.
        </p>
      </form>
    </div>
  );
}