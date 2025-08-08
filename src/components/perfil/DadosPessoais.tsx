'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

export default function DadosPessoais() {
  const { user } = useAuth();
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setNome(user.name || '');
      // Buscar idade no MongoDB
      const buscarExtras = async () => {
        try {
          const res = await fetch(`/api/user-extra?id=${user.id}`);
          const dados = await res.json();
          if (dados && dados.idade) {
            setIdade(dados.idade.toString());
          }
        } catch (err) {
          console.error('Erro ao buscar dados extras:', err);
        }
      };
      buscarExtras();
    }
  }, [user]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem('');
    setCarregando(true);

    if (!user?.id) {
      setMensagem('Usuário não autenticado.');
      return;
    }

    try {
      const res = await fetch('/api/user-extra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wpUserId: user.id,
          idade: Number(idade),
        }),
      });

      const resposta = await res.json();
      if (res.ok) {
        setMensagem('✅ Dados salvos com sucesso!');
      } else {
        setMensagem(`Erro ao salvar: ${resposta.error || 'desconhecido'}`);
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setMensagem('❌ Erro ao salvar os dados.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <form onSubmit={handleSalvar} className="space-y-4">
      <div>
        <label className="block font-semibold mb-1">Nome</label>
        <input
          type="text"
          className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
          value={nome}
          disabled
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Idade (opcional)</label>
        <input
          type="number"
          min={0}
          max={120}
          className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
          value={idade}
          onChange={(e) => setIdade(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={carregando}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        {carregando ? 'Salvando...' : 'Salvar Alterações'}
      </button>

      {mensagem && (
        <p className="mt-2 text-sm font-medium text-green-600 dark:text-green-400">{mensagem}</p>
      )}
    </form>
  );
}
