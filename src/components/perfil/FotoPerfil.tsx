'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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
          if (dados?.avatarUrl) {
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
        setPreview(reader.result as string);
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
        setMensagem(`❌ Erro: ${resposta.error || 'Desconhecido'}`);
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
      <div className="w-32 h-32 relative rounded-full overflow-hidden border-4 border-blue-500 shadow-md bg-gray-200 dark:bg-gray-700">
        {preview ? (
          <Image
            src={preview}
            alt="Foto de perfil"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
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
        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
      >
        Escolher imagem
      </button>

      {preview && (
        <button
          onClick={handleSalvarFoto}
          disabled={carregando}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          {carregando ? 'Salvando...' : 'Salvar Foto'}
        </button>
      )}

      {mensagem && (
        <p className="text-sm mt-2 text-green-600 dark:text-green-400">{mensagem}</p>
      )}
    </div>
  );
}
