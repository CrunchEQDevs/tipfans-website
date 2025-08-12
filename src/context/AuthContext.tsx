'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

export type User = {
  id: string | number;
  email: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  memberSince?: string;
  stats?: Record<string, unknown>;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/me', {
        method: 'GET',
        credentials: 'include', // envia cookie httpOnly
        cache: 'no-store',
      });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      const u: User | null = data?.user ?? null;
      setUser(u);
      if (u?.role) localStorage.setItem('userRole', u.role);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchMe();
      setLoading(false);
    })();
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        const res = await fetch('/api/login', {
          method: 'POST',
          credentials: 'include', // grava cookie tf_token
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        type LoginResponse = { ok?: boolean; user?: User; error?: string; [k: string]: unknown };
        const data = (await res.json().catch(() => ({}))) as LoginResponse;

        if (!res.ok) {
          console.error('❌ Login falhou:', data?.error || res.statusText);
          return false;
        }

        // Se o backend devolver { user }, usa; senão puxa do /api/me
        if (data?.user) {
          setUser(data.user);
          if (data.user.role) localStorage.setItem('userRole', data.user.role);
        } else {
          await fetchMe();
        }

        return true;
      } catch (e) {
        console.error('❌ Erro de conexão no login:', e);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchMe]
  );

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    } finally {
      localStorage.removeItem('userRole');
      setUser(null);
      setLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setLoading(true);
    await fetchMe();
    setLoading(false);
  }, [fetchMe]);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser }),
    [user, loading, login, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro do AuthProvider');
  return ctx;
}
