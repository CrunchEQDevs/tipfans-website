'use client';

import { useState } from 'react';

export default function RegisterForm() {
  const [username, setUsername] = useState('');
  const [uIdade, setUIdade] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password: senha,
          idade: uIdade,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const role = data.role;

        if (role === 'administrator') {
          window.location.href = 'https://tipfans.com/wp/wp-admin/index.php';
        } else {
          setMensagem('✅ Conta criada com sucesso!');
          setUsername('');
          setUIdade('');
          setEmail('');
          setSenha('');
        }
      } else {
        setMensagem(`❌ ${data.message || 'Erro ao criar conta.'}`);
      }
    } catch (error) {
      console.error(error);
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
          placeholder="Nome"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:text-white"
          required
        />
        <input
          type="number"
          placeholder="Idade"
          value={uIdade}
          onChange={(e) => setUIdade(e.target.value)}
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
        <p className="mt-4 text-center text-sm text-red-500 dark:text-red-400">
          {mensagem}
        </p>
      )}
    </div>
  );
}
