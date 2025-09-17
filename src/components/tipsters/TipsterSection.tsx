'use client';

import Image from 'next/image';
import Link from 'next/link';

export type TipCard = {
  id: string | number;
  title: string;
  sport: 'futebol' | 'basquete' | 'tenis' | 'esports';
  cover?: string | null;
  author?: string;
  createdAt?: string;
  href?: string;
  league?: string;
  teams?: string;
  odds?: string | number;
};

export default function TipsterSection({
  id,
  title,
  items,
  emptyMsg,
  viewAllHref,
}: {
  id: string;
  title: string;
  items: TipCard[];
  emptyMsg: string;
  viewAllHref?: string;
}) {
  return (
    <section id={id} className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[15px] font-bold uppercase tracking-wide">{title}</h2>
          <span className="h-px w-24 bg-white/20" />
        </div>
        {viewAllHref ? (
          <Link href={viewAllHref} className="text-sm text-white/80 hover:text-white">
            Ver mais {title} →
          </Link>
        ) : <span />}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl bg-[#1B1F2A] p-6 text-white/80 ring-1 ring-white/10">
          {emptyMsg}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((t, i) => {
            const href = t.href ?? `/tips/${t.sport}/${t.id}`;
            return (
              <Link
                key={String(t.id)}
                href={href}
                className="group relative overflow-hidden rounded-xl bg-[#1B1F2A] ring-1 ring-white/10 hover:ring-white/20 transition"
              >
                <div className="relative aspect-[16/10]">
                  {t.cover ? (
                    <Image
                      src={t.cover}
                      alt={t.title}
                      fill
                      className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10" />
                  )}
                  <div className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white">
                    {title}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold">{t.title}</h3>
                  {t.author || t.createdAt ? (
                    <p className="mt-1 text-xs text-white/60">
                      {t.author ? t.author : ''}{t.author && t.createdAt ? ' — ' : ''}{t.createdAt ? new Date(t.createdAt).toLocaleDateString('pt-PT') : ''}
                    </p>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
