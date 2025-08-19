'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [senha, setSenha]       = useState('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password: senha }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (data.redirect) {
          window.location.href = data.redirect as string;
          return;
        }
        setMensagem('✅ Conta criada e autenticada com sucesso. Redirecionando…');
        setTimeout(() => { window.location.href = '/perfil'; }, 800);
      } else {
        const msg = (data?.error || data?.message || 'Erro ao criar conta.') as string;
        setMensagem(`❌ ${msg}`);
      }
    } catch {
      setMensagem('❌ Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className=" p-6 bg-[#1E1E1E] dark:bg-gray-800 rounded-lg shadow relative overflow-hidden ">
      {/* Fundo: cobre todo o card, atrás e não captura cliques */}
      <div className=" inset-8  pointer-events-none">
        <Image
          src="/Jog_login.png"
          alt=""
          fill
          className="object-cover opacity-40"
          priority
        />
      </div>

      <h2 className="relative z-10 text-2xl font-bold mb-4 text-center text-white dark:text-white">
        Criar Conta
      </h2>

      <form className="space-y-4 px-8" onSubmit={handleRegister} >
        <input
          type="text"
          placeholder="Nome de utilizador"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="relative w-full px-3 py-2 border bg-white text-gray-700 placeholder:text-gray-500 rounded-md"
          autoComplete="username"
          required
        />
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className=" relative w-full px-3 py-2 border bg-white text-gray-700 placeholder:text-gray-500 rounded-md"
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="relative w-full px-3 py-2 border bg-white text-gray-700 placeholder:text-gray-500 rounded-md"
          autoComplete="new-password"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="relative w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded transition disabled:opacity-50"
        >
          {loading ? 'Criando...' : 'Cadastrar'}
        </button>
      </form>

      {mensagem && (
        <p
          className={`relative z-10 mt-4 text-center text-sm ${
            mensagem.startsWith('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
          }`}
        >
          {mensagem}
        </p>
      )}
    </div>
  );
}
