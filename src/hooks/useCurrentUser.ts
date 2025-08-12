'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type CurrentUser = {
  id: string;
  nome: string;  // mapeado de `name`
  email: string;
  role?: string;
  memberSince?: string;
  avatarUrl?: string;
  stats?: Record<string, unknown>;
};

type HookState = {
  user: CurrentUser | null;
  loading: boolean;
  erro: string | null;
  refresh: () => Promise<void>;   // ← NOVO
};

export function useCurrentUser(): HookState {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const doFetch = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setErro(null);

    try {
      const res = await fetch('/api/me', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        signal: ac.signal,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        setUser(null);
        setErro(txt || `HTTP ${res.status}`);
        return;
      }

      const data = await res.json();
      const u = data?.user;

      if (!u || typeof u !== 'object') {
        setUser(null);
        setErro('Resposta inválida de /api/me');
        return;
      }

      const mapped: CurrentUser = {
        id: String((u as Record<string, unknown>).id ?? (u as Record<string, unknown>).email ?? ''),
        nome:
          String((u as Record<string, unknown>).name ?? (u as Record<string, unknown>).nome ?? '')
            .trim() ||
          String((u as Record<string, unknown>).email ?? '').split('@')[0],
        email: String((u as Record<string, unknown>).email ?? ''),
        role: (u as Record<string, unknown>).role as string | undefined,
        memberSince: (u as Record<string, unknown>).memberSince as string | undefined,
        avatarUrl: (u as Record<string, unknown>).avatarUrl as string | undefined,
        stats: (u as Record<string, unknown>).stats as Record<string, unknown> | undefined,
      };

      setUser(mapped);
    } catch (e: unknown) {
      // ignorar abortos do fetch
      if (e instanceof Error && e.name === 'AbortError') {
        return;
      }
      setUser(null);
      setErro(e instanceof Error ? e.message : 'Falha ao carregar /api/me');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void doFetch(); }, [doFetch]);

  const refresh = useCallback(async () => { await doFetch(); }, [doFetch]);

  return { user, loading, erro, refresh };
}
