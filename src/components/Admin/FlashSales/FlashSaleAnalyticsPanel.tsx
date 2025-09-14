import { useEffect, useState } from 'react';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { realTimeService } from '../../../services/realTimeService';

interface FlashSaleAnalyticsPanelProps { saleId: string | null; onClose: () => void; }

interface AnalyticsItem {
  product: { _id: string; name: string };
  flashPrice: number;
  basePrice: number;
  stockLimit: number | null;
  perUserLimit: number | null;
  soldCount: number;
  aggregatedQuantitySold: number;
  aggregatedRevenue: number;
  remaining: number | null;
}

interface AnalyticsResponse {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  metrics: { totalSoldUnits: number; totalRevenue: number; itemCount: number };
  items: AnalyticsItem[];
}

export function FlashSaleAnalyticsPanel({ saleId, onClose }: FlashSaleAnalyticsPanelProps) {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (saleId) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saleId]);

  // Real-time auto refresh when flash sale updates broadcast
  useEffect(() => {
    if (!saleId) return;
    const unsub = realTimeService.subscribe('system_notification', (evt) => {
      const payload = (evt as any).data;
      if (payload?.type === 'flash_sale_update' && Array.isArray(payload.sales)) {
        const impacted = payload.sales.some((s: any) => s._id === saleId);
        if (impacted) {
          fetchData();
        }
      }
    });
    return () => { unsub && unsub(); };
  }, [saleId]);

  const fetchData = async () => {
    if (!saleId) return;
    try {
      setLoading(true);
      const res = await api.getWithRetry(`/flash-sales/${saleId}/analytics`);
      setData(res.data);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!saleId) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose}></div>
      <div className="w-full max-w-4xl bg-white h-full shadow-xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Flash Sale Analytics</h2>
            {data && (
              <p className="text-xs text-gray-500">{data.title} • {format(new Date(data.startDate), 'PP p')} → {format(new Date(data.endDate), 'PP p')}</p>
            )}
          </div>
          <button onClick={onClose} className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200">Close</button>
        </div>
        <div className="p-4 space-y-4 overflow-auto">
          {loading && <div className="text-center py-10 text-gray-500">Loading...</div>}
          {!loading && data && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Total Units Sold" value={data.metrics.totalSoldUnits} />
                <MetricCard label="Total Revenue" value={data.metrics.totalRevenue.toFixed(2)} prefix="$" />
                <MetricCard label="Products" value={data.metrics.itemCount} />
                <MetricCard label="Status" value={data.status} />
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <Th>Product</Th>
                      <Th>Flash Price</Th>
                      <Th>Base Price</Th>
                      <Th>Sold</Th>
                      <Th>Revenue</Th>
                      <Th>Remaining</Th>
                      <Th>Limit/User</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map(item => (
                      <tr key={item.product._id} className="border-t hover:bg-gray-50">
                        <Td>{item.product.name}</Td>
                        <Td>${item.flashPrice?.toFixed(2)}</Td>
                        <Td>${item.basePrice?.toFixed(2)}</Td>
                        <Td>{item.aggregatedQuantitySold}</Td>
                        <Td>${item.aggregatedRevenue.toFixed(2)}</Td>
                        <Td>{item.remaining ?? '—'}</Td>
                        <Td>{item.perUserLimit ?? '—'}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <button onClick={fetchData} className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700">Refresh</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, prefix }: { label: string; value: string | number; prefix?: string }) {
  return (
    <div className="p-3 bg-white border rounded-lg shadow-sm">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="text-lg font-semibold text-gray-900">{prefix}{value}</div>
    </div>
  );
}

function Th({ children }: { children: any }) { return <th className="px-3 py-2 text-left font-semibold text-gray-600">{children}</th>; }
function Td({ children }: { children: any }) { return <td className="px-3 py-2 whitespace-nowrap">{children}</td>; }
