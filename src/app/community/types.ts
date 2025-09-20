export type Article = {
  id: string | number;
  title: string;
  excerpt?: string;
  cover?: string | null;
  author?: string;
  authorAvatar?: string | null;
  authorRole?: string | null;
  authorHref?: string | null;
  createdAt?: string;
  href?: string;
};

export type UserLite = { id: string | number; name: string; avatar?: string | null };

export type Comment = {
  id: string | number;
  author: UserLite;
  content: string;
  createdAt: string;
};

export function fmtDateTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(+d)) return '';
  return d.toLocaleString('pt-PT');
}
