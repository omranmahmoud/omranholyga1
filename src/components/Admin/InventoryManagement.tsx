import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface InventoryRecord {
  _id: string;
  product: { _id: string; name: string };
  color: string;
  size: string;
  quantity: number;
}

export function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await api.getWithRetry('/inventory');
      setInventory(res.data);
    } catch (err) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (record: InventoryRecord) => {
    setEditingId(record._id);
    setEditValue(record.quantity);
  };

  const saveEdit = async (record: InventoryRecord) => {
    try {
      await api.putWithRetry('/inventory/by-combo', {
        productId: record.product._id,
        color: record.color,
        size: record.size,
        quantity: editValue
      });
      toast.success('Inventory updated');
      setEditingId(null);
      fetchInventory();
    } catch (err) {
      toast.error('Failed to update inventory');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Inventory Management</h2>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
            ) : inventory.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8">No inventory records found.</td></tr>
            ) : (
              inventory.map(record => (
                <tr key={record._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{record.product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.color}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === record._id ? (
                      <input
                        type="number"
                        className="border rounded px-2 py-1 w-20"
                        value={editValue}
                        min={0}
                        onChange={e => setEditValue(Number(e.target.value))}
                      />
                    ) : (
                      record.quantity
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === record._id ? (
                      <>
                        <button className="text-green-600 mr-2" onClick={() => saveEdit(record)}>Save</button>
                        <button className="text-gray-500" onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="text-indigo-600" onClick={() => startEdit(record)}>Edit</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
