import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('zeno_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('zeno_token') || null);
  const [mode, setMode] = useState(() => localStorage.getItem('zeno_mode') || 'DEMO');
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const res = await authService.login(credentials);
      if (res.success) {
        setUser(res.user);
        setToken(res.token);
        setMode(res.mode || 'LIVE');
        localStorage.setItem('zeno_user', JSON.stringify(res.user));
        localStorage.setItem('zeno_token', res.token);
        localStorage.setItem('zeno_mode', res.mode || 'LIVE');
        if (res.refreshToken) {
          localStorage.setItem('zeno_refresh_token', res.refreshToken);
        }
        return { success: true, user: res.user };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await authService.register(userData);
      if (res.success) {
        setUser(res.user);
        setToken(res.token);
        setMode(res.mode || 'LIVE');
        localStorage.setItem('zeno_user', JSON.stringify(res.user));
        localStorage.setItem('zeno_token', res.token);
        localStorage.setItem('zeno_mode', res.mode || 'LIVE');
        return { success: true, user: res.user, message: res.message };
      }
      return { success: false, message: res.message };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = () => {
    return login({ account: 'demo_dealer', password: 'demo_password' });
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      const next = { ...prev, ...updatedFields };
      localStorage.setItem('zeno_user', JSON.stringify(next));
      return next;
    });
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // ignore
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('zeno_user');
    localStorage.removeItem('zeno_token');
    localStorage.removeItem('zeno_mode');
    localStorage.removeItem('zeno_refresh_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, mode, loading, login, register, loginDemo, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
