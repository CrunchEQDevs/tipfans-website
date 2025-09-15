// app/latest/[slug]/[article]/page.tsx
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { FaFacebookF, FaInstagram, FaYoutube, FaDiscord } from "react-icons/fa";

/* ========= Tipos ========= */
type NewsDetail = {
  id: string | number;
  title: string;
  date?: string;
  author?: string;
  cover?: string | null;
  contentHtml?: string;
  tags?: string[];
};

type NewsCardFromList = {
  id: string | number;
  titulo: string;
  image?: string | null;
  data?: string;
};

type TipSide = {
  id: string | number;
  home: string;
  away: string;
  league?: string;
  startAt?: string;
  oddH?: number;
};

/* ========= Utils ========= */
function toSlug(s: string) {
  return (s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Aceita "123-meu-slug" ou "meu-slug"
function splitIdAndSlug(articleParam: string) {
  const [maybeId, ...rest] = (articleParam || "").split("-");
  const isId = /^\d+$/.test(maybeId);
  return {
    id: isId ? maybeId : undefined,
    slug: isId ? rest.join("-") : articleParam,
  };
}

// URL absoluta (Next 15)
async function abs(path: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}${path}`;
}

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return fallback;
    const ct = r.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return fallback;
    return (await r.json()) as T;
  } catch {
    return fallback;
  }
}

/* ========= Data: artigo ========= */
async function fetchDetailById(id: string | number): Promise<NewsDetail | null> {
  const url = await abs(`/api/wp/news-item?id=${encodeURIComponent(String(id))}`);
  const data = await fetchJson<any>(url, null as any);
  if (!data) return null;
  return {
    id: data.id ?? id,
    title: data.title ?? "",
    date: data.date ?? data.createdAt ?? "",
    author: data.author ?? "",
    cover: data.cover ?? null,
    contentHtml: data.contentHtml ?? "",
    tags: Array.isArray(data?.tags) ? data.tags : undefined,
  };
}

async function fetchDetailBySearch(category: string, titleSlug: string): Promise<NewsDetail | null> {
  const listUrl = await abs(
    `/api/wp/news?sport=${encodeURIComponent(category)}&per_page=1&search=${encodeURIComponent(titleSlug)}`
  );
  const list = await fetchJson<any>(listUrl, { items: [] });
  const first: NewsCardFromList | undefined = Array.isArray(list?.items) ? list.items[0] : undefined;
  if (!first?.id) return null;
  return fetchDetailById(first.id);
}

async function getPost(category: string, articleParam: string): Promise<NewsDetail> {
  const { id, slug } = splitIdAndSlug(articleParam);

  if (id) {
    const detail = await fetchDetailById(id);
    if (detail) return detail;
  }

  const detail = await fetchDetailBySearch(category, slug);
  if (detail) return detail;

  return {
    id: "0",
    title: "Artigo não encontrado",
    date: "",
    author: "",
    cover: null,
    contentHtml: "<p>Não conseguimos carregar este conteúdo.</p>",
    tags: ["Futebol"],
  };
}

/* ========= Data: relacionados ========= */
async function getRelated(category: string, excludeId?: string | number) {
  const url = await abs(`/api/wp/news?sport=${encodeURIComponent(category)}&per_page=4`);
  const list = await fetchJson<any>(url, { items: [] });
  const items: NewsCardFromList[] = Array.isArray(list?.items) ? list.items : [];
  return items
    .filter((p) => String(p.id) !== String(excludeId ?? ""))
    .slice(0, 4)
    .map((p) => ({
      id: p.id,
      title: p.titulo ?? "",
      image: p.image ?? null,
      date: p.data ?? "",
    }));
}

/* ========= Data: sidebar TIPS ========= */
const FALLBACK_TIPS: TipSide[] = [
  { id: "t1", home: "Nice",  away: "Benfica", league: "Futebol", startAt: "Hoje 20:45", oddH: 2.05 },
  { id: "t2", home: "PSG",   away: "Lyon",   league: "Futebol", startAt: "Amanhã 20:00", oddH: 1.70 },
  { id: "t3", home: "Inter", away: "Milan",  league: "Futebol", startAt: "Dom 19:45",   oddH: 2.30 },
];

async function getSidebarTips(category: string): Promise<TipSide[]> {
  const url = await abs(`/api/wp/tips/subs?sport=${encodeURIComponent(category)}&limit=3`);
  const list = await fetchJson<TipSide[]>(url, []);
  return list.length ? list.slice(0, 3) : FALLBACK_TIPS;
}

/* ========= Metadata ========= */
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string; article: string }> }
): Promise<Metadata> {
  const { slug, article } = await params;
  const post = await getPost(slug, article);
  const desc = (post?.contentHtml || "").replace(/<[^>]+>/g, "").slice(0, 160);

  return {
    title: post?.title || "Notícia",
    description: desc,
    openGraph: {
      title: post?.title || "Notícia",
      description: desc,
      images: post?.cover ? [post.cover] : [],
      type: "article",
    },
  };
}

/* ========= Página ========= */
export default async function LatestArticlePage({
  params,
}: {
  params: { slug: string; article: string };
}) {
  const { slug, article } = params;

  const post    = await getPost(slug, article);
  const related = await getRelated(slug, post.id);
  const tips    = await getSidebarTips(slug);

  const SPORT_LABELS: Record<string, string> = {
    futebol: "Futebol",
    basquete: "Basquete",
    tenis: "Ténis",
    esports: "eSports",
  };
  const sportLabel = SPORT_LABELS[slug] ?? slug;

  // para Prev/Next (usa os 2 primeiros relacionados)
  const prev = related[0];
  const next = related[1];

  return (
    <main className="bg-[#1E1E1E] text-white">
      <div className="mx-auto max-w-7xl px-4 py-32 grid gap-6 md:grid-cols-4">
        {/* ====== Conteúdo principal ====== */}
        <article className="md:col-span-3">
          {/* TÍTULO */}
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
            {post.title}
          </h1>

          {/* Byline */}
          <p className="mt-2 text-sm text-white/70">
            {post.author ? `Por ${post.author}` : ""}
            {post.author && post.date ? " • " : ""}
            {post.date ?? ""}
          </p>

          {/* Hero */}
          {post.cover && (
            <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-lg ring-1 ring-white/10">
              <Image
                src={post.cover}
                alt={post.title}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Legenda opcional */}
          <p className="mt-2 text-xs text-white/60">Legenda / Crédito da foto</p>

          {/* Corpo do post */}
          <div
            className="mt-4 space-y-4 leading-relaxed text-[15px]"
            dangerouslySetInnerHTML={{ __html: post.contentHtml ?? "" }}
          />

          {/* Linha divisória */}
          <hr className="my-5 border-white/40" />

          {/* SHARE */}
          <div className="mb-4">
            <span className="text-sm">Partilhar este artigo:</span>
            <div className="mt-2 flex items-center gap-2">
              {[
                { Icon: FaDiscord,   label: "Discord"   },
                { Icon: FaFacebookF, label: "Facebook"  },
                { Icon: FaInstagram, label: "Instagram" },
                { Icon: FaYoutube,   label: "YouTube"   },
              ].map(({ Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="inline-flex h-8 w-8 items-center justify-center rounded bg-white text-black hover:opacity-90 transition"
                >
                  <Icon className="text-[14px]" />
                </button>
              ))}
            </div>
          </div>

          {/* Também pode interessar */}
          <section className="mt-6">
            <h2 className="text-xl font-bold mb-4">Artigos que também lhe podem interessar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map((r) => (
                <Link
                  key={String(r.id)}
                  href={`/latest/${slug}/${r.id}-${toSlug(r.title)}`}
                  className="group rounded-lg overflow-hidden bg-[#1B1F2A] ring-1 ring-white/10 hover:ring-white/20"
                >
                  <div className="relative aspect-[16/10] bg-black/20">
                    {r.image && (
                      <Image
                        src={r.image}
                        alt={r.title}
                        fill
                        sizes="(min-width:768px) 25vw, 50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] text-white/60">{r.date ?? ""}</p>
                    <h3 className="text-sm font-semibold line-clamp-2">{r.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Tags */}
          <section className="mt-8 border-b border-white/40 pb-4">
            <h3 className="text-xl font-bold mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {(post.tags?.length ? post.tags : ["Futebol", "Liga dos Campeões"]).map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 text-xs rounded bg-white text-black ring-1 font-bold ring-white/10"
                >
                  {t}
                </span>
              ))}
            </div>
          </section>

          {/* Prev / Next */}
          <nav className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <Link
              href={prev ? `/latest/${slug}/${prev.id}-${toSlug(prev.title)}` : "#"}
              className="p-3"
            >
              <span className="text-lg text-[#ED4F00] font-bold">
                <span className="mr-2">{`<`}</span>Anterior
              </span>
              <p className="font-semibold line-clamp-2">{prev?.title ?? "Artigo anterior"}</p>
            </Link>
            <Link
              href={next ? `/latest/${slug}/${next.id}-${toSlug(next.title)}` : "#"}
              className="p-3 text-right"
            >
              <span className="text-lg text-[#ED4F00] font-bold">
                Próximo<span className="ml-2">{`>`}</span>
              </span>
              <p className="font-semibold line-clamp-2">{next?.title ?? "Próximo artigo"}</p>
            </Link>
          </nav>

          {/* Comentários */}
          <section className="mt-4">
            <h3 className="text-lg font-bold mb-3">Deixe um comentário</h3>
            <form className="space-y-3">
              <input
                type="text"
                placeholder="Nome"
                className="w-full rounded bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10"
              />
              <textarea
                placeholder="Comentário"
                className="w-full rounded bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 min-h-[120px]"
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded bg-[#ED4F00] px-4 py-2 text-sm font-semibold hover:opacity-90"
                >
                  Submeter comentário
                </button>
                <p className="text-sm text-white/70">
                  Para <Link href="/src/app/login" className="text-[#ED4F00] underline">Iniciar sessão</Link> para submeter seu comentário.
                </p>
              </div>
            </form>
          </section>
        </article>

        {/* ====== Sidebar (TIPS) ====== */}
        <aside className="md:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="overflow-hidden rounded-lg ring-white/10 bg-[#1E1E1E]">
              <div className="px-3 py-2 border-b border-[#ED4F00] flex items-center justify-between">
                <span className="text-xl font-bold">TIPS {sportLabel}</span>
              </div>

              <div className="divide-y divide-white/20">
                {tips.map((g) => (
                  <div key={String(g.id)} className="px-3 py-3">
                    <div className="text-[11px] uppercase tracking-wide text-white flex items-center justify-between">
                      <span><span className="opacity-60 mr-1">•</span>{g.league ?? sportLabel}</span>
                      {g.startAt && <span>{g.startAt}</span>}
                    </div>

                    <div className="flex items-center gap-3 justify-center my-3">
                      <p className="text-[18px] font-semibold text-[#ED4F00]">{g.home}</p>
                      <span className="opacity-70">vs</span>
                      <p className="text-[18px] font-semibold text-[#ED4F00]">{g.away}</p>
                    </div>

                    <div className="flex items-center">
                      <span className="mr-2">💡</span>
                      <p className="mr-2">Dica:</p>
                      <p>Vitória do {g.home}</p>
                    </div>

                    <div className="flex items-center">
                      <span className="mr-2">➕</span>
                      <p className="mr-2">Odd:</p>
                      <p className="text-[#ED4F00] font-bold">
                        {typeof g.oddH === "number" ? g.oddH.toFixed(2) : "—"}
                      </p>
                    </div>

                    <div className="flex items-center">
                      <span className="mr-2">🧑‍💼</span>
                      <p className="mr-2">Hoje! Tipster: Comunidade</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PUB placeholder */}
            <div className="relative w-full h-[700px] rounded-lg overflow-hidden ring-1 ring-white/10">
              <Image
                src="/noticia2.jpg"
                alt="Publicidade"
                fill
                className="object-cover"
                sizes="300px"
              />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
