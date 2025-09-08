'use client';

import { useEffect, useMemo, useState } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

type PerfilGetResp = {
  ok?: boolean;
  user?: {
    id?: number;
    email?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    birthdate?: string;          // YYYY-MM-DD (servidor)
    marketing_optin?: boolean;
    avatar_urls?: Record<string, string>;
  };
  error?: string;
};

type PerfilPutResp = {
  ok?: boolean;
  profile?: PerfilGetResp['user'];
  error?: string;
  details?: unknown;
};

/* ===== helpers ===== */
function toDisplayDate(iso?: string): string {
  // YYYY-MM-DD -> DD/MM/YYYY
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function toISODate(display?: string): string | undefined {
  // aceita DD/MM/YYYY e YYYY-MM-DD
  if (!display) return undefined;
  const v = display.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return undefined;
}
function maskBirthdate(input: string): string {
  // força dígitos e coloca barras DD/MM/YYYY
  const digits = input.replace(/\D/g, '').slice(0, 8);
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 4);
  const p3 = digits.slice(4, 8);
  if (digits.length <= 2) return p1;
  if (digits.length <= 4) return `${p1}/${p2}`;
  return `${p1}/${p2}/${p3}`;
}
function maskPhone(input: string): string {
  // ligações PT simples: permite + e números, agrupa de forma leve
  let v = input.replace(/[^\d+]/g, '');
  // se começar com +351, mantém; se começar com 0, mantém
  return v;
}

export default function PerfilForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birth, setBirth] = useState(''); // DD/MM/YYYY
  const [optIn, setOptIn] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  function showToast(type: 'success' | 'error', msg: string, ms = 2800) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), ms);
  }

  // carrega perfil
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const res = await fetch('/api/perfil', { cache: 'no-store' });
        const data: PerfilGetResp = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Falha ao carregar perfil');

        if (dead) return;
        const u = data.user || {};
        setName((u.name || '').trim());
        setFirst((u.first_name || '').trim());
        setLast((u.last_name || '').trim());
        setEmail((u.email || '').trim());
        setPhone((u.phone || '').trim());
        setBirth(toDisplayDate(u.birthdate));
        setOptIn(!!u.marketing_optin);
      } catch (e: any) {
        showToast('error', e?.message || 'Não foi possível carregar o perfil.');
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, []);

  const canSave = useMemo(() => {
    if (saving || loading) return false;
    // validação simples da data (se preenchida)
    if (birth) {
      const iso = toISODate(birth);
      if (!iso) return false;
      // checagem básica de calendário
      const dt = new Date(iso);
      if (Number.isNaN(dt.getTime())) return false;
    }
    return true;
  }, [saving, loading, birth]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const body: any = {
        name: name,
        first_name: first,
        last_name: last,
        phone: phone,
        marketing_optin: optIn,
      };
      const iso = toISODate(birth);
      if (iso) body.birthdate = iso;

      const res = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const out: PerfilPutResp = await res.json();
      if (!res.ok || !out.ok) {
        throw new Error(out?.error || `Erro ao salvar (${res.status})`);
      }

      // reflete retorno (nome pode vir composto do WP)
      const p = out.profile;
      if (p) {
        setName((p.name || '').trim());
        setFirst((p.first_name || '').trim());
        setLast((p.last_name || '').trim());
        setPhone((p.phone || '').trim());
        setBirth(toDisplayDate(p.birthdate));
        setOptIn(!!p.marketing_optin);
      }

      showToast('success', 'Perfil atualizado com sucesso!');
    } catch (e: any) {
      showToast('error', e?.message || 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="max-w-5xl mx-auto px-4 md:px-6">
      {/* Toast */}
      <div aria-live="polite" className="fixed top-4 right-4 z-50">
        {toast && (
          <div
            className={[
              'flex items-center gap-2 rounded-xl px-4 py-3 shadow-xl text-white',
              toast.type === 'success' ? 'bg-emerald-600/95' : 'bg-rose-600/95',
            ].join(' ')}
          >
            {toast.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
            <span className="text-sm font-medium">{toast.msg}</span>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#1E1E1E] p-6 text-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold">Informações de Conta</h2>
          {loading && <span className="text-xs text-white/70">a carregar…</span>}
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome público */}
            <div>
              <label className="block text-xs mb-1">Nome a mostrar</label>
              <input
                className="w-full rounded-md bg-white/10 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-orange-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Joana Silva"
              />
            </div>

            {/* Primeiro nome */}
            <div>
              <label className="block text-xs mb-1">Primeiro nome</label>
              <input
                className="w-full rounded-md bg-white/10 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-orange-500"
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                placeholder="Ex.: Joana"
              />
            </div>

            {/* Apelido */}
            <div>
              <label className="block text-xs mb-1">Apelido</label>
              <input
                className="w-full rounded-md bg-white/10 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-orange-500"
                value={last}
                onChange={(e) => setLast(e.target.value)}
                placeholder="Ex.: Silva"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs mb-1">Email</label>
              <input
                type="email"
                readOnly
                disabled
                className="w-full rounded-md bg-white/10 border border-white/10 px-3 py-2 text-sm opacity-80 cursor-not-allowed"
                value={email}
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-xs mb-1">Contacto</label>
              <input
                className="w-full rounded-md bg-white/10 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-orange-500"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                placeholder="+351 9XX XXX XXX"
                inputMode="tel"
              />
            </div>

            {/* Data de nascimento */}
            <div>
              <label className="block text-xs mb-1">Data de nascimento</label>
              <input
                className="w-full rounded-md bg-white/10 border border-white/10 px-3 py-2 text-sm outline-none focus:ring-2 ring-orange-500"
                value={birth}
                onChange={(e) => setBirth(maskBirthdate(e.target.value))}
                placeholder="DD/MM/AAAA"
                inputMode="numeric"
              />
            </div>

            {/* Opt-in marketing */}
            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-orange-500 h-4 w-4"
                  checked={optIn}
                  onChange={(e) => setOptIn(e.target.checked)}
                />
                Autorizo a receber atualizações por e-mail.
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSave}
              className="px-4 py-2 rounded-md text-sm font-medium bg-orange-600 hover:bg-orange-500 transition disabled:opacity-60"
            >
              {saving ? 'A guardar…' : 'Guardar alterações'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
