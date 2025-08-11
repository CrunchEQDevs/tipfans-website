'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FaUser, FaLock, FaCamera, FaTags, FaHome, FaHeadset,
  FaEnvelope, FaComments, FaPhone, FaClock
} from 'react-icons/fa';
import Image from 'next/image';
import Link from 'next/link';

import { useCurrentUser } from '@/hooks/useCurrentUser';
import DadosPessoais from '@/components/perfil/DadosPessoais';
import FotoPerfil from './FotoPerfil';
import AlterarSenha from './AlterarSenha';
import OfertasAplicadas from './OfertasAplicadas';

type Aba = 'dashboard' | 'dados' | 'senha' | 'foto' | 'ofertas';

/* ================== Tipos para o utilizador ================== */
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
  return (
    typeof r.id === 'string' &&
    typeof r.nome === 'string' &&
    typeof r.email === 'string'
  );
}

/* ================== Client-only date (evita hydration mismatch) ================== */
function ClientOnlyDate({ dateISO }: { dateISO: string }) {
  const formatted = useMemo(() => {
    const t = Date.parse(dateISO);
    if (Number.isNaN(t)) return '';
    try {
      return new Date(t).toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
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

/* ================== Helpers – Resumo de Ofertas Ativas ================== */
type OfertaResumo = {
  id: string;
  titulo: string;
  descricao?: string;
  data?: string; // ISO
  status?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}
function pickFirstString(obj: Record<string, unknown>, keys: string[], fallback = ''): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.length > 0) return v;
  }
  return fallback;
}

function mapUnknownToResumo(raw: unknown): OfertaResumo | null {
  if (!isRecord(raw)) return null;

  const id = asString(raw._id) || asString(raw.id);
  const titulo = pickFirstString(raw, ['titulo', 'title', 'nome'], 'Sem título');
  const descricao = pickFirstString(raw, ['descricao', 'description', 'resumo']);
  const data = pickFirstString(raw, ['data', 'date', 'appliedAt', 'createdAt']);
  const statusRaw = pickFirstString(raw, ['status', 'state', 'situacao']).toLowerCase();

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
  return new Date(t).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
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
      setLoading(true);
      setErro(null);
      try {
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.set('email', userEmail);
        url.searchParams.set('status', 'active');

        const res = await fetch(url.toString(), { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json: unknown = await res.json();

        // extrai array com segurança
        let arrUnknown: unknown = [];
        if (Array.isArray(json)) {
          arrUnknown = json;
        } else if (isRecord(json) && Array.isArray(json[jsonPath])) {
          arrUnknown = json[jsonPath] as unknown[];
        }

        const arr = Array.isArray(arrUnknown) ? arrUnknown : [];
        const ativas = arr.map(mapUnknownToResumo).filter(Boolean) as OfertaResumo[];

        if (!abort) setOfertas(ativas.slice(0, limit));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Erro ao carregar';
        if (!abort) setErro(msg);
      } finally {
        if (!abort) setLoading(false);
      }
    })();

    return () => {
      abort = true;
    };
  }, [endpoint, jsonPath, limit, userEmail]);

  if (!userEmail) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600 dark:border-white/20 dark:bg-white/5 dark:text-gray-300">
        Inicia sessão para ver as tuas ofertas ativas.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-gray-100 ring-1 ring-gray-200 dark:bg-white/5 dark:ring-white/10"
          />
        ))}
      </div>
    );
  }

  if (erro) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
        Ocorreu um erro ao carregar as ofertas: {erro}
      </div>
    );
  }

  if (!ofertas.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600 dark:border-white/20 dark:bg-white/5 dark:text-gray-300">
        Ainda não tens ofertas ativas.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {ofertas.map((o) => (
        <article
          key={o.id}
          className="relative overflow-hidden rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm ring-1 ring-emerald-100 transition hover:shadow-md dark:border-emerald-400/30 dark:bg-white/5 dark:ring-emerald-400/20"
        >
          <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Ativa
          </span>

          <h4 className="mb-1 line-clamp-1 text-base font-semibold">{o.titulo}</h4>
          {o.descricao ? (
            <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">{o.descricao}</p>
          ) : null}

          {o.data ? (
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <FaClock />
              Aplicada em {formatDatePT(o.data)}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">Benefícios ativos</span>
            <Link
              href="/perfil?tab=ofertas"
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Ver todas
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
/* ================== Fim helpers ================== */

export default function PerfilTabs() {
  const [abaAtiva, setAbaAtiva] = useState<Aba>('dashboard');

  // Ponte: troca token do localStorage por cookie httpOnly (lê 'tf_token' OU 'token')
  useEffect(() => {
    const t =
      typeof window !== 'undefined'
        ? localStorage.getItem('tf_token') ?? localStorage.getItem('token')
        : null;
    if (!t) return;
    void fetch('/api/session/exchange', {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}` },
    }).catch(() => {});
  }, []);

  // Hook pode não estar tipado; validamos com type-guard
  const { user, loading, erro } = useCurrentUser() as {
    user: unknown;
    loading: boolean;
    erro: string | null;
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] grid place-items-center text-gray-600 dark:text-gray-300">
        A carregar o teu perfil…
      </div>
    );
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

  if (!isCurrentUser(user)) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <div className="rounded-2xl bg-white p-6 text-center text-gray-700 ring-1 ring-gray-200 dark:bg-white/5 dark:text-gray-200 dark:ring-white/10">
          <p className="mb-3 text-sm">Precisas de iniciar sessão para veres o teu perfil.</p>
          <Link
            href="/login"
            className="inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Iniciar sessão
          </Link>
        </div>
      </div>
    );
  }

  const u = user as CurrentUser;

  const tabs = [
    { id: 'dashboard' as const, label: 'Resumo', icon: <FaHome className="text-sm" /> },
    { id: 'dados' as const, label: 'Informações', icon: <FaUser className="text-sm" /> },
    { id: 'senha' as const, label: 'Alterar senha', icon: <FaLock className="text-sm" /> },
    { id: 'foto' as const, label: 'Foto de perfil', icon: <FaCamera className="text-sm" /> },
    { id: 'ofertas' as const, label: 'Ofertas aplicadas', icon: <FaTags className="text-sm" /> },
  ];

  return (
    <div className="min-h-[70vh] w-full bg-gradient-to-b from-gray-100 via-gray-50 to-white text-gray-900 dark:from-gray-900 dark:via-gray-900 dark:to-black dark:text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <section className="mb-6 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 dark:bg-white/5 dark:ring-white/10">
          <div className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-gray-200 dark:ring-white/20">
              <Image
                src={u.avatarUrl || '/avatar-default.png'}
                alt="Foto de perfil"
                fill
                sizes="80px"
                className="object-cover"
                priority
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl font-semibold leading-tight">
                Olá, <span className="text-indigo-600 dark:text-amber-400">{u.nome}</span>
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">{u.email}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-200 dark:bg-white/10 dark:text-white dark:ring-white/20">
                  {u.role || 'Utilizador'}
                </span>
                {u.memberSince && <ClientOnlyDate dateISO={u.memberSince} />}
              </div>
            </div>

            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setAbaAtiva('dados')}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 dark:bg-amber-500 dark:text-black dark:hover:bg-amber-400"
              >
                Editar perfil
              </button>
              <Link
                href="/"
                className="rounded-xl bg-green-400 px-4 py-2 text-sm font-medium text-white ring-1 ring-gray-200 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:ring-white/10 dark:hover:bg-white/20"
              >
                Voltar ao site
              </Link>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <nav className="mb-4 overflow-x-auto">
          <ul className="flex gap-2">
            {tabs.map((t) => {
              const active = abaAtiva === t.id;
              return (
                <li key={t.id}>
                  <button
                    onClick={() => setAbaAtiva(t.id)}
                    className={[
                      'flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition focus:outline-none focus:ring-2',
                      active
                        ? 'bg-indigo-600 text-white shadow ring-indigo-400 dark:bg-amber-500 dark:text-black dark:ring-amber-300'
                        : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10 dark:hover:bg-white/10',
                    ].join(' ')}
                    aria-current={active ? 'page' : undefined}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Conteúdo */}
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 dark:bg-white/5 dark:ring-white/10">
          {abaAtiva === 'dashboard' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Ofertas ativas (resumo) */}
              <div className="lg:col-span-2">
                <div className="mb-1 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Ofertas ativas</h2>
                  <Link
                    href="/perfil?tab=ofertas"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-amber-300 dark:hover:text-amber-200"
                  >
                    Ver histórico
                  </Link>
                </div>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  Aqui aparecem apenas as tuas ofertas ativas. Para ver todas, acede à aba “Ofertas aplicadas”.
                </p>
                <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200 dark:bg-black/20 dark:ring-white/10">
                  <OfertasAtivasResumo
                    endpoint="/api/mongo-crud"
                    jsonPath="data"
                    limit={4}
                    userEmail={u.email}
                  />
                </div>
              </div>

              {/* Suporte ao Cliente – premium */}
              <div className="lg:col-span-1">
                <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                    <FaHeadset className="text-xs" />
                  </span>
                  Suporte ao Cliente
                </h2>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                  Precisas de ajuda? A nossa equipa está disponível para responder às tuas dúvidas e resolver problemas.
                </p>

                <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-4 text-white shadow-lg ring-1 ring-black/10 dark:ring-white/10">
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                        <FaEnvelope />
                      </span>
                      Email:{' '}
                      <a
                        href="mailto:suporte@tipfans.com"
                        className="underline decoration-white/60 hover:text-yellow-300"
                      >
                        suporte@tipfans.com
                      </a>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                        <FaComments />
                      </span>
                      Chat ao vivo disponível no horário comercial
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                        <FaPhone />
                      </span>
                      Telefone: +351 900 000 000
                    </li>
                  </ul>

                  <div className="mt-4">{/* CTA opcional */}</div>
                </div>
              </div>
            </div>
          )}

          {abaAtiva === 'dados' && (
            <div>
              <h2 className="mb-1 text-lg font-semibold">Informações pessoais</h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                Atualize o seu nome, contacto e outros dados básicos.
              </p>
              <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200 dark:bg-black/20 dark:ring-white/10">
                <DadosPessoais />
              </div>
            </div>
          )}

          {abaAtiva === 'senha' && (
            <div>
              <h2 className="mb-1 text-lg font-semibold">Alterar senha</h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                Mínimo 8 caracteres, incluindo números e letras.
              </p>
              <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200 dark:bg-black/20 dark:ring-white/10">
                <AlterarSenha />
              </div>
            </div>
          )}

          {abaAtiva === 'foto' && (
            <div>
              <h2 className="mb-1 text-lg font-semibold">Foto de perfil</h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                Imagem quadrada (ideal 512×512). Formatos JPG ou PNG.
              </p>
              <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200 dark:bg-black/20 dark:ring-white/10">
                <FotoPerfil />
              </div>
            </div>
          )}

          {abaAtiva === 'ofertas' && (
            <div>
              <h2 className="mb-1 text-lg font-semibold">Ofertas aplicadas</h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                Lista completa das tuas participações e histórico.
              </p>
              <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200 dark:bg-black/20 dark:ring-white/10">
                {/* se teu backend aceitar filtro por email, passa props no componente completo */}
                {/* <OfertasAplicadas endpoint="/api/offers" userEmail={u.email} /> */}
                <OfertasAplicadas />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
