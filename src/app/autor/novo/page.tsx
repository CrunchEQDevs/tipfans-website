// src/app/autor/novo/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

type MediaResp = { ok?: boolean; media?: { id?: number; url?: string | null }; error?: string };
type PostResp  = { ok?: boolean; post?: { id?: number; link?: string | null }; error?: string };

export default function NovoArtigoPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'draft' | 'publish'>('draft');
  const [featuredId, setFeaturedId] = useState<number | null>(null);
  const [featuredUrl, setFeaturedUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/login'); return; }
    const role = (user.role ?? '').toLowerCase();
    if (role !== 'author' && role !== 'administrator') { router.push('/perfil'); }
  }, [user, loading, router]);

  async function onPickFile(file?: File) {
    if (!file) return;
    setErr(null); setMsg(null);
    const fd = new FormData();
    fd.append('file', file);
    setBusy(true);
    try {
      const r = await fetch('/api/wp/media', { method: 'POST', body: fd });
      const j = (await r.json().catch(() => ({}))) as MediaResp;
      if (!r.ok || !j.ok || !j.media?.id) throw new Error(j.error || 'Falha ao enviar imagem');
      setFeaturedId(j.media.id!);
      setFeaturedUrl(j.media.url ?? null);
      setMsg('Imagem enviada ✅');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha no upload');
    } finally { setBusy(false); }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (!title.trim()) { setErr('Informe um título'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/wp/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content,                // HTML simples (o preview abaixo já mostra exatamente isso)
          status,
          featured_media: featuredId ?? undefined,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as PostResp;
      if (!r.ok || !j.ok || !j.post?.id) throw new Error(j.error || 'Falha ao criar artigo');

      setMsg('Artigo criado ✅');

      if (status === 'draft') {
        // rascunho → vai para o editor com preview inicial
        const id = String(j.post.id);
        router.replace((`/autor/editar/${id}?preview=1`) as Route);
      } else {
        // publicado → dashboard
        router.replace('/autor');
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao criar artigo');
    } finally { setBusy(false); }
  }

  const previewHtml = useMemo(() => {
    const safe = content?.trim() || '<p><em>Sem conteúdo…</em></p>';
    return { __html: safe };
  }, [content]);

  if (loading || !user) {
    return <main className="min-h-[60vh] grid place-items-center">A carregar…</main>;
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="text-xl font-semibold">Novo artigo</h1>
        {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
        {msg && <p className="text-sm text-green-600 dark:text-green-400">{msg}</p>}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Editor */}
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Título</label>
              <input
                className="w-full rounded-lg border px-3 py-2 dark:border-white/10 dark:bg-white/10"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Escreve o título…"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Conteúdo (HTML simples ou Markdown leve)</label>
              <textarea
                className="w-full min-h-[220px] rounded-lg border px-3 py-2 font-mono text-sm dark:border-white/10 dark:bg-white/10"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="<p>O teu conteúdo…</p>"
              />
              <p className="mt-1 text-xs text-gray-500">O que escreveres aqui aparece na pré-visualização ao lado.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Imagem destacada</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer rounded-lg bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-800 dark:bg-white/10 dark:hover:bg-white/20">
                  Escolher imagem
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onPickFile(e.target.files?.[0] ?? undefined)}
                  />
                </label>
                {featuredUrl && <span className="text-xs text-gray-600">✔ enviada</span>}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={status === 'draft'}
                  onChange={() => setStatus('draft')}
                  className="mr-2"
                />
                Rascunho
              </label>
              <label className="text-sm">
                <input
                  type="radio"
                  name="status"
                  value="publish"
                  checked={status === 'publish'}
                  onChange={() => setStatus('publish')}
                  className="mr-2"
                />
                Publicar
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {busy ? 'A guardar…' : status === 'draft' ? 'Salvar rascunho' : 'Publicar'}
              </button>
              <button
                type="button"
                onClick={() => router.replace('/autor')}
                className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20"
              >
                Cancelar
              </button>
            </div>
          </form>

          {/* Pré-visualização ao vivo */}
          <aside className="space-y-3">
            <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">Pré-visualização</div>

              {featuredUrl ? (
                <div className="mb-3 overflow-hidden rounded-lg">
                  <Image
                    src={featuredUrl}
                    alt="Imagem destacada"
                    width={960}
                    height={540}
                    className="h-auto w-full"
                    unoptimized
                    priority={false}
                  />
                </div>
              ) : null}

              <h2 className="mb-2 text-2xl font-semibold">{title || '(Sem título)'}</h2>

              <article className="prose prose-sm max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={previewHtml} />
              </article>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
