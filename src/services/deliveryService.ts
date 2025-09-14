import api from './api';
import { toast } from 'react-hot-toast';

export interface DeliveryOrder {
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
  };
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface DeliveryCompany {
  _id: string;
  name: string;
  apiConfiguration: {
    baseUrl: string;
    authMethod: string;
    apiKey?: string;
    headers?: Record<string, string>;
  };
  fieldMappings: Array<{
    sourceField: string;
    targetField: string;
    required: boolean;
    transform?: string;
  }>;
  statusMapping: Array<{
    companyStatus: string;
    internalStatus: string;
  }>;
  isActive: boolean;
}

export interface DeliveryStatusResponse {
  success: boolean;
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  lastUpdate?: string;
  events?: Array<{
    status: string;
    description: string;
    timestamp: string;
    location?: string;
  }>;
}

class DeliveryService {
  // Helper: normalize a phone to digits only
  private toDigits(phone?: string) {
    return (phone || '').replace(/\D+/g, '');
  }

  // Optional heuristic validation for common provider rule: 10-digit mobile
  private validateMobileLength(order: DeliveryOrder) {
    const digits = this.toDigits(order?.customerInfo?.mobile);
    return { digits, isTen: digits.length === 10 };
  }
  // Simple field mapping function that just maps basic fields
  applyFieldMappings(order: DeliveryOrder, company: DeliveryCompany) {
    console.log('📋 Applying simple field mappings for:', company.name);
    
    // Basic mapping - just transform the order data to a simple format
    const transformedData = {
      orderNumber: order.orderNumber,
      customerName: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
      customerEmail: order.customerInfo.email,
      customerPhone: order.customerInfo.mobile,
      address: {
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        zipCode: order.shippingAddress.zipCode,
        country: order.shippingAddress.country
      },
      totalAmount: order.totalAmount,
      createdAt: order.createdAt
    };

    console.log('✅ Basic field mapping complete');
    
    return {
      transformedData,
      validationResults: {
        companyValidation: { isValid: true },
        hasRequiredFields: true,
        appliedMappings: company.fieldMappings?.length || 0
      }
    };
  }

  // Simple send function that calls the backend with correct payload structure
  async sendOrder(order: DeliveryOrder, companyId: string, deliveryFee: number = 0) {
    try {
      console.log('🚚 Sending order to delivery company via backend API');

      // Preflight: validate company config and field mappings on the server (if order is persisted)
      // Note: validate-field-mappings requires orderId to exist in DB.
      if (order?._id && companyId) {
        try {
          const [cfg, mapping] = await Promise.all([
            api.getWithRetry(`/delivery/companies/${companyId}/validate-config`),
            api.postWithRetry('/delivery/validate-field-mappings', { orderId: order._id, companyId })
          ]);

          if (cfg?.data && cfg.data.issues?.length) {
            console.warn('Delivery company config issues:', cfg.data.issues);
          }

          const isValid = !!mapping?.data?.data?.isValid;
          if (!isValid) {
            const missing = mapping?.data?.data?.missingFields || [];
            const msg = 'Missing required mapped fields';
            toast.error(msg);
            const err: any = new Error(msg);
            err.code = 'MAPPING_MISSING';
            err.details = { missingFields: missing, payloadPreview: mapping?.data?.data?.payloadPreview };
            throw err;
          }
        } catch (e: any) {
          // If the validation endpoint itself fails, proceed but log; only rethrow our custom mapping error
          if (e?.code === 'MAPPING_MISSING') throw e;
          console.warn('Preflight validation skipped due to error:', e?.message || e);
        }
      }

      // Soft client-side validation for common provider requirement
      const phoneCheck = this.validateMobileLength(order);
      if (!phoneCheck.isTen) {
        console.warn('Mobile number is not 10 digits after normalization; provider may reject.');
        // Keep it minimal: hint rather than blocking
        toast('Mobile number may be invalid for delivery provider (expects 10 digits).');
      }
      
      // Use the payload structure that matches backend controller expectations
      const payload: any = {
        order: order, // Send full order object as expected by controller
        companyId,
        mappedData: {
          deliveryFee,
          orderData: {
            orderNumber: order.orderNumber,
            customerName: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
            customerEmail: order.customerInfo.email,
            customerPhone: order.customerInfo.mobile,
            address: order.shippingAddress,
            totalAmount: order.totalAmount
          }
        },
        isTestMode: false
      };

      console.log('📦 Sending payload to /api/delivery/order endpoint');
      const response = await api.postWithRetry('/delivery/order', payload);
      
      console.log('✅ Order sent successfully via controller endpoint');
      // Ensure tracking number exists; surface a warning if not
      const tracking = response?.data?.data?.trackingNumber;
      if (!tracking) {
        console.warn('Provider did not return a tracking number.');
        toast.error('Delivery provider did not return a tracking number.');
      }
      return response.data;
    } catch (error) {
      console.error('❌ Error sending order:', error);
      // Surface provider error details, e.g., invalid phone digits
      const message = (error as any)?.response?.data?.message || (error as Error)?.message;
      if (message) {
        // Example specific message pass-through
        if (/10 digits/i.test(message)) {
          toast.error('Please enter a 10-digit mobile number (digits only).');
        }
      }
      throw error;
    }
  }

  async checkStatus(orderId: string, companyId?: string): Promise<DeliveryStatusResponse> {
    try {
      // Server defines status route as /delivery/status/:orderId/:companyId?
      const url = companyId 
        ? `/delivery/status/${orderId}/${companyId}`
        : `/delivery/status/${orderId}`;
      
      const response = await api.getWithRetry(url);
      return response.data;
    } catch (error: any) {
      console.error('Error checking delivery status:', error);
      throw new Error(error.response?.data?.message || 'Failed to check delivery status');
    }
  }

  async updateFieldMappings(companyId: string, data: { fieldMappings: any[]; customFields: any }): Promise<void> {
    try {
      await api.putWithRetry(`/delivery/companies/${companyId}/field-mappings`, data);
    } catch (error: any) {
      console.error('Error updating field mappings:', error);
      throw new Error(error.response?.data?.message || 'Failed to update field mappings');
    }
  }

  // Expose validation endpoints for UI flows
  async validateFieldMappings(orderId: string, companyId: string) {
    const res = await api.postWithRetry('/delivery/validate-field-mappings', { orderId, companyId });
    return res.data;
  }

  async validateCompanyConfig(companyId: string) {
    const res = await api.getWithRetry(`/delivery/companies/${companyId}/validate-config`);
    return res.data;
  }
}

export const deliveryService = new DeliveryService();