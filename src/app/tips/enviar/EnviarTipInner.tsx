'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

type CreateResp = {
  ok?: boolean;
  tip?: { id: number; link?: string };
  error?: string;
};

type MediaResp = {
  ok?: boolean;
  media?: { id?: number; url?: string | null };
  error?: string;
};

async function fetchSafeJSON(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ res: Response; data: unknown; text: string }> {
  const res = await fetch(input, init);
  const text = await res.text();
  let data: unknown = null;
  try { data = JSON.parse(text); } catch { data = null; }
  return { res, data, text };
}

export default function EnviarTipPage() {
  const qs = useSearchParams();

  const [title, setTitle] = useState('');
  const [sport, setSport] = useState('Futebol');
  const [league, setLeague] = useState('');
  const [teams, setTeams] = useState('');
  const [pick, setPick] = useState('');
  const [odds, setOdds] = useState<string>('');
  const [content, setContent] = useState('');

  const [featuredUrl, setFeaturedUrl] = useState<string | null>(null);
  const [featuredId, setFeaturedId] = useState<number | null>(null);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [agree, setAgree] = useState(false);

  useEffect(() => {
    if (!qs) return;
    const t = qs.get('title'); if (t) setTitle(t);
    const sp = qs.get('sport'); if (sp) setSport(sp);
    const lg = qs.get('league'); if (lg) setLeague(lg);
    const tm = qs.get('teams'); if (tm) setTeams(tm);
    const pk = qs.get('pick'); if (pk) setPick(pk);
    const od = qs.get('odds'); if (od) setOdds(od);
  }, [qs]);

  async function onPickFile(file?: File) {
    if (!file) return;
    setErr(null); setMsg(null);
    const fd = new FormData();
    fd.append('file', file);
    setBusy(true);
    try {
      const { res, data } = await fetchSafeJSON('/api/wp/media', { method: 'POST', body: fd });
      const ok = (data as MediaResp | null)?.ok;
      const media = (data as MediaResp | null)?.media;

      if (!res.ok || !ok || !media?.id) {
        const apiErr = (data as MediaResp | null)?.error;
        throw new Error(apiErr || `Falha ao enviar imagem (HTTP ${res.status})`);
      }
      setFeaturedId(media.id as number);
      setFeaturedUrl(media.url ?? null);
      setMsg('Imagem enviada ✅');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha no upload');
    } finally {
      setBusy(false);
    }
  }

  async function onPublish(e?: React.FormEvent) {
    e?.preventDefault?.();
    if (!agree) { setErr('É necessário aceitar a responsabilidade pelas informações.'); return; }
    if (!title.trim()) { setErr('Título é obrigatório.'); return; }

    setErr(null); setMsg(null);
    setBusy(true);
    try {
      const payload = {
        title: title.trim(),
        content,
        status: 'publish' as const,
        featured_media: featuredId ?? undefined,
        meta: {
          sport: sport || undefined,
          league: league || undefined,
          teams: teams || undefined,
          pick: pick || undefined,
          odds: odds || undefined,
        },
      };

      const { res, data } = await fetchSafeJSON('/api/wp/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const ok = (data as CreateResp | null)?.ok;
      if (!res.ok || !ok) {
        const apiErr = (data as CreateResp | null)?.error;
        throw new Error(apiErr || `Falha ao publicar (HTTP ${res.status})`);
      }

      setMsg('Publicado ✅');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Erro ao publicar');
    } finally {
      setBusy(false);
    }
  }

  const previewCard = useMemo(() => {
    return (
      <article className="group rounded-xl overflow-hidden border border-gray-200 bg-white hover:shadow-md transition">
        <div className="relative aspect-[16/10] overflow-hidden">
          {featuredUrl ? (
            <Image
              src={featuredUrl}
              alt={title || 'Pré-visualização'}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="h-full w-full bg-gray-100 grid place-items-center text-sm text-gray-500">
              Sem imagem
            </div>
          )}
          {!!pick && (
            <span className="absolute top-2 left-2 rounded-md bg-black/60 text-white text-[11px] px-2 py-0.5 backdrop-blur">
              {pick}
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs text-gray-500 mb-1">
            {sport || '—'} {league ? `• ${league}` : ''}
          </p>
          <h3 className="text-sm font-semibold line-clamp-2">{title || 'Sem título…'}</h3>
          <p className="mt-1 text-xs text-gray-700">
            {teams || '—'} {odds ? `• @${odds}` : ''}
          </p>
          <p className="mt-2 text-[11px] text-gray-500">por Você</p>
        </div>
      </article>
    );
  }, [featuredUrl, title, sport, league, teams, odds, pick]);

  return (
    <main className="min-h-screen bg-[#F5EFE6] text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">Publicar Tip</h1>
          <Link href="/tips/utilizadores" className="text-sm underline hover:no-underline">Voltar</Link>
        </div>

        {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
        {msg && <p className="mb-3 text-sm text-green-700">{msg}</p>}

        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={onPublish} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Título *</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Mais de 2.5 golos no clássico"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Desporto</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  placeholder="Futebol, Basquete…"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Liga</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={league}
                  onChange={(e) => setLeague(e.target.value)}
                  placeholder="Liga PT, Premier League…"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Equipas/Jogo</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                value={teams}
                onChange={(e) => setTeams(e.target.value)}
                placeholder="Benfica vs Porto"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Pick</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={pick}
                  onChange={(e) => setPick(e.target.value)}
                  placeholder="Mais de 2.5 / BTTS Sim / 1X / etc."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Odds</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={odds}
                  onChange={(e) => setOdds(e.target.value)}
                  placeholder="1.80"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Descrição (opcional – HTML simples)</label>
              <textarea
                className="w-full min-h-[160px] rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="<p>Justifica a tua pick aqui…</p>"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Imagem</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800">
                  Escolher imagem
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0] ?? undefined)} />
                </label>
                {featuredUrl && <span className="text-xs text-gray-600">✔ imagem anexada</span>}
              </div>
            </div>

            <label className="mt-2 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>Declaro que sou o responsável pelas informações desta tip e compreendo que não constitui recomendação financeira.</span>
            </label>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={!agree || busy}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 disabled:opacity-60"
                aria-label="Publicar tip"
              >
                {busy ? 'A publicar…' : 'Publicar agora'}
              </button>
              <span className="text-xs text-gray-600">Será publicada imediatamente.</span>
            </div>
          </form>

          <div className="space-y-3">
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="mb-2 text-sm text-gray-500">Pré-visualização</div>
              {previewCard}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="mb-2 text-sm text-gray-500">Descrição (HTML)</div>
              <article className="prose prose-sm max-w-none">
                <div
                  dangerouslySetInnerHTML={{
                    __html: content || '<p><em>Sem descrição…</em></p>',
                  }}
                />
              </article>
            </div>

            <Link
              href="/tips/utilizadores"
              className="inline-block rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            >
              Ir para a listagem de tips
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
