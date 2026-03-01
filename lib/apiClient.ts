import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '${VITE_API_URL:-http://85.198.70.191/api}/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('apiClient: Adding token to request:', token.substring(0, 20) + '...');
  } else {
    console.log('apiClient: No token found in localStorage');
  }
  return config;
});

// Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);
