'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PaginaProtegida() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token === null) return; // ainda carregando

    if (!token || !user) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [token, user, router]);

  if (loading || !user) {
    return <p>Verificando autenticação...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Bem-vindo, {user.name}</h1>
      <p className="mt-2 text-gray-300">Email: {user.email}</p>
    </div>
  );
}
