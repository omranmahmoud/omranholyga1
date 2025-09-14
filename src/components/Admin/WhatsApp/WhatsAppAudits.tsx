import React, { useEffect, useState } from 'react';
import api from '../../../services/api';
import { History, RefreshCw } from 'lucide-react';

interface Audit {
  _id: string;
  admin: string;
  userIds: string[];
  message: string;
  generatedLinks: number;
  skipped: number;
  createdAt: string;
  context?: any;
}

export const WhatsAppAudits: React.FC = () => {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(50);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.getWithRetry(`/whatsapp/audits?limit=${limit}`);
      setAudits(data.audits || []);
    } catch (e:any) { setError(e?.response?.data?.message || 'Failed to load audits'); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, [limit]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><History className="w-6 h-6" /> WhatsApp Audits</h1>
        <div className="flex items-center gap-3">
          <select value={limit} onChange={e=>setLimit(parseInt(e.target.value))} className="border rounded px-2 py-1 text-sm">
            {[20,50,100,200].map(l=> <option key={l} value={l}>{l}</option>)}
          </select>
          <button onClick={load} disabled={loading} className="px-3 py-2 border rounded text-sm flex items-center gap-2 disabled:opacity-40"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} />Refresh</button>
        </div>
      </div>
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</div>}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Links</th>
              <th className="px-3 py-2 text-left">Skipped</th>
              <th className="px-3 py-2 text-left">Message Preview</th>
              <th className="px-3 py-2 text-left">Context</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {audits.map(a => (
              <tr key={a._id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2">{a.generatedLinks}</td>
                <td className="px-3 py-2">{a.skipped}</td>
                <td className="px-3 py-2 max-w-xs truncate" title={a.message}>{a.message.slice(0,120)}</td>
                <td className="px-3 py-2 text-xs text-gray-500">{a.context ? JSON.stringify(a.context) : '—'}</td>
              </tr>
            ))}
            {audits.length === 0 && !loading && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">No audits yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
