import React from 'react';
import { Save, AlertCircle } from 'lucide-react';

interface FacebookPixelFormProps {
  config: {
    pixelId: string;
    enabled: boolean;
  };
  onSubmit: (config: { pixelId: string; enabled: boolean }) => Promise<void>;
  loading: boolean;
}

export function FacebookPixelForm({ config, onSubmit, loading }: FacebookPixelFormProps) {
  const [formData, setFormData] = React.useState(config);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="pixelEnabled"
            checked={formData.enabled}
            onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="pixelEnabled" className="ml-2 text-sm text-gray-900">
            Enable Facebook Pixel
          </label>
        </div>
      </div>

      {/* Pixel ID Input */}
      {formData.enabled && (
        <>
          <div>
            <label htmlFor="pixelId" className="block text-sm font-medium text-gray-700">
              Pixel ID
            </label>
            <div className="mt-1">
              <input
                type="text"
                id="pixelId"
                value={formData.pixelId}
                onChange={(e) => setFormData(prev => ({ ...prev, pixelId: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your Facebook Pixel ID"
                required
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              You can find your Pixel ID in your Facebook Events Manager
            </p>
          </div>

          {/* Important Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">Important Note</h4>
                <p className="mt-1 text-sm text-blue-700">
                  Make sure to comply with data protection regulations (like GDPR) when using Facebook Pixel. 
                  Consider implementing a cookie consent mechanism.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
