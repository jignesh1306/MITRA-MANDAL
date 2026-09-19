import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('mm_token');
      const cached = localStorage.getItem('mm_user');
      if (!token || token === 'null' || token === 'undefined') return null;
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(() => {
    const token = localStorage.getItem('mm_token');
    const cached = localStorage.getItem('mm_user');
    const hasValidToken = Boolean(token && token !== 'null' && token !== 'undefined');
    // If user is already authenticated with token and cached profile in localStorage,
    // do NOT block rendering with loading=true on refresh!
    if (hasValidToken && cached) return false;
    if (hasValidToken && !cached) return true;
    return false;
  });

  const checkAuth = async () => {
    const token = localStorage.getItem('mm_token');
    if (!token || token === 'null' || token === 'undefined') {
      setUser(null);
      localStorage.removeItem('mm_user');
      localStorage.removeItem('mm_token');
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('mm_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      const status = err.status || err.response?.status;
      // Only log out if explicitly 401 Unauthorized or 403 Forbidden
      if (status === 401 || status === 403) {
        console.warn('Session expired or unauthorized. Logging out.');
        setUser(null);
        localStorage.removeItem('mm_user');
        localStorage.removeItem('mm_token');
      } else {
        // Network error, 502/503/504 gateway timeout, or backend waking up on Render free tier:
        // DO NOT log out! Keep the user on their dashboard.
        console.warn('Backend unavailable or waking up; maintaining local session.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (phone, password, role) => {
    const res = await api.post('/auth/login', { phone, password, role });
    if (res.data.user) {
      setUser(res.data.user);
      localStorage.setItem('mm_user', JSON.stringify(res.data.user));
    }
    if (res.data.token) {
      localStorage.setItem('mm_token', res.data.token);
    }
    return res.data;
  };

  const signup = async (data) => {
    const res = await api.post('/auth/register', data);
    if (res.data.token && res.data.user) {
      setUser(res.data.user);
      localStorage.setItem('mm_user', JSON.stringify(res.data.user));
      localStorage.setItem('mm_token', res.data.token);
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {}
    setUser(null);
    localStorage.removeItem('mm_user');
    localStorage.removeItem('mm_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
