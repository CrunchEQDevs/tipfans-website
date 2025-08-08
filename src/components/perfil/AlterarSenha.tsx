'use client';

import { useState } from 'react';

export default function AlterarSenha() {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();

    setErro('');
    setMensagem('');

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      setErro('Preencha todos os campos.');
      return;
    }

    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    // 🔐 Aqui você pode chamar sua API para alteração real da senha
    setMensagem('✅ Senha alterada com sucesso!');
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
  };

  return (
    <form onSubmit={handleAlterarSenha} className="space-y-4 max-w-md mx-auto">
      <div>
        <label className="block font-semibold mb-1">Senha atual</label>
        <input
          type="password"
          className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Nova senha</label>
        <input
          type="password"
          className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">Confirmar nova senha</label>
        <input
          type="password"
          className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Alterar senha
      </button>

      {erro && <p className="text-red-600 dark:text-red-400">{erro}</p>}
      {mensagem && <p className="text-green-600 dark:text-green-400">{mensagem}</p>}
    </form>
  );
}
