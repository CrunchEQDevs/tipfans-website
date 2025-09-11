// src/lib/fetchTipsDia.ts
import type { TipCard } from "@/components/tipsdodia/types";

const WP_BASE =
  process.env.WP_BASE_URL ||
  process.env.NEXT_PUBLIC_WP_BASE_URL ||
  "https://www.wp.tipfans.com"; // ajuste se preciso

// Se você souber o slug do CPT, defina no .env: WP_TIPS_CPT_SLUG=tips | dicas | posts...
const ENV_CPT = (process.env.WP_TIPS_CPT_SLUG || "").trim();

// ordem de tentativa: .env → comuns → posts
const CANDIDATES = [ENV_CPT, "tips", "dicas", "tip", "apostas", "posts"].filter(Boolean);

// strip básico de HTML (title/excerpt do WP)
const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();

async function tryFetch(typeSlug: string, limit: number) {
  const url = `${WP_BASE}/wp-json/wp/v2/${typeSlug}?per_page=${limit}&_embed=1`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) {
    // 404 nesse tipo? devolve null => tenta o próximo
    if (res.status === 404) return null;
    // outros erros: loga e tenta próximo também
    console.error(`WP fetch ${typeSlug} error:`, res.status, await res.text());
    return null;
  }
  const data = await res.json();
  if (!Array.isArray(data)) return null;
  return data;
}

export async function fetchTipsDia(limit = 3): Promise<TipCard[]> {
  let posts: any[] | null = null;
  let usedType = "";

  for (const type of CANDIDATES) {
    posts = await tryFetch(type, limit);
    if (posts) {
      usedType = type;
      break;
    }
  }

  if (!posts) {
    console.error("WP fetch error: nenhuma rota válida encontrada para", CANDIDATES);
    return [];
  }

  // mapear campos comuns (serve para posts e CPTs)
  const items: TipCard[] = posts.map((p: any) => {
    const media = p?._embedded?.["wp:featuredmedia"]?.[0];
    const image: string = media?.source_url || "/tips/fallback.png";

    // categoria: usa o primeiro termo disponível (category ou tax do CPT)
    const firstTerm =
      p?._embedded?.["wp:term"]?.flat()?.[0];
    const categoria = firstTerm?.name || "Tips";

    const author = p?._embedded?.author?.[0]?.name || "Autor";
    const dt = new Date(p.date);

    const dataFmt =
      dt.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" }) +
      " | " +
      dt.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

    const titulo = stripHtml(p?.title?.rendered || "");
    const resumoRaw = p?.excerpt?.rendered || p?.yoast_head_json?.og_description || "";
    const resumo = stripHtml(resumoRaw).slice(0, 180) + (resumoRaw ? "…" : "");

    // sua rota interna — ajuste se o slug público for diferente
    const href =
      usedType === "posts"
        ? `/tips/dicas/${p.slug}`      // mantém seu padrão de rota interna
        : `/tips/dicas/${p.slug}`;

    return {
      id: String(p.id),
      categoria,
      titulo,
      data: dataFmt,                // aparece na assinatura do card
      resumo,
      autorLinha: `Por ${author}`,  // “Por Autor — data” já fica certo no card
      image,
      href,
    } as TipCard;
  });

  return items;
}
