export type WhenKey = "today" | "tomorrow" | "soon";

export type TipCard = {
  id: string | number;
  dateISO: string;
  league?: string;
  home: string;
  away: string;
  hotTip?: string;
  pick?: string;
  bothTeamsScore?: "YES" | "NO";
  correctScore?: string;
  ctaUrl?: string;
};
