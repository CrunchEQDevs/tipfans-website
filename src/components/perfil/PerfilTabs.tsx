// src/components/perfil/PerfilTabs.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { FaTags, FaHome, FaHeadset, FaEnvelope, FaComments, FaPhone, FaClock } from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import OfertasAplicadas from './OfertasAplicadas';

type Aba = 'dashboard' | 'ofertas';

type CurrentUser = {
  id: string;
  nome: string;
  email: string;
  role?: string;
  memberSince?: string;
  avatarUrl?: string;
};

function isCurrentUser(u: unknown): u is CurrentUser {
  if (!u || typeof u !== 'object') return false;
  const r = u as Record<string, unknown>;
  return typeof r.id === 'string' && typeof r.nome === 'string' && typeof r.email === 'string';
}

/* Data client-only (evita mismatch) */
function ClientOnlyDate({ dateISO }: { dateISO: string }) {
  const formatted = useMemo(() => {
    const t = Date.parse(dateISO);
    if (Number.isNaN(t)) return '';
    try {
      return new Date(t).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  }, [dateISO]);
  if (!formatted) return null;
  return (
    <span className="rounded-full bg-gray-50 px-3 py-1 text-xs text-gray-700 ring-1 ring-gray-200 dark:bg-white/10 dark:text-gray-200 dark:ring-white/20">
      Membro desde {formatted}
    </span>
  );
}

/* Ofertas ativas – resumo */
type OfertaResumo = { id: string; titulo: string; descricao?: string; data?: string; status?: string };
function isRecord(v: unknown): v is Record<string, unknown> { return typeof v === 'object' && v !== null; }
function asString(v: unknown, fb = ''): string { return typeof v === 'string' ? v : fb; }
function pickFirstString(obj: Record<string, unknown>, keys: string[], fb = '') {
  for (const k of keys) { const v = obj[k]; if (typeof v === 'string' && v) return v; }
  return fb;
}
function mapUnknownToResumo(raw: unknown): OfertaResumo | null {
  if (!isRecord(raw)) return null;
  const rec = raw as Record<string, unknown>;
  const id = asString(rec._id) || asString(rec.id);
  const titulo = pickFirstString(rec, ['titulo', 'title', 'nome'], 'Sem título');
  const descricao = pickFirstString(rec, ['descricao', 'description', 'resumo']);
  const data = pickFirstString(rec, ['data', 'date', 'appliedAt', 'createdAt']);
  const statusRaw = pickFirstString(rec, ['status', 'state', 'situacao']).toLowerCase();
  const isActive =
    ['ativa', 'active', 'open', 'opened'].includes(statusRaw) ||
    (!!data && !Number.isNaN(Date.parse(data)) && new Date(data) >= new Date());
  if (!id) return null;
  return isActive ? { id, titulo, descricao, data, status: 'ativa' } : null;
}
function formatDatePT(d?: string) {
  if (!d) return '';
  const t = Date.parse(d);
  if (Number.isNaN(t)) return d;
  return new Date(t).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
}
function OfertasAtivasResumo({
  endpoint = '/api/mongo-crud',
  jsonPath = 'data',
  limit = 4,
  userEmail,
}: {
  endpoint?: string;
  jsonPath?: 'data' | 'items' | 'result' | 'ofertas';
  limit?: number;
  userEmail?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [ofertas, setOfertas] = useState<OfertaResumo[]>([]);

  useEffect(() => {
    if (!userEmail) return;
    let abort = false;
    (async () => {
      setLoading(true); setErro(null);
      try {
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.set('email', userEmail);
        url.searchParams.set('status', 'active');
        const res = await fetch(url.toString(), { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: unknown = await res.json();

        let arrUnknown: unknown = [];
        if (Array.isArray(json)) {
          arrUnknown = json;
        } else if (isRecord(json)) {
          const rec = json as Record<string, unknown>;
          const maybeArr = rec[jsonPath];
          if (Array.isArray(maybeArr)) arrUnknown = maybeArr;
        }

        const arr = Array.isArray(arrUnknown) ? arrUnknown : [];
        const ativas = arr.map(mapUnknownToResumo).filter(Boolean) as OfertaResumo[];
        if (!abort) setOfertas(ativas.slice(0, limit));
      } catch (e: unknown) {
        if (!abort) setErro(e instanceof Error ? e.message : 'Erro ao carregar');
      } finally { if (!abort) setLoading(false); }
    })();
    return () => { abort = true; };
  }, [endpoint, jsonPath, limit, userEmail]);

  if (!userEmail) {
    return <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600 dark:border-white/20 dark:bg-white/5 dark:text-gray-300">
      Inicia sessão para ver as tuas ofertas ativas.
    </div>;
  }
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 ring-1 ring-gray-200 dark:bg-white/5 dark:ring-white/10" />
        ))}
      </div>
    );
  }
  if (erro) {
    return <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
      Ocorreu um erro ao carregar as ofertas: {erro}
    </div>;
  }
  if (!ofertas.length) {
    return <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600 dark:border-white/20 dark:bg-white/5 dark:text-gray-300">
      Ainda não tens ofertas ativas.
    </div>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {ofertas.map((o) => (
        <article key={o.id} className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm ring-1 ring-emerald-100 transition hover:shadow-md dark:border-emerald-400/30 dark:bg-white/5 dark:ring-emerald-400/20">
          <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Ativa
          </span>
          <h4 className="mb-1 line-clamp-1 text-base font-semibold">{o.titulo}</h4>
          {o.descricao ? <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{o.descricao}</p> : null}
          {o.data ? (
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <FaClock /> Aplicada em {formatDatePT(o.data)}
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">Benefícios ativos</span>
            <Link href="/perfil?tab=ofertas" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
              Ver todas
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

/* Botão de aba reutilizável */
function TabButton({
  active, onClick, children, id, controls,
}: { active: boolean; onClick: () => void; children: React.ReactNode; id: string; controls: string; }) {
  return (
    <button
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={[
        'flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition focus:outline-none focus-visible:ring-2',
        active
          ? 'bg-indigo-600 text-white shadow ring-indigo-400 dark:bg-amber-500 dark:text-black dark:ring-amber-300'
          : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10 dark:hover:bg-white/10',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/* Componente principal */
export default function PerfilTabs() {
  const router = useRouter();
  const search = useSearchParams();

  // Aba inicial pela URL
  const initialTab: Aba = (() => {
    const t = (search?.get('tab') || '').toLowerCase() as Aba;
    return (['dashboard', 'ofertas'] as Aba[]).includes(t) ? t : 'dashboard';
  })();

  const [abaAtiva, setAbaAtiva] = useState<Aba>(initialTab);

  // Atualiza se a URL mudar (back/forward)
  useEffect(() => {
    const t = (search?.get('tab') || '').toLowerCase();
    if ((['dashboard', 'ofertas'] as string[]).includes(t) && t !== abaAtiva) {
      setAbaAtiva(t as Aba);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const setTabAndPush = useCallback((tab: Aba) => {
    setAbaAtiva(tab);
    const params = new URLSearchParams(Array.from(search?.entries?.() || []));
    params.set('tab', tab);
    router.push(`/perfil?${params.toString()}`, { scroll: false });
  }, [router, search]);

  // Ponte: troca token do localStorage por cookie (se houver)
  useEffect(() => {
    const t = typeof window !== 'undefined'
      ? localStorage.getItem('tf_token') ?? localStorage.getItem('token')
      : null;
    if (!t) return;
    void fetch('/api/session/exchange', { method: 'POST', headers: { Authorization: `Bearer ${t}` } }).catch(() => {});
  }, []);

  // Hook do usuário
  const { user, loading, erro } = useCurrentUser() as { user: unknown; loading: boolean; erro: string | null; };

  // === A PARTIR DAQUI: NENHUM RETURN ANTES DE DECLARAR OS HOOKS DO AVATAR ===
  // user seguro (ou null)
  const cu: CurrentUser | null = isCurrentUser(user) ? (user as CurrentUser) : null;

  // estado do avatar e src com cache-busting
  const [imgError, setImgError] = useState(false);
  const avatarSrc = useMemo(() => {
    const base =
      imgError ? '/avatar-default.png'
      : (cu?.avatarUrl && cu.avatarUrl.length > 0 ? cu.avatarUrl : '/avatar-default.png');

    if (base.startsWith('data:')) return base; // base64 não precisa bust
    const sep = base.includes('?') ? '&' : '?';
    const bust = Date.now();
    return `${base}${sep}t=${bust}`;
  }, [cu?.avatarUrl, imgError]);

  // === AGORA PODEMOS FAZER RETORNOS CONDICIONAIS, DEPOIS DE TODOS OS HOOKS ACIMA ===
  if (loading) {
    return <div className="min-h-[50vh] grid place-items-center text-gray-600 dark:text-gray-300">A carregar o teu perfil…</div>;
  }
  if (erro) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
          Erro ao carregar o perfil: {erro}
        </div>
      </div>
    );
  }
  if (!cu) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="rounded-2xl bg-white p-6 text-center text-gray-700 ring-1 ring-gray-200 dark:bg:white/5 dark:text-gray-200 dark:ring-white/10">
          <p className="mb-3 text-sm">Precisas de iniciar sessão para veres o teu perfil.</p>
          <Link href="/login" className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
            Iniciar sessão
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard' as const, label: 'Resumo', icon: <FaHome className="text-sm" /> },
    { id: 'ofertas' as const, label: 'Ofertas aplicadas', icon: <FaTags className="text-sm" /> },
  ];

  return (
    <div className="min-h-[70vh] w-full bg-gradient-to-b from-gray-100 via-gray-50 to-white text-gray-900 dark:from-gray-900 dark:via-gray-900 dark:to-black dark:text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header — com botões Alterar perfil e Voltar ao site */}
        <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg:white/5 dark:ring-white/10">
          <div className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-gray-200 dark:ring-white/20">
              <Image
                key={avatarSrc}
                src={avatarSrc}
                alt="Foto de perfil"
                fill
                sizes="80px"
                className="object-cover"
                priority
                unoptimized
                onError={() => setImgError(true)}
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl font-semibold leading-tight">
                Olá, <span className="text-indigo-600 dark:text-amber-400">{cu!.nome}</span>
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">{cu!.email}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 dark:bg-white/10 dark:text-white dark:ring-white/20">
                  {cu!.role || 'Utilizador'}
                </span>
                {cu!.memberSince && <ClientOnlyDate dateISO={cu!.memberSince} />}
              </div>
            </div>

            <div className="mt-2 flex gap-2">
              <Link
                href="/perfil/alterar"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-amber-500 dark:text-black dark:hover:bg-amber-400 dark:focus:ring-amber-300"
              >
                Alterar perfil
              </Link>

              <Link
                href="/"
                className="rounded-xl bg-green-500 px-4 py-2 text-sm font-medium text-white ring-1 ring-green-400 transition hover:bg-green-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400/70 dark:bg-white/10 dark:text-white dark:ring-white/10 dark:hover:bg-white/20"
              >
                Voltar ao site
              </Link>
            </div>
          </div>
        </section>

        {/* Destaque: Crie a sua tip */}
        <section className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-white p-5 ring-1 ring-indigo-200 shadow-sm dark:from-white/10 dark:to-white/5 dark:ring-white/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-indigo-900 dark:text-white">Crie a sua tip</h2>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Publique o seu palpite e participe na comunidade.
              </p>
            </div>
            <Link
              href="/tips/enviar"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:bg-amber-500 dark:text-black dark:hover:bg-amber-400 dark:focus:ring-amber-300"
            >
              Criar tip agora
            </Link>
          </div>
        </section>

        {/* Tabs */}
        <nav className="mb-4 overflow-x-auto" role="tablist" aria-label="Navegação do perfil">
          <ul className="flex gap-2">
            {tabs.map((t) => {
              const active = abaAtiva === t.id;
              const tabId = `tab-${t.id}`;
              const panelId = `panel-${t.id}`;
              return (
                <li key={t.id}>
                  <TabButton id={tabId} controls={panelId} active={active} onClick={() => setTabAndPush(t.id)}>
                    {t.icon}{t.label}
                  </TabButton>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Conteúdo */}
        <section
          id={`panel-${abaAtiva}`}
          role="tabpanel"
          aria-labelledby={`tab-${abaAtiva}`}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-white/5 dark:ring-white/10"
        >
          {abaAtiva === 'dashboard' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Resumo → Ofertas ativas */}
              <div className="lg:col-span-2">
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Resumo</h2>
                  <Link
                    href="/perfil?tab=ofertas"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-amber-300 dark:hover:text-amber-200"
                    onClick={(e) => { e.preventDefault(); setTabAndPush('ofertas'); }}
                  >
                    Ver histórico
                  </Link>
                </div>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  Atividade recente e benefícios ativos.
                </p>
                <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200 dark:bg-black/20 dark:ring-white/10">
                  <OfertasAtivasResumo endpoint="/api/mongo-crud" jsonPath="data" limit={4} userEmail={cu.email} />
                </div>
              </div>

              {/* Suporte */}
              <div className="lg:col-span-1">
                <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md"><FaHeadset className="text-xs" /></span>
                  Suporte ao Cliente
                </h2>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  Precisas de ajuda? Fala connosco.
                </p>
                <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4 text-white shadow-lg ring-1 ring-black/10 dark:ring-white/10">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20"><FaEnvelope /></span>
                      Email: <a href="mailto:suporte@tipfans.com" className="underline decoration-white/60 hover:text-yellow-300">suporte@tipfans.com</a>
                    </li>
                    <li className="flex items-center gap-2"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20"><FaComments /></span> Chat ao vivo no horário comercial</li>
                    <li className="flex items-center gap-2"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20"><FaPhone /></span> +351 900 000 000</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {abaAtiva === 'ofertas' && (
            <div>
              <h2 className="mb-1 text-lg font-semibold">Ofertas aplicadas</h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Lista completa das tuas participações.</p>
              <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200 dark:bg-black/20 dark:ring-white/10">
                <OfertasAplicadas />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
