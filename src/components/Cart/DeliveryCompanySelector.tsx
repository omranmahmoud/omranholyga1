import { useState, useEffect } from 'react';
import { Truck, Clock, DollarSign, MapPin } from 'lucide-react';
import api from '../../services/api';

interface DeliveryCompany {
  _id: string;
  name: string;
  code?: string;
  settings: {
    supportedRegions: string[];
    priceCalculation: string;
    basePrice: number;
    apiFormat: string;
  };
  isActive: boolean;
}

interface DeliveryCompanySelectorProps {
  selectedCompany: string | null;
  onCompanySelect: (companyId: string) => void;
  shippingAddress: {
    country: string;
    city: string;
    state: string;
  };
  totalAmount: number;
}

export function DeliveryCompanySelector({
  selectedCompany,
  onCompanySelect,
  shippingAddress,
  totalAmount
}: DeliveryCompanySelectorProps) {
  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [deliveryFees, setDeliveryFees] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailableCompanies();
  }, [shippingAddress]);

  const fetchAvailableCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, get all active companies
      const response = await api.getWithRetry('/delivery/companies/public/active');
      // Unwrap API response shape: either array or { success, data }
      let availableCompanies: DeliveryCompany[] = Array.isArray(response.data)
        ? response.data
        : (response.data?.data ?? []);

      // Filter by supported regions if shipping address is available
      if (shippingAddress?.country || shippingAddress?.state) {
        const region = shippingAddress.state || shippingAddress.country;
        availableCompanies = availableCompanies.filter((company: DeliveryCompany) => {
          return company.settings.supportedRegions.length === 0 || 
                 company.settings.supportedRegions.some(supportedRegion => 
                   supportedRegion.toLowerCase().includes(region.toLowerCase()) ||
                   region.toLowerCase().includes(supportedRegion.toLowerCase())
                 );
        });
      }

      setCompanies(availableCompanies);

    // Calculate delivery fees for each company
      const fees: Record<string, number> = {};
      for (const company of availableCompanies) {
        try {
      const feeResponse = await api.postWithRetry(`/delivery/companies/${company._id}/calculate-fee`, {
            totalAmount,
            shippingAddress
          });
      // Fee may be returned as { success, data: { fee } }
      const fee = (feeResponse.data?.data?.fee ?? feeResponse.data?.fee);
      fees[company._id] = (typeof fee === 'number' ? fee : undefined) ?? company.settings.basePrice;
        } catch (error) {
          console.warn(`Failed to calculate fee for ${company.name}:`, error);
          fees[company._id] = company.settings.basePrice;
        }
      }
      setDeliveryFees(fees);

      // Auto-select first company if none selected
      if (!selectedCompany && availableCompanies.length > 0) {
        onCompanySelect(availableCompanies[0]._id);
      }
    } catch (error: any) {
      console.error('Error fetching delivery companies:', error);
      setError('Failed to load delivery companies');
    } finally {
      setLoading(false);
    }
  };

  const getPriceCalculationIcon = (calculation: string) => {
    switch (calculation) {
      case 'weight': return <Clock className="w-4 h-4 text-gray-500" />;
      case 'distance': return <MapPin className="w-4 h-4 text-gray-500" />;
      default: return <DollarSign className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriceCalculationText = (calculation: string) => {
    switch (calculation) {
      case 'weight': return 'Weight-based pricing';
      case 'distance': return 'Distance-based pricing';
      case 'fixed': return 'Fixed price';
      default: return 'Standard pricing';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Select Delivery Company</h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Select Delivery Company</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAvailableCompanies}
            className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Select Delivery Company</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-yellow-600" />
            <p className="text-yellow-800">
              No delivery companies available for your region. Please contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Select Delivery Company</h3>
      <div className="space-y-3">
        {companies.map((company) => (
          <div
            key={company._id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedCompany === company._id
                ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onCompanySelect(company._id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedCompany === company._id
                    ? 'border-indigo-600 bg-indigo-600'
                    : 'border-gray-300'
                }`}>
                  {selectedCompany === company._id && (
                    <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">
                      {company.name}
                    </span>
                    {company.code && company.code.trim() !== '' && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {company.code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getPriceCalculationIcon(company.settings.priceCalculation)}
                    <span className="text-sm text-gray-600">
                      {getPriceCalculationText(company.settings.priceCalculation)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  ${deliveryFees[company._id]?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-gray-500">Delivery fee</div>
              </div>
            </div>
            {company.settings.supportedRegions.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Serves: {company.settings.supportedRegions.join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
