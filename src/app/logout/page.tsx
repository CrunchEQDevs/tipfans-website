'use client';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    logout();
    router.push('/'); // volta para home após logout
  }, [logout, router]);

  return (
    <div className="p-6 text-center">
      <p>Saindo da conta...</p>
    </div>
  );
}
