'use client';

import { useState } from 'react';

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
        // Se a API mandar redirect (ex.: administrator), respeita.
        if (data.redirect) {
          window.location.href = data.redirect as string;
          return;
        }

        // Login automático já deixou o cookie tf_token setado.
        setMensagem('✅ Conta criada e autenticada com sucesso. Redirecionando…');
        // Dá um respiro pra UX e vai pro perfil:
        setTimeout(() => {
          window.location.href = '/perfil';
        }, 800);
      } else {
        // A API pode devolver { error } ou { message }
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
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-white">
        Criar Conta
      </h2>

      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="text"
          placeholder="Nome de utilizador"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white"
          required
        />
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded transition disabled:opacity-50"
        >
          {loading ? 'Criando...' : 'Cadastrar'}
        </button>
      </form>

      {mensagem && (
        <p
          className={`mt-4 text-center text-sm ${
            mensagem.startsWith('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'
          }`}
        >
          {mensagem}
        </p>
      )}
    </div>
  );
}
