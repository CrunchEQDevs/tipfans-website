// src/components/LoginPanel.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

type LoginPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register'; // <- permite abrir direto em Registo
};

export default function LoginPanel({ isOpen, onClose, initialTab = 'login' }: LoginPanelProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);

  // --- LOGIN ---
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [erroLogin, setErroLogin] = useState('');

  // --- REGISTO ---
  const [username, setUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPass2, setRegPass2] = useState('');
  const [loadingReg, setLoadingReg] = useState(false);
  const [msgReg, setMsgReg] = useState('');

  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }, [isOpen]);

  // sincroniza a aba quando o parent quiser abrir direto em "register"
  useEffect(() => setTab(initialTab), [initialTab, isOpen]);

  const activeClass = (t: 'login' | 'register') =>
    t === tab ? 'text-white border-b-2 border-[#ED4F00]' : 'text-white/90 hover:text-white';

  // -------- handlers ----------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLogin('');
    setLoadingLogin(true);

    const sucesso = await login(email, senha);
    if (sucesso) {
      const role = (localStorage.getItem('userRole') ?? '').toLowerCase();
      if (role === 'administrator') {
        window.location.href = 'https://tipfans.com/wp/wp-admin/index.php';
      } else if (role === 'author') {
        router.push('/autor');
      } else {
        router.push('/');
      }
      setEmail(''); setSenha(''); onClose();
    } else {
      setErroLogin('Usuário ou senha inválidos.');
    }
    setLoadingLogin(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsgReg('');
    if (regPass !== regPass2) {
      setMsgReg('❌ As palavras-passe não coincidem.');
      return;
    }
    setLoadingReg(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email: regEmail, password: regPass }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMsgReg('✅ Conta criada. Pode iniciar sessão.');
        // opcional: mudar automaticamente para a aba login
        setTimeout(() => setTab('login'), 800);
      } else {
        setMsgReg(`❌ ${data?.error || data?.message || 'Erro ao criar conta.'}`);
      }
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
          {/* overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* drawer */}
          <motion.aside
            className="fixed right-0 top-0 z-50 h-full w-full sm:max-w-sm md:max-w-md overflow-y-auto"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
          >
            {/* topo com logo + X */}
            <div className="flex items-center justify-between bg-black px-4 py-4">
              <Image src="/Logo_TipFans.png" alt="TIPFANS" width={220} height={60} className="h-auto" priority />
              <button onClick={onClose} aria-label="Fechar" className="text-white/90 hover:text-white text-xl">✕</button>
            </div>

            {/* área com bg do jogador + fade laranja */}
            <div className="relative bg-[#1E1E1E]">
              <div className="absolute inset-0">
                <Image src="/Jog_login.png" alt="" fill className="object-cover opacity-20" priority />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#ED4F00]/30 via-transparent to-transparent" />
              </div>

              <div className="relative px-6 py-6">
                {/* abas */}
                <div className="mb-3 flex items-center gap-8">
                  <button type="button" className={`text-lg font-semibold ${activeClass('register')}`} onClick={() => setTab('register')}>
                    Registo
                  </button>
                  <button type="button" className={`text-lg font-semibold ${activeClass('login')}`} onClick={() => setTab('login')}>
                    Log In
                  </button>
                </div>
                {/* linha fina */}
                <div className="mb-5 h-px w-full bg-white/20" />

                {/* ====== REGISTO ====== */}
                {tab === 'register' && (
                  <form className="space-y-4 pb-10" onSubmit={handleRegister}>
                    <div>
                      <label className="mb-1 block text-sm text-white">Nome de utilizador</label>
                      <input
                        type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#ED4F00]/50"
                        placeholder=""
                        autoComplete="username" required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-white">E-mail</label>
                      <input
                        type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#ED4F00]/50"
                        autoComplete="email" required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-white">Palavra-passe</label>
                      <input
                        type="password" value={regPass} onChange={(e) => setRegPass(e.target.value)}
                        className="w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#ED4F00]/50"
                        autoComplete="new-password" required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-white">Confirmar palavra-passe</label>
                      <input
                        type="password" value={regPass2} onChange={(e) => setRegPass2(e.target.value)}
                        className="w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#ED4F00]/50"
                        autoComplete="new-password" required
                      />
                    </div>

                    <button
                      type="submit" disabled={loadingReg}
                      className="mt-2 w-full rounded-md bg-[#ED4F00] py-2 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                    >
                      {loadingReg ? 'A criar…' : 'Registar'}
                    </button>

                    {msgReg && (
                      <p className={`text-sm ${msgReg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>{msgReg}</p>
                    )}

                    <div className="mt-4 space-y-1 text-sm">
                      <p className="text-white">
                        Já tem conta?{' '}
                        <button type="button" onClick={() => setTab('login')} className="font-semibold text-[#ED4F00] hover:underline">
                          Iniciar sessão
                        </button>
                      </p>
                      <button
                        type="button"
                        onClick={() => { onClose(); router.push('/recuperar-senha'); }}
                        className="text-left font-medium text-[#ED4F00] hover:underline"
                      >
                        Esqueceu-se da senha?
                      </button>
                    </div>
                  </form>
                )}

                {/* ====== LOGIN ====== */}
                {tab === 'login' && (
                  <form className="space-y-4 mb-10" onSubmit={handleLogin}>
                    <div>
                      <label className="mb-1 block text-sm text-white">Nome de utilizador ou E-mail</label>
                      <input
                        type="text" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#ED4F00]/50"
                        autoComplete="username"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-white">Palavra-passe</label>
                      <input
                        type="password" value={senha} onChange={(e) => setSenha(e.target.value)}
                        className="w-full rounded-md border border-white/15 bg-white/10 px-3 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#ED4F00]/50"
                        autoComplete="current-password"
                      />
                    </div>

                    {erroLogin && <p className="text-sm text-red-400">{erroLogin}</p>}

                    <button
                      type="submit" disabled={loadingLogin}
                      className="mt-2 w-full rounded-md bg-[#ED4F00] py-2 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
                    >
                      {loadingLogin ? 'Entrando…' : 'Entrar'}
                    </button>

                    <div className="mt-4 space-y-1 text-sm">
                      <p className="text-white">
                        Ainda não tem conta?{' '}
                        <button type="button" onClick={() => setTab('register')} className="font-semibold text-[#ED4F00] hover:underline">
                          Registar
                        </button>
                      </p>
                      <button
                        type="button"
                        onClick={() => { onClose(); router.push('/recuperar-senha'); }}
                        className="text-left font-medium text-[#ED4F00] hover:underline"
                      >
                        Esqueceu-se da senha?
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
