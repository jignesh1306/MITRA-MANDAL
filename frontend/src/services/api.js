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

// Fast in-memory cache for GET requests (10-second TTL for instant tab switching)
const apiCache = new Map();
const CACHE_TTL = 10000;

export const clearApiCache = () => {
  apiCache.clear();
};

// Attach JWT Bearer token and check cache
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mm_token');
  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  }

  const method = (config.method || 'get').toUpperCase();

  // If mutation (POST/PUT/PATCH/DELETE), invalidate read cache immediately
  if (method !== 'GET') {
    apiCache.clear();
    return config;
  }

  // Check GET cache (allow bypassing with skipCache: true)
  if (method === 'GET' && !config.skipCache && !config.params?.skipCache) {
    const key = `${config.url}?${JSON.stringify(config.params || {})}`;
    const cached = apiCache.get(key);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      config.adapter = () => Promise.resolve({
        data: JSON.parse(JSON.stringify(cached.data)),
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {}
      });
    }
  }

  return config;
});

// Response interceptor: cache successful GET results and preserve status on errors
api.interceptors.response.use(
  (response) => {
    const method = (response.config.method || 'get').toUpperCase();
    if (method === 'GET' && !response.config.skipCache && !response.config.params?.skipCache) {
      const key = `${response.config.url}?${JSON.stringify(response.config.params || {})}`;
      apiCache.set(key, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    return response;
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || 'કંઈક સમસ્યા આવી છે. કૃપા કરીને ફરી પ્રયાસ કરો.';
    const enhancedError = new Error(msg);
    enhancedError.response = error.response;
    enhancedError.status = error.response?.status;
    return Promise.reject(enhancedError);
  }
);

export default api;
