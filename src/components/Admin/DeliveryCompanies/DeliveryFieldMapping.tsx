import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Info, 
  Plus, 
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../services/api';

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
  transform?: string;
  defaultValue?: string;
  defaultValuePriority?: boolean;
  enabled: boolean;
}

interface DeliveryCompanyFieldConfig {
  _id: string;
  name: string;
  code: string;
  fieldMappings: FieldMapping[];
  customFields: { [key: string]: any };
  lastUpdated?: string;
}

interface AvailableField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  description: string;
  required?: boolean;
}

const AVAILABLE_ORDER_FIELDS: AvailableField[] = [
  { key: 'orderNumber', label: 'Order Number', type: 'string', description: 'Unique order identifier' },
  { key: 'customerInfo.firstName', label: 'Customer First Name', type: 'string', description: 'Customer first name' },
  { key: 'customerInfo.lastName', label: 'Customer Last Name', type: 'string', description: 'Customer last name' },
  { key: 'customerInfo.email', label: 'Customer Email', type: 'string', description: 'Customer email address' },
  { key: 'customerInfo.mobile', label: 'Customer Mobile', type: 'string', description: 'Customer phone number', required: true },
  { key: 'shippingAddress.street', label: 'Street Address', type: 'string', description: 'Delivery street address', required: true },
  { key: 'shippingAddress.city', label: 'City', type: 'string', description: 'Delivery city' },
  { key: 'shippingAddress.state', label: 'State/Province', type: 'string', description: 'Delivery state or province' },
  { key: 'shippingAddress.zipCode', label: 'ZIP/Postal Code', type: 'string', description: 'Delivery postal code' },
  { key: 'shippingAddress.country', label: 'Country', type: 'string', description: 'Delivery country' },
  { key: 'shippingAddress.latitude', label: 'Latitude', type: 'string', description: 'GPS latitude coordinate' },
  { key: 'shippingAddress.longitude', label: 'Longitude', type: 'string', description: 'GPS longitude coordinate' },
  { key: 'totalAmount', label: 'Total Amount', type: 'number', description: 'Order total value' },
  { key: 'paymentMethod', label: 'Payment Method', type: 'string', description: 'Payment method used' },
  { key: 'items', label: 'Order Items', type: 'object', description: 'Array of order items' },
  { key: 'items.length', label: 'Item Count', type: 'number', description: 'Number of items in order' },
  { key: 'weight', label: 'Package Weight', type: 'number', description: 'Total package weight' },
  { key: 'notes', label: 'Special Instructions', type: 'string', description: 'Delivery notes or instructions' }
];

const TRANSFORM_OPTIONS = [
  { value: '', label: 'No Transform' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'trim', label: 'Trim Whitespace' },
  { value: 'phone_digits', label: 'Phone Digits Only' },
  { value: 'phone_last10', label: 'Phone: Keep Last 10 Digits' },
  { value: 'full_name', label: 'Combine First + Last Name' },
  { value: 'format_address', label: 'Format Full Address' }
];

export function DeliveryFieldMapping() {
  const [companies, setCompanies] = useState<DeliveryCompanyFieldConfig[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [customFields, setCustomFields] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await api.getWithRetry('/delivery/companies');
      const companiesData = response.data.map((company: any) => ({
        _id: company._id,
        name: company.name,
        code: company.code,
        fieldMappings: company.fieldMappings || getDefaultMappings(),
        customFields: company.customFields || {},
        lastUpdated: company.fieldMappingsUpdated
      }));
      setCompanies(companiesData);
      
      if (companiesData.length > 0 && !selectedCompany) {
        setSelectedCompany(companiesData[0]._id);
        loadCompanyMappings(companiesData[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch delivery companies');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultMappings = (): FieldMapping[] => [
    { sourceField: 'orderNumber', targetField: 'reference', required: false, enabled: true },
    { sourceField: 'customerInfo.firstName', targetField: 'customer_name', required: false, enabled: true, transform: 'full_name' },
    { sourceField: 'customerInfo.mobile', targetField: 'customer_phone', required: true, enabled: true, transform: 'phone_digits' },
    { sourceField: 'customerInfo.email', targetField: 'customer_email', required: false, enabled: true },
    { sourceField: 'shippingAddress.street', targetField: 'delivery_address', required: true, enabled: true },
    { sourceField: 'shippingAddress.city', targetField: 'delivery_city', required: false, enabled: true },
    { sourceField: 'shippingAddress.state', targetField: 'delivery_state', required: false, enabled: true },
    { sourceField: 'shippingAddress.zipCode', targetField: 'delivery_zip', required: false, enabled: true },
    { sourceField: 'totalAmount', targetField: 'cod_amount', required: false, enabled: true },
    { sourceField: 'paymentMethod', targetField: 'payment_method', required: false, enabled: true }
  ];

  const loadCompanyMappings = (company: DeliveryCompanyFieldConfig) => {
    setFieldMappings(company.fieldMappings);
    setCustomFields(company.customFields);
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId);
    const company = companies.find(c => c._id === companyId);
    if (company) {
      loadCompanyMappings(company);
    }
  };

  const addFieldMapping = () => {
    const newMapping: FieldMapping = {
      sourceField: '',
      targetField: '',
      required: false,
  defaultValuePriority: false,
      enabled: true
    };
    setFieldMappings([...fieldMappings, newMapping]);
  };

  const updateFieldMapping = (index: number, field: keyof FieldMapping, value: any) => {
    const updated = fieldMappings.map((mapping, i) => 
      i === index ? { ...mapping, [field]: value } : mapping
    );
    setFieldMappings(updated);
  };

  const removeFieldMapping = (index: number) => {
    setFieldMappings(fieldMappings.filter((_, i) => i !== index));
  };

  const addCustomField = () => {
    const fieldName = prompt('Enter custom field name:');
    if (fieldName && !customFields[fieldName]) {
      setCustomFields({
        ...customFields,
        [fieldName]: ''
      });
    }
  };

  const updateCustomField = (fieldName: string, value: any) => {
    setCustomFields({
      ...customFields,
      [fieldName]: value
    });
  };

  const removeCustomField = (fieldName: string) => {
    const updated = { ...customFields };
    delete updated[fieldName];
    setCustomFields(updated);
  };

  const resetToDefaults = () => {
    if (window.confirm('Reset to default field mappings? This will override all current settings.')) {
      setFieldMappings(getDefaultMappings());
      setCustomFields({});
      toast.success('Reset to default mappings');
    }
  };

  const generatePreview = async () => {
    try {
      console.log('Generating preview for company:', selectedCompany);
      const response = await api.postWithRetry('/delivery/preview-mapping', {
        companyId: selectedCompany,
        fieldMappings,
        customFields
      });
      setPreviewData(response.data);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    }
  };

  const saveFieldMappings = async () => {
    if (!selectedCompany) {
      toast.error('Please select a delivery company');
      return;
    }

    try {
      setSaving(true);
      console.log('Saving field mappings for company:', selectedCompany);
      console.log('Field mappings:', fieldMappings);
      console.log('Custom fields:', customFields);
      
      const url = `/delivery/companies/${selectedCompany}/field-mappings`;
      console.log('API URL:', url);
      
      await api.putWithRetry(url, {
        fieldMappings,
        customFields
      });
      
      // Update local state
      setCompanies(companies.map(company => 
        company._id === selectedCompany 
          ? { ...company, fieldMappings, customFields, lastUpdated: new Date().toISOString() }
          : company
      ));
      
      toast.success('Field mappings saved successfully');
    } catch (error: any) {
      console.error('Error saving field mappings:', error);
      toast.error(error.response?.data?.message || 'Failed to save field mappings');
    } finally {
      setSaving(false);
    }
  };

  const getSourceFieldInfo = (sourceField: string) => {
    return AVAILABLE_ORDER_FIELDS.find(field => field.key === sourceField);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Field Mapping</h1>
          <p className="text-gray-600 mt-1">Control which fields are sent to delivery companies</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={generatePreview}
            disabled={!selectedCompany}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={resetToDefaults}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={saveFieldMappings}
            disabled={saving || !selectedCompany}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Company Selection */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Delivery Company
          </label>
          <select
            value={selectedCompany}
            onChange={(e) => handleCompanyChange(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Choose a company...</option>
            {companies.map(company => (
              <option key={company._id} value={company._id}>
                {company.name} ({company.code})
              </option>
            ))}
          </select>
        </div>

        {selectedCompany && (
          <div className="text-sm text-gray-600">
            Configure how order data is mapped to the delivery company's API format.
            {companies.find(c => c._id === selectedCompany)?.lastUpdated && (
              <span className="ml-2">
                Last updated: {new Date(companies.find(c => c._id === selectedCompany)!.lastUpdated!).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {selectedCompany && (
        <>
          {/* Field Mappings */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Field Mappings</h2>
                </div>
                <button
                  onClick={addFieldMapping}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Mapping
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {fieldMappings.map((mapping, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={mapping.enabled}
                        onChange={(e) => updateFieldMapping(index, 'enabled', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                      {/* Source Field */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Source Field
                        </label>
                        <select
                          value={mapping.sourceField}
                          onChange={(e) => updateFieldMapping(index, 'sourceField', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          disabled={!mapping.enabled}
                        >
                          <option value="">Select field...</option>
                          {AVAILABLE_ORDER_FIELDS.map(field => (
                            <option key={field.key} value={field.key}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Target Field */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Target Field
                        </label>
                        <input
                          type="text"
                          value={mapping.targetField}
                          onChange={(e) => updateFieldMapping(index, 'targetField', e.target.value)}
                          placeholder="API field name"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          disabled={!mapping.enabled}
                        />
                      </div>

                      {/* Transform */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Transform
                        </label>
                        <select
                          value={mapping.transform || ''}
                          onChange={(e) => updateFieldMapping(index, 'transform', e.target.value || undefined)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          disabled={!mapping.enabled}
                        >
                          {TRANSFORM_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Default Value */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Default Value
                        </label>
                        <input
                          type="text"
                          value={mapping.defaultValue || ''}
                          onChange={(e) => updateFieldMapping(index, 'defaultValue', e.target.value || undefined)}
                          placeholder="Default value"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          disabled={!mapping.enabled}
                        />
                        <label className="mt-2 inline-flex items-center text-xs text-gray-600">
                          <input
                            type="checkbox"
                            className="mr-2"
                            checked={!!mapping.defaultValuePriority}
                            onChange={(e) => updateFieldMapping(index, 'defaultValuePriority', e.target.checked)}
                            disabled={!mapping.enabled}
                          />
                          Always use default (ignore source)
                        </label>
                      </div>

                      {/* Required */}
                      <div className="flex items-center">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Required
                          </label>
                          <input
                            type="checkbox"
                            checked={mapping.required}
                            onChange={(e) => updateFieldMapping(index, 'required', e.target.checked)}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            disabled={!mapping.enabled}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-end">
                        <button
                          onClick={() => removeFieldMapping(index)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Remove mapping"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Field Info */}
                    {mapping.sourceField && (
                      <div className="text-xs text-gray-500 max-w-xs">
                        {getSourceFieldInfo(mapping.sourceField)?.description}
                        {getSourceFieldInfo(mapping.sourceField)?.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {fieldMappings.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No field mappings configured. Click "Add Mapping" to start.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Custom Fields</h2>
                </div>
                <button
                  onClick={addCustomField}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Custom Field
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {Object.entries(customFields).map(([fieldName, value]) => (
                  <div key={fieldName} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {fieldName}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateCustomField(fieldName, e.target.value)}
                        placeholder={`Value for ${fieldName}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={() => removeCustomField(fieldName)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      title="Remove custom field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {Object.keys(customFields).length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    No custom fields configured. Add static fields that will be included in all deliveries.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Information Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <h4 className="font-medium mb-2">Field Mapping Guidelines</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Source fields come from your order data structure</li>
                  <li>Target fields should match the delivery company's API requirements</li>
                  <li>Required fields must have values or the delivery will fail</li>
                  <li>Transforms modify the data before sending (e.g., format phone numbers)</li>
                  <li>Default values are used when source fields are empty</li>
                  <li>Custom fields add static values to all deliveries</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Mapping Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                >
                  <EyeOff className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto">
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                {JSON.stringify(previewData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
