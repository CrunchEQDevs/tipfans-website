// src/components/tipsters/tipisterdesk/types.ts
export type Sport = 'futebol' | 'basquete' | 'tenis' | 'esports';

export type ApiItem = {
  author: { id: number; slug: string; name: string; avatar?: string | null };
  window: { last: number };
  counts?: { tips: number; articles: number };
  applied?: { sport?: string; period?: number | 'all' };
  stats: {
    sports: Sport[];
    settledCount: number;
    pushes: number;
    stakeTotal: number;
    units: number;
    hitPct: number;
    roiPct: number;
    lastDate?: string;
  };
};

export type ApiResp = { items: ApiItem[] };
