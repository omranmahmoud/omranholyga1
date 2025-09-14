import { useState, useEffect } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { DeliveryCompanyList } from './DeliveryCompanyList';
import { DeliveryCompanyModal } from './DeliveryCompanyModal';
import { DeliveryOrderList } from './DeliveryOrderList';
import { DeliveryAssignmentModal } from './DeliveryAssignmentModal';
import api from '../../../services/api';
import { toast } from 'react-hot-toast';

// Local interface for the list component compatibility
interface LocalDeliveryCompany {
  _id: string;
  name: string;
  code: string;
  apiUrl: string;
  isActive: boolean;
  settings: {
    supportedRegions: string[];
    priceCalculation: 'fixed' | 'weight' | 'distance';
    basePrice: number;
  };
}

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

export function DeliveryManagement() {
  const [companies, setCompanies] = useState<LocalDeliveryCompany[]>([]);
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<LocalDeliveryCompany | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

    const fetchData = async () => {
    try {
      setLoading(true);
      const [companiesResponse, ordersResponse] = await Promise.all([
        api.getWithRetry('/delivery/companies'),
        api.getWithRetry('/orders/all'),
      ]);
      
      // Ensure we always set arrays
      const companiesData = companiesResponse.data;
      const companiesArr = Array.isArray(companiesData)
        ? companiesData
        : (Array.isArray(companiesData?.data) ? companiesData.data : []);
      if (!Array.isArray(companiesArr)) {
        console.warn('Unexpected companies data format:', companiesData);
        setCompanies([]);
      } else {
        setCompanies(companiesArr);
      }

      const ordersData = ordersResponse.data;
      if (Array.isArray(ordersData)) {
        setOrders(ordersData);
      } else if (ordersData && Array.isArray(ordersData.data)) {
        setOrders(ordersData.data);
      } else {
        console.warn('Unexpected orders data format:', ordersData);
        setOrders([]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setCompanies([]); // Ensure arrays are always set
      setOrders([]);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (data: any) => {
    try {
      const response = await api.postWithRetry('/delivery/companies', data);
      setCompanies([...companies, response.data]);
      setIsModalOpen(false);
      toast.success('Delivery company created successfully');
    } catch (error) {
      toast.error('Failed to create delivery company');
    }
  };

  const handleUpdateCompany = async (data: any) => {
    try {
      const response = await api.putWithRetry(`/delivery/companies/${data._id}`, data);
      setCompanies(companies.map(c => c._id === data._id ? response.data : c));
      setIsModalOpen(false);
      toast.success('Delivery company updated successfully');
    } catch (error) {
      toast.error('Failed to update delivery company');
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this delivery company?')) return;

    try {
      await api.deleteWithRetry(`/delivery/companies/${id}`);
      setCompanies((prev) => prev.filter((c) => c._id !== id));
      toast.success('Delivery company deleted successfully');
    } catch (error) {
      toast.error('Failed to delete delivery company');
    }
  };

  const handleSendToDelivery = async (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setIsAssignmentModalOpen(true);
  };

  const handleCheckStatus = async (orderId: string) => {
    try {
      const response = await api.getWithRetry(`/delivery/status/${orderId}`);
      toast.success(`Delivery Status: ${response.data.status}`);
    } catch (error) {
      toast.error('Failed to check delivery status');
    }
  };

  const openModal = (company: LocalDeliveryCompany | null) => {
    setSelectedCompany(company);
    setIsModalOpen(true);
  };

  const handleAssignmentSuccess = () => {
    fetchData(); // Refresh data after successful assignment
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage delivery companies and track orders
        </p>
      </div>

      {/* API Mode Status */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-green-500 rounded-full mt-0.5 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-green-800">Real API Mode Active</h4>
            <p className="text-sm text-green-700 mt-1">
              The system is configured to use real delivery company APIs. Orders will be sent to actual delivery services.
              Make sure your API credentials are properly configured for each delivery company.
            </p>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-800">Important Note</h4>
            <p className="text-sm text-amber-700 mt-1">
              Ensure the delivery address is complete and accurate before sending the order to the delivery service.
              The customer's phone number is required for delivery updates.
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Companies */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Companies</h2>
        {companies.length > 0 ? (
          <DeliveryCompanyList
            companies={companies}
            onEdit={openModal}
            onDelete={handleDeleteCompany}
          />
        ) : (
          <p className="text-sm text-gray-500">No delivery companies available. Add a new company below.</p>
        )}
      </div>

      {/* Orders */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders for Delivery</h2>
        <DeliveryOrderList
          orders={orders}
          onSendToDelivery={handleSendToDelivery}
          onCheckStatus={handleCheckStatus}
        />
      </div>

      {/* Add Company Button */}
      <div className="fixed bottom-8 left-8 z-10">
        <button
          onClick={() => openModal(null)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:shadow-xl hover:-translate-y-0.5"
          aria-label="Add Delivery Company"
        >
          <Plus className="w-5 h-5" />
          Add Delivery Company
        </button>
      </div>

      {/* Company Modal */}
      <DeliveryCompanyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCompany(null);
        }}
        onSubmit={selectedCompany ? handleUpdateCompany : handleCreateCompany}
        company={selectedCompany ? {
          ...selectedCompany,
          credentials: {
            login: '',
            password: '',
            apiKey: '',
            database: ''
          }
        } : undefined}
      />

      {/* Delivery Assignment Modal */}
      <DeliveryAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        order={selectedOrder}
        onSuccess={handleAssignmentSuccess}
      />
    </div>
  );
}
