'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaCrown, FaCamera, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

type MeResp = {
  user?: { name?: string; email?: string; avatarUrl?: string };
};

type AvatarResp = {
  ok?: boolean;
  avatarUrl?: string;
  user?: { avatarUrl?: string; name?: string; email?: string };
  error?: string;
};

const PERFIL_PATH = '/perfil';
const LOJA_PATH = '/perfil/loja';
const DESAFIOS_PATH = '/perfil/desafios';
const CRIAR_TIP_PATH = '/tips/enviar';

type AccountForm = {
  displayName: string;
  email: string;
  avatarUrl: string;
};

type Toast = { type: 'success' | 'error'; message: string } | null;

// Fallback embutido (evita 404 de /avatar-fallback.png)
const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
      <rect width="100%" height="100%" fill="#1f1f23"/>
      <circle cx="128" cy="96" r="48" fill="#3b3b43"/>
      <rect x="56" y="164" width="144" height="60" rx="30" fill="#3b3b43"/>
    </svg>`
  );

export default function PerfilLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const [account, setAccount] = useState<AccountForm>({
    displayName: '',
    email: '',
    avatarUrl: '',
  });
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function showToast(t: Toast, ms = 2500) {
    setToast(t);
    if (t) setTimeout(() => setToast(null), ms);
  }

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch('/api/me', { cache: 'no-store', credentials: 'include' });
        const data: MeResp = await r.json();
        if (!r.ok) throw new Error('Falha ao carregar /api/me');
        if (dead) return;
        const u = data.user || {};
        setAccount({
          displayName: (u.name || '').trim(),
          email: (u.email || '').trim(),
          avatarUrl: (u.avatarUrl || '').trim(),
        });
      } catch {
        // silencioso
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, []);

  function onChooseAvatar() {
    fileInputRef.current?.click();
  }

  async function onAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setAccount((a) => ({ ...a, avatarUrl: localUrl }));
    setSavingAvatar(true);
    setJustUpdated(false);

    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch('/api/account/avatar', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      const data: AvatarResp = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data?.error || `Falha ao salvar avatar (${res.status})`);
      }

      const newUrl = data?.user?.avatarUrl || data?.avatarUrl || '';
      if (newUrl) setAccount((a) => ({ ...a, avatarUrl: newUrl }));

      setJustUpdated(true);
      showToast({ type: 'success', message: 'Foto de perfil atualizada!' });
    } catch (err: any) {
      showToast({ type: 'error', message: err?.message || 'Não foi possível atualizar a foto.' }, 3500);
    } finally {
      setSavingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // /perfil ativa só no exato; as demais aceitam subrotas
  const isActive = (href: string) => (href === PERFIL_PATH ? pathname === href : pathname.startsWith(href));

  return (
    <section className="w-full bg-[#0f0f10] text-white">
      {/* TOAST */}
      <div aria-live="polite" className="pointer-events-none fixed top-4 right-4 z-[60]">
        {toast && (
          <div
            className={[
              'pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 shadow-xl',
              toast.type === 'success' ? 'bg-emerald-600/95' : 'bg-rose-600/95',
            ].join(' ')}
          >
            {toast.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )}
      </div>

      {/* Header sem imagem de fundo */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-8">
        {/* Avatar + ação */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-full p-[3px] bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-200 shadow-[0_8px_40px_-8px_rgba(255,153,0,0.6)]">
              <div className="relative w-full h-full rounded-full overflow-hidden bg-neutral-800 ring-2 ring-black/20">
                <Image
                  src={account.avatarUrl || DEFAULT_AVATAR}
                  alt="Foto do utilizador"
                  fill
                  sizes="160px"
                  unoptimized
                  onError={() => setAccount((a) => ({ ...a, avatarUrl: DEFAULT_AVATAR }))}
                  className={['object-cover', justUpdated ? 'animate-pulse' : ''].join(' ')}
                />
                {savingAvatar && (
                  <div className="absolute inset-0 bg-black/30 grid place-content-center">
                    <div className="h-7 w-7 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onChooseAvatar}
              disabled={savingAvatar}
              className="absolute -bottom-2 -right-2 inline-flex items-center justify-center w-10 h-10 rounded-full bg-black/80 hover:bg-black disabled:opacity-60 shadow-lg border border-white/10"
              title="Alterar foto"
            >
              <FaCamera className="text-white" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarFileChange}
            />
          </div>

          {/* Nome & Email */}
          <div className="mt-4 text-center">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-300">
              <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-orange-600">👤</span>
              Perfil do Usuário
            </h3>
            <h1 className="text-xl font-semibold tracking-wide">
              {account.displayName || (loading ? '—' : '—')}
            </h1>
            <p className="text-sm text-white/70">{account.email || (loading ? '—' : '—')}</p>
          </div>
        </div>

        {/* Barra de ganhos */}
        <div className="mt-6">
          <div className="flex items-center gap-2 text-xs text-white/80 mb-2">
            <span className="font-semibold">Ganhos</span>
            <FaCrown className="text-amber-400" />
            <span className="ml-auto">100 🪙</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500"
              style={{ width: '65%' }}
            />
          </div>
        </div>

        {/* NAV — abaixo da barra */}
        <div className="mt-5">
          <nav className="flex gap-2 rounded-full p-1 border border-white/15 bg-white/5">
            {[
              { href: PERFIL_PATH, label: 'Perfil' },
              { href: LOJA_PATH, label: 'Loja' },
              { href: DESAFIOS_PATH, label: 'Meus desafios' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={[
                  'px-4 py-1.5 rounded-full text-sm font-medium transition',
                  isActive(href) ? 'bg-white/15 text-white' : 'text-white/80 hover:text-white',
                ].join(' ')}
              >
                {label}
              </Link>
            ))}
            <div className="ml-auto">
              <Link
                href={CRIAR_TIP_PATH}
                className="px-4 py-1.5 rounded-full text-sm font-semibold text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400"
                title="Criar uma nova tip"
              >
                Crie sua tip
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* Conteúdo das páginas filhas */}
      <div className="mt-8">{children}</div>
    </section>
  );
}
