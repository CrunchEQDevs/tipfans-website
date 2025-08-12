'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type UserMe = {
  id: string | number;
  name: string;
  email: string;
  avatarUrl?: string;
};

export default function AlterarPerfilPage() {
  const router = useRouter();
  const [me, setMe] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // bootstrap com /api/me
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/me', { credentials: 'include', cache: 'no-store' });
        if (!res.ok) throw new Error('Não autenticado');
        const data = await res.json();
        const user = data?.user as UserMe | undefined;
        setMe(user ?? null);
        setName(user?.name ?? '');
        setEmail(user?.email ?? '');
        setAvatarPreview(user?.avatarUrl ?? null);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : 'Erro ao carregar perfil');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function onPickAvatar(file?: File) {
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (newPass && newPass !== confirmPass) {
      setErr('A confirmação da nova senha não coincide.');
      return;
    }

    setSaving(true);
    try {
      // 1) Atualiza dados básicos + senha (opcionais)
      const updRes = await fetch('/api/account/update', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          current_password: curPass || undefined,
          new_password: newPass || undefined,
        }),
      });
      const updJson = await updRes.json().catch(() => ({}));
      if (!updRes.ok) throw new Error((updJson as { error?: string })?.error || 'Falha ao atualizar conta');

      // 2) Avatar (opcional)
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const avaRes = await fetch('/api/account/avatar', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        const avaJson = await avaRes.json().catch(() => ({}));
        if (!avaRes.ok) throw new Error((avaJson as { error?: string })?.error || 'Falha ao atualizar avatar');
      }

      // 3) Refresh do /api/me e feedback
      const refreshed = await fetch('/api/me', { credentials: 'include', cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      if (refreshed?.user) {
        setMe(refreshed.user as UserMe);
        setMsg('✅ Perfil atualizado com sucesso.');
      } else {
        setMsg('✅ Perfil atualizado.');
      }

      // limpa campos sensíveis
      setCurPass(''); setNewPass(''); setConfirmPass('');
      // volta ao /perfil
      setTimeout(() => router.push('/perfil'), 600);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao guardar alterações');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-[60vh] grid place-items-center text-gray-600 dark:text-gray-300">
        A carregar…
      </main>
    );
  }

  if (!me) {
    return (
      <main className="min-h-[60vh] grid place-items-center">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          {err || 'Inicia sessão para continuar.'}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow ring-1 ring-gray-200 dark:bg-white/5 dark:ring-white/10">
        <h1 className="mb-6 text-2xl font-bold">Alterar perfil</h1>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Avatar */}
          <div>
            <label className="mb-2 block text-sm font-medium">Foto de perfil</label>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-gray-200 dark:ring-white/15">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xs text-gray-500">Sem imagem</div>
                )}
              </div>
              <label className="cursor-pointer rounded-lg bg-gray-700 px-3 py-2 text-sm text-white hover:bg-gray-800 dark:bg-white/10 dark:hover:bg-white/20">
                Escolher imagem
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onPickAvatar(e.target.files?.[0] ?? undefined)}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">PNG/JPG até ~5 MB.</p>
          </div>

          {/* Nome + Email */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-white/10 dark:bg-white/10"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-white/10 dark:bg-white/10"
                required
              />
            </div>
          </div>

          {/* Senha */}
          <fieldset className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
            <legend className="px-2 text-sm font-medium text-gray-700 dark:text-gray-200">Alterar senha (opcional)</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm">Senha atual</label>
                <input
                  type="password"
                  value={curPass}
                  onChange={(e) => setCurPass(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-white/10 dark:bg-white/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Nova senha</label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-white/10 dark:bg-white/10"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm">Confirmar nova senha</label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-white/10 dark:bg-white/10"
                />
              </div>
            </div>
          </fieldset>

          {/* Feedback */}
          {err && <p className="text-sm text-red-600 dark:text-red-400">{err}</p>}
          {msg && <p className="text-sm text-green-600 dark:text-green-400">{msg}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? 'A guardar…' : 'Guardar alterações'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/perfil')}
              className="rounded-xl bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
