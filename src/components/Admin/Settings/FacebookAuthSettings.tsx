import React from 'react';
import { Save, RefreshCw } from 'lucide-react';
import { useStore } from '../../../context/StoreContext';
import { authProviderService } from '../../../services/authProviderService';

export function FacebookAuthSettings() {
  const { settings, updateSettings } = useStore();
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    enabled: settings?.facebookAuth?.enabled || false,
    appId: settings?.facebookAuth?.appId || '',
    webAppId: settings?.facebookAuth?.webAppId || '',
    iosAppId: settings?.facebookAuth?.iosAppId || '',
    androidAppId: settings?.facebookAuth?.androidAppId || ''
  });
  const [appSecret, setAppSecret] = React.useState('');

  React.useEffect(() => {
    setForm({
      enabled: settings?.facebookAuth?.enabled || false,
      appId: settings?.facebookAuth?.appId || '',
      webAppId: settings?.facebookAuth?.webAppId || '',
      iosAppId: settings?.facebookAuth?.iosAppId || '',
      androidAppId: settings?.facebookAuth?.androidAppId || ''
    });
    setAppSecret('');
  }, [settings?.facebookAuth]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { ...form };
      if (appSecret.trim()) payload.appSecret = appSecret.trim();
      const updated = await authProviderService.updateFacebook(payload);
      await updateSettings({ facebookAuth: updated } as any);
      setAppSecret('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Facebook Login</h3>
        <p className="text-sm text-gray-500 mt-1">Allow customers to sign up / sign in using their Facebook account.</p>
      </div>
      <form onSubmit={submit} className="space-y-6">
        <div className="flex items-center gap-3">
          <input
            id="fb-enabled"
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm(f => ({ ...f, enabled: e.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="fb-enabled" className="text-sm font-medium text-gray-700">Enable Facebook Login</label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary App ID</label>
            <input
              type="text"
              value={form.appId}
              onChange={e => setForm(f => ({ ...f, appId: e.target.value }))}
              placeholder="123456789012345"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            />
            <p className="mt-1 text-xs text-gray-500">Used for token validation.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Web App ID (optional)</label>
            <input
              type="text"
              value={form.webAppId}
              onChange={e => setForm(f => ({ ...f, webAppId: e.target.value }))}
              placeholder="Web-specific App ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            />
            <p className="mt-1 text-xs text-gray-500">If different from primary.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">iOS App ID</label>
            <input
              type="text"
              value={form.iosAppId}
              onChange={e => setForm(f => ({ ...f, iosAppId: e.target.value }))}
              placeholder="iOS App ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Android App ID</label>
            <input
              type="text"
              value={form.androidAppId}
              onChange={e => setForm(f => ({ ...f, androidAppId: e.target.value }))}
              placeholder="Android App ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">App Secret (write-only)</label>
            <input
              type="password"
              value={appSecret}
              onChange={e => setAppSecret(e.target.value)}
              placeholder="Enter new secret to update"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-gray-500">Never displayed again. Leave blank to keep existing.{settings?.facebookAuth?.secretPreview && (<span className="ml-2 text-green-600">Stored secret: {settings.facebookAuth.secretPreview}</span>)}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setForm({
              enabled: settings?.facebookAuth?.enabled || false,
              appId: settings?.facebookAuth?.appId || '',
              webAppId: settings?.facebookAuth?.webAppId || '',
              iosAppId: settings?.facebookAuth?.iosAppId || '',
              androidAppId: settings?.facebookAuth?.androidAppId || ''
            })}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
          <button
            type="submit"
            disabled={loading || (form.enabled && !form.appId)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Facebook Auth'}
          </button>
        </div>
      </form>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-700 space-y-2">
        <p className="font-semibold">Setup Notes:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Create an app in <a href="https://developers.facebook.com/apps/" className="underline" target="_blank" rel="noreferrer">Meta Developer Dashboard</a>.</li>
          <li>Enable Facebook Login product and configure OAuth redirect URIs for web if used.</li>
          <li>Request email scope client-side; without it signup will fail.</li>
          <li>Clients obtain accessToken then POST /api/auth/facebook {`{ accessToken, userID }`} to exchange for JWT.</li>
          <li>Set FACEBOOK_APP_ID & FACEBOOK_APP_SECRET in server .env for production security.</li>
        </ul>
      </div>
    </div>
  );
}

export default FacebookAuthSettings;
