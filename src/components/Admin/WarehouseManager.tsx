import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Warehouse {
  _id: string;
  name: string;
  address?: string;
  contact?: string;
  notes?: string;
}

export default function WarehouseManager() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', contact: '', notes: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await api.getWithRetry('/warehouses');
      setWarehouses(res.data);
    } catch (e) {
      toast.error('Failed to fetch warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await api.putWithRetry(`/warehouses/${editingId}`, form);
        toast.success('Warehouse updated');
      } else {
        await api.postWithRetry('/warehouses', form);
        toast.success('Warehouse added');
      }
      setForm({ name: '', address: '', contact: '', notes: '' });
      setEditingId(null);
      fetchWarehouses();
    } catch (e) {
      toast.error('Failed to save warehouse');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (wh: Warehouse) => {
    setForm({ name: wh.name, address: wh.address || '', contact: wh.contact || '', notes: wh.notes || '' });
    setEditingId(wh._id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this warehouse?')) return;
    setLoading(true);
    try {
      await api.deleteWithRetry(`/warehouses/${id}`);
      toast.success('Warehouse deleted');
      fetchWarehouses();
    } catch (e) {
      toast.error('Failed to delete warehouse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Warehouse Management</h2>
      <form onSubmit={handleSubmit} className="space-y-3 mb-6">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input name="name" value={form.name} onChange={handleChange} required className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Address</label>
          <input name="address" value={form.address} onChange={handleChange} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Contact</label>
          <input name="contact" value={form.contact} onChange={handleChange} className="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm font-medium">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full border rounded px-2 py-1" />
        </div>
        <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded">
          {editingId ? 'Update' : 'Add'} Warehouse
        </button>
        {editingId && (
          <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', address: '', contact: '', notes: '' }); }} className="ml-2 px-4 py-2 rounded border">Cancel</button>
        )}
      </form>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Address</th>
            <th className="p-2 text-left">Contact</th>
            <th className="p-2 text-left">Notes</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {warehouses.map(wh => (
            <tr key={wh._id} className="border-t">
              <td className="p-2">{wh.name}</td>
              <td className="p-2">{wh.address}</td>
              <td className="p-2">{wh.contact}</td>
              <td className="p-2">{wh.notes}</td>
              <td className="p-2 flex gap-2">
                <button onClick={() => handleEdit(wh)} className="text-blue-600">Edit</button>
                <button onClick={() => handleDelete(wh._id)} className="text-red-600">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
