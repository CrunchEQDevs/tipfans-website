export type TipCard = {
  id: string | number;
  title: string;
  sport?: string;      // futebol | basquete | tenis | esports
  league?: string;
  teams?: string;
  pick?: string;
  odds?: string | number;
  author?: string;
  image?: string | null;
  createdAt?: string;

  href?: string;       // link pronto
  hrefPost?: string;   // compat

  // usados pelo cartão
  resumo?: string;     // texto limpo
  excerpt?: string;    // fallback (também texto limpo)
  autorLinha?: string; // ex.: "content — 16/09/2025"
  categoria?: string;  // ex.: "Futebol"
};
