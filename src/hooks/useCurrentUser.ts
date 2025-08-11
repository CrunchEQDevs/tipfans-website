'use client';

import { useEffect, useState } from 'react';

export type User = {
  id: string;
  nome: string;
  email: string;
  role?: string;
  memberSince?: string;
  avatarUrl?: string;
  // Campos extras vindos do Mongo (opcional)
  stats?: Record<string, unknown>;
};

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let abort = false;

    (async () => {
      try {
        setLoading(true);
        setErro(null);

        // 1) tenta com cookie (fluxo normal)
        let res = await fetch('/api/me', { cache: 'no-store' });

        // 2) fallback: se 401, tenta com token salvo no localStorage (se existir)
        if (res.status === 401) {
          const raw =
            typeof window !== 'undefined'
              ? localStorage.getItem('token') ?? localStorage.getItem('tf_token')
              : null;

          if (raw) {
            res = await fetch('/api/me', {
              method: 'GET',
              cache: 'no-store',
              headers: { Authorization: `Bearer ${raw}` },
            });

            // se funcionou, tenta gravar cookie pra próximas vezes
            if (res.ok) {
              await fetch('/api/session/exchange', {
                method: 'POST',
                headers: { Authorization: `Bearer ${raw}` },
              }).catch(() => {});
            }
          }
        }

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}${txt ? `: ${txt}` : ''}`);
        }

        const data = (await res.json()) as { user?: User };
        if (!abort) setUser(data.user ?? null);
      } catch (e) {
        if (!abort) setErro(e instanceof Error ? e.message : 'Erro');
      } finally {
        if (!abort) setLoading(false);
      }
    })();

    return () => {
      abort = true;
    };
  }, []);

  return { user, loading, erro };
}
