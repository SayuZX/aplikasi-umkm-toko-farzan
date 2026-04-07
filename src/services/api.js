import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const api = axios.create({
  timeout: 15000,
});

// Dynamic base URL
api.interceptors.request.use((config) => {
  const { serverUrl, token } = useAuthStore.getState();
  config.baseURL = serverUrl + '/api';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Dev bypass for maintenance mode
  const devBypassToken = localStorage.getItem('devBypassToken');
  if (devBypassToken) {
    config.headers['X-Dev-Bypass'] = devBypassToken;
  }
  return config;
});

// Auto-unwrap standardized {success, data, message} responses + auto logout on 401
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && response.data.success !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.hash = '#/login';
    }
    if (error.response?.status === 404) {
      // Skip toast for expected 404s (e.g. barcode not found)
      if (!error.config?._silent404) {
        toast.error(`404: ${error.config?.url || 'endpoint tidak ditemukan'}`);
      }
    }
    if (error.response?.status === 503) {
      // Maintenance mode — dispatch event for MaintenanceGuard to handle
      const data = error.response?.data;
      if (data?.status === 'maintenance' && !window.location.hash.includes('/login')) {
        if (data?.message) sessionStorage.setItem('maintenance_message', data.message);
        if (data?.retry_after) sessionStorage.setItem('maintenance_retry_after', String(data.retry_after));
        window.dispatchEvent(new CustomEvent('maintenance:enabled'));
        return Promise.reject(error);
      }
    }
    if (error.response?.status >= 500) {
      toast.error('Server error, coba lagi');
    }
    // Extract message from standardized error response
    if (error.response?.data && error.response.data.success === false) {
      error.response.data = { message: error.response.data.message };
    }
    return Promise.reject(error);
  }
);

export default api;
