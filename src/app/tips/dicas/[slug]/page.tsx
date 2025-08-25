// src/app/tips/dicas/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import TipAccordion from "@/components/dicasPage/TipAccordion";

// ========= SEO =========
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const sport = (params.slug || "").toString();
  const title =
    sport.length > 0
      ? `Dicas de ${sport.charAt(0).toUpperCase() + sport.slice(1)} | TipFans`
      : "Dicas | TipFans";

  return {
    title,
    description:
      "Previsões gratuitas de especialistas — hoje, amanhã e em breve. Compare odds, picks e análises por jogo.",
  };
}

// ========= Tipos =========
type WhenKey = "today" | "tomorrow" | "soon";
export type TipCard = {
  id: string | number;
  dateISO: string;
  league?: string;
  home: string;
  away: string;
  hotTip?: string;
  pick?: string;
  bothTeamsScore?: "YES" | "NO";
  correctScore?: string;
  ctaUrl?: string;
};

// ========= UI (Banner fixo) =========
function TitleBanner({ right }: { right?: string }) {
  return (
    <div className="relative overflow-hidden border-b border-neutral-800 h-[250px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/banner_dicas.jpg"
        alt="Banner de Dicas"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-neutral-950/60" />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-10">
        <div className="flex items-end justify-between gap-6 mt-10">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
            <span className="text-orange-500">DICAS</span>{" "}
            <span className="text-neutral-100">DE APOSTAS</span>
            <br />
            <span className="text-neutral-100">DE </span>
            <span className="text-orange-500">FUTEBOL</span>{" "}
            <span className="text-orange-500">EM BREVE</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <p className="text-xs text-neutral-400">
            PREVISÕES GRATUITAS DE ESPECIALISTAS PARA
          </p>
          {right ? (
            <div className="text-[11px] md:text-xs uppercase text-orange-400 pb-1">
              {right}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SectionKicker({ whenLabel }: { whenLabel: string }) {
  return (
    <div className="max-w-6xl mx-auto px-4 mt-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-orange-500 text-xl">✔︎</span>
        <span className="text-neutral-200">Top previsões para {whenLabel}</span>
      </div>
    </div>
  );
}

function TabsLinks({ sport, active }: { sport: string; active: WhenKey }) {
  const tabs: { key: WhenKey; label: string }[] = [
    { key: "today", label: "Hoje" },
    { key: "tomorrow", label: "Amanhã" },
    { key: "soon", label: "Em breve" },
  ];
  return (
    <div className="max-w-6xl mx-auto px-4 mt-3">
      <div className="inline-flex gap-6">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <Link
              key={t.key}
              href={`/tips/dicas/${encodeURIComponent(sport)}?when=${t.key}`}
              aria-current={isActive ? "page" : undefined}
              className="relative pl-6 text-xs md:text-sm font-semibold tracking-wide uppercase text-neutral-300 hover:text-white"
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-orange-500"
                />
              )}
              {t.label}
            </Link>
          );
        })}
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-white/90 to-transparent my-6 max-w-72" />
    </div>
  );
}

// ========= Helpers =========
function yn(val: any): "YES" | "NO" | undefined {
  if (val === true || `${val}`.toLowerCase() === "yes" || `${val}`.toLowerCase() === "sim") return "YES";
  if (val === false || `${val}`.toLowerCase() === "no" || `${val}`.toLowerCase() === "não" || `${val}`.toLowerCase() === "nao") return "NO";
  return undefined;
}

function normalizeItem(it: any): TipCard {
  const meta = it?.meta ?? it?.acf ?? it ?? {};
  const dateRaw =
    it?.dateISO ?? meta?.dateISO ?? meta?.datetime ?? meta?.match_date ?? it?.date_gmt ?? new Date().toISOString();
  return {
    id: it?.id ?? it?.ID ?? Math.random().toString(36).slice(2),
    dateISO: new Date(dateRaw).toString() === "Invalid Date" ? new Date().toISOString() : new Date(dateRaw).toISOString(),
    league: it?.league ?? meta?.league ?? it?.categories?.[0]?.name,
    home: it?.home ?? meta?.home ?? meta?.home_team ?? meta?.teams?.home ?? "Home",
    away: it?.away ?? meta?.away ?? meta?.away_team ?? meta?.teams?.away ?? "Away",
    hotTip: it?.hotTip ?? meta?.hotTip ?? meta?.dica_quente,
    pick: it?.pick ?? meta?.pick ?? meta?.main_pick,
    bothTeamsScore: yn(it?.bothTeamsScore ?? meta?.btts ?? meta?.ambas_marcam),
    correctScore: it?.correctScore ?? meta?.correct_score,
    ctaUrl: it?.ctaUrl ?? it?.link ?? it?.permalink ?? meta?.cta_url,
  };
}

// DEMO local
const DEMO: Record<WhenKey, TipCard[]> = {
  today: [
    {
      id: "demo-1",
      dateISO: new Date().toISOString(),
      league: "Primeira Liga",
      home: "Porto",
      away: "Guimarães",
      pick: "Mais de 4.5 cartões no total",
      hotTip: "Clássico quente: tendência de 5+ cartões nos últimos encontros.",
      correctScore: "2-1",
      bothTeamsScore: "YES",
      ctaUrl: "#",
    },
    {
      id: "demo-2",
      dateISO: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      league: "Primeira Liga",
      home: "Porto",
      away: "Guimarães",
      pick: "Mais de 4.5 cartões no total",
      ctaUrl: "#",
    },
  ],
  tomorrow: [
    {
      id: "demo-3",
      dateISO: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      league: "LaLiga",
      home: "Betis",
      away: "Villarreal",
      pick: "Ambas marcam",
      hotTip: "Tendência de golos nas duas partes.",
      correctScore: "2-2",
      bothTeamsScore: "YES",
      ctaUrl: "#",
    },
  ],
  soon: [
    {
      id: "demo-4",
      dateISO: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      league: "UCL Qual.",
      home: "Nice",
      away: "Benfica",
      pick: "Mais de 3.5 cartões",
      hotTip: "Jogos decisivos elevam cartões.",
      correctScore: "0-1",
      bothTeamsScore: "NO",
      ctaUrl: "#",
    },
  ],
};

// Data (Server)
async function fetchTips(sport: string, when: WhenKey): Promise<TipCard[]> {
  try {
    const r = await fetch(`/api/tips/dicas/${encodeURIComponent(sport)}?when=${when}`, { cache: "no-store" });
    if (!r.ok) return DEMO[when];
    const raw = await r.json();
    const arr = Array.isArray(raw) ? raw : [];
    const mapped = arr.map(normalizeItem).filter((x) => x.home && x.away);
    return mapped.length ? mapped : DEMO[when];
  } catch {
    return DEMO[when];
  }
}

function cloneTip(base: TipCard, idx: number): TipCard {
  // clona com id/horário únicos para cada placeholder
  const t = new Date(base.dateISO);
  t.setMinutes(t.getMinutes() + 30 * (idx + 1));
  return {
    ...base,
    id: `${base.id}-copy-${idx}`,
    dateISO: t.toISOString(),
  };
}

// ========= Página =========
export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { when?: string };
}) {
  const sport = (params.slug || "").toLowerCase();

  const q = (searchParams?.when || "").toLowerCase();
  const active: WhenKey = q === "tomorrow" ? "tomorrow" : q === "soon" ? "soon" : "today";
  const whenLabel = active === "today" ? "hoje" : active === "tomorrow" ? "amanhã" : "em breve";

  const tips = await fetchTips(sport, active);

  // 1 aberto + 6 fechados (todos com TipAccordion => todos abrem ao clicar)
  const desiredTotal = 7;

  // card aberto
  const openTip = tips[0] ?? DEMO[active][0];

  // base da lista (inclui o aberto + demais vindos da API)
  const baseList: TipCard[] = [openTip, ...tips.slice(1)];

  // completa com placeholders (cópias do primeiro) até ter 7
  while (baseList.length < desiredTotal) {
    baseList.push(cloneTip(openTip, baseList.length - 1));
  }

  // exatamente 7
  const list = baseList.slice(0, desiredTotal);

  return (
    <main className="min-h-screen text-neutral-100 bg-neutral-950">
      <TitleBanner right={new Date().toLocaleDateString()} />
      <SectionKicker whenLabel={whenLabel} />
      <TabsLinks sport={sport} active={active} />

      <section className="max-w-6xl mx-auto px-4 mt-4 pb-12 space-y-3">
        {/* 1º totalmente aberto */}
        <TipAccordion tip={list[0]} open1 open2 />

        {/* 6 fechados, mas clicáveis com o MESMO conteúdo */}
        {list.slice(1).map((t) => (
          <TipAccordion key={t.id} tip={t} />
        ))}
      </section>
    </main>
  );
}
