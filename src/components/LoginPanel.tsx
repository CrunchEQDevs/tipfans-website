'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

type LoginPanelProps = {
  isOpen: boolean;
  onClose?: () => void; // ← opcional agora
  initialTab?: 'login' | 'register';
};

type Toast = { id: number; type: 'success' | 'error' | 'info'; msg: string };

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

  // feedback/UX
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showTopProgress, setShowTopProgress] = useState(false);

  const { login, refreshUser, user } = useAuth();
  const router = useRouter();

  // Bloqueia scroll da página quando o panel está aberto
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }, [isOpen]);

  // Sincroniza tab inicial
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, isOpen]);

  // Progress bar no topo (mobile-friendly)
  useEffect(() => {
    const busy = loadingLogin || loadingReg;
    setShowTopProgress(busy);
  }, [loadingLogin, loadingReg]);

  const pushToast = (t: Omit<Toast, 'id'>, autoCloseMs = 2500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, ...t }]);
    if (autoCloseMs > 0) {
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), autoCloseMs);
    }
  };

  const redirectByRole = (roleParam?: string) => {
    const role = (roleParam ?? user?.role ?? localStorage.getItem('userRole') ?? '').toLowerCase();

    if (role === 'administrator') {
      window.location.href = 'https://wp.tipfans.com/wp-admin/';
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
      pushToast({ type: 'error', msg: '❌ Falha no login.' });
      return;
    }

    pushToast({ type: 'success', msg: '✅ Sessão iniciada!' });
    await refreshUser();
    redirectByRole();

    setEmailLogin('');
    setSenhaLogin('');
    // fecha após um pequeno delay para ver o toast
    setTimeout(() => onClose?.(), 400); // ← seguro
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
      const m = '❌ As palavras-passe não coincidem.';
      setMsgReg(m);
      pushToast({ type: 'error', msg: m });
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
        const m = `${data?.error || data?.message || 'Erro ao criar conta.'}${code}`;
        setMsgReg(`❌ ${m}`);
        pushToast({ type: 'error', msg: `❌ ${m}` });
        return;
      }

      const m = '✅ Conta criada! A entrar…';
      setMsgReg(m);
      pushToast({ type: 'success', msg: m }, 1800);

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
      setTimeout(() => onClose?.(), 600); // ← seguro
    } catch {
      const m = '❌ Erro de conexão com o servidor.';
      setMsgReg(m);
      pushToast({ type: 'error', msg: m });
    } finally {
      setLoadingReg(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loadingLogin && !loadingReg && onClose?.()} // ← seguro
          />

          {/* Off-canvas panel */}
          <motion.div
            className="fixed top-0 right-0 w-full sm:max-w-sm md:max-w-md h-svh z-[110] bg-neutral-900 text-white"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
          >
            {/* Top progress bar (mostra quando está carregando) */}
            <AnimatePresence>
              {showTopProgress && (
                <motion.div
                  key="progress"
                  className="absolute top-0 left-0 right-0 h-1 bg-[#FF4500]/70 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="h-full w-1/3 animate-[progress_1.2s_ease-in-out_infinite]" style={{ background: '#FF4500' }} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between bg-black px-4 py-3 pt-[max(12px,env(safe-area-inset-top))]">
              <Image src="/Logo_TipFans.png" alt="Logo" width={180} height={40} className="h-auto" priority />
              <button
                onClick={() => onClose?.()} // ← seguro
                disabled={loadingLogin || loadingReg}
                className="text-white/90 hover:text-white text-xl disabled:opacity-50"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Banner imagético + gradiente (altura reduzida no mobile) */}
            <div className="relative h-40 sm:h-56 bg-[#2b2b2b]">
              <Image src="/Jog_login.png" alt="" fill className="object-cover opacity-25" priority />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
            </div>

            {/* Conteúdo rolável */}
            <div className="flex flex-col h=[calc(100svh-40px-56px)] sm:h-[calc(100svh-56px-56px)] overflow-hidden">
              <div className="relative flex-1 overflow-y-auto px-4 py-5">
                {/* Tabs */}
                <div className="mb-5 flex items-center gap-8">
                  <button
                    className={`text-base sm:text-lg font-semibold ${tab === 'register' ? 'text-white' : 'text-white/70'}`}
                    onClick={() => setTab('register')}
                    type="button"
                  >
                    Registo
                  </button>
                  <button
                    className={`text-base sm:text-lg font-semibold ${tab === 'login' ? 'text-white' : 'text-white/70'}`}
                    onClick={() => setTab('login')}
                    type="button"
                  >
                    Log In
                  </button>
                </div>

                {/* Região de status para leitores de tela */}
                <p className="sr-only" role="status" aria-live="polite">
                  {loadingLogin || loadingReg ? 'A processar…' : 'Pronto'}
                </p>

                {/* Forms */}
                {tab === 'login' ? (
                  <form onSubmit={handleLogin} className="space-y-4" noValidate>
                    <div>
                      <label className="block text-sm text-white/90 mb-1">Nome de utilizador ou E-mail</label>
                      <input
                        type="text"
                        value={emailLogin}
                        onChange={(e) => setEmailLogin(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none"
                        placeholder="email ou usuário"
                        autoComplete="username"
                        required
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/90 mb-1">Palavra-passe</label>
                      <input
                        type="password"
                        value={senhaLogin}
                        onChange={(e) => setSenhaLogin(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                      />
                    </div>

                    {erroLogin && <p className="text-red-400 text-sm">{erroLogin}</p>}

                    <button
                      type="submit"
                      disabled={loadingLogin || !emailLogin.trim() || !senhaLogin}
                      className="w-full bg-[#FF4500] hover:bg-orange-600 text-white py-2.5 rounded-md transition disabled:opacity-60 flex items-center justify-center gap-2"
                      aria-busy={loadingLogin}
                    >
                      {loadingLogin && (
                        <span className="inline-block h-4 w-4 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                      )}
                      {loadingLogin ? 'A entrar…' : 'Entrar'}
                    </button>

                    <div className="mt-3 text-center">
                      <p className="text-white/90 text-sm">
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
                      <label className="block text-sm text-white/90 mb-1">Nome de utilizador</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/90 mb-1">E-mail</label>
                      <input
                        type="email"
                        value={emailReg}
                        onChange={(e) => setEmailReg(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/90 mb-1">Palavra-passe</label>
                      <input
                        type="password"
                        value={senhaReg}
                        onChange={(e) => setSenhaReg(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/90 mb-1">Confirmar palavra-passe</label>
                      <input
                        type="password"
                        value={senhaReg2}
                        onChange={(e) => setSenhaReg2(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-white text-gray-900 placeholder:text-gray-500 focus:outline-none"
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
                      className="w-full bg-[#FF4500] hover:bg-orange-600 text-white py-2.5 rounded-md transition disabled:opacity-60 flex items-center justify-center gap-2"
                      aria-busy={loadingReg}
                    >
                      {loadingReg && (
                        <span className="inline-block h-4 w-4 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                      )}
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

              {/* Rodapé compacto (dica/links) */}
              <div className="px-4 py-3 border-t border-white/10 text-center text-xs text-white/70">
                Problemas para entrar? <a href="/recuperar" className="underline decoration-white/50 hover:decoration-white">Recuperar palavra-passe</a>
              </div>
            </div>
          </motion.div>

          {/* Toasts */}
          <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-[120] w-[92%] max-w-sm space-y-2">
            <AnimatePresence>
              {toasts.map(t => (
                <motion.div
                  key={t.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className={`rounded-md px-3 py-2 text-sm shadow-lg ${
                    t.type === 'success'
                      ? 'bg-green-600 text-white'
                      : t.type === 'error'
                      ? 'bg-red-600 text-white'
                      : 'bg-neutral-800 text-white'
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {t.msg}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Keyframes para a barra de progresso */}
          <style jsx global>{`
            @keyframes progress {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(20%); }
              100% { transform: translateX(100%); }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}
