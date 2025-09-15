import api from './api';

export async function fetchCurrentUser() {
  const response = await api.get('/api/auth/me'); // Adjust endpoint if needed
  return response.data;
}
