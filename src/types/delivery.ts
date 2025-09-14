// Delivery Company Types
export interface DeliveryCompany {
  _id: string;
  name: string;
  code?: string; // Optional - not all delivery companies use codes
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
    apiFormat?: string;
  };
  fieldMappings?: FieldMapping[];
  customFields?: Record<string, any>;
  statistics?: DeliveryStatistics;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryStatistics {
  totalOrders: number;
  successfulDeliveries: number;
  averageDeliveryTime: number;
  lastUsed?: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
  enabled: boolean;
  transform?: 'full_name' | 'phone_digits' | 'uppercase' | 'lowercase' | 'trim' | 'phone_last10';
  defaultValue?: string;
  defaultValuePriority?: boolean;
}

// Delivery Order Types
export interface DeliveryOrder {
  _id: string;
  orderNumber: string;
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
    zipCode: string;
    country: string;
    latitude?: string;
    longitude?: string;
  };
  totalAmount: number;
  status: string;
  deliveryStatus?: DeliveryStatus;
  deliveryCompany?: {
    _id: string;
    name: string;
    code: string;
  };
  deliveryTrackingNumber?: string;
  deliveryAssignedAt?: string;
  deliveryEstimatedDate?: string;
  deliveryActualDate?: string;
  items: DeliveryOrderItem[];
  createdAt: string;
}

export interface DeliveryOrderItem {
  product: {
    _id: string;
    name: string;
    images?: string[];
  };
  quantity: number;
  price: number;
}

// Delivery Status Types
export type DeliveryStatus = 
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'delivery_failed'
  | 'returned'
  | 'cancelled';

export interface DeliveryStatusResponse {
  status: DeliveryStatus;
  trackingNumber: string;
  estimatedDelivery: string;
  company: string;
  updates?: DeliveryUpdate[];
}

export interface DeliveryUpdate {
  status: DeliveryStatus;
  timestamp: string;
  location?: string;
  note?: string;
}

// API Request/Response Types
export interface CreateDeliveryCompanyRequest {
  name: string;
  code: string;
  apiUrl: string;
  credentials: {
    login?: string;
    password?: string;
    apiKey?: string;
    database?: string;
  };
  isActive?: boolean;
  settings: {
    supportedRegions: string[];
    priceCalculation: 'fixed' | 'weight' | 'distance';
    basePrice: number;
    apiFormat?: string;
  };
}

export interface UpdateDeliveryCompanyRequest extends Partial<CreateDeliveryCompanyRequest> {
  _id?: string;
}

export interface SendOrderToDeliveryRequest {
  order: DeliveryOrder;
  companyId: string;
}

export interface SendOrderToDeliveryResponse {
  message: string;
  trackingId: string;
  status: DeliveryStatus;
}

export interface CalculateDeliveryFeeRequest {
  totalAmount: number;
  shippingAddress: {
    country: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface CalculateDeliveryFeeResponse {
  fee: number;
  currency: string;
  estimatedDays?: {
    min: number;
    max: number;
  };
}

// Field Mapping Types
export interface FieldMappingConfig {
  companyId: string;
  fieldMappings: FieldMapping[];
  customFields: Record<string, any>;
}

export interface FieldMappingPreviewRequest {
  companyId: string;
  fieldMappings: FieldMapping[];
  customFields: Record<string, any>;
}

export interface FieldMappingPreviewResponse {
  previewData: Record<string, any>;
  sampleOrder: string;
}

// Validation Types
export interface DeliveryValidationResult {
  isValid: boolean;
  errors: string[];
}

// Filter and Search Types
export interface DeliveryOrderFilters {
  status?: string;
  deliveryStatus?: DeliveryStatus;
  companyId?: string;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

export interface DeliveryCompanyFilters {
  isActive?: boolean;
  region?: string;
  priceCalculation?: 'fixed' | 'weight' | 'distance';
}

// Analytics Types
export interface DeliveryAnalytics {
  totalOrders: number;
  completedDeliveries: number;
  pendingDeliveries: number;
  averageDeliveryTime: number;
  successRate: number;
  companiesPerformance: CompanyPerformance[];
  dailyStats: DailyDeliveryStats[];
}

export interface CompanyPerformance {
  companyId: string;
  companyName: string;
  totalOrders: number;
  successfulDeliveries: number;
  averageDeliveryTime: number;
  successRate: number;
}

export interface DailyDeliveryStats {
  date: string;
  ordersAssigned: number;
  ordersDelivered: number;
  ordersFailed: number;
}

// Error Types
export interface DeliveryError {
  code: string;
  message: string;
  details?: any;
}

// Configuration Types
export interface DeliveryConfiguration {
  autoAssignment: boolean;
  defaultCompanyId?: string;
  fallbackCompanyId?: string;
  maxRetries: number;
  timeoutMinutes: number;
}


