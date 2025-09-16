// app/tips/[slug]/[id-or-tipsnews]/page.tsx  (cliente)
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TipBanner from './TipBanner';

/* ------------ Tip type ------------ */
type Tip = {
  id: string | number;
  title: string;
  sport: 'futebol' | 'basquete' | 'tenis' | 'esports';
  league?: string;
  teams?: string;
  pick?: string;
  odds?: string | number;
  author?: string;
  createdAt?: string;
  bannerImage?: string;
  cover?: string | null;
  coverCaption?: string | null;
  contentHtml?: string;
};

/* ------------ utils ------------ */
function normalizeSport(raw?: string): Tip['sport'] {
  const s = (raw || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  if (s.includes('esport')) return 'esports';
  if (s.startsWith('basq') || s.includes('basket')) return 'basquete';
  if (s.startsWith('ten')) return 'tenis';
  return 'futebol';
}

function extractNumericIdFromParams(p: Record<string, unknown>): string {
  const candidates = [
    String(p?.id ?? ''),
    String(p?.tipsnews ?? ''),
    String(p?.tip ?? ''),
    String(p?.slug2 ?? ''),
  ].filter(Boolean);
  const joined = candidates.find(Boolean) || '';
  return joined.match(/\d+/)?.[0] ?? '';
}

function formatPt(dateIso?: string) {
  if (!dateIso) return '';
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return dateIso;
  return d.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ------------ Page ------------ */
export default function Page() {
  const params = useParams<Record<string, string>>();
  const router = useRouter();

  const routeSport = normalizeSport(params?.slug);
  const tipId = extractNumericIdFromParams(params);

  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setNotFound(false);

        if (!tipId) {
          setNotFound(true);
          setTip(null);
          return;
        }

        // ✅ usa o endpoint novo /api/wp/tips/[id]
        const res = await fetch(`/api/wp/tips/${tipId}?_=${Date.now()}`, {
          cache: 'no-store',
        });

        if (res.status === 404) {
          if (!cancel) {
            setNotFound(true);
            setTip(null);
          }
          return;
        }
        if (!res.ok) throw new Error('API falhou');

        const data = (await res.json()) as Partial<Tip> & Record<string, any>;
        if (cancel) return;

        const sport = normalizeSport(data.sport || routeSport);

        setTip({
          id: data.id ?? tipId,
          title: data.title ?? '',
          sport,
          league: data.league,
          teams: data.teams,
          pick: data.pick,
          odds: data.odds,
          author: data.author,
          createdAt: data.createdAt ?? data.date ?? data.date_gmt,
          cover: data.cover ?? data.bannerImage ?? null,
          coverCaption: data.coverCaption ?? null,
          contentHtml:
            data.contentHtml ??
            (typeof data.content === 'object'
              ? data.content?.rendered
              : data.content) ??
            '',
        });
      } catch {
        if (!cancel) {
          setNotFound(true);
          setTip(null);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [tipId, routeSport]);

  const headerTitle = useMemo(
    () => tip?.teams || tip?.title || 'Pré-jogo',
    [tip?.teams, tip?.title]
  );

  /* ---------- loading ---------- */
  if (loading) {
    return (
      <main className="bg-[#1E1E1E] text-white">
        <TipBanner />
        <div className="mx-auto w-full max-w-7xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-40 bg-white/10 rounded" />
            <div className="h-64 bg-white/10 rounded-xl" />
            <div className="h-4 w-3/4 bg-white/10 rounded" />
            <div className="h-4 w-2/3 bg-white/10 rounded" />
          </div>
        </div>
      </main>
    );
  }

  /* ---------- id inválido ---------- */
  if (!tipId) {
    return (
      <main className="min-h-[60vh] bg-[#1E1E1E] text-white px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm opacity-80">ID inválido.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            Voltar
          </button>
        </div>
      </main>
    );
  }

  /* ---------- não encontrado ---------- */
  if (notFound || !tip) {
    return (
      <main className="min-h-[60vh] bg-[#1E1E1E] text-white px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm opacity-80">Tip não encontrada.</p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => router.back()}
              className="rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
            >
              Voltar
            </button>
            <Link
              href={`/tips/${params?.slug || routeSport}`}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold hover:bg-orange-700"
            >
              Ver todas as tips de {params?.slug || routeSport}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#1E1E1E] text-white ">
      <TipBanner />
      <h1 className="sr-only">{headerTitle}</h1>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA PRINCIPAL */}
        <article className="lg:col-span-2">
          {/* Autor */}
          <div className="mb-4 rounded-md bg-white/5 ring-1 ring-white/10 px-3 py-2 text-sm text-white/80">
            <div className="inline-flex items-center gap-2">
              <Image
                src="/user.png"
                alt="Autor"
                width={24}
                height={24}
                className="object-contain w-6 h-6 rounded"
                priority
              />
              <span className="opacity-95">{tip.author || '—'}</span>
            </div>
          </div>

          {/* Capa + legenda */}
          <div className="overflow-hidden rounded-xl ring-1 ring-white/10 bg-black/20">
            <div className="relative w-full aspect-[16/9]">
              <Image
                src={tip.cover || '/B_tips/jogador.png'}
                alt={tip.title || ''}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 66vw, 100vw"
                priority
              />
            </div>
            {tip.coverCaption ? (
              <div className="px-4 py-2 text-[12px] text-white/70">
                {tip.coverCaption}
              </div>
            ) : null}
          </div>

          {/* Conteúdo */}
          {tip.contentHtml ? (
            <div
              className="
                prose prose-invert max-w-none mt-6
                prose-headings:text-white prose-h2:text-xl prose-h3:text-lg
                prose-p:text-white/90 prose-li:text-white/90
                prose-a:text-orange-400 hover:prose-a:text-orange-300
                prose-strong:text-white
              "
              dangerouslySetInnerHTML={{ __html: tip.contentHtml }}
            />
          ) : (
            <div className="mt-6 rounded-md bg-white/5 ring-1 ring-white/10 p-4 text-sm text-white/80">
              Esta tip ainda não tem conteúdo publicado.
            </div>
          )}

          {/* Meta final */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/90 to-transparent my-6" />
          <div className="rounded-md bg-white/5 ring-1 ring-white/10 px-3 py-3">
            <div className="text-[12px] text-white/70">
              Updated: {formatPt(tip.createdAt) || '--'}
            </div>
            <div className="mt-2 inline-flex items-center gap-2">
              <Image
                src="/user.png"
                alt="Autor"
                width={24}
                height={24}
                className="object-contain w-6 h-6 rounded"
                priority
              />
              <span className="opacity-95 text-sm">{tip.author || '—'}</span>
            </div>
          </div>
        </article>

        {/* SIDEBAR */}
        <aside className="space-y-4 mt-8 lg:mt-0">
          <div className="mb-2">
            <button
              onClick={() => router.push(`/tips/${params?.slug || routeSport}`)}
              className="rounded-md bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
              aria-label="Voltar às tips"
              title="Voltar às tips"
            >
              ← Voltar às tips
            </button>
          </div>

          <div className="rounded-xl bg-[#22252e] ring-1 ring-white/10 p-4">
            <h3 className="text-xl font-semibold mb-4">
              Veja todas as nossas previsões
            </h3>
            <div className="space-y-2">
              <Link className="group flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-sm hover:bg-white/10" href="/tips/futebol">
                Ver dicas de Futebol
                <span className="opacity-70 group-hover:opacity-100 font-bold text-[30px]">›</span>
              </Link>
              <Link className="group flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-sm hover:bg-white/10" href="/tips/basquete">
                Ver dicas de Basquete
                <span className="opacity-70 group-hover:opacity-100 font-bold text-[30px]">›</span>
              </Link>
              <Link className="group flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-sm hover:bg-white/10" href="/tips/tenis">
                Ver dicas de Ténis
                <span className="opacity-70 group-hover:opacity-100 font-bold text-[30px]">›</span>
              </Link>
              <Link className="group flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-sm hover:bg-white/10" href="/tips/esports">
                Ver dicas de E-sports
                <span className="opacity-70 group-hover:opacity-100 font-bold text-[30px]">›</span>
              </Link>
            </div>
          </div>

          {/* Placeholder de próximos jogos */}
          <div className="rounded-xl bg-[#22252e] ring-1 ring-white/10 p-4">
            <h3 className="text-sm font-semibold mb-3">Próximos jogos</h3>
            {[
              { date: '9/08/25', label: 'Benfica x Porto | Previsão', img: '/B_tips/frame1.png', href: '/tips/futebol' },
              { date: '9/08/25', label: 'Sporting x Vitória | Previsão', img: '/B_tips/frame1.png', href: '/tips/futebol' },
              { date: '9/08/25', label: 'Benfica x Braga | Previsão', img: '/B_tips/frame1.png', href: '/tips/futebol' },
              { date: '9/08/25', label: 'Braga x Porto | Previsão', img: '/B_tips/frame1.png', href: '/tips/futebol' },
            ].map((m, i, arr) => (
              <div key={i} className={i > 0 ? 'mt-3' : ''}>
                <div className="text-white/60 text-xs">{m.date}</div>
                <Link href={m.href} className="mt-1 flex items-center justify-between rounded-md px-1 py-2 hover:bg-white/5">
                  <div className="flex items-center gap-3">
                    <Image src={m.img} alt={m.label} width={32} height={32} className="w-8 h-8 object-contain rounded" />
                    <span className="text-sm text-white/90">{m.label}</span>
                  </div>
                  <svg className="h-4 w-4 text-white/70" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
                {i < arr.length - 1 ? <div className="h-px bg-white/10 ml-11" /> : null}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
