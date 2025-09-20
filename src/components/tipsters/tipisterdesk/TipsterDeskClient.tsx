'use client';
import dynamic from 'next/dynamic';

// carrega só no cliente
const TipsterDeskPage = dynamic(() => import('./TipsterDeskPage'), { ssr: false });

export default function TipsterDeskClient() {
  return <TipsterDeskPage />;
}
