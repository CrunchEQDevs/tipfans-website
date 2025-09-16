// src/lib/fetchHeroSlides.ts
const WP_BASE =
  process.env.WP_BASE_URL ||
  process.env.NEXT_PUBLIC_WP_BASE_URL ||
  "https://www.wp.tipfans.com";

const ENV_CPT = (process.env.WP_HERO_CPT_SLUG || process.env.WP_TIPS_CPT_SLUG || "").trim();

// Tentativas típicas para artigos/notícias + fallback "posts"
const CANDIDATES = [ENV_CPT, "articles", "noticias", "news", "posts"].filter(Boolean);

const stripHtml = (html: string) =>
  (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

async function tryFetch(typeSlug: string, limit: number) {
  const url = `${WP_BASE}/wp-json/wp/v2/${typeSlug}?per_page=${limit}&_embed=1`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    if (res.status === 404) return null;
    console.error(`WP fetch ${typeSlug} error:`, res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return Array.isArray(data) ? data : null;
}

// Escolhe a melhor imagem destacada disponível
function pickFeaturedImage(p: any): string {
  const media = p?._embedded?.["wp:featuredmedia"]?.[0];
  const sizes = media?.media_details?.sizes;
  return (
    sizes?.large?.source_url ||
    sizes?.full?.source_url ||
    media?.source_url ||
    "/noticia3.jpg"
  );
}

// Detecta o "sport" a partir das taxonomias (fallback: futebol)
function detectSport(p: any): "futebol" | "basquete" | "tenis" | "esports" {
  const terms = (p?._embedded?.["wp:term"] || []).flat() as any[];
  const slugs = terms.map(t => String(t?.slug || "").toLowerCase());

  if (slugs.some(s => ["basquete", "basket", "basketball"].includes(s))) return "basquete";
  if (slugs.some(s => ["tenis", "ténis", "tennis"].includes(s))) return "tenis";
  if (slugs.some(s => ["esports", "e-sports", "esport"].includes(s))) return "esports";
  if (slugs.some(s => ["futebol", "football", "soccer"].includes(s))) return "futebol";

  // se vier no próprio objeto:
  const fromPost = String(p?.sport || p?.categorySlug || "").toLowerCase();
  if (["futebol", "basquete", "tenis", "esports"].includes(fromPost)) return fromPost as any;

  return "futebol";
}

export type HeroSlide = {
  title: string;
  description: string;
  image: string;
  href: string; // agora sempre /latest/{sport}/{id}-{slug} (ou fallback coerente)
};

export async function fetchHeroSlides(limit = 3): Promise<HeroSlide[]> {
  let posts: any[] | null = null;

  for (const type of CANDIDATES) {
    posts = await tryFetch(type, limit);
    if (posts) break;
  }

  if (!posts) {
    console.error("WP fetch error (Hero): nenhuma rota válida encontrada para", CANDIDATES);
    return [];
  }

  const slides: HeroSlide[] = posts.map((p) => {
    const title = stripHtml(p?.title?.rendered) || "Sem título";
    const rawDesc = p?.excerpt?.rendered || p?.yoast_head_json?.og_description || "";
    const description = stripHtml(rawDesc).slice(0, 160) + (rawDesc ? "…" : "");
    const image = pickFeaturedImage(p);

    // >>> AQUI: tira /tips e adiciona /latest/{sport}/{id}-{slug}
    const sport = detectSport(p);
    const id = p?.id ?? "";
    const slug = String(p?.slug || "");
    // casos de segurança se faltar algo:
    const href =
      id && slug
        ? `/latest/${sport}/${encodeURIComponent(String(id))}-${encodeURIComponent(slug)}`
        : id
        ? `/latest/${sport}/${encodeURIComponent(String(id))}`
        : slug
        ? `/latest/${sport}/${encodeURIComponent(slug)}`
        : `/latest/${sport}`;

    return { title, description, image, href };
  });

  return slides;
}
