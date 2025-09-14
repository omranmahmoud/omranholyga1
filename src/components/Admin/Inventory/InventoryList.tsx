import React, { useState } from 'react';
import { Edit2, AlertTriangle, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { InventoryItem } from '../../../services/inventoryService';

type InventoryListProps = {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onInlineEdit: (item: InventoryItem, newQuantity: number) => void;
};

type InlineEditQuantityProps = {
  item: InventoryItem;
  onInlineEdit: (item: InventoryItem, newQuantity: number) => void;
};

function InlineEditQuantity({ item, onInlineEdit }: InlineEditQuantityProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.quantity);
  return editing ? (
    <span>
      <input
        type="number"
        className="border rounded px-2 py-1 w-20"
        value={value}
        min={0}
        onChange={e => setValue(Number(e.target.value))}
      />
      <button className="ml-2 text-green-600" onClick={() => { onInlineEdit(item, value); setEditing(false); }}>Save</button>
      <button className="ml-1 text-gray-500" onClick={() => { setEditing(false); setValue(item.quantity); }}>Cancel</button>
    </span>
  ) : (
    <span>
      {item.quantity}
      <button className="ml-2 text-indigo-600" onClick={() => setEditing(true)}>Edit</button>
    </span>
  );
}

export function InventoryList({ items, onEdit, onInlineEdit }: InventoryListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Inventory Items</h3>
        <p className="text-gray-500">No inventory items found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Size/Color
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Updated
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {item.product.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      ID: {item.product._id}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{item.size}</div>
                <div className="text-sm text-gray-500">{item.color}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <InlineEditQuantity item={item} onInlineEdit={onInlineEdit} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  getStatusColor(item.status)
                }`}>
                  {item.status.replace('_', ' ').toUpperCase()}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.location}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDistanceToNow(new Date(item.lastUpdated), { addSuffix: true })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onEdit(item)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}