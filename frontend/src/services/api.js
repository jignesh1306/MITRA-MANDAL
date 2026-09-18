import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: false
});

// Attach JWT Bearer token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for friendly error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.message || 'કંઈક સમસ્યા આવી છે. કૃપા કરીને ફરી પ્રયાસ કરો.';
    return Promise.reject(new Error(msg));
  }
);

export default api;
