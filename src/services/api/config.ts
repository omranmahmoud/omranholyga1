import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_BASE_URL, HTTP_STATUS, ERROR_MESSAGES } from './constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      toast.error(ERROR_MESSAGES.NETWORK);
      return Promise.reject(new Error(ERROR_MESSAGES.NETWORK));
    }

    // Handle specific status codes
    switch (error.response.status) {
      case HTTP_STATUS.UNAUTHORIZED:
        localStorage.removeItem('token');
        window.location.href = '/login';
        toast.error(ERROR_MESSAGES.UNAUTHORIZED);
        break;

      case HTTP_STATUS.FORBIDDEN:
        toast.error(ERROR_MESSAGES.FORBIDDEN);
        break;

      case HTTP_STATUS.NOT_FOUND:
        console.warn('Resource not found:', error.config.url);
        // Return empty data for GET requests
        if (error.config.method?.toLowerCase() === 'get') {
          return Promise.resolve({ 
            data: Array.isArray(error.config.defaultValue) ? [] : null 
          });
        }
        break;

      case HTTP_STATUS.SERVER_ERROR:
        toast.error(ERROR_MESSAGES.SERVER);
        break;

      default:
        toast.error(error.response.data?.message || ERROR_MESSAGES.DEFAULT);
    }

    return Promise.reject(error);
  }
);

export default api;
