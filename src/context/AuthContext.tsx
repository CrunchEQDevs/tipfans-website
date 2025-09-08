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

// (opcional, mas recomendado) util que dispara eventos de auth
// se não quiser criar o arquivo, troque por um inline:
//   try { localStorage.setItem('tf_auth_event', String(Date.now())); window.dispatchEvent(new Event('tf-auth-changed')); } catch {}
import { notifyAuthChanged } from '@/lib/auth-events';

export type User = {
  id?: string | number;
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
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function roleSlug(r?: string) {
  return (r || '').toLowerCase();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = (await res.json().catch(() => ({}))) as { user?: User };
      const u = data?.user ?? null;
      setUser(u);

      if (u?.role) localStorage.setItem('userRole', roleSlug(u.role));
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
    async (identifier: string, password: string) => {
      try {
        setLoading(true);
        const res = await fetch('/api/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });

        const data = (await res.json().catch(() => ({}))) as { ok?: boolean; user?: User; error?: string };

        if (!res.ok || !data?.ok) {
          console.error('❌ Login falhou:', data?.error);
          return false;
        }

        // Atualiza estado imediatamente com o user retornado
        if (data.user) {
          setUser(data.user);
          if (data.user.role) localStorage.setItem('userRole', roleSlug(data.user.role));
        } else {
          await fetchMe();
        }

        // Notifica app/abas que o auth mudou (evita precisar de F5)
        try {
          notifyAuthChanged();
        } catch {
          try {
            localStorage.setItem('tf_auth_event', String(Date.now()));
            window.dispatchEvent(new Event('tf-auth-changed'));
          } catch {}
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

      // Notifica mudança de auth
      try {
        notifyAuthChanged();
      } catch {
        try {
          localStorage.setItem('tf_auth_event', String(Date.now()));
          window.dispatchEvent(new Event('tf-auth-changed'));
        } catch {}
      }

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
