// src/app/autor/editar/[id]/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type PostData = {
  id: number;
  title: string;
  content: string;   // HTML do WP (rendered) — vamos editar como HTML simples
  status: 'draft' | 'publish' | string;
  featured_media: number | null;
  link: string | null;
};

export default function EditarArtigoPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();


  const [post, setPost] = useState<PostData | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // editor simples (HTML)
  const [status, setStatus] = useState<'draft' | 'publish'>('draft');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [featuredUrl, setFeaturedUrl] = useState<string | null>(null);
  const [featuredId, setFeaturedId] = useState<number | null>(null);


  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/login'); return; }
    const role = (user.role ?? '').toLowerCase();
    if (role !== 'author' && role !== 'administrator') { router.push('/perfil'); return; }

    (async () => {
      try {
        const r = await fetch(`/api/wp/posts/${params.id}`, { cache: 'no-store' });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || 'Falha ao carregar post');

        const p = j.post as PostData;
        setPost(p);
        setTitle(p.title ?? '');
        // conteúdo vem renderizado; se quiseres editar "raw", é preciso buscar content.raw com context=edit no WP;
        // neste primeiro passo, editamos como HTML simples (funciona).
        setContent(p.content ?? '');
        setStatus((p.status as 'draft' | 'publish') ?? 'draft');
        setFeaturedId(p.featured_media ?? null);
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Erro ao carregar post');
      }
    })();
  }, [user, loading, router, params.id]);

  async function onPickFile(file?: File) {
    if (!file) return;
    setErr(null); setMsg(null);
    const fd = new FormData();
    fd.append('file', file);
    setBusy(true);
    try {
      const r = await fetch('/api/wp/media', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok || !j?.ok || !j?.media?.id) throw new Error(j?.error || 'Falha ao enviar imagem');
      setFeaturedId(j.media.id as number);
      setFeaturedUrl(j.media.url ?? null);
      setMsg('Imagem enviada ✅');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha no upload');
    } finally {
      setBusy(false);
    }
  }

  async function onSave(e?: React.FormEvent) {
    e?.preventDefault?.();
    setErr(null); setMsg(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/wp/posts/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content, // HTML simples
          status,
          featured_media: featuredId ?? undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'Falha ao guardar');

      setMsg(status === 'publish' ? 'Publicado ✅' : 'Rascunho guardado ✅');
      if (j.post?.link) {
        setPost((old) => (old ? { ...old, link: j.post.link, status: j.post.status ?? status } : old));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao guardar');
    } finally {
      setBusy(false);
    }
  }

  const previewPane = useMemo(() => {
    return (
      <div className="rounded-xl border p-3 bg-white dark:bg-white/5 dark:border-white/10">
        <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">Pré-visualização</div>
        <article className="prose prose-sm max-w-none dark:prose-invert">
          {/* Atenção: content é html simples — vindo do próprio autor — renderizamos diretamente */}
          <div dangerouslySetInnerHTML={{ __html: content || '<p><em>Sem conteúdo…</em></p>' }} />
        </article>
      </div>
    );
  }, [content]);

  if (loading || !post) {
    return <main className="min-h-[60vh] grid place-items-center text-gray-600 dark:text-gray-300">A carregar…</main>;
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Editar artigo</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {busy ? 'A guardar…' : 'Guardar'}
            </button>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value === 'publish' ? 'publish' : 'draft')}
              className="rounded-lg border px-3 py-2 dark:border-white/10 dark:bg-white/10"
              aria-label="Estado do artigo"
            >
              <option value="draft">Rascunho</option>
              <option value="publish">Publicar</option>
            </select>
          </div>
        </div>

        {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
        {msg && <p className="text-sm text-green-600 dark:text-green-400">{msg}</p>}

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Editor */}
          <form onSubmit={onSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Título</label>
              <input
                className="w-full rounded-lg border px-3 py-2 dark:border-white/10 dark:bg-white/10"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Conteúdo (HTML simples)</label>
              <textarea
                className="w-full min-h-[260px] rounded-lg border px-3 py-2 font-mono text-sm dark:border-white/10 dark:bg-white/10"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">Dica: podes colar HTML básico (parágrafos, títulos, listas, imagens).</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Imagem destacada</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer rounded-lg bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-800 dark:bg-white/10 dark:hover:bg-white/20">
                  Escolher imagem
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0] ?? undefined)} />
                </label>
                {featuredUrl && <span className="text-xs text-gray-600">✔ enviada</span>}
              </div>
            </div>
          </form>

          {/* Preview */}
          <div className="space-y-3">
            {previewPane}
            {post.link && post.status === 'publish' && (
              <a
                href={post.link}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Ver publicado
              </a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
