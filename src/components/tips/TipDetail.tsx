'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TipBanner from './TipBanner';

type Tip = {
  id: string | number;
  title: string;
  sport: 'futebol' | 'basquete' | 'tenis' | 'esports';
  league?: string;
  teams?: string;
  pick?: string;
  odds?: string | number;
  author?: string;
  createdAt?: string; // ex: "2025-08-06 17:00"
  bannerImage?: string;
  cover?: string;
  coverCaption?: string;
  contentHtml?: string;
};

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

/* ---------- Fallback (mock) ---------- */
const MOCK_TIP = (id: string, sport: Tip['sport']): Tip => ({
  id,
  title:
    'Previsões Sheffield United vs Sunderland: Equipa da casa para dominar',
  sport,
  league: 'Championship (Ingl.)',
  teams: 'Sheffield United vs Sunderland',
  pick: 'Sheffield United -1 (Asiático)',
  odds: '1.90',
  author: 'Nuno Cunha',
  createdAt: '2025-08-09 17:30',
  cover: '/B_tips/jogador.png',
  coverCaption:
    'Fábricas vão voar quando o Sheffield United receber o Sunderland em Bramall Lane para a estreia no Championship, no sábado, 9 de agosto de 2025.',
  contentHtml: `
    <h2>Previsões Sheffield United vs Sunderland: Equipa da casa para dominar</h2>

    <h3>Estatísticas-chave</h3>
    <ul>
      <li>O Bristol City não venceu nenhum dos últimos nove confrontos com o Sheffield United.</li>
      <li>Seis jogos consecutivos entre estas equipas tiveram menos de 11 cantos.</li>
      <li>O Sheffield United marcou primeiro em cinco dos últimos seis reencontros com o Bristol City.</li>
    </ul>

    <h3>Previsão de resultado correto: Sheffield United 3-1 Bristol City</h3>
    <p>
      O Bristol City tem um histórico fraco contra o Sheffield United, perdendo cinco dos últimos seis confrontos entre ambos.
      Aliás, as equipas cruzaram-se nas meias-finais do playoff do Championship há três meses, e o Sheffield United venceu
      ambos os jogos num total agregado de 3-0.
    </p>

    <h3>Probabilidades antes do jogo e hipóteses de vitória: Bristol City em desvantagem</h3>
    <ul>
      <li><strong>Casa:</strong> 39.14%</li>
      <li><strong>Empate:</strong> 27.74%</li>
      <li><strong>Fora:</strong> 33.12%</li>
    </ul>

    <p>
      Odds de laboratório, sugerem o Sheffield United como favorito com odd de 3/4 (1.75). Equipas com estes odds têm,
      normalmente, 55%+ de probabilidade de vencer.
    </p>

    <p>
      Não te esqueças de verificar as nossas <a href="/tips/futebol">melhores dicas de apostas</a> e previsões diárias nas
      nossas previsões para futebol.
    </p>
  `,
});

/* ---------- Página ---------- */
export default function TipDetail() {
  const params = useParams<{ slug: string; tipsnews: string }>();
  const router = useRouter();

  const sport = normalizeSport(params?.slug);
  const tipId = String(params?.tipsnews || '').trim();

  const [tip, setTip] = useState<Tip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        if (!tipId) throw new Error('id vazio');
        const u = new URL('/api/wp/tip', window.location.origin);
        u.searchParams.set('id', tipId);
        const res = await fetch(u.toString(), { cache: 'no-store' });
        if (!res.ok) throw new Error('API falhou');
        const data = (await res.json()) as Partial<Tip>;
        if (cancel) return;
        setTip({
          ...MOCK_TIP(tipId, sport),
          ...data,
          id: tipId,
          sport,
        });
      } catch {
        if (cancel) return;
        setTip(MOCK_TIP(tipId, sport));
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [tipId, sport]);

  const headerTitle = useMemo(
    () => tip?.teams || tip?.title || 'Pré-jogo',
    [tip?.teams, tip?.title]
  );

  // quando está carregando, mostra esqueleto simples
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

  return (
    <main className="bg-[#1E1E1E] text-white ">
      {/* Banner dinâmico (com escudos + data/hora central) */}
      <TipBanner />

      {/* Título sem impactar layout (usa headerTitle -> elimina warning) */}
      <h1 className="sr-only">{headerTitle}</h1>

      {/* Conteúdo + sidebar */}
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA PRINCIPAL */}
        <article className="lg:col-span-2">
          {/* Autor (chip) */}
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
              <span className="opacity-95">{tip?.author || '—'}</span>
            </div>
          </div>

          {/* Imagem principal + legenda */}
          <div className="overflow-hidden rounded-xl ring-1 ring-white/10 bg-black/20">
            <div className="relative w-full aspect-[16/9]">
              <Image
                src={tip?.cover || '/B_tips/jogador.png'}
                alt={tip?.title || ''}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 66vw, 100vw"
                priority
              />
            </div>
            {tip?.coverCaption ? (
              <div className="px-4 py-2 text-[12px] text-white/70">
                {tip.coverCaption}
              </div>
            ) : null}
          </div>

          {/* Conteúdo */}
          <div
            className="
              prose prose-invert max-w-none mt-6
              prose-headings:text-white prose-h2:text-xl prose-h3:text-lg
              prose-p:text-white/90 prose-li:text-white/90
              prose-a:text-orange-400 hover:prose-a:text-orange-300
              prose-strong:text-white
            "
            dangerouslySetInnerHTML={{ __html: tip?.contentHtml || '' }}
          />

          {/* Separador */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/90 to-transparent my-6" />

          {/* Bloco final (Updated + Autor + texto) */}
          <div className="rounded-md bg-white/5 ring-1 ring-white/10 px-3 py-3">
            <div className="text-[12px] text-white/70">
              Updated: {tip?.createdAt || '--'}
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
              <span className="opacity-95 text-sm">{tip?.author || '—'}</span>
            </div>
            <p className="mt-2 text-sm text-white/80">
              Lorem ipsum é simplesmente um texto fictício da indústria tipográfica. Lorem Ipsum tem sido o
              texto fictício padrão da indústria desde os anos 1500, quando um impressor desconhecido pegou
              uma bandeja de tipos e embaralhou para fazer um livro de amostras.
            </p>
          </div>
        </article>

        {/* SIDEBAR */}
        <aside className="space-y-4 mt-8 lg:mt-0">
          {/* Botão voltar às tips */}
          <div className="mb-2">
            <button
              onClick={() => router.push(`/tips/${params?.slug || sport}`)}
              className="rounded-md bg-white/10 px-3 py-1.5 text-xs hover:bg-white/15"
              aria-label="Voltar às tips"
              title="Voltar às tips"
            >
              ← Voltar às tips
            </button>
          </div>

          {/* Box: ver todas as previsões */}
          <div className="rounded-xl bg-[#22252e] ring-1 ring-white/10 p-4">
            <h3 className="text-xl font-semibold mb-4">
              Veja todas as nossas previsões
            </h3>
            <div className="space-y-2">
              <Link
                className="group flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                href="/tips/futebol"
              >
                Dicas e apostas para HOJE de futebol
                <span className="opacity-70 group-hover:opacity-100 font-bold text-[30px]">
                  ›
                </span>
              </Link>
              <Link
                className="group flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                href="/tips/basquete"
              >
                Dicas e apostas para AMANHÃ de futebol
                <span className="opacity-70 group-hover:opacity-100 font-bold text-[30px]">
                  ›
                </span>
              </Link>
              <Link
                className="group flex items-center justify-between rounded-md bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                href="/tips/tenis"
              >
                Próximas previsões
                <span className="opacity-70 group-hover:opacity-100 font-bold text-[30px]">
                  ›
                </span>
              </Link>
            </div>
          </div>

          {/* Box: próximos jogos (ajustado como a imagem) */}
          <div className="rounded-xl bg-[#22252e] ring-1 ring-white/10 p-4">
            <h3 className="text-sm font-semibold mb-3">Próximos jogos</h3>

            {[
              { date: '9/08/25', label: 'Benfica x Porto | Previsão', img: '/B_tips/frame1.png', href: '/tips/futebol' },
              { date: '9/08/25', label: 'Sporting x Vitória | Previsão', img: '/B_tips/frame1.png', href: '/tips/futebol' },
              { date: '9/08/25', label: 'Benfica x Braga | Previsão', img: '/B_tips/frame1.png', href: '/tips/futebol' },
              { date: '9/08/25', label: 'Braga x Porto | Previsão', img: '/B_tips/frame1.png', href: '/tips/futebol' },
            ].map((m, i, arr) => (
              <div key={i} className={i > 0 ? 'mt-3' : ''}>
                {/* data */}
                <div className="text-white/60 text-xs">{m.date}</div>

                {/* linha do jogo */}
                <Link
                  href={m.href}
                  className="mt-1 flex items-center justify-between rounded-md px-1 py-2 hover:bg-white/5"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={m.img}
                      alt={m.label}
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain rounded"
                    />
                    <span className="text-sm text-white/90">{m.label}</span>
                  </div>

                  <svg
                    className="h-4 w-4 text-white/70"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>

                {/* separador (menos no último) */}
                {i < arr.length - 1 ? (
                  <div className="h-px bg-white/10 ml-11" />
                ) : null}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
