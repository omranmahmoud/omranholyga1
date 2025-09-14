import React from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';


export function PayPalSettings() {
  const { settings, updateSettings } = useStore();
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    enabled: settings?.paypalConfig?.enabled || false,
    clientId: settings?.paypalConfig?.clientId || '',
    mode: settings?.paypalConfig?.mode || 'sandbox',
  });
  // Secret is write-only, never pre-filled
  const [secret, setSecret] = React.useState('');

  React.useEffect(() => {
    setForm({
      enabled: settings?.paypalConfig?.enabled || false,
      clientId: settings?.paypalConfig?.clientId || '',
      mode: settings?.paypalConfig?.mode || 'sandbox',
    });
    setSecret(''); // Always clear secret field on settings change
  }, [settings?.paypalConfig]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { paypalConfig: { ...form } };
      if (secret.trim()) payload.paypalConfig.secret = secret.trim();
      await updateSettings(payload);
      setSecret(''); // Clear after save
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">PayPal</h3>
        <p className="text-sm text-gray-500 mt-1">Configure PayPal checkout. Secret stays only on server env vars.</p>
      </div>
      <form onSubmit={submit} className="space-y-6">
        <div className="flex items-center gap-3">
          <input
            id="pp-enabled"
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm(f => ({ ...f, enabled: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="pp-enabled" className="text-sm font-medium text-gray-700">Enable PayPal</label>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
            <select
              value={form.mode}
              onChange={e => setForm(f => ({ ...f, mode: e.target.value as 'sandbox' | 'live' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="sandbox">Sandbox (Testing)</option>
              <option value="live">Live (Production)</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
            <input
              type="text"
              value={form.clientId}
              onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
              placeholder="Acd123ExampleSandboxClientId"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            />
            <p className="mt-1 text-xs text-gray-500">Client ID is public. Do not paste the secret here.</p>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Secret (write-only)</label>
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              placeholder="Enter new secret to update"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-gray-500">Secret is never shown. Enter only to update. Leave blank to keep current.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setForm({
              enabled: settings?.paypalConfig?.enabled || false,
              clientId: settings?.paypalConfig?.clientId || '',
              mode: settings?.paypalConfig?.mode || 'sandbox'
            })}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
          <button
            type="submit"
            disabled={loading || (form.enabled && !form.clientId)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save PayPal'}
          </button>
        </div>
      </form>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-xs text-indigo-700 space-y-2">
        <p className="font-semibold">Setup Notes:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Create a REST app in <a href="https://developer.paypal.com/dashboard" className="underline" target="_blank" rel="noreferrer">PayPal Developer Dashboard</a>.</li>
          <li>Add PAYPAL_CLIENT_ID & PAYPAL_SECRET to server .env and restart server.</li>
          <li>Set VITE_PAYPAL_CLIENT_ID in web .env for client SDK loading (optional if you fetch from settings).</li>
          <li>Switch to Live mode only after successful sandbox tests.</li>
        </ul>
      </div>
    </div>
  );
}

export default PayPalSettings;