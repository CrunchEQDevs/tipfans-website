// src/app/login/LoginPageClient.tsx
'use client';

import { useRouter } from 'next/navigation';
import LoginPanel from '@/components/LoginPanel';

export default function LoginPageClient({
  initialTab,
}: {
  initialTab: 'login' | 'register';
}) {
  const router = useRouter();
  return (
    <LoginPanel
      isOpen
      initialTab={initialTab}
      onClose={() => router.replace('/')}
    />
  );
}
