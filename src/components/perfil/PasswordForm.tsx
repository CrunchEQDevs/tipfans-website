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
      // ✅ sem `any`, usa `unknown`
      const message = err instanceof Error ? err.message : 'Erro ao alterar palavra-passe';
      alert(message);
    } finally {
      setSavingPwd(false);
    }
  }

  return (
    <section className="text-gray-100 rounded-sm max-w-6xl mx-auto px-4 ">
      <h2 className="text-sm font-semibold text-white mb-4">
        Alteração Palavra-passe
      </h2>

      <form onSubmit={savePassword} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs text-white mb-1">Palavra-passe Antiga</label>
            <input
              type="password"
              className="w-[49%] rounded-sm  border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-orange-500"
              value={pwd.current}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPwd({ ...pwd, current: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs text-white mb-1">Palavra-passe Nova</label>
            <input
              type="password"
              className="w-full mb-3 rounded-sm bg-[#FFFFFF33] border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-orange-500"
              value={pwd.next}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPwd({ ...pwd, next: e.target.value })
              }
            />
          
            <label className="block text-xs text-white mb-1">Confirmar palavra-passe</label>
            <input
              type="password"
              className="w-full rounded-sm bg-[#FFFFFF33] border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-orange-500"
              value={pwd.confirm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPwd({ ...pwd, confirm: e.target.value })
              }
            />
          </div>

          
        </div>

        <button
          type="submit"
          disabled={savingPwd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-orange-600 hover:bg-orange-500 transition disabled:opacity-60"
        >
          <FaLock /> {savingPwd ? 'A guardar...' : 'Guardar alterações'}
        </button>
      </form>
    </section>
  );
}
