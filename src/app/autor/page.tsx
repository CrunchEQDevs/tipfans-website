// src/app/autor/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

type Summary = { published: number; drafts: number; total: number };
type Item = { id: number; date: string; status: string; title: string; link: string | null };

export default function AutorDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sum, setSum] = useState<Summary | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/login'); return; }
    const role = (user.role ?? '').toLowerCase();
    if (role !== 'author' && role !== 'administrator') { router.push('/perfil'); return; }

    (async () => {
      try {
        const s = await fetch('/api/wp/posts?summary=1', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null);
        setSum(s?.summary ?? null);
        const l = await fetch('/api/wp/posts?per_page=5&page=1', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null);
        setItems(Array.isArray(l?.items) ? l.items as Item[] : []);
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Falha ao carregar');
      }
    })();
  }, [user, loading, router]);

  if (loading || !user) return <main className="min-h-[60vh] grid place-items-center">A carregar…</main>;

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Área do Autor</h1>
          <Link href="/autor/novo" className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500">
            + Novo artigo
          </Link>
        </div>

        {erro && <p className="mb-4 text-sm text-red-600">{erro}</p>}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow dark:bg-white/5">
            <p className="text-sm text-gray-600 dark:text-gray-300">Publicados</p>
            <p className="text-3xl font-semibold">{sum?.published ?? '—'}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow dark:bg-white/5">
            <p className="text-sm text-gray-600 dark:text-gray-300">Rascunhos</p>
            <p className="text-3xl font-semibold">{sum?.drafts ?? '—'}</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow dark:bg-white/5">
            <p className="text-sm text-gray-600 dark:text-gray-300">Total</p>
            <p className="text-3xl font-semibold">{sum?.total ?? '—'}</p>
          </div>
        </div>

        <h2 className="mt-8 mb-2 text-lg font-semibold">Últimos artigos</h2>
        <div className="overflow-hidden rounded-xl bg-white shadow dark:bg-white/5">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-white/10">
              <tr>
                <th className="px-4 py-2 text-left">Título</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t dark:border-white/10">
                  <td className="px-4 py-2">{p.title}</td>
                  <td className="px-4 py-2 text-center capitalize">{p.status}</td>
                  <td className="px-4 py-2 text-center">{new Date(p.date).toLocaleDateString('pt-PT')}</td>
                  <td className="px-4 py-2 text-center">
                    {p.link ? <a href={p.link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Ver</a> : '—'}
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Ainda não há artigos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
