import React, { useState } from 'react';
import { buildLinksForIds, buildLinksByFilter, buildSingleLink, WhatsAppLinkResult } from '../../services/whatsappService';
import { toast } from 'react-hot-toast';

interface Props { }

// Minimal UI - integrate with your admin layout/navigation as needed
const WhatsAppBroadcast: React.FC<Props> = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [userIds, setUserIds] = useState(''); // comma separated
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<WhatsAppLinkResult[]>([]);

  async function handleSingle(e: React.FormEvent){
    e.preventDefault();
    setLoading(true);
    try {
      const { url } = await buildSingleLink(phoneNumber, message);
      setLinks([{ url, phoneNumber, name: 'Manual' }]);
      toast.success('Link generated');
    } catch (e:any){ toast.error(e.message || 'Error'); } finally { setLoading(false); }
  }

  async function handleIds(e: React.FormEvent){
    e.preventDefault();
    setLoading(true);
    try {
      const ids = userIds.split(',').map(s => s.trim()).filter(Boolean);
      const res = await buildLinksForIds(ids, message, true);
      setLinks(res.links);
      toast.success(`Generated ${res.count} links`);
    } catch (e:any){ toast.error(e.message || 'Error'); } finally { setLoading(false); }
  }

  async function handleFilter(e: React.FormEvent){
    e.preventDefault();
    setLoading(true);
    try {
      const res = await buildLinksByFilter(message, true, 200);
      setLinks(res.links);
      toast.success(`Generated ${res.count} links`);
    } catch (e:any){ toast.error(e.message || 'Error'); } finally { setLoading(false); }
  }

  function openAll(){
    links.filter(l => l.url).forEach((l, i) => {
      setTimeout(() => window.open(l.url!, '_blank'), i * 500); // throttle opens
    });
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">WhatsApp Broadcast (Manual)</h1>
      <p className="text-sm text-gray-500">Generates WhatsApp chat links you can open manually. No automatic sending.</p>

      <div className="grid md:grid-cols-3 gap-6">
        <form onSubmit={handleSingle} className="space-y-3 border p-4 rounded">
          <h2 className="font-medium">Single Number</h2>
          <input value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)} placeholder="+15551234567" className="w-full border rounded px-2 py-1" />
          <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message" className="w-full border rounded px-2 py-1" rows={3} />
          <button disabled={loading} className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50">Generate</button>
        </form>

        <form onSubmit={handleIds} className="space-y-3 border p-4 rounded">
          <h2 className="font-medium">Selected Users (IDs)</h2>
            <textarea value={userIds} onChange={e=>setUserIds(e.target.value)} placeholder="Comma separated user IDs" className="w-full border rounded px-2 py-1" rows={3} />
            <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message" className="w-full border rounded px-2 py-1" rows={3} />
            <button disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">Generate</button>
        </form>

        <form onSubmit={handleFilter} className="space-y-3 border p-4 rounded">
          <h2 className="font-medium">All Opt-In Users</h2>
          <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Message" className="w-full border rounded px-2 py-1" rows={5} />
          <button disabled={loading} className="bg-indigo-600 text-white px-3 py-1 rounded disabled:opacity-50">Generate</button>
        </form>
      </div>

      {links.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="font-medium">Results ({links.filter(l=>l.url).length} valid)</h2>
            <button onClick={openAll} className="bg-emerald-600 text-white px-3 py-1 rounded">Open All</button>
            <button onClick={() => navigator.clipboard.writeText(links.filter(l=>l.url).map(l=>l.url).join('\n'))} className="bg-gray-700 text-white px-3 py-1 rounded">Copy Links</button>
          </div>
          <div className="max-h-96 overflow-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1 text-left">Name</th>
                  <th className="px-2 py-1 text-left">Phone</th>
                  <th className="px-2 py-1 text-left">Status</th>
                  <th className="px-2 py-1 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {links.map(l => (
                  <tr key={l.userId || l.phoneNumber} className="border-t">
                    <td className="px-2 py-1">{l.name || '-'}</td>
                    <td className="px-2 py-1">{l.phoneNumber || '-'}</td>
                    <td className="px-2 py-1">{l.skipped ? `Skipped: ${l.reason}` : 'OK'}</td>
                    <td className="px-2 py-1">
                      {l.url && <a href={l.url} target="_blank" rel="noreferrer" className="text-green-600 underline">Open</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppBroadcast;
