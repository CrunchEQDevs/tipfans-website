'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaCrown, FaCamera } from 'react-icons/fa';

type AccountForm = {
  displayName: string;
  email: string;
  phone: string;
  avatarUrl: string;
};

type PerfilGetResp = {
  ok?: boolean;
  user?: {
    email?: string;
    name?: string;
    displayName?: string;
    avatarUrl?: string;
    phone?: string;
  };
  error?: string;
};

const PERFIL_PATH = '/perfil';
const LOJA_PATH = '/perfil/loja';
const DESAFIOS_PATH = '/perfil/desafios';
const CRIAR_TIP_PATH = '/tips/enviar';

export default function PerfilLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const [account, setAccount] = useState<AccountForm>({
    displayName: '',
    email: '',
    phone: '',
    avatarUrl: '',
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Carrega dados reais (avatar, nome, etc.)
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/api/perfil', { cache: 'no-store' });
        const data: PerfilGetResp = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Falha a carregar perfil');

        const u = data.user || {};
        if (cancel) return;

        setAccount({
          displayName: (u.displayName || u.name || '').trim(),
          email: (u.email || '').trim(),
          phone: (u.phone || '').trim(),
          avatarUrl: (u.avatarUrl || '').trim(),
        });
      } catch {
        /* silencioso */
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // Avatar (preview local no header)
  function onChooseAvatar() {
    fileInputRef.current?.click();
  }

  function onAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setAccount((a) => ({ ...a, avatarUrl: localUrl }));
    alert('Pré-visualização aplicada. Para salvar permanente, use um URL público ou crie /api/avatar.');
  }

  // Helper para estado ativo dos links
  const isActive = (path: string) => pathname === path;

  return (
    <section className="w-full">
      {/* ===== Cabeçalho fixo: Foto → Ganhos → Botões (links) ===== */}
      <div className="relative w-full h-64 md:h-72 overflow-hidden bg-gray-800">
        <Image
          src="/tip2.jpg"
          alt="Banner de perfil"
          fill
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-[#1e1e1e]/60" />

        {/* Stack central */}
        <div className="absolute inset-0 flex flex-col items-center pt-4">
          {/* Foto (avatar) no topo */}
          <div className="relative w-32 h-32 rounded-full ring-4 ring-gray-900 overflow-hidden shadow-lg">
            <Image
              src={account.avatarUrl || '/avatar-fallback.png'}
              alt="Foto do utilizador"
              fill
              className="object-cover"
              sizes="128px"
            />
            <button
              type="button"
              onClick={onChooseAvatar}
              className="absolute bottom-1 right-1 inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/70 hover:bg-black/80"
              title="Alterar foto"
            >
              <FaCamera className="text-white text-sm" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarFileChange}
            />
          </div>

          {/* Faixa de ganhos logo abaixo da foto */}
          <div className="mt-4 w-full max-w-3xl px-4">
            <div className="flex items-center gap-2 text-xs text-gray-200 mb-2">
              <span className="font-bold">Ganhos</span>
              <FaCrown />
              <span className="ml-auto">100 🪙</span>
            </div>
            <div className="h-3 rounded-md overflow-hidden bg-gray-600">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                style={{ width: '65%' }}
              />
            </div>
          </div>

          {/* Botões (links) */}
          <div className="mt-4 w-full max-w-3xl px-4">
            <div className="flex items-center justify-between">
              <nav className="flex gap-3 text-sm">
                <Link
                  href={PERFIL_PATH}
                  className={[
                    'px-3 py-1 rounded-md transition text-white font-bold',
                    isActive(PERFIL_PATH) ? 'bg-white/10' : '',
                  ].join(' ')}
                >
                  Perfil
                </Link>

                <Link
                  href={LOJA_PATH}
                  className={[
                    'px-3 py-1 rounded-md transition text-white font-bold',
                    isActive(LOJA_PATH) ? 'bg-white/10' : '',
                  ].join(' ')}
                >
                  Loja
                </Link>

                <Link
                  href={DESAFIOS_PATH}
                  className={[
                    'px-3 py-1 rounded-md transition text-white font-bold',
                    isActive(DESAFIOS_PATH) ? 'bg-white/10' : '',
                  ].join(' ')}
                >
                  Meus desafios
                </Link>
              </nav>

              {/* CTA: Crie sua tip */}
              <Link
                href={CRIAR_TIP_PATH}
                className="px-4 py-2 rounded-md text-sm font-semibold text-orange-500"
                title="Criar uma nova tip"
              >
                Crie sua tip
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Área dinâmica das páginas filhas ===== */}
      <div className="space-y-10 bg-[#1E1E1E]">
        {children}
      </div>
    </section>
  );
}
