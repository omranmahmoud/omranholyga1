import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface DeliveryCompany {
  _id?: string;
  name: string;
  code: string;
  apiUrl: string;
  credentials: {
    login?: string;
    password?: string;
    apiKey?: string;
    database?: string;
  };
  apiFormat?: 'rest' | 'jsonrpc' | 'soap' | 'graphql';
  isActive: boolean;
  settings: {
    supportedRegions: string[];
    priceCalculation: 'fixed' | 'weight' | 'distance';
    basePrice: number;
  };
  apiConfiguration?: {
    baseUrl?: string;
    isTestMode?: boolean;
    username?: string;
    password?: string;
    apiKey?: string;
    customFields?: Record<string, any>;
  };
}

interface DeliveryCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DeliveryCompany) => Promise<void>;
  company?: DeliveryCompany;
}

export function DeliveryCompanyModal({
  isOpen,
  onClose,
  onSubmit,
  company,
}: DeliveryCompanyModalProps) {
  const [formData, setFormData] = useState<DeliveryCompany>({
    name: '',
    code: '',
    apiUrl: '',
    credentials: {},
    apiFormat: 'rest',
    isActive: true,
    settings: {
      supportedRegions: [],
      priceCalculation: 'fixed',
      basePrice: 0,
    },
    apiConfiguration: {
      isTestMode: false,
    },
  });
  const [newRegion, setNewRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [useRealApi, setUseRealApi] = useState(true);

  useEffect(() => {
    if (company) {
      setFormData(company);
      setUseRealApi(!company.apiConfiguration?.isTestMode);
    } else {
      resetForm();
    }
  }, [company, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      apiUrl: '',
      credentials: {},
      isActive: true,
      settings: {
        supportedRegions: [],
        priceCalculation: 'fixed',
        basePrice: 0,
      },
      apiConfiguration: {
        isTestMode: false,
      },
    });
    setNewRegion('');
    setUseRealApi(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.apiUrl.trim() || !formData.name.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      // Update the form data with the current API mode setting
      const updatedFormData = {
        ...formData,
        apiConfiguration: {
          ...formData.apiConfiguration,
          baseUrl: formData.apiUrl,
          isTestMode: !useRealApi,
          username: formData.credentials.login,
          password: formData.credentials.password,
          apiKey: formData.credentials.apiKey,
          // Save required API params (db) under params for server preflight
          params: formData.credentials.database ? { db: formData.credentials.database } : {},
          // Keep existing customFields behavior for UI helpers
          customFields: formData.credentials.database ? { db: formData.credentials.database } : {},
        },
      };

      await onSubmit(updatedFormData);
      resetForm();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addRegion = () => {
    if (newRegion.trim() && !formData.settings.supportedRegions.includes(newRegion.trim())) {
      setFormData((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          supportedRegions: [...prev.settings.supportedRegions, newRegion.trim()],
        },
      }));
      setNewRegion('');
    }
  };

  const removeRegion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        supportedRegions: prev.settings.supportedRegions.filter((_, i) => i !== index),
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-modal="true" role="dialog">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {company ? 'Edit Delivery Company' : 'Add Delivery Company'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Code</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
              </div>
            </div>

            {/* API Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Format</label>
              <select
                value={formData.apiFormat}
                onChange={(e) => setFormData((prev) => ({
                  ...prev,
                  apiFormat: e.target.value as 'rest' | 'jsonrpc' | 'soap' | 'graphql'
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              >
                <option value="rest">REST API</option>
                <option value="jsonrpc">JSON-RPC</option>
                <option value="soap">SOAP/XML</option>
                <option value="graphql">GraphQL</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Select the API format used by this delivery company
              </p>
            </div>

            {/* API URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API URL</label>
              <input
                type="url"
                required
                value={formData.apiUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, apiUrl: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
                placeholder="https://api.deliverycompany.com/create_order"
              />
            </div>

            {/* API Credentials */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                API Credentials
                <span className="text-xs text-gray-500 ml-2">({formData.apiFormat?.toUpperCase()})</span>
              </h4>

              {formData.apiFormat === 'jsonrpc' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Login/Username *</label>
                    <input
                      type="text"
                      value={formData.credentials.login || ''}
                      onChange={(e) => setFormData((prev) => ({
                        ...prev,
                        credentials: { ...prev.credentials, login: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      disabled={loading}
                      placeholder="Enter login/username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input
                      type="password"
                      value={formData.credentials.password || ''}
                      onChange={(e) => setFormData((prev) => ({
                        ...prev,
                        credentials: { ...prev.credentials, password: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      disabled={loading}
                      placeholder="Enter password"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Database *</label>
                    <input
                      type="text"
                      value={formData.credentials.database || ''}
                      onChange={(e) => setFormData((prev) => ({
                        ...prev,
                        credentials: { ...prev.credentials, database: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      disabled={loading}
                      placeholder="Database name (e.g., hi-demo)"
                    />
                  </div>
                </div>
              )}

              {formData.apiFormat === 'rest' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="text"
                    value={formData.credentials.apiKey || ''}
                    onChange={(e) => setFormData((prev) => ({
                      ...prev,
                      credentials: { ...prev.credentials, apiKey: e.target.value }
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    disabled={loading}
                    placeholder="Enter API key"
                  />
                </div>
              )}

              {(formData.apiFormat === 'soap' || formData.apiFormat === 'graphql') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                      type="text"
                      value={formData.credentials.login || ''}
                      onChange={(e) => setFormData((prev) => ({
                        ...prev,
                        credentials: { ...prev.credentials, login: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      disabled={loading}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password/Token</label>
                    <input
                      type="password"
                      value={formData.credentials.password || ''}
                      onChange={(e) => setFormData((prev) => ({
                        ...prev,
                        credentials: { ...prev.credentials, password: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      disabled={loading}
                      placeholder="Enter password or token"
                    />
                  </div>
                </div>
              )}

              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong>
                  {formData.apiFormat === 'jsonrpc' && ' JSON-RPC APIs typically require login, password, and database credentials.'}
                  {formData.apiFormat === 'rest' && ' REST APIs usually require an API key for authentication.'}
                  {formData.apiFormat === 'soap' && ' SOAP APIs often use username/password authentication.'}
                  {formData.apiFormat === 'graphql' && ' GraphQL APIs may use tokens or username/password authentication.'}
                </p>
              </div>
            </div>

            {/* API Mode Toggle */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">API Mode</h4>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="apiMode"
                    checked={useRealApi}
                    onChange={() => setUseRealApi(true)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    disabled={loading}
                  />
                  <span className="text-sm font-medium text-gray-700">Real API</span>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">Recommended</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="apiMode"
                    checked={!useRealApi}
                    onChange={() => setUseRealApi(false)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    disabled={loading}
                  />
                  <span className="text-sm font-medium text-gray-700">Test Mode (Mock)</span>
                </label>
              </div>
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{useRealApi ? 'Real API Mode:' : 'Test Mode:'}</strong>
                  {useRealApi
                    ? ' Orders will be sent to the actual delivery company API. Make sure your credentials are correct.'
                    : ' Orders will be simulated with mock responses. Use this for testing without affecting real deliveries.'
                  }
                </p>
              </div>
            </div>

            {/* Supported Regions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supported Regions</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  placeholder="Add region..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={addRegion}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  disabled={loading || !newRegion.trim()}
                  aria-label="Add region"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.settings.supportedRegions.map((region, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {region}
                    <button
                      type="button"
                      onClick={() => removeRegion(index)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      aria-label={`Remove ${region}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : company ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
