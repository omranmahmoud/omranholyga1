import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Tiny event system (avoids Node 'events' dependency which RN doesn't provide)
type Handler = () => void;
const unauthorizedHandlers: Handler[] = [];
export const onUnauthorized = (h: Handler) => { if (!unauthorizedHandlers.includes(h)) unauthorizedHandlers.push(h); };
export const offUnauthorized = (h: Handler) => {
  const i = unauthorizedHandlers.indexOf(h);
  if (i >= 0) unauthorizedHandlers.splice(i, 1);
};
const emitUnauthorized = () => { unauthorizedHandlers.slice().forEach(h => { try { h(); } catch { /* ignore */ } }); };

// Resolve API base URL with environment override and platform defaults
const getDefaultBaseUrl = () => {
  // Android emulator maps host machine's localhost to 10.0.2.2
  if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
  // iOS simulator and web can use localhost
  return 'https://omraneva.onrender.com';
};

const fromEnv = process.env.EXPO_PUBLIC_API_URL as string | undefined;
const fromConstants = (Constants?.expoConfig as any)?.extra?.EXPO_PUBLIC_API_URL as string | undefined;
let API_BASE_URL = (fromEnv || fromConstants || '').trim() || getDefaultBaseUrl();

// Web runtime override: allow a global injected at index.html build time (e.g. Netlify env)
// If a script sets window.__API_BASE__ before bundle executes, use it.
if (typeof window !== 'undefined' && (window as any).__API_BASE__) {
  API_BASE_URL = (window as any).__API_BASE__;
}

// If running on a physical device, 'localhost' is not reachable. Attempt to derive LAN IP from Expo hostUri.
if (/localhost|127\.0\.0\.1/.test(API_BASE_URL) && Platform.OS !== 'web') {
  try {
    const hostUri: string | undefined = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest?.hostUri || (Constants as any)?.manifest?.debuggerHost;
    if (hostUri) {
      const match = hostUri.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (match) {
        const ip = match[1];
        // Preserve port if explicitly set, else default 5000
        const portMatch = API_BASE_URL.match(/:(\d+)(?:\/|$)/);
        const port = portMatch ? portMatch[1] : '5000';
        API_BASE_URL = `http://${ip}:${port}`;
      }
    }
  } catch {
    // swallow - fallback stays as localhost (works on simulators)
  }
}

const api = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

// Attach JWT token to every request if available
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Global response error handling (auto logout on 401)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
  if (status === 401) emitUnauthorized();
    return Promise.reject(error);
  }
);

export default api;
