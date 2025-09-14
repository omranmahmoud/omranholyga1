import React from 'react';
import { Truck, Edit, Trash2 } from 'lucide-react';

interface DeliveryCompany {
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
  apiConfiguration?: {
    baseUrl?: string;
    isTestMode?: boolean;
    username?: string;
    password?: string;
    apiKey?: string;
    customFields?: Record<string, any>;
  };
}

interface DeliveryCompanyListProps {
  companies: DeliveryCompany[];
  onEdit: (company: DeliveryCompany) => void;
  onDelete: (id: string) => void;
}

export function DeliveryCompanyList({ companies, onEdit, onDelete }: DeliveryCompanyListProps) {
  // Ensure companies is always an array
  const validCompanies = Array.isArray(companies) ? companies : [];

  return (
    <div className="space-y-4">
      {validCompanies.map((company) => (
        <div
          key={company._id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{company.name}</h3>
                <div className="flex items-center gap-2">
                  {company.code && company.code.trim() !== '' ? (
                    <p className="text-sm text-gray-500">Code: {company.code}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No code assigned</p>
                  )}
                  <span className="text-gray-300">•</span>
                  {company.apiConfiguration?.isTestMode === false ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Real API
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Test Mode
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(company)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(company._id)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Supported Regions:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {company.settings.supportedRegions.map((region) => (
                  <span
                    key={region}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs"
                  >
                    {region}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Price Calculation:</span>
              <p className="mt-1 text-gray-900 capitalize">{company.settings.priceCalculation}</p>
            </div>
            <div>
              <span className="text-gray-500">Base Price:</span>
              <p className="mt-1 text-gray-900">${company.settings.basePrice.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-4 border-t">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              company.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {company.isActive ? 'Active' : 'Inactive'}
            </span>
            <a
              href={company.apiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              View API Documentation
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}