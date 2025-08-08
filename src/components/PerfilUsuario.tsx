'use client';

import { useAuth } from '@/context/AuthContext';

export default function PerfilUsuario() {
  const { user } = useAuth();

  if (!user) {
    return <p className="text-center text-red-500">⚠️ Nenhum usuário autenticado.</p>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 shadow rounded-xl mt-10">
      <h2 className="text-2xl font-bold mb-4 text-center">👤 Perfil do Usuário</h2>
      <div className="space-y-3">
        <p><strong>Nome:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>
    </div>
  );
}
