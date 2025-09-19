'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Article = {
  id: string | number;
  title: string;
  excerpt?: string;
  cover?: string | null;
  author?: string;
  createdAt?: string;
  href?: string;
};

type UserLite = { id: string; name: string; avatar?: string | null };
type Comment = { id: string; author: UserLite; content: string; createdAt: string };

function fmtDateTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(+d)) return '';
  return d.toLocaleString('pt-PT');
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
    const text = await r.text().catch(() => '');
    throw new Error(`HTTP ${r.status} ${text}`);
  }
  return r.json();
}

function fireOpenLogin() {
  try { document.dispatchEvent(new CustomEvent('open-login')); } catch {}
}

/* ======== ÍCONES (inline svg) ======== */
const Heart = ({ filled, className = '' }: { filled?: boolean; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    {filled ? (
      <path
        fill="currentColor"
        d="M12.1 21.35 10 19.45C5.4 15.36 2 12.28 2 8.5 2 6 4 4 6.5 4c1.74 0 3.41.81 4.5 2.09C12.59 4.81 14.26 4 16 4 18.5 4 20.5 6 20.5 8.5c0 3.78-3.4 6.86-8 10.95l-0.4.35Z"
      />
    ) : (
      <path
        fill="currentColor"
        d="M16 5c-1.54 0-3.04.99-4 2.09C11.04 5.99 9.54 5 8 5 5.79 5 4 6.79 4 9c0 3.09 2.82 5.7 7.1 9.54l.9.82.9-.82C17.18 14.7 20 12.09 20 9c0-2.21-1.79-4-4-4Zm0-2c2.76 0 5 2.24 5 5 0 3.74-3.4 6.83-8.55 11.39L12 20.35l-.45-.41C6.4 14.83 3 11.74 3 8c0-2.76 2.24-5 5-5 1.87 0 3.53.93 4.5 2.36C12.47 3.93 14.13 3 16 3Z"
      />
    )}
  </svg>
);

const ShareIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
<path
  fill="currentColor"           // ← 1º fill
  d="M16 5a3 3 0 1 1 2.83 4H16a3 3 0 0 1 0-6h.17A3 3 0 0 1 16 5Zm-8 7a3 3 0 1 1-2.83 4H8a3 3 0 1 1 0-6h.17A3 3 0 0 1 8 12Zm10 0a3 3 0 1 1 2.83 4H18a3 3 0 1 1 0-6h.17A3 3 0 0 1 18 12ZM9 13.5l6-3M9 16.5l6 3"
  stroke="currentColor"
  strokeWidth="1.5"
                  // ← 2º fill (duplicado)
  strokeLinecap="round"
/>

  </svg>
);

const ChevronDown = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path fill="currentColor" d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41Z" />
  </svg>
);
/* ===================================== */

export default function Comunidade() {
  // ===== auth (troque pela sua store se já tiver) =====
  const [isAuthed, setIsAuthed] = useState(false);
  useEffect(() => {
    setIsAuthed(!!localStorage.getItem('tipfans_auth'));
  }, []);
  // ====================================================

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const resp = await api<{ items: any[] }>(
          '/api/wp/news?per_page=8&orderby=date&order=desc'
        );
        const items = Array.isArray(resp.items) ? resp.items : [];
        const mapped: Article[] = items.map((p: any) => ({
          id: p?.id,
          title: p?.title ?? '',
          excerpt: p?.excerpt ?? '',
          cover: p?.cover ?? null,
          author: p?.author ?? '',
          createdAt: p?.createdAt ?? '',
          href: p?.hrefPost ?? `/news/${p?.id ?? ''}`,
        }));
        if (!cancel) setArticles(mapped);
      } catch {
        if (!cancel) setErr('Falha ao carregar comunidade.');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  return (
    <section className="relative w-full bg-[#1E1E1E] py-10">
      <div className="container mx-auto px-4">
        {/* Cabeçalho */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">Comunidade</h2>
        </div>

        {/* CTA login */}
        {!isAuthed && (
          <div className="mb-6 rounded-xl bg-[#1B1F2A] ring-1 ring-white/10 p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold">Participe da conversa</p>
              <p className="text-white/70 text-sm">
                A leitura é livre. Para comentar, entre na sua conta.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fireOpenLogin}
                className="rounded-lg bg-[#ED4F00] px-3 py-1.5 text-sm font-semibold text-white"
              >
                Entrar
              </button>
              <Link
                href="/registrar"
                className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/15"
              >
                Criar conta
              </Link>
            </div>
          </div>
        )}

        {/* Feed */}
        <div className="space-y-4">
          {loading && [1,2,3].map(k => <SkeletonCard key={k} />)}

          {!loading && err && (
            <div className="rounded-xl bg-[#1B1F2A] ring-1 ring-white/10 p-4 text-red-300">
              {err}
            </div>
          )}

          {!loading && !err && articles.length === 0 && (
            <div className="rounded-xl bg-[#1B1F2A] ring-1 ring-white/10 p-4 text-white/80">
              Ainda não há artigos.
            </div>
          )}

          {!loading && !err && articles.map(a => (
            <ArticleCard
              key={String(a.id)}
              article={a}
              isAuthed={isAuthed}
              onRequireLogin={fireOpenLogin}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl bg-[#1B1F2A] ring-1 ring-white/10 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-white/10 animate-pulse" />
        <div className="h-4 w-40 rounded bg-white/10 animate-pulse" />
      </div>
      <div className="mt-3 h-4 w-3/4 rounded bg-white/10 animate-pulse" />
      <div className="mt-2 h-4 w-1/2 rounded bg-white/10 animate-pulse" />
    </div>
  );
}

/* ====== CARD DO ARTIGO (com curtir/partilhar/comentar) ====== */
function ArticleCard({
  article,
  isAuthed,
  onRequireLogin,
}: {
  article: Article;
  isAuthed: boolean;
  onRequireLogin: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [comment, setComment] = useState('');

  // like
  const likeKey = `tf_like_news_${article.id}`;
  const countKey = `tf_like_news_count_${article.id}`;
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  // share
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const lk = localStorage.getItem(likeKey);
    setLiked(lk === '1');
    const c = Number(localStorage.getItem(countKey) || '0');
    setLikes(Number.isFinite(c) ? c : 0);
  }, [likeKey, countKey]);

  const canSend = isAuthed && comment.trim().length >= 2;

  async function loadComments() {
    const resp = await fetch(
      `/api/community/news/${article.id}/comments?_=${Date.now()}`,
      { cache: 'no-store' }
    );
    if (!resp.ok) return setComments([]);
    const json = (await resp.json()) as { items: Comment[] };
    setComments(Array.isArray(json.items) ? json.items : []);
  }

  async function toggleComments() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && comments == null) {
      await loadComments();
    }
  }

  async function submit() {
    if (!isAuthed) {
      onRequireLogin();
      return;
    }
    if (!canSend) return;

    const r = await fetch(`/api/community/news/${article.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment.trim() }),
    });
    if (!r.ok) return;
    const json = (await r.json()) as { item: Comment };
    setComment('');
    setComments([...(comments ?? []), json.item]);
    setOpen(true);
  }

  function toggleLike() {
    const next = !liked;
    setLiked(next);
    localStorage.setItem(likeKey, next ? '1' : '0');
    setLikes((prev) => {
      const val = Math.max(0, prev + (next ? 1 : -1));
      localStorage.setItem(countKey, String(val));
      return val;
    });
  }

  function absoluteHref() {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    return article.href ? (article.href.startsWith('http') ? article.href : base + article.href) : base;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absoluteHref());
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  return (
    <article className="rounded-xl bg-[#1B1F2A] ring-1 ring-white/10 p-4 sm:p-5">
      {/* Header com imagem e meta */}
      <div className="flex gap-4">
        <div className="relative hidden sm:block h-20 w-32 overflow-hidden rounded-lg bg-white/10">
          {article.cover ? (
            <Image
              src={article.cover}
              alt={article.title}
              fill
              className="object-cover"
              sizes="128px"
              unoptimized
            />
          ) : (
            <div className="h-full w-full bg-white/10" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-white font-semibold leading-tight line-clamp-2">
            {article.title}
          </h3>
          <p className="text-[12px] text-white/60">
            {article.author ? `${article.author} • ` : ''}{fmtDateTime(article.createdAt)}
          </p>

          {article.excerpt ? (
            <p className="mt-2 text-sm text-white/80 line-clamp-3">{article.excerpt}</p>
          ) : null}

          {/* AÇÕES: Ver • Comentários • Curtir • Partilhar */}
          <div className="relative mt-3 flex flex-wrap items-center gap-3">
            {article.href ? (
              <Link
                href={article.href}
                className="rounded bg-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/15"
              >
                Ver artigo
              </Link>
            ) : null}

            <button
              className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/15"
              onClick={toggleComments}
              aria-expanded={open}
            >
              <span>Comentários{comments?.length != null ? ` (${comments.length})` : ''}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  open ? 'rotate-180' : 'rotate-0'
                }`}
              />
            </button>

            {/* Curtir */}
            <button
              onClick={toggleLike}
              className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${
                liked
                  ? 'bg-[#ED4F00]/20 text-[#FFB490]'
                  : 'bg-white/10 text-white/80 hover:bg-white/15'
              }`}
              aria-pressed={liked}
            >
              <Heart filled={liked} className="h-4 w-4" />
              <span>{likes}</span>
            </button>

            {/* Partilhar */}
            <div className="relative">
              <button
                onClick={() => setShareOpen((v) => !v)}
                className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs text-white/80 hover:bg-white/15"
              >
                <ShareIcon className="h-4 w-4" />
                Partilhar
              </button>

              {shareOpen && (
                <div
                  className="absolute z-10 mt-2 w-48 rounded-lg bg-[#11151f] p-2 ring-1 ring-white/10"
                  onMouseLeave={() => setShareOpen(false)}
                >
                  <ShareList url={absoluteHref()} onCopy={copyLink} copied={copied} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dropdown de comentários (feedback de abertura com chevron já no botão) */}
      {open && (
        <div className="mt-4 rounded-lg bg-black/20 p-3 ring-1 ring-white/5">
          {comments == null ? (
            <p className="text-sm text-white/60">A carregar comentários…</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-white/60">Seja o primeiro a comentar.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-3">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full bg-white/10">
                    <Image
                      src={c.author.avatar || '/user.png'}
                      alt={c.author.name}
                      fill
                      className="object-cover"
                      sizes="32px"
                      unoptimized
                    />
                  </div>
                  <div>
                    <p className="text-[12px] text-white/60">
                      <span className="font-semibold text-white">{c.author.name}</span>{' '}
                      • {fmtDateTime(c.createdAt)}
                    </p>
                    <p className="text-sm text-white/90">{c.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isAuthed ? 'Escreva um comentário…' : 'Entre na sua conta para comentar'
              }
              className="flex-1 rounded bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none ring-1 ring-white/10 focus:ring-[#ED4F00]/30 disabled:opacity-60"
              disabled={!isAuthed}
            />
            <button
              onClick={submit}
              disabled={!canSend}
              className={`rounded px-3 py-2 text-sm font-semibold ${
                canSend
                  ? 'bg-[#ED4F00] text-white hover:brightness-110'
                  : 'bg-white/10 text-white/40'
              }`}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

/* ====== LISTA DE PARTILHA ====== */
function ShareList({
  url,
  onCopy,
  copied,
}: {
  url: string;
  onCopy: () => void;
  copied: boolean;
}) {
  const enc = encodeURIComponent(url);
  const links = [
    { label: 'WhatsApp', href: `https://wa.me/?text=${enc}` },
    { label: 'X / Twitter', href: `https://twitter.com/intent/tweet?url=${enc}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
  ];

  return (
    <div className="space-y-1 text-sm">
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded px-2 py-1 text-white/80 hover:bg-white/10"
        >
          {l.label}
        </a>
      ))}
      <button
        onClick={onCopy}
        className="block w-full text-left rounded px-2 py-1 text-white/80 hover:bg-white/10"
      >
        {copied ? 'Link copiado!' : 'Copiar link'}
      </button>
    </div>
  );
}
