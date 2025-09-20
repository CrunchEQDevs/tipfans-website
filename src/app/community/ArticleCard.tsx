'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Article, Comment, UserLite } from './types';
import { fmtDateTime } from './types';


export default function ArticleCard({
  article,
  isAuthed,
  currentUser,
  onRequireLogin,
}: {
  article: Article;
  isAuthed: boolean;
  currentUser: UserLite | null;
  onRequireLogin: () => void;
}) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Carrega comentários SEMPRE e inicia truncado (2)
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`/api/community/news/${article.id}/comments?_=${Date.now()}`, {
          cache: 'no-store',
        });
        if (!resp.ok) {
          setComments([]);
          setShowAll(false);
          return;
        }
        const json = (await resp.json()) as { items: Comment[] };
        setComments(Array.isArray(json.items) ? json.items : []);
      } finally {
        setShowAll(false);
      }
    })();
  }, [article.id]);

  const total = comments?.length ?? 0;
  const commentsToRender = useMemo(
    () => (!comments ? [] : showAll ? comments : comments.slice(0, 2)),
    [comments, showAll]
  );

  // Like local
  const likeKey = `tf_like_news_${article.id}`;
  const countKey = `tf_like_news_count_${article.id}`;
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  useEffect(() => {
    const lk = localStorage.getItem(likeKey);
    setLiked(lk === '1');
    const c = Number(localStorage.getItem(countKey) || '0');
    setLikes(Number.isFinite(c) ? c : 0);
  }, [likeKey, countKey]);

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
    } catch {}
  }

  // Ícones inline (para manter só 4 arquivos)
  const HeartIcon = ({ filled, className = '' }: { filled?: boolean; className?: string }) => (
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
        d="M9 13.5l6-3M9 16.5l6 3M16 5a3 3 0 1 1 2.83 4H16a3 3 0 0 1 0-6h.17A3 3 0 0 1 16 5Zm-8 7a3 3 0 1 1-2.83 4H8a3 3 0 1 1 0-6h.17A3 3 0 0 1 8 12Zm10 0a3 3 0 1 1 2.83 4H18a3 3 0 1 1 0-6h.17A3 3 0 0 1 18 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const CommentIcon = ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M4 6a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H10l-4 4v-4a4 4 0 0 1-2-3V6Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );

  return (
    <article className="rounded-2xl bg-[#1B1F2A] ring-1 ring-white/10 p-4 sm:p-5">
      {/* Header autor */}
      <div className="flex items-start gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
          <Image
            src={article.authorAvatar || '/user.png'}
            alt={article.author || 'Autor'}
            fill
            className="object-cover"
            sizes="40px"
            unoptimized
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {article.authorHref ? (
              <Link href={article.authorHref} className="font-semibold text-white hover:underline line-clamp-1">
                {article.author || 'Usuário'}
              </Link>
            ) : (
              <span className="font-semibold text-white line-clamp-1">{article.author || 'Usuário'}</span>
            )}
            {article.authorRole && (
              <span className="rounded-full bg-white/10 px-2 py-[2px] text-[10px] font-medium text-white/70">
                {article.authorRole}
              </span>
            )}
            <span className="text-[12px] text-white/50">• {fmtDateTime(article.createdAt)}</span>
          </div>

          <h3 className="mt-1 text-lg font-semibold leading-tight text-white line-clamp-2">{article.title}</h3>
          {article.excerpt ? <p className="mt-2 text-sm text-white/80 line-clamp-3">{article.excerpt}</p> : null}
        </div>

        {/* Capa */}
        <div className="relative hidden md:block h-20 w-32 overflow-hidden rounded-lg bg-white/10">
          {article.cover ? (
            <Image src={article.cover} alt={article.title} fill className="object-cover" sizes="128px" unoptimized />
          ) : (
            <div className="h-full w-full bg-white/10" />
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="relative mt-3 flex flex-wrap items-center gap-3">
        {article.href ? (
          <Link href={article.href} className="rounded bg-white/10 px-3 py-1.5 text-xs text-white/90 hover:bg-white/15">
            Ver artigo
          </Link>
        ) : null}

        <div className="inline-flex items-center gap-1 rounded bg-white/10 px-2.5 py-1 text-xs text-white/80">
          <CommentIcon className="h-4 w-4" />
          <span>{total}</span>
        </div>

        <button
          onClick={toggleLike}
          className={`inline-flex items-center gap-1 rounded px-3 py-1.5 text-xs font-semibold ${
            liked ? 'bg-[#ED4F00]/20 text-[#FFB490]' : 'bg-white/10 text-white/80 hover:bg-white/15'
          }`}
          aria-pressed={liked}
        >
          <HeartIcon filled={liked} className="h-4 w-4" />
          <span>{likes}</span>
        </button>

        <button
          type="button"
          className="inline-flex items-center gap-1 rounded bg-white/10 px-3 py-1.5 text-xs text-white/80 hover:bg-white/15"
          onClick={copyLink}
        >
          <ShareIcon className="h-4 w-4" />
          Partilhar
        </button>
      </div>

      {/* Comentários + Composer */}
      <div className="mt-4 space-y-3">
        <div className="rounded-lg bg-[#151A24] p-3 ring-1 ring-white/10">
          {comments == null ? (
            <p className="text-sm text-white/60">A carregar comentários…</p>
          ) : total === 0 ? (
            <p className="text-sm text-white/60">Seja o primeiro a comentar.</p>
          ) : (
            <>
              <ul className="space-y-3">
                {commentsToRender.map((c) => (
                  <li key={String(c.id)} className="flex gap-3">
                    <div className="relative h-8 w-8 overflow-hidden rounded-full bg-white/10">
                      <Image
                        src={c.author.avatar || '/user.png'}
                        alt={String(c.author.name)}
                        fill
                        className="object-cover"
                        sizes="32px"
                        unoptimized
                      />
                    </div>
                    <div>
                      <p className="text-[12px] text-white/60">
                        <span className="font-semibold text-white">{c.author.name}</span> • {fmtDateTime(c.createdAt)}
                      </p>
                      <p className="text-sm text-white/90">{c.content}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {total > 2 && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowAll((v) => !v)}
                    className="w-full rounded-md bg-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/15"
                  >
                    {showAll ? 'Ver menos' : `Ver mais comentários (${total - 2})`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Composer */}
        
      </div>
    </article>
  );
}
