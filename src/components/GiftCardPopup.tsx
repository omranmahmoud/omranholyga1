import { useState } from 'react';
import { Gift, X } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { formatPrice, type CurrencyCode } from '../utils/currency';

interface GiftCardPopupProps {
  open: boolean;
  onClose: () => void;
}

export function GiftCardPopup({ open, onClose }: GiftCardPopupProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { code: string; balance: number; currency: CurrencyCode; status: string; expiryDate?: string }>(null);

  if (!open) return null;

  const onCheck = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error('Enter a gift card code');
      return;
    }
    try {
      setLoading(true);
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 20000);
      const { data } = await api.getWithRetry(`/gift-cards/balance/${encodeURIComponent(trimmed)}`, { signal: controller.signal });
      window.clearTimeout(timer);
      setResult(data);
      if (data.status !== 'active') toast.error(`Gift card is ${data.status}`); else toast.success('Gift card found');
    } catch (e: any) {
      const isTimeout = e?.name === 'CanceledError' || e?.message === 'canceled' || e?.code === 'ERR_CANCELED';
      toast.error(isTimeout ? 'Request timed out' : (e?.response?.data?.message || 'Invalid code'));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl p-5 relative">
        <button className="absolute right-3 top-3 text-gray-500 hover:text-gray-800" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold">Check Gift Card</h3>
        </div>
        <div className="flex gap-2 mb-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button disabled={loading} onClick={onCheck} className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-60">
            {loading ? 'Checking…' : 'Check'}
          </button>
        </div>
        {result && (
          <div className="border rounded-lg p-3 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono">{result.code}</span>
              <span className="text-gray-500">{result.status}</span>
            </div>
            <div>Balance: {formatPrice(result.balance, result.currency)}</div>
            <div>Currency: {result.currency}</div>
            <div>Expiry: {result.expiryDate ? new Date(result.expiryDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : '—'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
