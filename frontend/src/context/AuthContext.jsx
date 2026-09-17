import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('mm_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      localStorage.setItem('mm_user', JSON.stringify(res.data.user));
    } catch (err) {
      setUser(null);
      localStorage.removeItem('mm_user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (phone, password, role) => {
    const res = await api.post('/auth/login', { phone, password, role });
    setUser(res.data.user);
    localStorage.setItem('mm_user', JSON.stringify(res.data.user));
    return res.data;
  };

  const signup = async (data) => {
    const res = await api.post('/auth/register', data);
    if (res.data.user) {
      setUser(res.data.user);
      localStorage.setItem('mm_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {}
    setUser(null);
    localStorage.removeItem('mm_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
