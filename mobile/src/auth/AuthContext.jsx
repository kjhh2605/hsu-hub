import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

function normalizeSession(value) {
  if (!value || value.authenticated === false) return null;
  const user = value.user ?? value;
  if (!user?.id && !user?.email) return null;
  return user;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let current = true;
    api.get('/auth/session').then((session) => current && setUser(normalizeSession(session))).catch(() => current && setUser(null)).finally(() => current && setLoading(false));
    return () => { current = false; };
  }, []);
  const value = useMemo(() => ({
    user, loading,
    async logout() { await api.post('/auth/logout'); setUser(null); },
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider가 필요합니다.');
  return context;
}
