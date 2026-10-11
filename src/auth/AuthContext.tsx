import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthPayload, User } from '../types';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (payload: AuthPayload) => void;
  logout: () => void;
}

const STORAGE_KEY = 'provas.auth';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAuth(): AuthPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthPayload;
    if (!parsed?.token || !parsed?.user?.id || !parsed?.user?.role) return null;
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthPayload | null>(() => readStoredAuth());

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }, []);

  const login = useCallback((payload: AuthPayload) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setAuth(payload);
  }, []);

  useEffect(() => {
    const handleExpired = () => logout();
    window.addEventListener('provas:auth-expired', handleExpired);
    return () => window.removeEventListener('provas:auth-expired', handleExpired);
  }, [logout]);

  const value = useMemo<AuthContextValue>(() => ({
    token: auth?.token ?? null,
    user: auth?.user ?? null,
    isAuthenticated: Boolean(auth?.token),
    login,
    logout,
  }), [auth, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
