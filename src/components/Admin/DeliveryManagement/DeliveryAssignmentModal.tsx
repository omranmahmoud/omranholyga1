import { useState, useEffect } from 'react';
import { X, Truck, DollarSign, MapPin, Send, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';

interface DeliveryCompany {
  _id: string;
  name: string;
  code?: string; // Optional - not all delivery companies use codes
  apiUrl?: string;
  credentials?: {
    login?: string;
    password?: string;
    apiKey?: string;
    database?: string;
  };
  settings: {
    supportedRegions: string[];
    priceCalculation: 'fixed' | 'weight' | 'distance';
    basePrice: number;
  };
  fieldMappings?: Array<{
    sourceField: string;
    targetField: string;
    required: boolean;
    enabled: boolean;
    transform?: string;
  }>;
  customFields?: Record<string, any>;
  isActive: boolean;
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

interface DeliveryHistory {
  attemptNumber: number;
  timestamp: string;
  response: any;
  status: string;
  notes: string;
}

interface DeliveryOrderInfo {
  _id: string;
  trackingNumber: string;
  status: string;
  externalStatus?: string;
  externalOrderId?: string;
  resendAttempts: number;
  lastResendAt?: string;
  resendHistory?: DeliveryHistory[];
  deliveryCompany: {
    _id: string;
    name: string;
  };
  response?: any;
  createdAt: string;
}

interface Order {
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
  createdAt: string;
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
  deliveryOrderInfo?: DeliveryOrderInfo;
}

interface DeliveryAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess: () => void;
}

export function DeliveryAssignmentModal({ 
  isOpen, 
  onClose, 
  order, 
  onSuccess 
}: DeliveryAssignmentModalProps) {
  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showMappingPreview, setShowMappingPreview] = useState(false);
  const [deliveryOrderInfo, setDeliveryOrderInfo] = useState<DeliveryOrderInfo | null>(null);
  const [isResend, setIsResend] = useState(false);
  // Removed unused loadingDeliveryInfo state
  const [validatingMappings, setValidatingMappings] = useState(false);
  const [mappingValidation, setMappingValidation] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
      checkDeliveryStatus();
      setSelectedCompany('');
      setDeliveryFee(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCompany && order) {
      calculateDeliveryFee();
      validateFieldMappings();
    }
  }, [selectedCompany, order]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.getWithRetry('/delivery/companies/public/active');
      // Ensure we always set an array
      const companiesData = response.data;
      const rawArr = Array.isArray(companiesData)
        ? companiesData
        : (Array.isArray(companiesData?.data) ? companiesData.data : []);
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
          fieldMappings: Array.isArray(raw?.fieldMappings) ? raw.fieldMappings : [],
          customFields: raw?.customFields || {}
        };
      };
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

  const checkDeliveryStatus = async () => {
    if (!order) return;

  try {
      // Check if order has been sent to delivery by looking for delivery orders
      const response = await api.getWithRetry(`/delivery/orders?orderId=${order._id}`);

      if (response.data?.data && response.data.data.length > 0) {
        const deliveryOrder = response.data.data[0]; // Get the most recent delivery order
        setDeliveryOrderInfo(deliveryOrder);
        setIsResend(true);

        // Pre-select the delivery company if it exists
        if (deliveryOrder.deliveryCompany?._id) {
          setSelectedCompany(deliveryOrder.deliveryCompany._id);
        }
      } else {
        setDeliveryOrderInfo(null);
        setIsResend(false);
      }
    } catch (error) {
      console.error('Error checking delivery status:', error);
      // Don't show error toast as this is not critical
      setDeliveryOrderInfo(null);
      setIsResend(false);
    } finally {
      // no-op
    }
  };

  const calculateDeliveryFee = async () => {
    if (!selectedCompany || !order) return;

    try {
  const response = await api.postWithRetry(`/delivery/companies/${selectedCompany}/calculate-fee`, {
        totalAmount: order.totalAmount,
        shippingAddress: order.shippingAddress
      });
  const fee = (response.data?.data?.fee ?? response.data?.fee);
  setDeliveryFee(typeof fee === 'number' ? fee : 0);
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      setDeliveryFee(0);
    }
  };

  const validateFieldMappings = async () => {
    if (!selectedCompany || !order) {
      setMappingValidation(null);
      return;
    }

    try {
      setValidatingMappings(true);
      console.log('🔍 Validating field mappings for company:', selectedCompany);
      console.log('📋 Order data for validation:', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        customerInfo: order.customerInfo,
        shippingAddress: order.shippingAddress
      });

      const response = await api.postWithRetry('/delivery/validate-field-mappings', {
        orderId: order._id,
        companyId: selectedCompany
      });

      if (response.data?.success) {
        setMappingValidation(response.data.data);
        console.log('✅ Field mapping validation completed:', response.data.data);

        // Log detailed validation results for debugging
        if (!response.data.data.isValid) {
          console.log('❌ Validation failed with errors:', response.data.data.errors);
          console.log('📋 Missing fields:', response.data.data.missingFields);
          console.log('📋 Invalid fields:', response.data.data.invalidFields);
        }
      }
    } catch (error) {
      console.error('❌ Failed to validate field mappings:', error);
      setMappingValidation({
        isValid: false,
        errors: ['Failed to validate field mappings'],
        missingFields: [],
        invalidFields: []
      });
    } finally {
      setValidatingMappings(false);
    }
  };

  const handleSendToDelivery = async () => {
    if (!selectedCompany || !order) {
      toast.error('Please select a delivery company');
      return;
    }

    // Check field mapping validation before sending
    if (mappingValidation && !mappingValidation.isValid) {
      console.log('❌ Cannot send - field mapping validation failed:', mappingValidation);
      toast.error('Cannot send order: Field mapping validation failed. Please check the field mapping configuration.');
      return;
    }

    try {
      setSending(true);

      console.log(isResend ? '🔄 Starting delivery re-send process...' : '🚚 Starting delivery assignment process...');
      console.log('📋 Field mapping validation status:', mappingValidation);

      // Get the full company data
      const selectedCompanyData = Array.isArray(companies) ? companies.find(c => c._id === selectedCompany) : null;
      if (!selectedCompanyData) {
        toast.error('Selected delivery company not found');
        return;
      }

      console.log('🏢 Selected company:', selectedCompanyData.name);
      console.log('📋 Order data:', {
        _id: order._id,
        orderNumber: order.orderNumber,
        isResend: isResend,
        currentResendAttempts: deliveryOrderInfo?.resendAttempts || 0,
        hasItems: Array.isArray(order.items),
        itemsCount: order.items?.length || 0,
        hasCustomerInfo: !!order.customerInfo,
        hasShippingAddress: !!order.shippingAddress,
        totalAmount: order.totalAmount,
        currency: order.currency,
        paymentMethod: order.paymentMethod
      });

      // Use the new enhanced delivery endpoint that supports re-sending
      const payload = {
        orderId: order._id,
        companyId: selectedCompany,
        deliveryFee: deliveryFee
      };

      console.log(`📦 Sending to /api/delivery/send endpoint (${isResend ? 're-send' : 'first time'})...`);
      const response = await api.postWithRetry('/delivery/send', payload);
      
      console.log('✅ Delivery assignment completed successfully:', response.data);

      // Show detailed success message with delivery information
      const deliveryData = response.data.data;
      const successMessage = deliveryData?.message || response.data.message ||
        (isResend ? 'Order successfully re-sent to delivery company' : 'Order successfully sent to delivery company');

      // Show additional information in console for debugging
      if (deliveryData) {
        console.log('📋 Delivery Details:', {
          trackingNumber: deliveryData.trackingNumber,
          status: deliveryData.status,
          externalStatus: deliveryData.externalStatus,
          isResend: deliveryData.isResend,
          resendAttempts: deliveryData.resendAttempts,
          companyResponse: deliveryData.deliveryCompanyResponse
        });
      }

      toast.success(successMessage);

      // Refresh delivery status after successful send
      await checkDeliveryStatus();

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ Delivery assignment failed:', error);

      // Handle field mapping validation errors specifically
      if (error.response?.data?.errors || error.response?.data?.missingFields) {
        const errorData = error.response.data;
        let errorMessage = 'Field mapping validation failed:\n';

        if (errorData.missingFields && errorData.missingFields.length > 0) {
          errorMessage += '\nMissing required fields:\n';
          errorData.missingFields.forEach((field: any) => {
            errorMessage += `• ${field.sourceField} → ${field.targetField}\n`;
          });
        }

        if (errorData.invalidFields && errorData.invalidFields.length > 0) {
          errorMessage += '\nInvalid field values:\n';
          errorData.invalidFields.forEach((field: any) => {
            errorMessage += `• ${field.sourceField}: ${field.description}\n`;
          });
        }

        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to send order to delivery company';
        toast.error(errorMessage);
      }
    } finally {
      setSending(false);
    }
  };

  const selectedCompanyData = Array.isArray(companies) ? companies.find(c => c._id === selectedCompany) : null;

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {isResend ? 'Re-send to Delivery Company' : 'Select Delivery Company'}
              </h2>
              {isResend && (
                <RefreshCw className="w-5 h-5 text-orange-500" />
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">Order #{order.orderNumber}</p>
            {isResend && deliveryOrderInfo && (
              <div className="mt-2 text-sm">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  Re-send (Attempt #{(deliveryOrderInfo.resendAttempts || 0) + 1})
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Delivery Status */}
          {deliveryOrderInfo && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Current Delivery Status</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Company:</span>
                  <p className="text-gray-900">{deliveryOrderInfo.deliveryCompany?.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Tracking Number:</span>
                  <p className="text-gray-900 font-mono">{deliveryOrderInfo.trackingNumber}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <p className="text-gray-900 capitalize">{deliveryOrderInfo.status}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Resend Attempts:</span>
                  <p className="text-gray-900">{deliveryOrderInfo.resendAttempts || 0}</p>
                </div>
              </div>
              {deliveryOrderInfo.lastResendAt && (
                <div className="mt-3 text-sm">
                  <span className="font-medium text-gray-700">Last Resend:</span>
                  <p className="text-gray-900">{new Date(deliveryOrderInfo.lastResendAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}

          {/* Delivery Company Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Delivery Company
            </label>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading companies...</p>
              </div>
            ) : !Array.isArray(companies) || companies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No delivery companies available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {companies.map((company) => (
                  <div
                    key={company._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedCompany === company._id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCompany(company._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedCompany === company._id
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedCompany === company._id && (
                            <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{company.name}</h3>
                          {company.code && company.code.trim() !== '' ? (
                            <p className="text-sm text-gray-500">Code: {company.code}</p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">No code assigned</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${((company.settings?.basePrice ?? 0)).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {(company.settings?.priceCalculation ?? 'fixed')} rate
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Company Details */}
          {selectedCompanyData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Company Details</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Regions:</p>
                    <p className="font-medium">
                      {selectedCompanyData.settings.supportedRegions.length > 0
                        ? selectedCompanyData.settings.supportedRegions.join(', ')
                        : 'All regions'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Base Price:</p>
                    <p className="font-medium">${((selectedCompanyData.settings?.basePrice ?? 0)).toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Pricing:</p>
                    <p className="font-medium capitalize">{selectedCompanyData.settings?.priceCalculation ?? 'fixed'}</p>
                  </div>
                </div>
              </div>
              
              {deliveryFee > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Calculated delivery fee:</span>
                    <span className="font-medium text-lg text-green-600">
                      ${deliveryFee.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Field Mapping Validation */}
              {selectedCompany && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Field Mapping Status</h5>
                  {validatingMappings ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Validating field mappings...</span>
                    </div>
                  ) : mappingValidation ? (
                    <div className="space-y-2">
                      {mappingValidation.isValid ? (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>All required fields are properly mapped</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>Field mapping issues detected</span>
                          </div>
                          {mappingValidation.missingFields && mappingValidation.missingFields.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <p className="text-sm font-medium text-red-800 mb-1">Missing Required Fields:</p>
                              <ul className="text-sm text-red-700 space-y-2">
                                {mappingValidation.missingFields.map((field: any, index: number) => (
                                  <li key={index} className="flex flex-col gap-1">
                                    <div className="flex items-start gap-1">
                                      <span className="text-red-500">•</span>
                                      <span className="font-medium">{field.sourceField} → {field.targetField}</span>
                                    </div>
                                    {field.hasDefaultValue && (
                                      <div className="ml-3 text-xs text-green-600">
                                        ✓ Default value available: "{field.defaultValue}"
                                      </div>
                                    )}
                                    {field.sourceValue !== undefined && field.sourceValue !== null && field.sourceValue !== '' && (
                                      <div className="ml-3 text-xs text-blue-600">
                                        Source value: "{field.sourceValue}"
                                      </div>
                                    )}
                                    <div className="ml-3 text-xs text-gray-600">{field.description}</div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {mappingValidation.invalidFields && mappingValidation.invalidFields.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <p className="text-sm font-medium text-yellow-800 mb-1">Invalid Field Values:</p>
                              <ul className="text-sm text-yellow-700 space-y-1">
                                {mappingValidation.invalidFields.map((field: any, index: number) => (
                                  <li key={index} className="flex items-start gap-1">
                                    <span className="text-yellow-500">•</span>
                                    <span>{field.sourceField}: {field.description}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Select a company to validate field mappings
                    </div>
                  )}
                </div>
              )}

              {/* Field Mapping Preview */}
              {selectedCompanyData.fieldMappings && selectedCompanyData.fieldMappings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Field Mappings</span>
                    <div className="flex items-center gap-2">
                      {/* Validation Status Indicator */}
                      <div className="flex items-center gap-1">
                        {(() => {
                          const enabledMappings = selectedCompanyData.fieldMappings.filter(m => m.enabled);
                          const hasValidConfig = selectedCompanyData.apiUrl && 
                            (selectedCompanyData.credentials?.apiKey || selectedCompanyData.credentials?.login);
                          
                          if (hasValidConfig && enabledMappings.length > 0) {
                            return (
                              <>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-green-600">Configured</span>
                              </>
                            );
                          } else if (enabledMappings.length > 0) {
                            return (
                              <>
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span className="text-xs text-yellow-600">Partial</span>
                              </>
                            );
                          } else {
                            return (
                              <>
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <span className="text-xs text-gray-500">No mappings</span>
                              </>
                            );
                          }
                        })()}
                      </div>
                      <button
                        onClick={() => setShowMappingPreview(!showMappingPreview)}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        {showMappingPreview ? 'Hide Preview' : 'Show Preview'}
                      </button>
                    </div>
                  </div>
                  
                  {showMappingPreview && (
                    <div className="bg-gray-100 rounded p-3 text-xs">
                      <p className="font-medium mb-2 text-gray-700">
                        Company Configuration Status:
                      </p>
                      <div className="grid grid-cols-2 gap-2 mb-3 text-gray-600">
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${
                            selectedCompanyData.apiUrl ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          <span>API URL: {selectedCompanyData.apiUrl ? 'Set' : 'Missing'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${
                            selectedCompanyData.credentials?.apiKey || selectedCompanyData.credentials?.login 
                              ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></span>
                          <span>Auth: {
                            selectedCompanyData.credentials?.apiKey ? 'API Key' :
                            selectedCompanyData.credentials?.login ? 'Basic' : 'None'
                          }</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${
                            selectedCompanyData.credentials?.database ? 'bg-green-500' : 'bg-gray-400'
                          }`}></span>
                          <span>Database: {selectedCompanyData.credentials?.database || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${
                            selectedCompanyData.settings?.supportedRegions?.length > 0 ? 'bg-green-500' : 'bg-yellow-500'
                          }`}></span>
                          <span>Regions: {selectedCompanyData.settings?.supportedRegions?.length || 0}</span>
                        </div>
                      </div>
                      
                      <p className="font-medium mb-2 text-gray-700">Data will be transformed as:</p>
                      {selectedCompanyData.fieldMappings
                        .filter(m => m.enabled)
                        .map((mapping, index) => (
                          <div key={index} className="mb-1 text-gray-600 flex items-center gap-2">
                            <span className="font-mono">{mapping.sourceField}</span>
                            {' → '}
                            <span className="font-mono">{mapping.targetField}</span>
                            {mapping.required && (
                              <span className="text-red-500 text-xs">*required</span>
                            )}
                            {mapping.transform && (
                              <span className="text-blue-600 ml-2">({mapping.transform})</span>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          {/* Warning message when send is disabled due to field mapping issues */}
          {selectedCompany && mappingValidation && !mappingValidation.isValid && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-red-800">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Cannot send order: Field mapping issues must be resolved first</span>
              </div>
              <p className="text-xs text-red-600 mt-1">
                Please configure the field mappings for this delivery company in the Field Mapping tab.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendToDelivery}
              disabled={!selectedCompany || sending || validatingMappings || (mappingValidation && !mappingValidation.isValid)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              title={
                mappingValidation && !mappingValidation.isValid
                  ? 'Cannot send: Field mapping validation failed'
                  : validatingMappings
                    ? 'Validating field mappings...'
                    : ''
              }
            >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isResend ? 'Re-sending...' : 'Sending...'}
              </>
            ) : validatingMappings ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Validating...
              </>
            ) : mappingValidation && !mappingValidation.isValid ? (
              <>
                <AlertCircle className="w-4 h-4" />
                Cannot Send
              </>
            ) : (
              <>
                {isResend ? <RefreshCw className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {isResend ? 'Re-send to Delivery' : 'Send to Delivery'}
              </>
            )}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
