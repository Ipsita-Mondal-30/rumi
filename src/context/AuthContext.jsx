import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api.js';

export const AuthContext = createContext(null);

const tokenKey = 'rumi_token';
const userKey = 'rumi_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem(userKey);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey));
  const [loading, setLoading] = useState(true);

  const setAuth = useCallback((newToken, newUser) => {
    if (newToken) localStorage.setItem(tokenKey, newToken);
    else localStorage.removeItem(tokenKey);
    if (newUser) localStorage.setItem(userKey, JSON.stringify(newUser));
    else localStorage.removeItem(userKey);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.login(email, password);
    if (data.success && data.token) {
      setAuth(data.token, data.user);
      return data;
    }
    throw new Error(data.message || 'Login failed');
  }, [setAuth]);

  const registerUser = useCallback(async (payload) => {
    const { data } = await api.register(payload);
    if (data.success && data.token) {
      setAuth(data.token, data.user);
      return data;
    }
    throw new Error(data.message || 'Registration failed');
  }, [setAuth]);

  const logout = useCallback(() => {
    setAuth(null, null);
  }, [setAuth]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const { data } = await api.getProfile();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem(userKey, JSON.stringify(data.user));
      }
    } catch {
      logout();
    }
  }, [token, logout]);

  useEffect(() => {
    if (token && !user) refreshUser().finally(() => setLoading(false));
    else setLoading(false);
  }, [token]);

  useEffect(() => {
    const onLogout = () => logout();
    window.addEventListener('rumi:logout', onLogout);
    return () => window.removeEventListener('rumi:logout', onLogout);
  }, [logout]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register: registerUser,
    logout,
    refreshUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
