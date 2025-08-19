'use client';

import LoginPanel from '@/components/LoginPanel';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-grey-500">
      <LoginPanel isOpen={true} onClose={() => {}} />
    </div>
  );
}