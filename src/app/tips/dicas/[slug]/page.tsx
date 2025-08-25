// src/app/tips/dicas/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import TipAccordion from "@/components/dicasPage/TipAccordion";

/* ===================== helpers de tipo/segurança ===================== */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function getRec(v: unknown, key: string): Record<string, unknown> | undefined {
  if (!isRecord(v)) return undefined;
  const val = v[key];
  return isRecord(val) ? (val as Record<string, unknown>) : undefined;
}
function getStr(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}
function getNum(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}
function getBool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}
function toISODateSafe(v: unknown): string {
  const s = typeof v === "string" ? v : undefined;
  const n = typeof v === "number" ? v : undefined;
  const d = s ? new Date(s) : n ? new Date(n) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/* ===================== SEO ===================== */
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

/* ===================== Tipos ===================== */
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

/* ===================== UI (Banner fixo) ===================== */
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

/* ===================== Helpers de normalização ===================== */
function yn(val: unknown): "YES" | "NO" | undefined {
  if (getBool(val) === true) return "YES";
  if (getBool(val) === false) return "NO";
  const s = getStr(val)?.toLowerCase();
  if (s === "yes" || s === "sim") return "YES";
  if (s === "no" || s === "não" || s === "nao") return "NO";
  return undefined;
}

function normalizeItem(it: unknown): TipCard {
  const o = isRecord(it) ? it : {};
  const meta =
    getRec(o, "meta") ??
    getRec(o, "acf") ??
    (isRecord(o) ? (o as Record<string, unknown>) : {});

  const dateRaw =
    getStr(o.dateISO) ||
    (meta && (getStr(meta.dateISO) || getStr(meta.datetime) || getStr(meta.match_date))) ||
    getStr(o.date_gmt) ||
    new Date().toISOString();

  const categories = Array.isArray(o.categories) ? (o.categories as unknown[]) : [];
  const cat0 = categories.length > 0 && isRecord(categories[0]) ? (categories[0] as Record<string, unknown>) : undefined;

  const teams = getRec(meta, "teams");

  return {
    id:
      getNum(o.id) ??
      getStr(o.id) ??
      getNum(o.ID) ??
      getStr(o.ID) ??
      Math.random().toString(36).slice(2),
    dateISO: toISODateSafe(dateRaw),
    league: getStr(o.league) || (meta && getStr(meta.league)) || (cat0 && getStr(cat0.name)),
    home:
      getStr(o.home) ||
      (meta && (getStr(meta.home) || getStr(meta.home_team))) ||
      (teams && getStr(teams.home)) ||
      "Home",
    away:
      getStr(o.away) ||
      (meta && (getStr(meta.away) || getStr(meta.away_team))) ||
      (teams && getStr(teams.away)) ||
      "Away",
    hotTip: getStr(o.hotTip) || (meta && (getStr(meta.hotTip) || getStr(meta.dica_quente))),
    pick: getStr(o.pick) || (meta && (getStr(meta.pick) || getStr(meta.main_pick))),
    bothTeamsScore: yn(o.bothTeamsScore ?? (meta && (meta.btts ?? meta.ambas_marcam))),
    correctScore: getStr(o.correctScore) || (meta && getStr(meta.correct_score)),
    ctaUrl:
      getStr(o.ctaUrl) ||
      getStr(o.link) ||
      getStr(o.permalink) ||
      (meta && getStr(meta.cta_url)),
  };
}

/* ===================== DEMO local (fallback) ===================== */
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

/* ===================== Data (Server) ===================== */
async function fetchTips(sport: string, when: WhenKey): Promise<TipCard[]> {
  try {
    // Em componentes server do Next 13+/15+, fetch relativo para /api funciona
    const r = await fetch(
      `/api/tips/dicas/${encodeURIComponent(sport)}?when=${when}`,
      { cache: "no-store" }
    );
    if (!r.ok) return DEMO[when];
    const raw: unknown = await r.json();
    const arr = Array.isArray(raw) ? (raw as unknown[]) : [];
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

/* ===================== Página ===================== */
export default async function Page({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { when?: string };
}) {
  const sport = (params.slug || "").toLowerCase();

  const q = (searchParams?.when || "").toLowerCase();
  const active: WhenKey =
    q === "tomorrow" ? "tomorrow" : q === "soon" ? "soon" : "today";
  const whenLabel =
    active === "today" ? "hoje" : active === "tomorrow" ? "amanhã" : "em breve";

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
