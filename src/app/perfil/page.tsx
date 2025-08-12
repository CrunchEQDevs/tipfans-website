'use client';

import { Suspense } from 'react';
import PerfilTabs from '@/components/perfil/PerfilTabs';

export default function PerfilPage() {
  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-center mb-6">👤 Meu Perfil</h1>
        <Suspense
          fallback={
            <div className="min-h-[50vh] grid place-items-center text-gray-600 dark:text-gray-300">
              A carregar…
            </div>
          }
        >
          <PerfilTabs />
        </Suspense>
      </div>
    </main>
  );
}
