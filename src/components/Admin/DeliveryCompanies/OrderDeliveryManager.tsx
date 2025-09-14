import { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  AlertCircle,
  Search,
  Eye,
  Send,
  RefreshCw,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';
import { useCurrency } from '../../../context/CurrencyContext';
import { formatPrice } from '../../../utils/currency';

interface DeliveryCompany {
  _id: string;
  name: string;
  code?: string; // Optional: not all companies use codes
  isActive: boolean;
  settings: {
    supportedRegions: string[];
    priceCalculation: 'fixed' | 'weight' | 'distance';
    basePrice: number;
  };
}

interface Order {
  _id: string;
  orderNumber: string;
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
    latitude?: string;
    longitude?: string;
  };
  totalAmount: number;
  status: string;
  deliveryStatus?: string;
  deliveryCompany?: {
    _id: string;
    name: string;
    code: string;
  };
  items: Array<{
    product: {
      name: string;
      images: string[];
    };
    quantity: number;
    price: number;
  }>;
  createdAt: string;
}

export function OrderDeliveryManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sendingOrder, setSendingOrder] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const { currency } = useCurrency();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersResponse, companiesResponse] = await Promise.all([
        api.getWithRetry('/orders/all'),
        api.getWithRetry('/delivery/companies')
      ]);
      
      setOrders(ordersResponse.data);
      const companiesData = companiesResponse.data;
      const companiesArr: DeliveryCompany[] = Array.isArray(companiesData)
        ? companiesData
        : (companiesData?.data ?? []);
      setCompanies(companiesArr.filter((company: DeliveryCompany) => company.isActive));
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToDelivery = async () => {
    if (!selectedOrder || !selectedCompany) {
      toast.error('Please select an order and delivery company');
      return;
    }

    try {
      setSendingOrder(true);

      // Build payload expected by backend
      const payload = {
        order: selectedOrder,
        companyId: selectedCompany,
        mappedData: { deliveryFee: 0 }
      };

      console.log('📦 Sending to /api/delivery/order endpoint...', payload);
      const response = await api.postWithRetry('/delivery/order', payload);

      toast.success(response.data?.message || 'Order sent to delivery service successfully');
      await fetchData();
      setShowDeliveryModal(false);
      setSelectedOrder(null);
      setSelectedCompany('');
    } catch (error: any) {
      console.error('Failed to send order to delivery:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to send order to delivery');
    } finally {
      setSendingOrder(false);
    }
  };

  const handleCheckDeliveryStatus = async (order: Order) => {
    if (!order.deliveryCompany) {
      toast.error('No delivery company assigned to this order');
      return;
    }

    try {
      const response = await api.getWithRetry(`/delivery/status/${order._id}/${order.deliveryCompany._id}`);
      toast.success(`Delivery Status: ${response.data.status}`);
    } catch (error) {
      toast.error('Failed to check delivery status');
    }
  };

  // Remove unused function for now
  // const calculateDeliveryFee = async (order: Order, companyId: string) => {
  //   try {
  //     const response = await api.postWithRetry('/delivery/calculate-fee', {
  //       order,
  //       companyId
  //     });
  //     return response.data.fee;
  //   } catch (error) {
  //     return 0;
  //   }
  // };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.customerInfo.firstName} ${order.customerInfo.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending' && !order.deliveryCompany) ||
      (statusFilter === 'assigned' && order.deliveryCompany && order.deliveryStatus !== 'delivered') ||
      (statusFilter === 'delivered' && order.deliveryStatus === 'delivered');

    return matchesSearch && matchesStatus;
  });

  const openDeliveryModal = (order: Order) => {
    setSelectedOrder(order);
    setShowDeliveryModal(true);
    setSelectedCompany('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Delivery Management</h1>
          <p className="text-gray-600 mt-1">Assign orders to delivery companies and track status</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-xl font-semibold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Assignment</p>
              <p className="text-xl font-semibold text-gray-900">
                {orders.filter(o => !o.deliveryCompany).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Transit</p>
              <p className="text-xl font-semibold text-gray-900">
                {orders.filter(o => o.deliveryCompany && o.deliveryStatus !== 'delivered').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Delivered</p>
              <p className="text-xl font-semibold text-gray-900">
                {orders.filter(o => o.deliveryStatus === 'delivered').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search orders by number, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending Assignment</option>
              <option value="assigned">Assigned</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delivery Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-indigo-600">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {order.customerInfo.firstName} {order.customerInfo.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{order.customerInfo.email}</p>
                      <p className="text-xs text-gray-500">{order.customerInfo.mobile}</p>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs">
                      <p>{order.shippingAddress.street}</p>
                      <p className="text-xs text-gray-500">
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">
                      {formatPrice(order.totalAmount, currency)}
                    </p>
                    <p className="text-xs text-gray-500">{order.items.length} items</p>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.deliveryCompany ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.deliveryCompany.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.deliveryCompany.code}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Not assigned</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.deliveryStatus === 'delivered'
                        ? 'bg-green-100 text-green-800'
                        : order.deliveryCompany
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {order.deliveryStatus || (order.deliveryCompany ? 'Assigned' : 'Pending')}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {!order.deliveryCompany ? (
                        <button
                          onClick={() => openDeliveryModal(order)}
                          className="p-1 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded"
                          title="Assign to delivery company"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCheckDeliveryStatus(order)}
                          className="p-1 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded"
                          title="Check delivery status"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters to see more orders'
                : 'No orders available for delivery assignment'
              }
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && !showDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Details - #{selectedOrder.orderNumber}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Customer Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedOrder.customerInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedOrder.customerInfo.mobile}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Shipping Address</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-900">{selectedOrder.shippingAddress.street}</p>
                      <p className="text-sm text-gray-600">
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                      </p>
                      <p className="text-sm text-gray-600">{selectedOrder.shippingAddress.country}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {item.product.images?.[0] && (
                          <img 
                            src={item.product.images[0]} 
                            alt={item.product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatPrice(item.price * item.quantity, currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Assignment */}
              {!selectedOrder.deliveryCompany && (
                <div className="pt-4 border-t">
                  <button
                    onClick={() => openDeliveryModal(selectedOrder)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Send className="w-4 h-4" />
                    Assign to Delivery Company
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Assignment Modal */}
      {showDeliveryModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Assign to Delivery Company
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Order #{selectedOrder.orderNumber}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Delivery Company
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Choose a delivery company...</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name} ({company.code})
                    </option>
                  ))}
                </select>
              </div>

              {companies.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <p className="text-sm text-amber-700">
                      No active delivery companies available. Please add and activate delivery companies first.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-4 pt-4">
                <button
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendToDelivery}
                  disabled={!selectedCompany || sendingOrder || companies.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {sendingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Assign Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
