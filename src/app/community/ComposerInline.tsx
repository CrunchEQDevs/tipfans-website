'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { UserLite } from './types';

export default function ComposerInline({
  isAuthed,
  currentUser,
  onLogin,
  onPublish,
}: {
  isAuthed: boolean;
  currentUser: UserLite | null;
  onLogin: () => void;
  onPublish: (text: string) => void;
}) {
  const [text, setText] = useState('');
  const emojis = ['😀', '😮', '😡', '😅', '🥳'];
  const canSend = isAuthed && text.trim().length >= 2;

  return (
    <div className="rounded-lg bg-[#151A24] p-3 ring-1 ring-white/10">
      <div className="flex items-start gap-3">
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/10">
          <Image
            src={(isAuthed && (currentUser?.avatar as string)) || '/user.png'}
            alt={(currentUser?.name as string) || 'Você'}
            fill
            className="object-cover"
            sizes="32px"
            unoptimized
          />
        </div>

        <div className="flex-1">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isAuthed ? 'Entre na conversa…' : 'Entre para participar da conversa'}
            className="w-full rounded-md bg-[#0F1320] px-3 py-2 text-sm text-white placeholder:text-white/40 outline-none ring-1 ring-white/10 focus:ring-[#ED4F00]/30 disabled:opacity-60"
            disabled={!isAuthed}
          />

          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-2">
              {emojis.map((e) => (
                <button
                  key={e}
                  type="button"
                  className="rounded bg-white/5 px-2 py-1 text-sm hover:bg-white/10 disabled:opacity-50"
                  onClick={() => setText((t) => (t ? `${t} ${e}` : e))}
                  disabled={!isAuthed}
                  aria-label={`Reagir ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              {!isAuthed && (
                <button
                  type="button"
                  onClick={onLogin}
                  className="rounded bg-white/20 px-3 py-1.5 text-sm font-semibold text-white"
                >
                  Entrar
                </button>
              )}
              <button
                type="button"
                onClick={() => (canSend ? (onPublish(text.trim()), setText('')) : onLogin())}
                disabled={!isAuthed}
                className={`rounded px-3 py-1.5 text-sm font-semibold ${
                  canSend ? 'bg-[#ED4F00] text-white hover:brightness-110' : 'bg-white/10 text-white/40'
                }`}
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
