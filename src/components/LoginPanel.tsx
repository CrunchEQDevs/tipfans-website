'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

type LoginPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register';
};

export default function LoginPanel({ isOpen, onClose, initialTab = 'login' }: LoginPanelProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);

  // login
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [erroLogin, setErroLogin] = useState('');

  // register
  const [username, setUsername] = useState('');
  const [emailReg, setEmailReg] = useState('');
  const [senhaReg, setSenhaReg] = useState('');
  const [senhaReg2, setSenhaReg2] = useState('');
  const [loadingReg, setLoadingReg] = useState(false);
  const [msgReg, setMsgReg] = useState('');

  const { login, refreshUser, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }, [isOpen]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  const redirectByRole = (roleParam?: string) => {
    const role = (roleParam ?? user?.role ?? localStorage.getItem('userRole') ?? '').toLowerCase();

    if (role === 'administrator') {
      window.location.href = 'https://tipfans.com/wp/wp-admin/index.php';
      return;
    }
    if (role === 'author') {
      router.replace('/autor');
    } else {
      router.replace('/');
    }
    router.refresh();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLogin('');
    setLoadingLogin(true);

    const ok = await login(emailLogin.trim(), senhaLogin);
    setLoadingLogin(false);

    if (!ok) {
      setErroLogin('Usuário ou senha inválidos.');
      return;
    }

    await refreshUser();
    redirectByRole();

    setEmailLogin('');
    setSenhaLogin('');
    onClose();
  };

  const canSubmitRegister = useMemo(() => {
    if (!username.trim() || !emailReg.trim() || !senhaReg || !senhaReg2) return false;
    if (senhaReg !== senhaReg2) return false;
    return true;
  }, [username, emailReg, senhaReg, senhaReg2]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgReg('');

    if (senhaReg !== senhaReg2) {
      setMsgReg('❌ As palavras-passe não coincidem.');
      return;
    }

    try {
      setLoadingReg(true);
      const res = await fetch('/api/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          username: username.trim(),
          email: emailReg.trim(),
          password: senhaReg,
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.ok) {
        const code = data?.code ? ` (${data.code})` : '';
        setMsgReg(`❌ ${data?.error || data?.message || 'Erro ao criar conta.'}${code}`);
        return;
      }

      setMsgReg('✅ Conta criada! A entrar…');

      try {
        localStorage.setItem('tf_auth_event', String(Date.now()));
        window.dispatchEvent(new Event('tf-auth-changed'));
      } catch {}

      await refreshUser();
      const roleFromApi: string | undefined = data?.user?.role;
      redirectByRole(roleFromApi);

      setUsername('');
      setEmailReg('');
      setSenhaReg('');
      setSenhaReg2('');
      onClose();
    } catch {
      setMsgReg('❌ Erro de conexão com o servidor.');
    } finally {
      setLoadingReg(false);
    }
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
            className="fixed top-0 right-0 w-full sm:max-w-sm md:max-w-md h-full z-50"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween' }}
          >
            {/* Topo */}
            <div className="flex justify-between items-center bg-black px-5 py-4">
              <Image src="/Logo_TipFans.png" alt="Logo" width={250} height={48} className="h-auto p-5" priority />
              <button onClick={onClose} className="text-white/90 hover:text-white text-xl" aria-label="Fechar">✕</button>
            </div>

            {/* Fundo */}
            <div className="relative h-[60%] bg-[#2b2b2b]">
              <Image src="/Jog_login.png" alt="" fill className="object-cover opacity-25" priority />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

              {/* Conteúdo */}
              <div className="relative px-6 pt-6">
                {/* Tabs */}
                <div className="mb-4 flex items-center gap-8 text-white/90">
                  <button
                    className={`text-lg font-semibold ${tab === 'register' ? 'text-white' : 'text-white/70'}`}
                    onClick={() => setTab('register')}
                    type="button"
                  >
                    Registo
                  </button>
                  <button
                    className={`text-lg font-semibold ${tab === 'login' ? 'text-white' : 'text-white/70'}`}
                    onClick={() => setTab('login')}
                    type="button"
                  >
                    Log In
                  </button>
                </div>

                {/* Forms */}
                {tab === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-4" noValidate>
                    <div>
                      <label className="block text-sm text-white mb-1">Nome de utilizador ou E-mail</label>
                      <input
                        type="text"
                        value={emailLogin}
                        onChange={(e) => setEmailLogin(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white text-gray-800 placeholder:text-gray-500 focus:outline-none"
                        placeholder="email ou usuário"
                        autoComplete="username"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white mb-1">Palavra-passe</label>
                      <input
                        type="password"
                        value={senhaLogin}
                        onChange={(e) => setSenhaLogin(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white text-gray-800 placeholder:text-gray-500 focus:outline-none"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                      />
                    </div>

                    {erroLogin && <p className="text-red-500 text-sm">{erroLogin}</p>}

                    <button
                      type="submit"
                      disabled={loadingLogin || !emailLogin.trim() || !senhaLogin}
                      className="w-full bg-[#FF4500] hover:bg-orange-600 text-white py-2 rounded-md transition disabled:opacity-60"
                    >
                      {loadingLogin ? 'Entrando…' : 'Entrar'}
                    </button>

                    <div className="mt-3 text-center">
                      <p className="text-white text-sm">
                        Ainda não tem conta?{' '}
                        <button
                          type="button"
                          onClick={() => setTab('register')}
                          className="text-[#FF4500] hover:underline font-semibold"
                        >
                          Registar
                        </button>
                      </p>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4" noValidate>
                    <div>
                      <label className="block text-sm text-white mb-1">Nome de utilizador</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white text-gray-800 placeholder:text-gray-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white mb-1">E-mail</label>
                      <input
                        type="email"
                        value={emailReg}
                        onChange={(e) => setEmailReg(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white text-gray-800 placeholder:text-gray-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white mb-1">Palavra-passe</label>
                      <input
                        type="password"
                        value={senhaReg}
                        onChange={(e) => setSenhaReg(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white text-gray-800 placeholder:text-gray-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white mb-1">Confirmar palavra-passe</label>
                      <input
                        type="password"
                        value={senhaReg2}
                        onChange={(e) => setSenhaReg2(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white text-gray-800 placeholder:text-gray-500 focus:outline-none"
                        required
                      />
                    </div>

                    {msgReg && (
                      <p className={`text-sm ${msgReg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                        {msgReg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loadingReg || !canSubmitRegister}
                      className="w-full bg-[#FF4500] hover:bg-orange-600 text-white py-2 rounded-md transition disabled:opacity-60"
                    >
                      {loadingReg ? 'A criar…' : 'Registar'}
                    </button>

                    <div className="mt-3 text-center">
                      <button
                        type="button"
                        onClick={() => setTab('login')}
                        className="text-white/80 hover:text-white text-sm"
                      >
                        Já tem conta? Iniciar sessão
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
