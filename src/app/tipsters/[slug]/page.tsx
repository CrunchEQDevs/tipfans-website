'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import TipsterBanner from '@/components/tipsters/TipsterBanner';
import TipsterSection, { TipCard } from '@/components/tipsters/TipsterSection';

type ApiResp = {
  author: { id: number; name: string; slug: string; avatar?: string | null; description?: string };
  items: Array<{
    id: number | string;
    title: string;
    author?: string;
    createdAt?: string;
    cover?: string | null;
    sport: 'futebol' | 'basquete' | 'tenis' | 'esports';
    hrefPost?: string;
  }>;
};

export default function TipsterProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ? String(params.slug) : '';

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [author, setAuthor] = useState<ApiResp['author'] | null>(null);
  const [items, setItems] = useState<ApiResp['items']>([]);

  useEffect(() => {
    let cancel = false;
    async function run() {
      if (!slug) return;
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const r = await fetch(`/api/wp/tipsters/${encodeURIComponent(slug)}?_=${Date.now()}`, {
          cache: 'no-store',
        });
        if (cancel) return;
        if (r.status === 404) {
          setNotFound(true);
          setAuthor(null);
          setItems([]);
          return;
        }
        if (!r.ok) {
          const txt = await r.text().catch(() => '');
          throw new Error(txt || `HTTP ${r.status}`);
        }
        const data = (await r.json()) as ApiResp;
        if (cancel) return;
        setAuthor(data.author);
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e: any) {
        if (!cancel) setError(String(e?.message ?? e));
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    run();
    return () => { cancel = true; };
  }, [slug]);

  const groups = useMemo(() => {
    const g: Record<'futebol'|'tenis'|'basquete'|'esports', TipCard[]> = {
      futebol: [], tenis: [], basquete: [], esports: [],
    };
    for (const p of items) {
      const sport = p.sport ?? 'futebol';
      if (sport in g) {
        g[sport as keyof typeof g].push({
          id: p.id,
          title: p.title,
          sport: sport as TipCard['sport'],
          cover: p.cover,
          author: p.author,
          createdAt: p.createdAt,
          href: p.hrefPost,
        });
      }
    }
    return g;
  }, [items]);

  if (notFound) {
    return (
      <main className="min-h-[60vh] bg-[#1E1E1E] text-white">
        <div className="mx-auto max-w-7xl px-4 pt-20">
          <div className="rounded-xl bg-[#1B1F2A] p-6 ring-1 ring-white/10">
            Autor “{slug}” não encontrado.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#1E1E1E] text-white">
      {/* marca d'água */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none opacity-[0.06]">
        <div className="mx-auto max-w-7xl h-full px-4 grid grid-rows-3 items-center">
          <span className="text-[12rem] lg:text-[18rem] font-extrabold tracking-tighter">TIP</span>
          <span className="text-[12rem] lg:text-[18rem] font-extrabold tracking-tighter">TIP</span>
          <span className="text-[12rem] lg:text-[18rem] font-extrabold tracking-tighter">TIP</span>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-14">
        {/* Banner */}
        <TipsterBanner
          name={author?.name ?? slug.replace(/-/g, ' ')}
          avatar={author?.avatar ?? null}
          bio={author?.description ?? ''}
        />

        {/* Estado de carregamento/erro */}
        {loading && (
          <div className="mt-8 rounded-xl bg-[#1B1F2A] p-6 ring-1 ring-white/10">
            A carregar…
          </div>
        )}
        {!!error && !loading && (
          <div className="mt-8 rounded-xl bg-[#7a1f1f] p-6 ring-1 ring-white/10">
            Erro ao carregar: {error}
          </div>
        )}

        {/* Seções por categoria */}
        {!loading && !error && (
          <>
            <TipsterSection
              id="futebol"
              title="Futebol"
              items={groups.futebol}
              viewAllHref="/tips/futebol"
              emptyMsg={`Ainda não há tips de Futebol para ${author?.name ?? 'este tipster'}.`}
            />
            <TipsterSection
              id="tenis"
              title="Ténis"
              items={groups.tenis}
              viewAllHref="/tips/tenis"
              emptyMsg={`Ainda não há tips de Ténis para ${author?.name ?? 'este tipster'}.`}
            />
            <TipsterSection
              id="basquete"
              title="Basquete"
              items={groups.basquete}
              viewAllHref="/tips/basquete"
              emptyMsg={`Ainda não há tips de Basquete para ${author?.name ?? 'este tipster'}.`}
            />
            <TipsterSection
              id="esports"
              title="eSports"
              items={groups.esports}
              viewAllHref="/tips/esports"
              emptyMsg={`Ainda não há tips de eSports para ${author?.name ?? 'este tipster'}.`}
            />
          </>
        )}
      </div>
    </main>
  );
}
