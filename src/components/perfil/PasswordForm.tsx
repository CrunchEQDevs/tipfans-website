'use client';

import { useState } from 'react';
import { FaLock } from 'react-icons/fa';

export default function PasswordForm() {
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [savingPwd, setSavingPwd] = useState(false);

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) {
      alert('As senhas não coincidem.');
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch('/api/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current: pwd.current, next: pwd.next }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out?.error || 'Falha ao alterar palavra-passe');
      alert('Palavra-passe atualizada.');
      setPwd({ current: '', next: '', confirm: '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar palavra-passe';
      alert(message);
    } finally {
      setSavingPwd(false);
    }
  }

  return (
    <section className="max-w-5xl mx-auto px-4 md:px-6">
      <div className="rounded-xl border border-white/10 bg-[#1E1E1E] p-6 text-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold">Alteração de Palavra-passe</h2>
        </div>

        <form onSubmit={savePassword} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Senha antiga */}
            <div className="md:col-span-2">
              <label className="block text-xs mb-1">Palavra-passe Antiga</label>
              <input
                type="password"
                className="w-full rounded-md bg-white/10 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-orange-500"
                value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
              />
            </div>

            {/* Senha nova */}
            <div>
              <label className="block text-xs mb-1">Palavra-passe Nova</label>
              <input
                type="password"
                className="w-full rounded-md bg-white/10 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-orange-500"
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
              />
            </div>

            {/* Confirmar */}
            <div>
              <label className="block text-xs mb-1">Confirmar Palavra-passe</label>
              <input
                type="password"
                className="w-full rounded-md bg-white/10 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-orange-500"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPwd}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-orange-600 hover:bg-orange-500 transition disabled:opacity-60"
            >
              <FaLock /> {savingPwd ? 'A guardar…' : 'Guardar alterações'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
