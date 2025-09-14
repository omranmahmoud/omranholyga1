import React from 'react';
import { formatPrice } from '../../../utils/currency';

interface OrderItem {
  product: {
    _id: string;
    name: string;
    images: string[];
  };
  quantity: number;
  price: number;
  size?: string;
}

interface OrderItemsProps {
  items: OrderItem[];
  totalAmount: number;
  currency: string;
}

export function OrderItems({ items, totalAmount, currency }: OrderItemsProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price ({currency})
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total ({currency})
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.product._id}>
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <img
                    src={item.product.images && item.product.images.length > 0 ? item.product.images[0] : '/placeholder-image.svg'}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.product.name}
                    </p>
                    {item.size && (
                      <p className="text-sm text-gray-500">Size: {item.size}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {item.quantity}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {item.price.toFixed(2)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                {(item.price * item.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
              Total
            </td>
            <td className="px-6 py-4 text-sm font-medium text-gray-900">
              {totalAmount.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}