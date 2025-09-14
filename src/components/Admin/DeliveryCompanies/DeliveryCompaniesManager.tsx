import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Settings, 
  Globe, 
  Shield, 
  DollarSign,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  Truck,
  Wifi,
  Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';

interface DeliveryCompany {
  _id: string;
  name: string;
  code?: string; // Made optional since not all companies use codes
  apiUrl: string;
  credentials: {
    login?: string;
    password?: string;
    apiKey?: string;
    database?: string;
  };
  isActive: boolean;
  settings: {
    supportedRegions: string[];
    priceCalculation: 'fixed' | 'weight' | 'distance';
    basePrice: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CompanyFormData {
  name: string;
  code: string; // Keep as string in form, but can be empty
  apiUrl: string;
  apiFormat?: 'rest' | 'jsonrpc' | 'soap' | 'graphql';
  credentials: {
    login: string;
    password: string;
    apiKey: string;
    database: string;
  };
  isActive: boolean;
  settings: {
    supportedRegions: string[];
    priceCalculation: 'fixed' | 'weight' | 'distance';
    basePrice: number;
  };
}

const initialFormData: CompanyFormData = {
  name: '',
  code: '',
  apiUrl: '',
  apiFormat: 'rest',
  credentials: {
    login: '',
    password: '',
    apiKey: '',
    database: ''
  },
  isActive: true,
  settings: {
    supportedRegions: [],
    priceCalculation: 'fixed',
    basePrice: 0
  }
};

export function DeliveryCompaniesManager() {
  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<DeliveryCompany | null>(null);
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);
  const [newRegion, setNewRegion] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [validatingConfig, setValidatingConfig] = useState(false);
  const [useRealApi, setUseRealApi] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const normalizeCompany = (raw: any): DeliveryCompany => {
    const settings = raw?.settings || {};
    const apiConf = raw?.apiConfiguration || {};
    const credentials = raw?.credentials || {};
    return {
      _id: raw?._id || '',
      name: raw?.name || '',
      code: raw?.code || '',
      apiUrl: raw?.apiUrl || apiConf.baseUrl || '',
      credentials: {
        login: credentials.login ?? apiConf.username ?? '',
        password: credentials.password ?? apiConf.password ?? '',
        apiKey: credentials.apiKey ?? apiConf.apiKey ?? '',
        database: credentials.database ?? ''
      },
      isActive: Boolean(raw?.isActive),
      settings: {
        supportedRegions: Array.isArray(settings.supportedRegions) ? settings.supportedRegions : [],
        priceCalculation: settings.priceCalculation || 'fixed',
        basePrice: typeof settings.basePrice === 'number' ? settings.basePrice : 0
      },
      createdAt: raw?.createdAt || new Date().toISOString(),
      updatedAt: raw?.updatedAt || new Date().toISOString()
    };
  };

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.getWithRetry('/delivery/companies');
      // Ensure we always set an array
      const companiesData = response.data;
      const rawArr = Array.isArray(companiesData)
        ? companiesData
        : (Array.isArray(companiesData?.data) ? companiesData.data : []);
      if (!Array.isArray(rawArr)) {
        console.warn('Unexpected companies data format:', companiesData);
        setCompanies([]);
      } else {
        setCompanies(rawArr.map(normalizeCompany));
      }
    } catch (error) {
      console.error('Failed to fetch delivery companies:', error);
      setCompanies([]); // Ensure companies is always an array
      toast.error('Failed to fetch delivery companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.apiUrl) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Map form data to server schema
      const payload = {
        name: formData.name,
        code: formData.code?.trim() || undefined,
        apiUrl: formData.apiUrl,
        apiFormat: formData.apiFormat || 'rest',
        credentials: {
          login: formData.credentials.login?.trim() || undefined,
          password: formData.credentials.password?.trim() || undefined,
          apiKey: formData.credentials.apiKey?.trim() || undefined,
          database: formData.credentials.database?.trim() || undefined
        },
        isActive: formData.isActive,
        settings: {
          supportedRegions: formData.settings.supportedRegions,
          priceCalculation: formData.settings.priceCalculation,
          basePrice: formData.settings.basePrice,
        },
        // Keep backward compatibility
        apiConfiguration: {
          baseUrl: formData.apiUrl,
          username: formData.credentials.login || undefined,
          password: formData.credentials.password || undefined,
          apiKey: formData.credentials.apiKey || undefined,
          // Ensure required API params (e.g., db for Olivery/Odoo) are saved in params
          params: {
            ...(formData.credentials.database?.trim() ? { db: formData.credentials.database.trim() } : {})
          },
          customFields: {},
          isTestMode: !useRealApi
        }
      };
      console.log('➕ Creating new company:', formData.name);
  const response = await api.postWithRetry('/delivery/companies', payload);
  console.log('✅ Create response:', response.data);
  const newCompanyRaw = response.data?.data ?? response.data;
  const newCompany = normalizeCompany(newCompanyRaw);

  // Immediately add to local state (normalized)
  setCompanies(prev => [...prev, newCompany]);

      toast.success(`"${formData.name}" created successfully`);

      // Fetch fresh data to ensure consistency
      await fetchCompanies();
      resetForm();

    } catch (error: any) {
      console.error('❌ Create error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || `Failed to create "${formData.name}"`);
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCompany) return;

    try {
      // Map form data to server schema - use __REMOVE__ marker for field removal
      const payload = {
        name: formData.name,
        code: formData.code?.trim() || '__REMOVE__',
        apiUrl: formData.apiUrl,
        apiFormat: formData.apiFormat || 'rest',
        credentials: {
          login: formData.credentials.login?.trim() || '__REMOVE__',
          password: formData.credentials.password?.trim() || '__REMOVE__',
          apiKey: formData.credentials.apiKey?.trim() || '__REMOVE__',
          database: formData.credentials.database?.trim() || '__REMOVE__'
        },
        isActive: formData.isActive,
        settings: {
          supportedRegions: formData.settings.supportedRegions,
          priceCalculation: formData.settings.priceCalculation,
          basePrice: formData.settings.basePrice,
        },
        // Keep backward compatibility
        apiConfiguration: {
          baseUrl: formData.apiUrl,
          username: formData.credentials.login || undefined,
          password: formData.credentials.password || undefined,
          apiKey: formData.credentials.apiKey || undefined,
          // Ensure required API params (e.g., db for Olivery/Odoo) are saved in params
          params: {
            ...(formData.credentials.database?.trim() ? { db: formData.credentials.database.trim() } : {})
          },
          customFields: {},
          isTestMode: !useRealApi
        }
      };
      console.log('📝 Updating company:', editingCompany._id, formData.name);
  const response = await api.putWithRetry(`/delivery/companies/${editingCompany._id}`, payload);
  console.log('✅ Update response:', response.data);

  const updatedCompanyRaw = response.data?.data ?? response.data;
  const updatedCompany = normalizeCompany(updatedCompanyRaw);

  // Immediately update local state (normalized)
  setCompanies(prev => prev.map(c => (c._id === editingCompany._id ? updatedCompany : c)));

      toast.success(`"${formData.name}" updated successfully`);

      // Fetch fresh data to ensure consistency
      await fetchCompanies();
      resetForm();

    } catch (error: any) {
      console.error('❌ Update error:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || `Failed to update "${formData.name}"`);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    const company = companies.find(c => c._id === id);
    const companyName = company?.name || 'this company';

    if (!confirm(`Are you sure you want to delete "${companyName}"?\n\nThis action cannot be undone. If this company has delivery orders, deletion will be prevented.`)) {
      return;
    }

    try {
      console.log('🗑️ Attempting to delete company:', id);
      const response = await api.deleteWithRetry(`/delivery/companies/${id}`);
      console.log('✅ Delete response:', response);

      // Immediately update local state to remove the company
      setCompanies(prev => prev.filter(c => c._id !== id));

      toast.success(`"${companyName}" deleted successfully`);

      // Fetch fresh data to ensure consistency
      await fetchCompanies();

    } catch (error: any) {
      console.error('❌ Delete error:', error.response?.data || error.message);

      const errorMessage = error.response?.data?.message || 'Failed to delete delivery company';

      if (errorMessage.includes('delivery orders')) {
        const shouldShowOrders = confirm(
          `Cannot delete "${companyName}" - it has active delivery orders.\n\n` +
          `Would you like to see the orders that are preventing deletion?\n\n` +
          `You'll need to remove these orders first before deleting the company.`
        );

        if (shouldShowOrders) {
          // Show orders in console for now - could be enhanced with a modal
          console.log(`🔍 Checking orders for company: ${companyName} (${id})`);
          await checkCompanyOrders(id, companyName);

          // Offer force delete option for development
          const shouldForceDelete = confirm(
            `⚠️ FORCE DELETE OPTION (Development Only)\n\n` +
            `This will permanently delete "${companyName}" and ALL its delivery orders.\n\n` +
            `This action CANNOT be undone!\n\n` +
            `Are you sure you want to force delete this company?`
          );

          if (shouldForceDelete) {
            try {
              console.log('🗑️ Force deleting company with all orders...');
              const forceResponse = await api.deleteWithRetry(`/delivery/companies/${id}?force=true`);
              console.log('✅ Force delete response:', forceResponse);

              // Immediately update local state
              setCompanies(prev => prev.filter(c => c._id !== id));

              const deletedOrders = forceResponse.data?.deletedOrders || 0;
              toast.success(`"${companyName}" force deleted successfully! (${deletedOrders} orders removed)`);

              // Fetch fresh data
              await fetchCompanies();

            } catch (forceError: any) {
              console.error('❌ Force delete error:', forceError.response?.data || forceError.message);
              toast.error(`Force delete failed: ${forceError.response?.data?.message || forceError.message}`);
            }
          }
        } else {
          toast.error(`Cannot delete "${companyName}" - it has active delivery orders. Check console for details.`);
        }
      } else {
        toast.error(`Failed to delete "${companyName}": ${errorMessage}`);
      }

      // Refresh data in case of error to ensure UI is in sync
      await fetchCompanies();
    }
  };

  const checkCompanyOrders = async (companyId: string, companyName: string) => {
    try {
      console.log(`📋 Fetching delivery orders for ${companyName}...`);
      const response = await api.getWithRetry('/delivery/orders');
      const orders = response.data?.data || response.data || [];

      const companyOrders = orders.filter((order: any) =>
        order.deliveryCompany === companyId || order.deliveryCompany?._id === companyId
      );

      console.log(`📊 Found ${companyOrders.length} orders for ${companyName}:`);

      if (companyOrders.length > 0) {
        companyOrders.forEach((order: any, index: number) => {
          console.log(`   ${index + 1}. Order ID: ${order._id}`);
          console.log(`      Order Number: ${order.order || 'N/A'}`);
          console.log(`      Status: ${order.status}`);
          console.log(`      Created: ${order.createdAt}`);
          console.log(`      Tracking: ${order.trackingNumber || 'N/A'}`);
          console.log('');
        });

        console.log(`💡 To delete "${companyName}", you need to:`);
        console.log('   1. Go to Order Management tab');
        console.log('   2. Find and remove these delivery orders');
        console.log('   3. Then try deleting the company again');
      } else {
        console.log(`✅ No orders found - company should be deletable`);
      }

    } catch (error: any) {
      console.error('❌ Error checking orders:', error.response?.data || error.message);
    }
  };

  const handleToggleStatus = async (company: DeliveryCompany) => {
    try {
      await api.putWithRetry(`/delivery/companies/${company._id}`, {
        ...company,
        isActive: !company.isActive
      });
      toast.success(`Company ${!company.isActive ? 'activated' : 'deactivated'} successfully`);
      await fetchCompanies();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update company status');
    }
  };

  const resetForm = () => {
    setEditingCompany(null);
    setShowForm(false);
    setNewRegion('');
    setUseRealApi(false);
    // Use a small delay to ensure state is cleared before setting new data
    setTimeout(() => {
      setFormData(initialFormData);
    }, 0);
  };

  const handleEditCompany = async (company: DeliveryCompany) => {
    try {
      // Fetch the full company data including credentials
  const response = await api.getWithRetry(`/delivery/companies/${company._id}`);
  const raw = response.data;
  const fullCompanyData = raw?.data ?? raw;

      setEditingCompany(fullCompanyData);
      setUseRealApi(fullCompanyData.apiConfiguration?.isTestMode === false);

      // Create a complete new formData object to ensure reactivity
      const newFormData: CompanyFormData = {
        name: fullCompanyData.name || '',
        code: fullCompanyData.code || '',
        apiUrl: fullCompanyData.apiConfiguration?.baseUrl || fullCompanyData.apiUrl || '',
        credentials: {
          login: fullCompanyData.apiConfiguration?.username || fullCompanyData.credentials?.login || '',
          password: fullCompanyData.apiConfiguration?.password || fullCompanyData.credentials?.password || '',
          apiKey: fullCompanyData.apiConfiguration?.apiKey || fullCompanyData.credentials?.apiKey || '',
          database: fullCompanyData.credentials?.database || ''
        },
        isActive: fullCompanyData.isActive,
        settings: {
          supportedRegions: fullCompanyData.settings?.supportedRegions || [],
          priceCalculation: fullCompanyData.settings?.priceCalculation || 'fixed',
          basePrice: fullCompanyData.settings?.basePrice || 0
        }
      };
      
      // Force a complete re-render by resetting first
      setFormData(initialFormData);
      setShowForm(true);
      
      // Then set the actual data on next tick
      setTimeout(() => {
        setFormData(newFormData);
        console.log('Form data set to:', newFormData);
      }, 0);
    } catch (error) {
      toast.error('Failed to fetch company details');
      console.error('Error fetching company details:', error);
    }
  };

  const addRegion = () => {
    if (newRegion.trim() && !formData.settings.supportedRegions.includes(newRegion.trim())) {
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          supportedRegions: [...prev.settings.supportedRegions, newRegion.trim()]
        }
      }));
      setNewRegion('');
    }
  };

  const removeRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        supportedRegions: prev.settings.supportedRegions.filter(r => r !== region)
      }
    }));
  };

  const handleTestConnection = async () => {
    if (!formData.apiUrl) {
      toast.error('Please enter an API URL first');
      return;
    }

    if (!editingCompany) {
      toast.error('Please save the company first before testing connection');
      return;
    }

    try {
      setTestingConnection(true);
      const response = await api.postWithRetry(`/delivery/companies/${editingCompany._id}/test-connection`);
      const result = response.data;
      
      if (result.success) {
        toast.success(result.message || 'Connection test successful');
      } else {
        toast.error(result.message || 'Connection test failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to test connection');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleValidateConfig = async () => {
    if (!editingCompany) {
      toast.error('Open and save a company first');
      return;
    }
    try {
      setValidatingConfig(true);
      const res = await api.getWithRetry(`/delivery/companies/${editingCompany._id}/validate-config`);
      const data = res.data || {};
      const ok = data.success !== false && (data.ok === undefined ? true : data.ok) && (!Array.isArray(data.issues) || data.issues.length === 0);
      const effDb = data.db?.effectiveDb ?? data.effective?.db;
      const dbSource = data.db?.sources ? Object.entries(data.db.sources).filter(([,v]) => v).map(([k]) => `${k}=${data.db.sources[k]}`).join(', ') : data.effective?.dbSource;
      if (ok) {
        toast.success(`Config looks okay${effDb ? ` (db=${effDb})` : ''}`);
      } else {
        const issues = (data.issues || []).join(', ');
        toast.error(`Config issues: ${issues || 'unknown'}${effDb ? `; db=${effDb}` : ''}`);
      }
      if (dbSource) console.info('DB sources:', dbSource);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to validate config');
    } finally {
      setValidatingConfig(false);
    }
  };

  const priceCalculationOptions = [
    { value: 'fixed', label: 'Fixed Price' },
    { value: 'weight', label: 'Weight Based' },
    { value: 'distance', label: 'Distance Based' }
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Delivery Companies</h1>
          <p className="text-gray-600 mt-1">Manage multiple delivery service providers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* Companies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.isArray(companies) && companies.length > 0 ? (
          companies.map((company) => (
            <div key={company._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{company.name}</h3>
                  {company.code && company.code.trim() !== '' ? (
                    <p className="text-sm text-gray-500">{company.code}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No code assigned</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(company)}
                  className={`p-1 rounded ${
                    company.isActive 
                      ? 'text-green-600 hover:bg-green-50' 
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {company.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleEditCompany(company)}
                  className="p-1 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCompany(company._id)}
                  className="p-1 text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  company.isActive ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className={`text-sm ${
                  company.isActive ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {company.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Globe className="w-4 h-4" />
        <span className="text-sm">{company.apiUrl || '—'}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
      {company.settings?.supportedRegions?.length ?? 0} regions
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm capitalize">
      {(company.settings?.priceCalculation ?? 'fixed')} pricing
                </span>
              </div>
            </div>

    {Array.isArray(company.settings?.supportedRegions) && company.settings.supportedRegions.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium text-gray-500 mb-2">Supported Regions</p>
                <div className="flex flex-wrap gap-1">
      {company.settings.supportedRegions.slice(0, 3).map((region) => (
                    <span
                      key={region}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {region}
                    </span>
                  ))}
      {company.settings.supportedRegions.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      +{company.settings.supportedRegions.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Delivery Companies</h3>
            <p className="text-gray-500 mb-4">
              {loading ? 'Loading companies...' : 'Add your first delivery company to start managing deliveries'}
            </p>
            {!loading && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add Company
              </button>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCompany ? 'Edit' : 'Add'} Delivery Company
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form 
              key={`${editingCompany?._id || 'new'}-${showForm}`} 
              onSubmit={editingCompany ? handleUpdateCompany : handleCreateCompany} 
              className="p-6 space-y-6"
            >
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., FastDelivery"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., FD (leave empty if company doesn't use codes)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Some delivery companies don't use short codes - this field is optional
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API URL *
                  </label>
                  <input
                    type="url"
                    value={formData.apiUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiUrl: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://api.deliverycompany.com"
                    required
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active (can receive new orders)
                  </label>
                </div>
              </div>

              {/* API Credentials */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">API Credentials</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={useRealApi}
                        onChange={(e) => setUseRealApi(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      Use real API
                    </label>
                    {editingCompany && (
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testingConnection}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                      >
                        <Wifi className="w-4 h-4" />
                        {testingConnection ? 'Testing...' : 'Test Connection'}
                      </button>
                    )}
                    {editingCompany && (
                      <button
                        type="button"
                        onClick={handleValidateConfig}
                        disabled={validatingConfig}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
                      >
                        Validate Config
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Login/Username
                    </label>
                    <input
                      type="text"
                      value={formData.credentials.login}
                      onChange={(e) => {
                        console.log('Login changed to:', e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          credentials: { ...prev.credentials, login: e.target.value }
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter username/login"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.credentials.password}
                      onChange={(e) => {
                        console.log('Password changed');
                        setFormData(prev => ({
                          ...prev,
                          credentials: { ...prev.credentials, password: e.target.value }
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <input
                      type="text"
                      value={formData.credentials.apiKey}
                      onChange={(e) => {
                        console.log('API Key changed to:', e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          credentials: { ...prev.credentials, apiKey: e.target.value }
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter API Key"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Database
                    </label>
                    <input
                      type="text"
                      value={formData.credentials.database}
                      onChange={(e) => {
                        console.log('Database changed to:', e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          credentials: { ...prev.credentials, database: e.target.value }
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter database name"
                    />
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900">Configuration</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price Calculation
                    </label>
                    <select
                      value={formData.settings.priceCalculation}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        settings: { 
                          ...prev.settings, 
                          priceCalculation: e.target.value as 'fixed' | 'weight' | 'distance'
                        }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {priceCalculationOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.settings.basePrice}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        settings: { ...prev.settings, basePrice: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Supported Regions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supported Regions
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newRegion}
                      onChange={(e) => setNewRegion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRegion())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Add region (e.g., California, New York)"
                    />
                    <button
                      type="button"
                      onClick={addRegion}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Add
                    </button>
                  </div>
                  
                  {formData.settings.supportedRegions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.settings.supportedRegions.map((region) => (
                        <div
                          key={region}
                          className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm"
                        >
                          <span>{region}</span>
                          <button
                            type="button"
                            onClick={() => removeRegion(region)}
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between gap-4 pt-6 border-t">
                <div className="flex items-center gap-2">
                  {editingCompany && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          // Build override payload for a real send test
                          const testBody = {
                            order: null, // will be filled below
                            companyId: editingCompany._id,
                            baseUrl: formData.apiUrl,
                            username: formData.credentials.login || undefined,
                            password: formData.credentials.password || undefined,
                            db: formData.credentials.database || undefined,
                            isTestMode: !useRealApi ? true : false
                          } as any;

                          // Fetch one recent order to test with
                          const ordersResp = await api.getWithRetry('/orders/all');
                          const allOrders = Array.isArray(ordersResp.data) ? ordersResp.data : (ordersResp.data?.data || []);
                          const pending = allOrders.find((o: any) => !o.deliveryCompany) || allOrders[0];
                          if (!pending) {
                            toast.error('No orders available to test real send');
                            return;
                          }
                          testBody.order = pending;

                          const res = await api.postWithRetry('/delivery/order', testBody);
                          toast.success(res.data?.message || 'Test send successful');
                        } catch (err: any) {
                          toast.error(err.response?.data?.message || err.message || 'Test send failed');
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                    >
                      <Send className="w-4 h-4" />
                      Test real send
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Save className="w-4 h-4" />
                    {editingCompany ? 'Update' : 'Create'} Company
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
