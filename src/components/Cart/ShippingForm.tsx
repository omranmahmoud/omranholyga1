import React, { useState, useEffect } from 'react';

interface ShippingFormProps {
  onSubmit: (data: any) => void;
}

const COUNTRIES = [
  { code: 'JO', name: 'Jordan', phoneCode: '+962' },
  { code: 'SA', name: 'Saudi Arabia', phoneCode: '+966' },
  { code: 'AE', name: 'United Arab Emirates', phoneCode: '+971' },
  { code: 'KW', name: 'Kuwait', phoneCode: '+965' },
  { code: 'QA', name: 'Qatar', phoneCode: '+974' },
  { code: 'BH', name: 'Bahrain', phoneCode: '+973' },
  { code: 'OM', name: 'Oman', phoneCode: '+968' },
  { code: 'EG', name: 'Egypt', phoneCode: '+20' },
  { code: 'IQ', name: 'Iraq', phoneCode: '+964' },
  { code: 'LB', name: 'Lebanon', phoneCode: '+961' },
  { code: 'PS', name: 'Palestine', phoneCode: '+970' }
];

export function ShippingForm({ onSubmit }: ShippingFormProps) {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0].code);
  const [primaryPhoneCode, setPrimaryPhoneCode] = useState(COUNTRIES[0].phoneCode);
  const [secondaryPhoneCode, setSecondaryPhoneCode] = useState(COUNTRIES[0].phoneCode);

  useEffect(() => {
    const country = COUNTRIES.find(c => c.code === selectedCountry);
    if (country) {
      setPrimaryPhoneCode(country.phoneCode);
      setSecondaryPhoneCode(country.phoneCode);
    }
  }, [selectedCountry]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    onSubmit(data);
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = e.target.value;
    setSelectedCountry(countryCode);
    
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country) {
      setPrimaryPhoneCode(country.phoneCode);
      setSecondaryPhoneCode(country.phoneCode);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
      <div className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Country Selection */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <select
            id="country"
            name="country"
            value={selectedCountry}
            onChange={handleCountryChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {COUNTRIES.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* Primary Mobile */}
        <div>
          <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
            Primary Mobile Number
          </label>
          <div className="flex gap-2">
            <select
              name="countryCode"
              value={primaryPhoneCode}
              onChange={(e) => setPrimaryPhoneCode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.phoneCode}>
                  {country.phoneCode}
                </option>
              ))}
            </select>
            <input
              type="tel"
              id="mobile"
              name="mobile"
              required
              pattern="[0-9]{9,10}"
              placeholder="7X XXXX XXX"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">Format: 9-10 digit number without spaces or dashes</p>
        </div>

        {/* Secondary Mobile */}
        <div>
          <label htmlFor="secondaryMobile" className="block text-sm font-medium text-gray-700 mb-1">
            Secondary Mobile Number (Optional)
          </label>
          <div className="flex gap-2">
            <select
              name="secondaryCountryCode"
              value={secondaryPhoneCode}
              onChange={(e) => setSecondaryPhoneCode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.phoneCode}>
                  {country.phoneCode}
                </option>
              ))}
            </select>
            <input
              type="tel"
              id="secondaryMobile"
              name="secondaryMobile"
              pattern="[0-9]{9,10}"
              placeholder="7X XXXX XXX"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Shipping Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Building, Street, Area"
          />
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t">
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded-full font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
        >
          Continue to Payment
        </button>
      </div>
    </form>
  );
}