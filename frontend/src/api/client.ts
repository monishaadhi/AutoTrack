import axios from 'axios';

const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Strip any trailing slashes to prevent double slashes in paths
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT token from localStorage if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('autotrack_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      // Token expired or invalid
      localStorage.removeItem('autotrack_token');
      localStorage.removeItem('autotrack_user');
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);
