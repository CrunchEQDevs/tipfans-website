'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LogoutPage() {
  const ran = useRef(false);
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    if (ran.current) return;        // evita rodar 2x no StrictMode
    ran.current = true;

    router.prefetch('/');           // deixa a home pronta
    router.replace('/');            // redireciona imediatamente

    // dispara o logout sem bloquear a navegação
    Promise.resolve().then(() => {
      try { logout?.(); } catch {}
      // (opcional) limpa cookie HttpOnly no servidor sem esperar
      fetch('/api/logout', { method: 'POST', credentials: 'include', keepalive: true }).catch(() => {});
    });
  }, [router, logout]);

  return null;
}
