'use client';

import { Suspense } from 'react';
import EnviarTipPage from './EnviarTipInner';

export default function Page() {
  return (
    <Suspense fallback={<main className="p-6">A carregar…</main>}>
      <EnviarTipPage />
    </Suspense>
  );
}
