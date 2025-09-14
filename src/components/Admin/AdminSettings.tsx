import React, { useState, useEffect } from 'react';
import { Save, DollarSign, CreditCard, KeyRound } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { GoogleAuthSettings } from './Settings/GoogleAuthSettings';
import { FacebookAuthSettings } from './Settings/FacebookAuthSettings';
import { useCurrency } from '../../context/CurrencyContext';
import { LogoSettings } from './LogoSettings';

interface StoreSettings {
  name: string;
  email: string;
  currency: string;
  timezone: string;
  logo?: string;
  pixelId?: string; // Added Facebook Pixel ID
}

export function AdminSettings() {
  const { currency: currentCurrency, setCurrency } = useCurrency();
  const [settings, setSettings] = useState<StoreSettings>({
    name: 'Eva Curves Fashion Store',
    email: 'contact@evacurves.com',
    currency: currentCurrency,
    timezone: 'UTC-5',
    pixelId: '',
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'logo' | 'analytics' | 'payments' | 'auth'>('general');
  const [paypalForm, setPaypalForm] = useState({ enabled: false, clientId: '', secretInput:'', secretPreview:'', mode: 'live' as 'live', features: { buttons: true, card: false } });
  const [paypalStatus, setPaypalStatus] = useState<any>(null);

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
  ];

  const timezones = [
    { value: 'UTC-5', label: 'UTC-5 (Eastern Time)' },
    { value: 'UTC+0', label: 'UTC+0 (GMT)' },
    { value: 'UTC+2', label: 'UTC+2 (Israel Standard Time)' },
    { value: 'UTC+1', label: 'UTC+1 (Central European Time)' },
  ];

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
  const response = await api.getWithRetry('/settings');
        setSettings(response.data);
  if (response.data?.paypalConfig) {
          setPaypalForm({
            enabled: response.data.paypalConfig.enabled || false,
            clientId: response.data.paypalConfig.clientId || '',
      secretInput: '',
      secretPreview: response.data.paypalConfig.secretPreview || '',
      mode: 'live',
            features: {
              buttons: response.data.paypalConfig.features?.buttons !== false,
              card: !!response.data.paypalConfig.features?.card
            }
          });
        }
        try {
          const st = await api.getWithRetry('/paypal/status');
          setPaypalStatus(st);
        } catch {}
      } catch (error) {
        toast.error('Failed to load settings');
      }
    };

    loadSettings();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
  await api.putWithRetry('/settings', settings);
      if (settings.currency !== currentCurrency) {
  await setCurrency(settings.currency as any);
      }
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  // Tab Navigation Button
  const renderTabButton = (tab: 'general' | 'logo' | 'analytics' | 'payments' | 'auth', label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`py-4 px-1 border-b-2 font-medium text-sm ${
        activeTab === tab
          ? 'border-indigo-600 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );

  // Reusable Text Input Component
  const TextInput = ({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    placeholder?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {renderTabButton('general', 'General Settings')}
          {renderTabButton('logo', 'Logo')}
          {renderTabButton('analytics', 'Analytics')}
          {renderTabButton('payments', 'Payments')}
          {renderTabButton('auth', 'Auth')}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'general' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Store Information */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Store Information</h2>
              <div className="space-y-6">
                <TextInput
                  label="Store Name"
                  value={settings.name}
                  onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
                />
                <TextInput
                  label="Contact Email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Currency and Localization */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-medium text-gray-900">Currency & Localization</h2>
              </div>
              <div className="space-y-6">
                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={settings.currency}
                    onChange={(e) => setSettings((prev) => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} ({currency.symbol}) - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings((prev) => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {timezones.map((timezone) => (
                      <option key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end rounded-b-xl">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Logo Settings */}
      {activeTab === 'logo' && <LogoSettings />}

      {/* Analytics Settings */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Facebook Pixel</h2>
          <TextInput
            label="Facebook Pixel ID"
            value={settings.pixelId || ''}
            onChange={(e) => setSettings((prev) => ({ ...prev, pixelId: e.target.value }))}
            placeholder="Enter your Facebook Pixel ID"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Payments Settings */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-medium text-gray-900">PayPal</h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <input
                id="pp-enable"
                type="checkbox"
                checked={paypalForm.enabled}
                onChange={(e) => setPaypalForm(f => ({ ...f, enabled: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="pp-enable" className="text-sm font-medium text-gray-700">Enable PayPal Checkout</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mode selection removed – live only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                <input
                  type="text"
                  value={paypalForm.clientId}
                  onChange={(e) => setPaypalForm(f => ({ ...f, clientId: e.target.value }))}
                  placeholder="AYourSandboxClientIDExample"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
                <p className="mt-1 text-xs text-gray-500">Client ID is public. Secret stays server-side; UI send optional update.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret (write-only)</label>
                <input
                  type="password"
                  value={paypalForm.secretInput}
                  onChange={(e) => setPaypalForm(f => ({ ...f, secretInput: e.target.value }))}
                  placeholder={paypalForm.secretPreview ? '•••••••• (stored)' : 'Enter new secret'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
                <p className="mt-1 text-xs text-gray-500">For development only. Prefer .env on server. Saving replaces existing.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 rounded-lg border bg-gray-50">
                <p className="text-sm font-medium text-gray-700">Features</p>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={paypalForm.features.buttons}
                    onChange={e => setPaypalForm(f => ({ ...f, features: { ...f.features, buttons: e.target.checked } }))}
                  /> Smart Buttons
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={paypalForm.features.card}
                    onChange={e => setPaypalForm(f => ({ ...f, features: { ...f.features, card: e.target.checked } }))}
                  /> Advanced Card Fields
                </label>
                <p className="text-xs text-gray-500">Card fields require eligibility and server integration.</p>
              </div>
        {paypalStatus && (
                <div className="p-4 rounded-lg border bg-white space-y-2 text-xs">
                  <p className="font-semibold text-gray-700">Current Status</p>
                  <p>Enabled: <span className="font-mono">{String(paypalStatus.enabled)}</span></p>
          <p>Mode: <span className="font-mono">live</span></p>
                  <p>Client Set: <span className="font-mono">{String(paypalStatus.hasClient)}</span></p>
                  <p>Buttons: <span className="font-mono">{String(paypalStatus.features?.buttons)}</span></p>
                  <p>Card: <span className="font-mono">{String(paypalStatus.features?.card)}</span></p>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const payload:any = {
                      enabled: paypalForm.enabled,
                      clientId: paypalForm.clientId,
                      mode: 'live',
                      features: paypalForm.features
                    };
                    if (paypalForm.secretInput) payload.secret = paypalForm.secretInput;
                    const resp = await api.putWithRetry('/settings/payments/paypal', payload);
                    setPaypalForm(f => ({
                      ...f,
                      enabled: resp.enabled,
                      clientId: resp.clientId,
                      mode: 'live',
                      features: resp.features || f.features,
                      secretInput: '',
                      secretPreview: resp.secretPreview || f.secretPreview
                    }));
                    try { const st = await api.getWithRetry('/paypal/status'); setPaypalStatus(st); } catch {}
                    toast.success('PayPal settings saved');
                  } catch (e) {
                    toast.error('Failed to save PayPal settings');
                  } finally { setLoading(false); }
                }}
                disabled={loading || (paypalForm.enabled && !paypalForm.clientId)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save PayPal'}
              </button>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-xs text-indigo-700 space-y-1">
              <p className="font-semibold">Setup Tips</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Create REST app in PayPal Developer Dashboard.</li>
                <li>Add PAYPAL_CLIENT_ID & PAYPAL_SECRET to server .env (secret only server).</li>
                <li>Use sandbox for testing; switch to live after verification.</li>
                <li>Client ID here may be exposed to browser; that's normal.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'auth' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-medium text-gray-900">Authentication Providers</h2>
          </div>
          <div className="space-y-8">
            <GoogleAuthSettings />
            <FacebookAuthSettings />
          </div>
        </div>
      )}
    </div>
  );
}

// Note: paymentReference now stored in Order model (server). Display logic can be implemented in Order detail component.
