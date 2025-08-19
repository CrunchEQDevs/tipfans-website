'use client';
import RegisterForm from '@/components/RegisterForm';
import Image from 'next/image';

export default function RegistroPage() {
  return (
    <div className="flex flex-col items-center m-0 justify-center min-h-screen bg-gray-800 dark:bg-gray-900 p-0">
      <Image
        src="/Logo_TipFans.png"
        alt="Logo TipFans"
        width={180}
        height={60}
        className="mb-0"
      />
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
}
