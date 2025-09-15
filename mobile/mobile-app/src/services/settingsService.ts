import api from './api';

export async function fetchStoreSettings() {
  const res = await api.get('/api/settings');
  return res.data;
}
