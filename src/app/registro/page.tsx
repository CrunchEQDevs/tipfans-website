'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegistroRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/?auth=register'); // abre painel pela Navbar
  }, [router]);
  return null;
}
