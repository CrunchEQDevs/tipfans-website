'use client';

import { useEffect, useState } from 'react';

type AccountForm = {
  displayName: string;
  email: string;
  phone: string;
  avatarUrl: string;
};

type PerfilGetResp = {
  ok?: boolean;
  user?: {
    email?: string;
    name?: string;
    displayName?: string;
    avatarUrl?: string;
    phone?: string;
  };
  error?: string;
};

export default function PerfilForm() {
  const [account, setAccount] = useState<AccountForm>({
    displayName: '',
    email: '',
    phone: '',
    avatarUrl: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carrega dados reais
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch('/api/perfil', { cache: 'no-store' });
        const data: PerfilGetResp = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Falha a carregar perfil');

        const u = data.user || {};
        if (cancel) return;

        setAccount({
          displayName: (u.displayName || u.name || '').trim(),
          email: (u.email || '').trim(),
          phone: (u.phone || '').trim(),
          avatarUrl: (u.avatarUrl || '').trim(),
        });
      } catch {
        /* silencioso */
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  async function saveAccount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        displayName: account.displayName,
        phone: account.phone,
      };
      if (account.avatarUrl) body.avatarUrl = account.avatarUrl;

      const res = await fetch('/api/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const out = await res.json();
      if (!res.ok) throw new Error(out?.error || 'Erro ao salvar');
      alert('Informações de conta atualizadas!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar';
      alert(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="text-gray-100 rounded-sm max-w-6xl mx-auto bg-[#1E1E1E] pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-300">Informações de Conta</h2>
        {loading && <span className="text-xs text-gray-400">a carregar...</span>}
      </div>

      <form onSubmit={saveAccount} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome a mostrar (displayName) */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Nome a mostrar</label>
            <input
              className="w-full rounded-md bg-gray-800 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-orange-500"
              value={account.displayName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAccount({ ...account, displayName: e.target.value })
              }
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Telefone</label>
            <input
              className="w-full rounded-md bg-gray-800 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-orange-500"
              value={account.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAccount({ ...account, phone: e.target.value })
              }
              placeholder="+351 9XX XXX XXX"
            />
          </div>

          {/* Email (read-only) */}
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Email (não editável aqui)</label>
            <input
              type="email"
              className="w-full rounded-md bg-gray-800/60 border border-white/10 px-3 py-2 text-sm outline-none cursor-not-allowed opacity-80"
              value={account.email}
              readOnly
              disabled
            />
          </div>

          {/* Avatar URL */}
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Foto (URL pública)</label>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-md bg-gray-800 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-orange-500"
                value={account.avatarUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAccount({ ...account, avatarUrl: e.target.value })
                }
                placeholder="https://.../minha-foto.jpg"
              />
              <button
                type="button"
                onClick={() => setAccount((a) => ({ ...a }))}
                className="px-3 py-2 rounded-md text-sm font-medium bg-black/50 hover:bg-black/60"
                title="Aplicar preview"
              >
                Aplicar
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Para upload de ficheiro, adiciona um endpoint (ex.: <code>/api/avatar</code>) e eu adapto aqui.
            </p>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving || loading}
            className="px-4 py-2 rounded-md text-sm font-medium bg-orange-600 hover:bg-orange-500 transition disabled:opacity-60"
          >
            {saving ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </div>
      </form>
    </section>
  );
}
