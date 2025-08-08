'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function FotoPerfil() {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [carregando, setCarregando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.id) {
      const buscarAvatar = async () => {
        try {
          const res = await fetch(`/api/user-extra?id=${user.id}`);
          const dados = await res.json();
          if (dados && dados.avatarUrl) {
            setPreview(dados.avatarUrl);
          }
        } catch (err) {
          console.error('Erro ao carregar avatar:', err);
        }
      };
      buscarAvatar();
    }
  }, [user]);

  const handleImagemSelecionada = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
      };
      reader.readAsDataURL(file);
      setMensagem('');
    }
  };

  const handleSalvarFoto = async () => {
    if (!user?.id || !preview) return;

    setCarregando(true);
    setMensagem('');

    try {
      const res = await fetch('/api/user-extra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wpUserId: user.id,
          avatarUrl: preview,
        }),
      });

      const resposta = await res.json();
      if (res.ok) {
        setMensagem('✅ Foto de perfil salva com sucesso!');
      } else {
        setMensagem(`Erro ao salvar: ${resposta.error || 'desconhecido'}`);
      }
    } catch (err) {
      console.error('Erro ao salvar avatar:', err);
      setMensagem('❌ Erro ao salvar a foto.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow">
        {preview ? (
          <img src={preview} alt="Foto de perfil" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700">
            Nenhuma imagem
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleImagemSelecionada}
        ref={inputRef}
        className="hidden"
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
      >
        Escolher imagem
      </button>

      {preview && (
        <button
          onClick={handleSalvarFoto}
          disabled={carregando}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {carregando ? 'Salvando...' : 'Salvar Foto'}
        </button>
      )}

      {mensagem && <p className="text-green-600 dark:text-green-400">{mensagem}</p>}
    </div>
  );
}
