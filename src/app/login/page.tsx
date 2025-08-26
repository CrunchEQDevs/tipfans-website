// src/app/login/page.tsx
import LoginPageClient from './LoginPageClient';

export const dynamic = 'force-dynamic';

export default function Page({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const initialTab: 'login' | 'register' =
    searchParams?.tab === 'register' ? 'register' : 'login';

  return <LoginPageClient initialTab={initialTab} />;
}
