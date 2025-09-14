import { Pencil, Trash2, Clock, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

interface FlashSale {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'expired';
  createdAt: string;
  items?: any[];
}

interface FlashSaleListProps {
  sales: FlashSale[];
  onEdit: (sale: FlashSale) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
  onAnalytics?: (sale: FlashSale) => void;
}

export function FlashSaleList({ sales, onEdit, onDelete, loading, onAnalytics }: FlashSaleListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[160px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!sales.length) {
    return (
      <div className="border border-dashed rounded-lg p-10 text-center text-gray-500">
        No flash sales yet. Click "New Flash Sale" to create one.
      </div>
    );
  }

  return (
    <div className="overflow-hidden border rounded-xl bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Schedule</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Products</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sales.map(sale => (
            <tr key={sale._id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{sale.title}</div>
                {sale.description && <div className="text-xs text-gray-500 line-clamp-1">{sale.description}</div>}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                <div>{format(new Date(sale.startDate), 'PP p')} →</div>
                <div>{format(new Date(sale.endDate), 'PP p')}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                  ${sale.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                  ${sale.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : ''}
                  ${sale.status === 'expired' ? 'bg-gray-200 text-gray-600' : ''}
                `}>
                  <Clock className="w-3.5 h-3.5" />
                  {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-gray-700">{sale.items?.length || 0}</td>
              <td className="px-4 py-3 text-right space-x-2">
                <button
                  onClick={() => onEdit(sale)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                <button
                  onClick={() => onDelete(sale._id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                {(typeof (onAnalytics) === 'function') && (
                  <button
                    onClick={() => onAnalytics?.(sale)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm border border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <BarChart3 className="w-4 h-4" /> Analytics
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
