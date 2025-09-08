// src/hooks/useCurrentUser.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type CurrentUser = {
  id: string;
  nome: string;
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
  refresh: () => Promise<void>;
};

async function safeJson<T = any>(res: Response): Promise<T | null> {
  try {
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    return (await res.json()) as T;
  } catch { return null; }
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, ms = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try { return await fetch(input, { ...init, signal: controller.signal }); }
  finally { clearTimeout(id); }
}

function mapToCurrentUser(u: Record<string, unknown>): CurrentUser {
  const idRaw = (u.id as string | number | undefined) ?? (u.email as string | undefined) ?? '';
  const email = String(u.email ?? '');
  const nameCandidate =
    (u.name as string | undefined) ??
    (u['nome'] as string | undefined) ??
    (u['displayName'] as string | undefined) ??
    (u['display_name'] as string | undefined) ??
    (u['username'] as string | undefined) ??
    (email ? email.split('@')[0] : '');
  return {
    id: String(idRaw),
    nome: String(nameCandidate).trim(),
    email,
    role: (u.role as string | undefined) ?? (u['roles'] as string | undefined),
    memberSince:
      (u.memberSince as string | undefined) ??
      (u['registered'] as string | undefined) ??
      (u['registered_date'] as string | undefined),
    avatarUrl:
      (u.avatarUrl as string | undefined) ??
      (u['avatar_url'] as string | undefined),
    stats: (u.stats as Record<string, unknown> | undefined) ?? undefined,
  };
}

export function useCurrentUser(): HookState {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const inflightRef = useRef<Promise<void> | null>(null);
  const lastAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      lastAbortRef.current?.abort();
    };
  }, []);

  const doFetch = useCallback(async () => {
    lastAbortRef.current?.abort();
    const ac = new AbortController();
    lastAbortRef.current = ac;

    if (inflightRef.current) {
      await inflightRef.current;
      return;
    }

    setLoading(true);
    setErro(null);

    inflightRef.current = (async () => {
      try {
        const res = await fetchWithTimeout('/api/me', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
          signal: ac.signal,
        }, 15000);

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          if (!mountedRef.current) return;
          setUser(null);
          setErro(txt || `HTTP ${res.status}`);
          return;
        }

        const data = await safeJson<{ user?: Record<string, unknown> }>(res);
        const u = data?.user;

        if (!mountedRef.current) return;

        if (!u || typeof u !== 'object') {
          setUser(null);
          setErro('Resposta inválida de /api/me');
          return;
        }

        setUser(mapToCurrentUser(u));
      } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') return;
        if (!mountedRef.current) return;
        setUser(null);
        setErro(e instanceof Error ? e.message : 'Falha ao carregar /api/me');
      } finally {
        inflightRef.current = null;
        if (mountedRef.current) setLoading(false);
      }
    })();

    await inflightRef.current;
  }, []);

  useEffect(() => { void doFetch(); }, [doFetch]);

  // auto-refresh quando outra aba fizer login/logout
  useEffect(() => {
    const onStorage = () => { void doFetch(); };
    window.addEventListener('storage', onStorage);

    // **MESMA ABA**: reage ao evento custom e ao foco
    const onAuthChanged = () => { void doFetch(); };
    window.addEventListener('tf-auth-changed', onAuthChanged as EventListener);
    window.addEventListener('focus', onAuthChanged as EventListener);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('tf-auth-changed', onAuthChanged as EventListener);
      window.removeEventListener('focus', onAuthChanged as EventListener);
    };
  }, [doFetch]);

  const refresh = useCallback(async () => { await doFetch(); }, [doFetch]);

  return { user, loading, erro, refresh };
}
