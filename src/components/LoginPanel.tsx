'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

type LoginPanelProps = { isOpen: boolean; onClose: () => void };

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
      // papel salvo pelo AuthContext a partir do /api/login
      const role = (localStorage.getItem('userRole') ?? '').toLowerCase();

      if (role === 'administrator') {
        // WP Admin
        window.location.href = 'https://tipfans.com/wp/wp-admin/index.php';
      } else if (role === 'author') {
        // Área do Autor
        router.push('/autor');
      } else {
        // Utilizador normal
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
            className="fixed top-0 right-0 w-full sm:max-w-sm md:max-w-md h-[70%] z-50 overscroll-y-none"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween' }}
          >
           
            <div className="flex justify-center bg-black">
              <Image src="/Logo_TipFans.png" alt="Logo" width={300} height={60} className="object-cover" />
                  <button onClick={onClose} className="text-white hover:text-red-500 text-xl ml-6">✕</button>
            </div>


            <div className=' relative'>
                <div className="flex justify-center  w-full">
                <Image src="/Jog_login.png" alt="Logo" fill className="object-cover opacity-30" />
                </div>
            <div className=' bg-gray-600 py-40'>  
                <div className="flex justify-between items-center mb-6 px-8"> 
                    <h2 className="text-xl font-bold text-white relative">Entrar na Conta</h2>
                
                </div>

                <form className="space-y-4 px-8" onSubmit={handleLogin}>

                <div className="relative z-10">
                <label htmlFor="login-username" className="block text-sm text-white">Usuário</label>
                <input
                    id="login-username"
                    name="username"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border bg-white text-gray-700 placeholder:text-gray-500 rounded-md
                            dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-400 dark:border-gray-700
                            caret-indigo-600 pointer-events-auto focus:outline-none focus:ring-2 focus:ring-brandOrange/70"
                    placeholder="email ou usuário"
                    autoComplete="username" />
                </div>

                <div className="relative z-10">
                    <label className="block text-sm text-white">Senha</label>
                    <input
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full px-3 py-2 border bg-white text-gray-700 placeholder:text-gray-500 rounded-md dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-400 dark:border-gray-700 caret-indigo-600"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    />
                </div>
            

                {erro && <p className="text-red-600 text-sm">{erro}</p>}
                <div className="relative z-10">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brandOrange hover:bg-orange-600 text-white py-2 rounded-md transition disabled:opacity-50"
                >
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
                </div>
                </form>

                <div className="mt-6 text-center relative z-10">
                <p className="text-white text-sm relative">
                    Ainda não tem uma conta?{' '}
                    <button
                    onClick={() => { onClose(); router.push('/registro'); }}
                    className="text-brandOrange hover:underline font-semibold"
                    >
                    Criar conta
                    </button>
                </p>
                </div>
            </div>     
        </div>
          </motion.div>
        </>
    
      )}
    </AnimatePresence>
  );
}
