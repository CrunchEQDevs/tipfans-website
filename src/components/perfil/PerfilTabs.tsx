'use client';

import { useState } from 'react';
import DadosPessoais from '@/components/perfil/DadosPessoais';
import FotoPerfil from './FotoPerfil'; 
import AlterarSenha from './AlterarSenha';
import OfertasAplicadas from './OfertasAplicadas';





export default function PerfilTabs() {
  const [abaAtiva, setAbaAtiva] = useState<'dados' | 'senha' | 'foto' | 'ofertas'>('dados');

  return (
    <div>
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setAbaAtiva('dados')}
          className={`px-4 py-2 rounded ${abaAtiva === 'dados' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          Informações Pessoais
        </button>
        <button
          onClick={() => setAbaAtiva('senha')}
          className={`px-4 py-2 rounded ${abaAtiva === 'senha' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          Alterar Senha
        </button>
        <button
          onClick={() => setAbaAtiva('foto')}
          className={`px-4 py-2 rounded ${abaAtiva === 'foto' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          Foto de Perfil
        </button>
        <button
          onClick={() => setAbaAtiva('ofertas')}
          className={`px-4 py-2 rounded ${abaAtiva === 'ofertas' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
        >
          Ofertas Aplicadas
        </button>
      </div>

      {/* Conteúdo dinâmico */}
      <div>
        {abaAtiva === 'dados' && <DadosPessoais />}
        {abaAtiva === 'senha' && <AlterarSenha />}
        {abaAtiva === 'foto' && <FotoPerfil />}
        {abaAtiva === 'ofertas' && <OfertasAplicadas />}

      </div>
    </div>
  );
}
