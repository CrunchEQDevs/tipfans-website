'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Article, UserLite } from './types';
import ArticleCard from './ArticleCard';

function fireOpenLogin() {
  try {
    document.dispatchEvent(new CustomEvent('open-login'));
  } catch {}
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const u = new URL(url, window.location.origin);
  if (init?.method !== 'POST') u.searchParams.set('_', String(Date.now()));
  const r = await fetch(u.toString(), {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    throw new Error(`HTTP ${r.status} ${txt}`);
  }
  return r.json();
}

async function getCurrentUser(): Promise<UserLite | null> {
  try {
    const me = await api<UserLite>('/api/me');
    if (me && (me.id || (me as any).user?.id)) return me;
  } catch {}
  try {
    const raw = localStorage.getItem('tipfans_user');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function Skeleton() {
  return (
    <div className="rounded-2xl bg-[#1B1F2A] ring-1 ring-white/10 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white/10 animate-pulse" />
        <div className="h-4 w-40 rounded bg-white/10 animate-pulse" />
      </div>
      <div className="mt-3 h-4 w-3/4 rounded bg-white/10 animate-pulse" />
      <div className="mt-2 h-4 w-1/2 rounded bg-white/10 animate-pulse" />
    </div>
  );
}

export default function CommunityPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [me, setMe] = useState<UserLite | null>(null);

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const authed = !!localStorage.getItem('tipfans_auth');
    setIsAuthed(authed);
    if (authed) getCurrentUser().then(setMe);
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const resp = await api<{ items: any[] }>('/api/wp/news?per_page=8&orderby=date&order=desc');
        const items = Array.isArray(resp.items) ? resp.items : [];
        const mapped: Article[] = items.map((p: any) => ({
          id: p?.id,
          title: p?.title ?? '',
          excerpt: p?.excerpt ?? '',
          cover: p?.cover ?? null,
          author: p?.author ?? p?.authorName ?? '',
          authorAvatar:
            p?.authorAvatar ||
            p?._embedded?.author?.[0]?.avatar_urls?.['96'] ||
            p?.author?.avatar?.full ||
            null,
          authorRole: p?.authorRole || p?.author?.role || null,
          authorHref:
            p?.hrefAuthor ||
            p?._embedded?.author?.[0]?.link ||
            (p?.authorSlug ? `/tipsters/${p.authorSlug}` : null),
          createdAt: p?.createdAt ?? p?.date ?? '',
          href: p?.hrefPost ?? `/news/${p?.id ?? ''}`,
        }));
        if (!cancel) setArticles(mapped);
      } catch {
        if (!cancel) setErr('Falha ao carregar comunidade.');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const stats = useMemo(() => ({ threads: 256, comments: 1492, online: 4987 }), []);

  return (
    <section className="relative w-full bg-[#1E1E1E] py-10">
      <div className="container mx-auto px-4">
        <header className="relative mb-8 overflow-hidden rounded-2xl ring-1 ">
          <div className="absolute inset-0 bg-[#ED4F00] " />
          <div className="relative px-5 py-8">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">Comunidade</h2>
            <p className="mt-1 text-white/80 text-sm md:text-base">
              Junte-se à conversa e compartilhe suas ideias.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <StatPill icon="💬" label="conversas" value={stats.threads} />
          <StatPill icon="💭" label="comentários" value={stats.comments} />
          <StatPill icon="🟢" label="membros online" value={stats.online} />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading && [1, 2, 3].map((k) => <Skeleton key={k} />)}

          {!loading && err && (
            <div className="rounded-2xl bg-[#1B1F2A] ring-1 ring-white/10 p-4 text-red-300">{err}</div>
          )}

          {!loading && !err && articles.length === 0 && (
            <div className="rounded-2xl bg-[#1B1F2A] ring-1 ring-white/10 p-4 text-white/80">
              Ainda não há artigos.
            </div>
          )}

          {!loading &&
            !err &&
            articles.map((a) => (
              <ArticleCard
                key={String(a.id)}
                article={a}
                isAuthed={isAuthed}
                currentUser={me}
                onRequireLogin={fireOpenLogin}
              />
            ))}
        </div>
      </div>
    </section>
  );
}

function StatPill({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#121722] ring-1 ring-white/10 px-4 py-3">
      <div className="text-white/80">{icon}</div>
      <div>
        <div className="text-white font-semibold">{value.toLocaleString('pt-PT')}</div>
        <div className="text-xs text-white/60">{label}</div>
      </div>
    </div>
  );
}
