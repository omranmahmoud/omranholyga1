import api from './api';
import { API_ENDPOINTS } from './api/endpoints';

export const authProviderService = {
  getGoogle: () => api.getWithRetry(API_ENDPOINTS.SETTINGS_AUTH.GOOGLE).then(r => r.data),
  updateGoogle: (data: any) => api.putWithRetry(API_ENDPOINTS.SETTINGS_AUTH.GOOGLE, data).then(r => r.data),
  getFacebook: () => api.getWithRetry(API_ENDPOINTS.SETTINGS_AUTH.FACEBOOK).then(r => r.data),
  updateFacebook: (data: any) => api.putWithRetry(API_ENDPOINTS.SETTINGS_AUTH.FACEBOOK, data).then(r => r.data)
};
