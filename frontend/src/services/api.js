import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: false,
  timeout: 60000 // 60s to accommodate Render free tier cold starts without early timeouts
});

// Pre-warm backend immediately when frontend bundle initializes
try {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
  const cleanBase = baseURL.replace(/\/+$/, '');
  const healthUrl = cleanBase.endsWith('/api') ? `${cleanBase}/health` : `${cleanBase}/api/health`;
  fetch(healthUrl).catch(() => {});
} catch (_) {}

// Attach JWT Bearer token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mm_token');
  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  }
  return config;
});

// Response interceptor for friendly error handling while preserving status for auth checks
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.message || error.message || 'કંઈક સમસ્યા આવી છે. કૃપા કરીને ફરી પ્રયાસ કરો.';
    const enhancedError = new Error(msg);
    enhancedError.response = error.response;
    enhancedError.status = error.response?.status;
    return Promise.reject(enhancedError);
  }
);

export default api;
