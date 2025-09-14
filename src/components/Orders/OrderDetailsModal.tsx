import { X, Package, Truck, Clock, CheckCircle, XCircle, Copy, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface Order {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  status: string;
  paymentStatus: string;
  deliveryStatus?: string;
  deliveryTrackingNumber?: string;
  deliveryCompany?: {
    _id: string;
    name: string;
    code?: string;
  };
  createdAt: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    secondaryMobile?: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  deliveryEstimatedDate?: string;
  deliveryActualDate?: string;
}

interface OrderDetailsModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'items' | 'delivery' | 'customer'>('items');

  if (!isOpen) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing': return <Package className="w-5 h-5 text-blue-500" />;
      case 'shipped': return <Truck className="w-5 h-5 text-indigo-500" />;
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'picked_up': return 'bg-purple-100 text-purple-800';
      case 'in_transit': return 'bg-indigo-100 text-indigo-800';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'delivery_failed': return 'bg-red-100 text-red-800';
      case 'returned': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const copyTrackingNumber = () => {
    if (order.deliveryTrackingNumber) {
      navigator.clipboard.writeText(order.deliveryTrackingNumber);
      toast.success('Tracking number copied to clipboard');
    }
  };

  const tabs = [
    { id: 'items', label: 'Order Items', icon: Package },
    { id: 'delivery', label: 'Delivery Info', icon: Truck },
    { id: 'customer', label: 'Customer Info', icon: CheckCircle }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="order-details-modal" role="dialog" aria-modal="true">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {formatStatus(order.status)}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'items' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${item.price.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">
                          Total: ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>${order.totalAmount.toFixed(2)} {order.currency}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'delivery' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Delivery Information</h3>
                
                {order.deliveryCompany ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">Delivery Company</h4>
                          <p className="text-gray-600">{order.deliveryCompany.name}</p>
                          {order.deliveryCompany.code && order.deliveryCompany.code.trim() !== '' ? (
                            <span className="inline-block mt-1 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                              {order.deliveryCompany.code}
                            </span>
                          ) : (
                            <span className="inline-block mt-1 text-xs text-gray-400 italic">
                              No code assigned
                            </span>
                          )}
                        </div>
                        {order.deliveryStatus && (
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getDeliveryStatusColor(order.deliveryStatus)}`}>
                            {formatStatus(order.deliveryStatus)}
                          </span>
                        )}
                      </div>

                      {order.deliveryTrackingNumber && (
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">Tracking Number</h5>
                              <p className="text-gray-600 font-mono">{order.deliveryTrackingNumber}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={copyTrackingNumber}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Copy tracking number"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => window.open(`#track/${order.deliveryTrackingNumber}`, '_blank')}
                                className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Track package"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {(order.deliveryEstimatedDate || order.deliveryActualDate) && (
                        <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {order.deliveryEstimatedDate && (
                            <div>
                              <h5 className="font-medium text-gray-900">Estimated Delivery</h5>
                              <p className="text-gray-600">
                                {new Date(order.deliveryEstimatedDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {order.deliveryActualDate && (
                            <div>
                              <h5 className="font-medium text-gray-900">Actual Delivery</h5>
                              <p className="text-gray-600">
                                {new Date(order.deliveryActualDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <p className="text-yellow-800">No delivery company assigned yet</p>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Shipping Address</h4>
                  <div className="text-gray-600">
                    <p>{order.shippingAddress.street}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'customer' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Contact Details</h4>
                    <div className="space-y-2 text-gray-600">
                      <p><span className="font-medium">Name:</span> {order.customerInfo.firstName} {order.customerInfo.lastName}</p>
                      <p><span className="font-medium">Email:</span> {order.customerInfo.email}</p>
                      <p><span className="font-medium">Mobile:</span> {order.customerInfo.mobile}</p>
                      {order.customerInfo.secondaryMobile && (
                        <p><span className="font-medium">Secondary Mobile:</span> {order.customerInfo.secondaryMobile}</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Payment Information</h4>
                    <div className="space-y-2 text-gray-600">
                      <p><span className="font-medium">Payment Status:</span> 
                        <span className={`ml-2 inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {formatStatus(order.paymentStatus)}
                        </span>
                      </p>
                      <p><span className="font-medium">Total Amount:</span> ${order.totalAmount.toFixed(2)} {order.currency}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t px-6 py-4 bg-gray-50">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
