import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true
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
