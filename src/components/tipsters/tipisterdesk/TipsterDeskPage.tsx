'use client';
import type { ApiItem, ApiResp } from '@/components/tipsters/tipisterdesk/types';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import TipsterDeskHeader from './TipsterDeskHeader';
import TipsterDeskList from './TipsterDeskList';


const SPORT_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'futebol', label: 'Futebol' },
  { value: 'tenis', label: 'Ténis' },
  { value: 'basquete', label: 'Basquete' },
  { value: 'esports', label: 'eSports' },
] as const;

export default function TipsterDeskPage() {
  const [items, setItems] = useState<ApiItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [order, setOrder] = useState<'roi' | 'hit'>('roi');
  const [sport, setSport] = useState<(typeof SPORT_OPTIONS)[number]['value']>('all');
  const [last] = useState(20);

  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setAnimateBars(false);

        const u = new URL('/api/competicao/masters', window.location.origin);
        u.searchParams.set('order', order);
        u.searchParams.set('sport', sport);
        u.searchParams.set('last', String(last));
        u.searchParams.set('limit', '6');
        u.searchParams.set('_', String(Date.now()));

        const r = await fetch(u.toString(), { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = (await r.json()) as ApiResp;
        if (!cancel) setItems(Array.isArray(json.items) ? json.items : []);
      } catch (e: any) {
        if (!cancel) setErr(String(e?.message ?? e));
      } finally {
        if (!cancel) {
          setLoading(false);
          requestAnimationFrame(() => setAnimateBars(true));
        }
      }
    })();
    return () => { cancel = true; };
  }, [order, sport, last]);

  const metricOf = useCallback(
    (it: ApiItem) => (order === 'hit' ? (it.stats?.hitPct ?? 0) : (it.stats?.roiPct ?? 0)),
    [order]
  );
  const hasMetrics = useCallback((it: ApiItem) => Number(it?.stats?.settledCount ?? 0) > 0, []);

  const visible = useMemo(() => {
    if (!items) return [] as ApiItem[];
    if (sport === 'all') return items;
    return items.filter((it) => hasMetrics(it) || (it.stats?.sports ?? []).includes(sport as any));
  }, [items, sport, hasMetrics]);

  const { minVal, maxVal } = useMemo(() => {
    const withMetrics = visible.filter(hasMetrics);
    if (!withMetrics.length) return { minVal: 0, maxVal: 0 };
    const vals = withMetrics.map(metricOf);
    return { minVal: Math.min(...vals), maxVal: Math.max(...vals) };
  }, [visible, metricOf, hasMetrics]);

  const round1 = (n: number) => Number((n ?? 0).toFixed(1));
  const leaderSlugs = useMemo(() => {
    const withMetrics = visible.filter(hasMetrics);
    const set = new Set<string>();
    if (!withMetrics.length) return [] as string[];
    const top = Math.max(...withMetrics.map(metricOf));
    const top1 = round1(top);
    for (const it of withMetrics) {
      if (round1(metricOf(it)) === top1) set.add(it.author.slug);
    }
    return Array.from(set);
  }, [visible, metricOf, hasMetrics]);

  return (
    <section className="relative w-full bg-[#1E1E1E] py-8 overflow-hidden">
      <div className="pointer-events-none absolute left-0  hidden md:block ">

      </div>

      <div className="relative z-10 w-full py-8">
        <div className="container mx-auto px-4">
          <div className="rounded-xl bg-[#1E1E1E]/60 backdrop-blur-sm text-center ">
            <TipsterDeskHeader
              order={order}
              setOrder={setOrder}
              sport={sport}
              setSport={setSport}
              loading={loading}
              err={err}
              visibleCount={visible.length}
            />
            <TipsterDeskList
              items={visible}
              loading={loading}
              err={err}
              order={order}
              minVal={minVal}
              maxVal={maxVal}
              leaderSlugs={leaderSlugs}
              animateBars={animateBars}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
