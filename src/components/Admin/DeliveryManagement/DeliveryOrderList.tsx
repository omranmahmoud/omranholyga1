import { Package, MapPin, Phone, Mail } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OrderItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    images?: string[];
  };
  quantity: number;
  price: number;
}

interface DeliveryOrder {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  currency?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod: 'card' | 'cod';
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  deliveryStatus?: string;
  deliveryTrackingNumber?: string;
  deliveryCompany?: {
    _id: string;
    name: string;
    code: string;
  };
  deliveryAssignedAt?: string;
  deliveryEstimatedDate?: string;
  deliveryActualDate?: string;
  createdAt: string;
}

interface DeliveryOrderListProps {
  orders: DeliveryOrder[];
  onSendToDelivery: (order: DeliveryOrder) => void;
  onCheckStatus: (orderId: string) => void;
}

export function DeliveryOrderList({ orders, onSendToDelivery, onCheckStatus }: DeliveryOrderListProps) {
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order._id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          {/* Order Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Order #{order.orderNumber}
              </h3>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
              </p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              order.deliveryStatus === 'delivered'
                ? 'bg-green-100 text-green-800'
                : order.deliveryStatus === 'in_transit'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {order.deliveryStatus || 'Pending'}
            </span>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Customer Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {order.customerInfo.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {order.customerInfo.mobile}
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Shipping Address</h4>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm">
              <span className="font-medium text-gray-900">Total Amount:</span>{' '}
              ${order.totalAmount.toFixed(2)}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => onCheckStatus(order._id)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Check Status
              </button>
              {!order.deliveryStatus && (
                <button
                  onClick={() => onSendToDelivery(order)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  Send to Delivery
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}