import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';
import { FlashSaleModal } from './FlashSaleModal';
import { FlashSaleList } from './FlashSaleList';
import { FlashSaleAnalyticsPanel } from './FlashSaleAnalyticsPanel';

interface FlashSale {
  _id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'expired';
  createdAt: string;
  items?: Array<{ _id?: string; product: { _id: string; name: string; price: number; images?: string[] }; flashPrice: number; stockLimit?: number; perUserLimit?: number }>;
}

export function FlashSaleManager() {
  const [sales, setSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<FlashSale | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [analyticsSaleId, setAnalyticsSaleId] = useState<string | null>(null);

  useEffect(() => {
    fetchSales();
  }, [statusFilter]);

  const fetchSales = async () => {
    try {
      const url = statusFilter ? `/flash-sales?status=${statusFilter}` : '/flash-sales';
      const res = await api.getWithRetry(url);
      setSales(res.data);
    } catch (e:any) {
      toast.error(e.response?.data?.message || 'Failed to load flash sales');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      const payload = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        items: data.items || []
      };
      const res = await api.postWithRetry('/flash-sales', payload);
      setSales(prev => [...prev, res.data]);
      toast.success('Flash sale created');
    } catch (e:any) {
      toast.error(e.response?.data?.message || 'Create failed');
      throw e;
    }
  };

  const handleUpdate = async (id: string, data: any) => {
    try {
      const payload = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        items: data.items || []
      };
      const res = await api.putWithRetry(`/flash-sales/${id}`, payload);
      setSales(prev => prev.map(s => s._id === id ? res.data : s));
      toast.success('Flash sale updated');
    } catch (e:any) {
      toast.error(e.response?.data?.message || 'Update failed');
      throw e;
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this flash sale?')) return;
    try {
      await api.deleteWithRetry(`/flash-sales/${id}`);
      setSales(prev => prev.filter(s => s._id !== id));
      toast.success('Flash sale deleted');
    } catch (e:any) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flash Sales</h1>
          <p className="mt-1 text-sm text-gray-500">Create and schedule time-limited promotional campaigns.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setLoading(true); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
            <option value="expired">Expired</option>
          </select>
          <button
            onClick={() => { setSelected(null); setModalOpen(true); }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5" /> New Flash Sale
          </button>
        </div>
      </div>
      <FlashSaleList
        sales={sales}
        onEdit={(sale) => { setSelected(sale); setModalOpen(true); }}
        onDelete={handleDelete}
        loading={loading}
        onAnalytics={(sale) => setAnalyticsSaleId(sale._id)}
      />
      {analyticsSaleId && (
        <FlashSaleAnalyticsPanel saleId={analyticsSaleId} onClose={() => setAnalyticsSaleId(null)} />
      )}
      <FlashSaleModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelected(null); }}
        onSubmit={(data) => selected ? handleUpdate(selected._id, data) : handleCreate(data)}
        flashSale={selected}
      />
    </div>
  );
}
