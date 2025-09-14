import axios, { AxiosInstance } from 'axios';
import { toast } from 'react-hot-toast';

// Resolve base URL (prefer runtime injected, then Vite env, fallback '/api')
const runtimeBase = (typeof window !== 'undefined' && (window as any).__API_BASE__) || '';
const envBase = (import.meta as any).env?.VITE_API_BASE || (import.meta as any).env?.VITE_API_URL || '';
const BASE_URL = (runtimeBase || envBase || '/api').replace(/\/$/, '') + '/api'.replace('/api/api','/api');

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(new Error('Network error'));
    }

    // Allow callers to suppress global error toasts
    const suppressToast = (error.config?.headers?.['X-Suppress-Toast'] === '1') || (error.config?.suppressToast === true);

    // Still handle auth errors normally
    if (suppressToast && error.response.status !== 401) {
      return Promise.reject(error);
    }

    // Suppress 404 toast for endpoints where "not found" is an expected, non-error state
    const url: string = error.config?.url || '';
    const method: string = (error.config?.method || '').toLowerCase();
    const silent404Paths = [
      '/hero/active',
      '/backgrounds/active',
      '/announcements/active',
    ];

    switch (error.response.status) {
      case 401:
        localStorage.removeItem('token');
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
        break;
      case 403:
        toast.error('You do not have permission to perform this action');
        break;
      case 404:
        // For GET requests to known optional resources (e.g., no active hero), don't show a toast
        if (!(method === 'get' && silent404Paths.some((p) => url.includes(p)))) {
          toast.error('Resource not found');
        }
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(error.response.data?.message || 'An error occurred');
    }

    return Promise.reject(error);
  }
);

const withRetry = async (request: () => Promise<any>, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await request();
    } catch (error: any) {
      // Do not retry on most 4xx client errors (except 429 Too Many Requests)
      const status = error?.response?.status;
      const isClientError = status >= 400 && status < 500;
      const shouldRetry = !isClientError || status === 429;

      if (i === retries - 1 || !shouldRetry) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};

interface EnhancedApi extends AxiosInstance {
  getWithRetry: (url: string, config?: any) => Promise<any>;
  postWithRetry: (url: string, data?: any, config?: any) => Promise<any>;
  putWithRetry: (url: string, data?: any, config?: any) => Promise<any>;
  patchWithRetry: (url: string, data?: any, config?: any) => Promise<any>;
  deleteWithRetry: (url: string, config?: any) => Promise<any>;
}

const enhancedApi: EnhancedApi = Object.assign(api, {
  getWithRetry: (url: string, config?: any) => withRetry(() => api.get(url, config)),
  postWithRetry: (url: string, data?: any, config?: any) => withRetry(() => api.post(url, data, config)),
  putWithRetry: (url: string, data?: any, config?: any) => withRetry(() => api.put(url, data, config)),
  patchWithRetry: (url: string, data?: any, config?: any) => withRetry(() => api.patch(url, data, config)),
  deleteWithRetry: (url: string, config?: any) => withRetry(() => api.delete(url, config))
});

export default enhancedApi;