import api from './Client';

export const refreshToken = async () => {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) throw new Error('No refresh token available');
  try {
    const response = await api.post('/api/auth/refresh/', { refresh });
    const newAccessToken = response.data.access;
    localStorage.setItem('access_token', newAccessToken);
    return newAccessToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};