import React from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { authProviderService } from '../../../services/authProviderService';

export function GoogleAuthSettings() {
  const { settings, updateSettings } = useStore();
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    enabled: settings?.googleAuth?.enabled || false,
    clientId: settings?.googleAuth?.clientId || '',
    webClientId: settings?.googleAuth?.webClientId || '',
    iosClientId: settings?.googleAuth?.iosClientId || '',
    androidClientId: settings?.googleAuth?.androidClientId || ''
  });
  const [clientSecret, setClientSecret] = React.useState('');

  React.useEffect(() => {
    setForm({
      enabled: settings?.googleAuth?.enabled || false,
      clientId: settings?.googleAuth?.clientId || '',
      webClientId: settings?.googleAuth?.webClientId || '',
      iosClientId: settings?.googleAuth?.iosClientId || '',
      androidClientId: settings?.googleAuth?.androidClientId || ''
    });
    setClientSecret('');
  }, [settings?.googleAuth]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { ...form };
      if (clientSecret.trim()) payload.clientSecret = clientSecret.trim();
      const updated = await authProviderService.updateGoogle(payload);
      // Merge into global settings for consistency
      await updateSettings({ googleAuth: updated } as any);
      setClientSecret('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Google Login</h3>
        <p className="text-sm text-gray-500 mt-1">Enable users to sign up & sign in with their Google account.</p>
      </div>
      <form onSubmit={submit} className="space-y-6">
        <div className="flex items-center gap-3">
          <input
            id="gg-enabled"
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm(f => ({ ...f, enabled: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="gg-enabled" className="text-sm font-medium text-gray-700">Enable Google Login</label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Client ID</label>
            <input
              type="text"
              value={form.clientId}
              onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
              placeholder="your_web_or_generic_client_id.apps.googleusercontent.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            />
            <p className="mt-1 text-xs text-gray-500">Used for backend token audience validation.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Web Client ID (optional)</label>
            <input
              type="text"
              value={form.webClientId}
              onChange={e => setForm(f => ({ ...f, webClientId: e.target.value }))}
              placeholder="web_client_id.apps.googleusercontent.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            />
            <p className="mt-1 text-xs text-gray-500">If different from primary.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">iOS Client ID</label>
            <input
              type="text"
              value={form.iosClientId}
              onChange={e => setForm(f => ({ ...f, iosClientId: e.target.value }))}
              placeholder="ios_client_id.apps.googleusercontent.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Android Client ID</label>
            <input
              type="text"
              value={form.androidClientId}
              onChange={e => setForm(f => ({ ...f, androidClientId: e.target.value }))}
              placeholder="android_client_id.apps.googleusercontent.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret (write-only)</label>
            <input
              type="password"
              value={clientSecret}
              onChange={e => setClientSecret(e.target.value)}
              placeholder="Enter new secret to update"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-gray-500">Never displayed again. Leave blank to keep existing.{settings?.googleAuth?.secretPreview && (<span className="ml-2 text-green-600">Stored secret: {settings.googleAuth.secretPreview}</span>)}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setForm({
              enabled: settings?.googleAuth?.enabled || false,
              clientId: settings?.googleAuth?.clientId || '',
              webClientId: settings?.googleAuth?.webClientId || '',
              iosClientId: settings?.googleAuth?.iosClientId || '',
              androidClientId: settings?.googleAuth?.androidClientId || ''
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
            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Google Auth'}
          </button>
        </div>
      </form>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-xs text-indigo-700 space-y-2">
        <p className="font-semibold">Setup Notes:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Create OAuth credentials in <a href="https://console.cloud.google.com/apis/credentials" className="underline" target="_blank" rel="noreferrer">Google Cloud Console</a>.</li>
          <li>Add authorized redirect URIs if using web sign-in (e.g. https://yourdomain.com/auth/google/callback).</li>
          <li>Use the correct platform-specific client IDs for mobile SDKs.</li>
          <li>Set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in server .env for redundancy/security.</li>
          <li>Client obtains idToken then POST /api/auth/google {`{ idToken }`} to exchange for JWT.</li>
        </ul>
      </div>
    </div>
  );
}

export default GoogleAuthSettings;
