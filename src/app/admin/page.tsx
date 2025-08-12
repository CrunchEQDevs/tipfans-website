'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // espera carregar o /api/me
    if (!user) {
      router.push('/login');
      return;
    }

    // papel prioritário vindo do contexto; fallback no localStorage
    const roleFromCtx = user.role ?? '';
    const roleFromLS =
      typeof window !== 'undefined' ? localStorage.getItem('userRole') ?? '' : '';
    const role = roleFromCtx || roleFromLS;

    if (role !== 'administrator') {
      router.push('/perfil');
    }
  }, [user, loading, router]);

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-center text-blue-600 dark:text-yellow-400">
        Painel Administrativo
      </h1>

      <div className="mt-6 mx-auto max-w-3xl rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <p className="text-lg">Bem-vindo, administrador! 🎉</p>
        {/* Coloque aqui as ferramentas administrativas (lista de usuários, etc.) */}
      </div>
    </main>
  );
}
