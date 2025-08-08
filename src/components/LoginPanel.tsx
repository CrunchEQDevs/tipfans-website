'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

type LoginPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LoginPanel({ isOpen, onClose }: LoginPanelProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    const sucesso = await login(email, senha);

    if (sucesso) {
      const userRole = localStorage.getItem('userRole');

      if (userRole === 'administrator') {
        window.location.href = 'https://tipfans.com/wp/wp-admin/index.php';
      } else {
        router.push('/');
      }

      setEmail('');
      setSenha('');
      onClose();
    } else {
      setErro('Usuário ou senha inválidos.');
    }

    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed top-0 right-0 w-full sm:max-w-sm md:max-w-md h-full z-50 p-4 sm:p-6 overflow-y-auto bg-[#1E1E1E]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween' }}
          >
            <div className="mt-10 mb-12 flex justify-center">
              <Image
                src="/Logo_TipFans.png"
                alt="Logo"
                width={180}
                height={60}
                className="h-auto w-auto"
              />
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Entrar na Conta</h2>
              <button onClick={onClose} className="text-white hover:text-red-500 text-xl">
                ✕
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm text-white">Usuário</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                  placeholder="seu usuário do WordPress"
                />
              </div>
              <div>
                <label className="block text-sm text-white">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full px-3 py-2 border bg-white dark:bg-gray-800 dark:border-gray-700 text-white rounded-full"
                  placeholder="••••••••"
                />
              </div>

              {erro && <p className="text-red-600 text-sm">{erro}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brandOrange hover:bg-orange-600 text-white py-2 rounded-full transition disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-white text-sm">
                Ainda não tem uma conta?{' '}
                <button
                  onClick={() => {
                    onClose();
                    router.push('/registro');
                  }}
                  className="text-brandOrange hover:underline font-semibold"
                >
                  Criar conta
                </button>
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
