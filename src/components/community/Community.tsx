// src/components/community/Community.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FiUsers, FiMessageSquare, FiZap, FiShield, FiAward, FiMessageCircle, FiHeart, FiShare2 } from 'react-icons/fi';

/** dispara o painel de login via CustomEvent */
function openLogin() {
  try { document.dispatchEvent(new CustomEvent('open-login')); } catch {}
}

/** contador com easing cúbico para as estatísticas */
function useCountUp(target: number, durationMs = 1200) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, durationMs]);
  return val;
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10">
          <span className="text-lg text-[#ED4F00]">{icon}</span>
        </div>
        <div>
          <div className="text-lg font-extrabold text-white leading-none">{value}</div>
          <div className="text-xs text-white/65">{label}</div>
        </div>
      </div>
    </div>
  );
}

type WPItem = {
  id: number;
  title?: string;
  excerpt?: string;
  cover?: string | null;
  author?: string;
  authorAvatar?: string | null;
  authorHref?: string | null;
  href?: string | null;
  commentsCount?: number;
  likesCount?: number;
};

export default function Community() {
  const { user } = useAuth() || {};
  const isLogged = !!user;

  // stats
  const members = useCountUp(4823);
  const threads  = useCountUp(967);
  const liveNow  = useCountUp(128);

  // preview do artigo mais recente
  const [post, setPost] = useState<WPItem | null>(null);
  const [loading, setLoading] = useState(true);

  // caixa de comentário local (sempre visível)
  const [comment, setComment] = useState('');
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const u = new URL('/api/wp/news', window.location.origin);
        u.searchParams.set('per_page', '1');
        u.searchParams.set('orderby', 'date');
        u.searchParams.set('order', 'desc');
        u.searchParams.set('_', String(Date.now()));
        const r = await fetch(u.toString(), { cache: 'no-store' });
        const json = await r.json();
        const first = Array.isArray(json?.items) ? json.items[0] : null;
        if (!cancel && first) {
          setPost({
            id: first.id,
            title: first.title ?? '',
            excerpt: first.excerpt ?? '',
            cover: first.cover ?? null,
            author: first.author ?? first.authorName ?? first?._embedded?.author?.[0]?.name ?? 'Autor',
            authorAvatar:
              first.authorAvatar ||
              first?._embedded?.author?.[0]?.avatar_urls?.['96'] ||
              first?.author?.avatar?.full || null,
            authorHref:
              first.hrefAuthor ||
              first?._embedded?.author?.[0]?.link ||
              (first?.authorSlug ? `/tipsters/${first.authorSlug}` : null),
            href: first.hrefPost ?? `/news/${first?.id ?? ''}`,
            commentsCount: Number(first.commentsCount ?? 0),
            likesCount: Number(first.likesCount ?? 0),
          });
        }
      } catch {
        // silencioso
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const reactions = useMemo(
    () => [
      { key: 'like', emoji: '👍' },
      { key: 'fire', emoji: '🔥' },
      { key: 'bullseye', emoji: '🎯' },
      { key: 'clap', emoji: '👏' },
    ],
    []
  );

  // CTA único no rodapé do bloco
  const primaryCta = isLogged
    ? { label: 'Ir para a Comunidade', href: '/community', onClick: undefined as undefined | (() => void) }
    : { label: 'Entrar', href: '#login', onClick: openLogin as undefined | (() => void) };

  return (
    <section className="relative w-full bg-[#1E1E1E] py-10">
      <div className="container mx-auto px-4">
        {/* BLOCO ÚNICO */}
        <div className="rounded-2xl bg-[#1E1E1E]/70 backdrop-blur-md ring-1 ring-white/10 p-6 md:p-8">
          {/* Badges topo */}
          <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-wide text-white/70">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10">
              <FiShield className="text-[#ED4F00]" />
              Comunidade moderada
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10">
              <FiZap className="text-[#ED4F00]" />
              Tempo real
            </span>
          </div>

          {/* Título + subtítulo */}
          <h2 className="text-3xl text-center md:text-5xl font-extrabold tracking-tight text-white mt-5">
            Participe da <span className="text-[#ED4F00]">Comunidade TipFans</span>
          </h2>
          <p className="mt-8 text-white/80 text-center">
            Tire dúvidas, compartilhe estratégias e acompanhe discussões ao vivo. Um espaço seguro,
            ativo e feito para quem vive o mercado.
          </p>

          {/* Estatísticas */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard icon={<FiUsers />} value={members.toLocaleString('pt-PT')} label="membros" />
            <StatCard icon={<FiMessageSquare />} value={threads.toLocaleString('pt-PT')} label="conversas" />
            <StatCard icon={<FiZap />} value={liveNow.toLocaleString('pt-PT')} label="online agora" />
          </div>

          {/* Divider suave */}
          <div className="mt-8 h-px w-full bg-white/10" />

          {/* Preview do artigo mais recente — dentro do mesmo bloco */}
          <div className="mt-6">
            {loading ? (
              <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/10 animate-pulse" />
                  <div className="h-4 w-40 rounded bg-white/10 animate-pulse" />
                </div>
                <div className="mt-3 h-4 w-3/4 rounded bg-white/10 animate-pulse" />
                <div className="mt-2 h-4 w-1/2 rounded bg-white/10 animate-pulse" />
                <div className="mt-4 h-28 w-full rounded-xl bg-white/5 animate-pulse" />
              </div>
            ) : post ? (
              <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 sm:p-5">
                {/* header */}
                <div className="flex items-start gap-3">
                  {/* info autor */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10 shrink-0">
                        {post.authorAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.authorAvatar}
                            alt={post.author ?? ''}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-semibold leading-tight">
                          {post.author}
                          <span className="mx-1 text-white/40">•</span>
                          <span className="text-white/60">TipFans</span>
                        </div>
                      </div>
                    </div>

                    {/* título */}
                    <h3 className="mt-2 text-white text-lg sm:text-xl font-semibold">
                      {post.title}
                    </h3>

                    {/* excerpt */}
                    <p className="mt-1 text-white/80 text-sm">
                      {post.excerpt}
                    </p>

                    {/* ações principais */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Link
                        href={post.href || '#'}
                        className="inline-flex items-center rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15 ring-1 ring-white/10 transition"
                      >
                        Ver artigo
                      </Link>

                      <span className="inline-flex items-center gap-1 rounded bg-white/5 px-3 py-1.5 text-xs text-white/70 ring-1 ring-white/10">
                        <FiMessageCircle /> {post.commentsCount ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-white/5 px-3 py-1.5 text-xs text-white/70 ring-1 ring-white/10">
                        <FiHeart /> {post.likesCount ?? 0}
                      </span>

                      <button
                        onClick={openLogin}
                        className="inline-flex items-center gap-1 rounded bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 ring-1 ring-white/10 transition"
                      >
                        <FiShare2 /> Partilhar
                      </button>
                    </div>
                  </div>

                  {/* capa à direita (sm+) */}
                  {post.cover ? (
                    <div className="hidden sm:block shrink-0">
                      <div className="relative h-24 w-40 overflow-hidden rounded-xl ring-1 ring-white/10">
                        <Image
                          src={post.cover}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="160px"
                          priority={false}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* reações com emojis */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {reactions.map((r) => (
                    <button
                      key={r.key}
                      onClick={openLogin}
                      className="rounded-full bg-white/10 px-3 py-1 text-sm ring-1 ring-white/10 text-white hover:bg-white/15 transition"
                      title="Reagir (requer login)"
                      aria-label={`Reagir ${r.emoji}`}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </div>

                {/* caixa de comentários */}
                <div className="mt-3">
                  <div className="rounded-lg bg-[#0F131C] ring-1 ring-white/10">
                    <textarea
                      ref={inputRef}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Seja o primeiro a comentar."
                      className="w-full resize-none rounded-lg bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/50 outline-none"
                      rows={2}
                    />
                    <div className="flex items-center justify-between px-3 pb-2">
                      <div className="flex gap-1">
                        {['😀', '😮', '😢', '😡', '🔥'].map((em) => (
                          <button
                            key={em}
                            onClick={openLogin}
                            className="px-2 py-1 text-base rounded hover:bg-white/10 transition text-white/90"
                            title="Inserir emoji (requer login)"
                          >
                            {em}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={openLogin}
                        className="inline-flex items-center rounded bg-[#ED4F00] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-95 transition"
                      >
                        Publicar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* CTA + selo — NO FINAL DO BLOCO */}
          <div className="mt-8 flex flex-col items-center gap-3">
            {primaryCta.onClick ? (
              <button
                onClick={primaryCta.onClick}
                className="inline-flex items-center rounded-xl bg-[#ED4F00] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(237,79,0,0.20)] hover:opacity-95 transition"
              >
                {primaryCta.label}
              </button>
            ) : (
              <Link
                href={primaryCta.href}
                className="inline-flex items-center rounded-xl bg-[#ED4F00] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(237,79,0,0.20)] hover:opacity-95 transition"
              >
                {primaryCta.label}
              </Link>
            )}

            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10 text-xs text-white/80">
              <FiAward className="text-[#ED4F00]" />
              Dica do dia exclusiva para membros
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
