'use client';

import LoginPanel from '@/components/LoginPanel';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <LoginPanel isOpen={true} onClose={() => {}} />
    </div>
  );
}