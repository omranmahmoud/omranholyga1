import { Gift, MoreVertical, Ban, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { formatPrice, type CurrencyCode } from '../../../utils/currency';

interface GiftCard {
  _id: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  currency: CurrencyCode;
  status: 'active' | 'redeemed' | 'expired' | 'cancelled';
  expiryDate: string;
  lastUsed?: string;
  redemptions?: Array<{ order?: string; amount: number; date?: string }>;
  purchasedBy: {
    name: string;
    email: string;
  };
  recipient?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface GiftCardListProps {
  giftCards: GiftCard[];
  onCancel: (id: string) => void;
  onView?: (card: GiftCard) => void;
}

export function GiftCardList({ giftCards, onCancel, onView }: GiftCardListProps) {
  const getStatusColor = (status: GiftCard['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'redeemed':
        return 'bg-gray-100 text-gray-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchased By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recipient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {giftCards.map((giftCard) => (
              <tr key={giftCard._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Gift className="w-5 h-5 text-indigo-600 mr-2" />
                    <span className="font-mono text-sm">{giftCard.code}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatPrice(giftCard.initialBalance, giftCard.currency)}
                  </div>
                  {giftCard.currentBalance !== giftCard.initialBalance && (
                    <div className="text-xs text-gray-500">
                      Balance: {formatPrice(giftCard.currentBalance, giftCard.currency)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {giftCard.purchasedBy.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {giftCard.purchasedBy.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {giftCard.recipient ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {giftCard.recipient.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {giftCard.recipient.email}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Self Purchase</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getStatusColor(giftCard.status)
                  }`}>
                    {giftCard.status.charAt(0).toUpperCase() + giftCard.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDistanceToNow(new Date(giftCard.createdAt), { addSuffix: true })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {giftCard.expiryDate ? new Date(giftCard.expiryDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : '—'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => navigator.clipboard?.writeText(giftCard.code)}
                      className="text-gray-500 hover:text-gray-800"
                      title="Copy code"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onView && onView(giftCard)}
                      className="text-gray-500 hover:text-gray-800"
                      title="View details"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {giftCard.status === 'active' && (
                      <button
                        onClick={() => onCancel(giftCard._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Cancel gift card"
                      >
                        <Ban className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}