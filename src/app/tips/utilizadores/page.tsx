'use client';

import { Suspense } from 'react';
import TipsUtilizadoresContent from './TipsUtilizadoresContent';

export default function TipsUtilizadoresPage() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <TipsUtilizadoresContent />
    </Suspense>
  );
}
