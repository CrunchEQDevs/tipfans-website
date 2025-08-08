'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminPage() {
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    const savedRole = localStorage.getItem('userRole');
    if (savedRole !== 'administrator') {
      router.push('/perfil');
    }
  }, [token, router]); // ✅ Dependências corretas

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-center text-blue-600 dark:text-yellow-400">
        Painel Administrativo
      </h1>

      <div className="mt-6 max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 shadow rounded-lg">
        <p className="text-lg">Bem-vindo, administrador! 🎉</p>
        {/* Aqui pode adicionar listagem de usuários, dados etc */}
      </div>
    </main>
  );
}
