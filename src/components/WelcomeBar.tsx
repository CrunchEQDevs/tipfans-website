'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function WelcomeBar() {
  const { user } = useAuth();

  if (!user) return null;

  // tenta pegar nome -> username -> email
  const displayName =
    (user as any).name ||
    (user as any).username ||
    (user as any).nickname ||
    (user as any).email ||
    'Utilizador';

  return (
    <div className="bg-blue-600 text-white text-sm flex items-center justify-between sm:justify-center gap-4">
      <span>👋 Bem-vindo, <strong>{displayName}</strong></span>
      {/* No mobile aparece botão direto para o perfil */}
      <Link
        href="/perfil"
        className="bg-white text-blue-700 font-semibold px-3 py-1 rounded-md hover:bg-gray-100 transition sm:hidden"
      >
        Meu Perfil
      </Link>
    </div>
  );
}
