import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { FaFacebookF,  FaInstagram,  FaYoutube,  FaDiscord,} from 'react-icons/fa';
/* ========================
   Tipos e fallbacks
======================== */
type NewsPost = {
  id: string | number;
  title: string;
  slug: string;
  cover?: string;
  content?: string;   // HTML
  createdAt?: string;
  author?: string;
  category?: string;
  tags?: string[];
};

type TipSide = {
  id: string | number;
  home: string;
  away: string;
  league?: string;
  startAt?: string;
  oddH?: number; // odd principal (casa) no seu fallback
};

const POST_TYPE = "latest";

const FALLBACK_POST: NewsPost = {
  id: "0",
  title: "Como funcionam os contratos publicitários dos jogadores de futebol",
  slug: "contratos-publicitarios-jogadores",
  cover: "/B_futebol.png",
  content: `
    <p><strong>Lorem ipsum</strong> dolor sit amet, consectetur adipiscing elit. 
    Integer in augue vel odio aliquam bibendum. Morbi vitae posuere lacus. 
    Nullam vulputate, arcu ac dapibus ultrices, nisl risus finibus nisl, 
    vitae ullamcorper arcu mi at nibh.</p>

    <p>Praesent dignissim, ante a interdum congue, lacus eros feugiat justo, 
    at pretium metus purus id velit. Suspendisse potenti. Curabitur 
    <em>fringilla</em> lobortis nunc, vitae luctus lectus varius non. Fusce 
    interdum, magna et luctus mattis, ex massa vulputate sapien, id pharetra 
    ex augue nec risus.</p>

    <h2>Subtítulo de seção do artigo</h2>
    <p>Phasellus sed urna id orci faucibus luctus. Duis nec gravida dui. 
    Pellentesque non libero sit amet augue placerat laoreet. Aenean iaculis 
    efficitur lectus, eu fermentum turpis scelerisque id.</p>

    <ul>
      <li>Item de lista 1 com um pequeno detalhe;</li>
      <li>Item de lista 2 explicando um ponto relevante;</li>
      <li>Item de lista 3 com uma observação final.</li>
    </ul>

    <blockquote>
      "Citação de exemplo para enriquecer o layout e a leitura do conteúdo."
    </blockquote>

    <p>Donec dictum, est a tempor ullamcorper, lectus nulla ornare sem, 
    vitae gravida odio risus non augue. Vestibulum ante ipsum primis in 
    faucibus orci luctus et ultrices posuere cubilia curae; Integer 
    consequat sapien eget ipsum ultricies, vel maximus augue pulvinar.</p>
  `,
  createdAt: "Hoje",
  author: "Redação TipFans",
  tags: ["Futebol", "Liga dos Campeões"],
};

const FALLBACK_TIPS: TipSide[] = [
  { id: "t1", home: "Nice",  away: "Benfica", league: "Futebol", startAt: "Hoje 20:45", oddH: 2.05 },
  { id: "t2", home: "PSG",   away: "Lyon",   league: "Futebol", startAt: "Amanhã 20:00", oddH: 1.70 },
  { id: "t3", home: "Inter", away: "Milan",  league: "Futebol", startAt: "Dom 19:45",   oddH: 2.30 },
];

/* ========================
   Fetch helpers (SSR)
======================== */
async function api<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) return fallback;
    const j = await res.json();
    const data = Array.isArray(j?.data) ? j.data : j?.data || j;
    return (data ?? fallback) as T;
  } catch {
    return fallback;
  }
}

// Aceita "123-meu-artigo" ou "meu-artigo"
function splitIdAndSlug(articleParam: string) {
  const [maybeId, ...rest] = (articleParam || "").split("-");
  const isId = /^\d+$/.test(maybeId);
  return {
    id: isId ? maybeId : undefined,
    slug: isId ? rest.join("-") : articleParam,
  };
}

async function getPost(category: string, articleParam: string): Promise<NewsPost> {
  const { id, slug } = splitIdAndSlug(articleParam);
  const qs = id ? `id=${id}&category=${category}` : `slug=${slug}&category=${category}`;
  const url = `/api/wp/posts?type=${POST_TYPE}&${qs}`;
  const list = await api<NewsPost[]>(url, []);
  return list[0] ?? FALLBACK_POST;
}

async function getRelated(category: string, currentId?: string | number): Promise<NewsPost[]> {
  const url = `/api/wp/posts?type=${POST_TYPE}&category=${category}&limit=4${currentId ? `&exclude=${currentId}` : ""}`;
  const list = await api<NewsPost[]>(url, []);
  if (list.length) return list.slice(0, 4);
  // fallback simples
  return [
    { ...FALLBACK_POST, id: "r1", slug: "rel1", title: "Lesão e impacto no elenco",       cover: "/noticia1.jpg" },
    { ...FALLBACK_POST, id: "r2", slug: "rel2", title: "Jovens talentos em ascensão",     cover: "/noticia2.jpg" },
    { ...FALLBACK_POST, id: "r3", slug: "rel3", title: "Mercado de transferências",       cover: "/noticia3.jpg" },
    { ...FALLBACK_POST, id: "r4", slug: "rel4", title: "Como funciona o fair-play",       cover: "/noticia1.jpg" },
  ];
}

async function getSidebarTips(category: string): Promise<TipSide[]> {
  const url = `/api/wp/tips/subs?sport=${category}&limit=3`;
  const list = await api<TipSide[]>(url, []);
  return list.length ? list.slice(0, 3) : FALLBACK_TIPS;
}

/* ========================
   Metadata
======================== */
export async function generateMetadata(
  { params }: { params: { slug: string; article: string } }
): Promise<Metadata> {
  const post = await getPost(params.slug, params.article);
  const desc = (post?.content || "").replace(/<[^>]+>/g, "").slice(0, 160);
  return {
    title: post?.title ?? "Notícia",
    description: desc,
    openGraph: {
      title: post?.title,
      description: desc,
      images: post?.cover ? [post.cover] : [],
      type: "article",
    },
  };
}

/* ========================
   Página
======================== */
export default async function LatestArticlePage({
  params,
}: {
  params: { slug: string; article: string };
}) {
  const { slug, article } = params;

  const post    = await getPost(slug, article);
  const related = await getRelated(slug, post?.id);
  const tips    = await getSidebarTips(slug);   // ← usamos ISSO no sidebar

  // label simpático para o cabeçalho do sidebar
  const SPORT_LABELS: Record<string, string> = {
    futebol: "Futebol",
    basquete: "Basquete",
    tenis: "Ténis",
    esports: "eSports",
  };
  const sportLabel = SPORT_LABELS[slug] ?? slug;

  return (
    <main className="bg-[#1E1E1E] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 grid gap-6 md:grid-cols-4">
        {/* ====== Conteúdo principal ====== */}
        <article className="md:col-span-3">
          <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
            {post.title}
          </h1>

          {/* Byline */}
          <p className="mt-2 text-sm text-white/70">
            {post.author ? `Por ${post.author} • ` : ""}{post.createdAt ?? ""}
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

          {/* Corpo do post (agora com lorem do fallback) */}
          <div
            className="mt-4 space-y-4 leading-relaxed text-[15px]"
            dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
          />

          {/* Linha divisória */}
          <hr className="my-6 border-white/50" />

          {/* Share simples (agora com “ícones” visuais sem libs) */}
      
            <span className="">Partilhar este artigo:</span>
            <div className="hidden md:flex items-center gap-4 text-white text-lg mr-56 mt-2">
                <FaDiscord className="cursor-pointer hover:scale-110 transition" />
                <FaFacebookF className="cursor-pointer hover:scale-110 transition" />
                <FaInstagram className="cursor-pointer hover:scale-110 transition" />
                <FaYoutube className="cursor-pointer hover:scale-110 transition" />
            </div>
        


          {/* Também pode interessar */}
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-7">Artigos que também lhe pode interessar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/latest/${slug}/${r.slug || r.id}`}
                  className="group rounded-lg overflow-hidden bg-[#1B1F2A] ring-1 ring-white/10 hover:ring-white/20"
                >
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={r.cover || "/rel1.jpg"}
                      alt={r.title}
                      fill
                      sizes="(min-width:768px) 25vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-2">
                    <h3 className="text-sm font-semibold line-clamp-2">{r.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>

         {/* Tags */}
        <section className="mt-20 border-b border-white/50 pb-4">
        <h1 className="mt-20 pb-4 text-xl font-bold">Tags</h1>
        <div className="flex flex-wrap gap-2">
            
            {(post.tags?.length ? post.tags : ["Futebol", "Liga dos Campeões"]).map((t) => (
            <span key={t} className="px-2 py-1 text-xs rounded bg-white text-black ring-1 font-bold ring-white/10">
                {t}
            </span>
            ))}
        </div>
        </section>

 {/* Prev / Next simples */}
          <nav className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
            <Link
              href={`/latest/${slug}/${related[0]?.slug || related[0]?.id || "#"}`}
              className="p-3"
            >
              <span className="text-lg text-[#ED4F00] font-bold">
                <span className="mr-2 mb-50 text-lg text-[#ED4F00]">{"<"}</span>

                 Anterior</span>
              <p className="font-semibold line-clamp-2">{related[0]?.title || "Artigo anterior"}</p>
            </Link>
            <Link
              href={`/latest/${slug}/${related[1]?.slug || related[1]?.id || "#"}`}
              className="p-3 text-right"
            > 

              <span className="text-lg text-[#ED4F00] font-bold">
                Próximo
                <span className="ml-2 mb-50 text-lg text-[#ED4F00]">{">"}</span>
                </span>
              <p className="font-semibold line-clamp-2">{related[1]?.title || "Próximo artigo"}</p>
            </Link>
          </nav>

          {/* Linha divisória */}
          <hr className="my-6 border-white/50" />

          {/* Comentários (estático) */}
          <section className="mt-8">
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
              <button
                type="button"
                className="rounded bg-[#ED4F00] px-4 py-2 text-sm font-semibold hover:opacity-90"
              >
                Submeter comentário
              </button>
              <p>Para <Link href="/src/app/login" className="text-[#ED4F00]" >Iniciar sessão</Link> para submeter seu comentario.</p>
            </form>
          </section>
        </article>

        {/* ====== Sidebar (usa apenas `tips` + `slug`) ====== */}
        <aside className="md:col-span-1">
          <div className="sticky top-[332px] space-y-4">
            {/* Caixa de TIPS */}
            <div className="overflow-hidden rounded-lg ring-white/10 bg-[#1E1E1E]">
              <div className="px-3 py-2 border-b border-[#ED4F00] flex items-center justify-between">
                <span className="text-xl font-bold">TIPS {sportLabel}</span>
              </div>

              <div className="divide-y divide-white/20 h-[700px]">
                {tips.map((g) => (
                  <div key={g.id} className="px-3 py-3">
                    {/* liga + horário */}
                    <div className="text-[11px] uppercase tracking-wide text-white flex items-center gap-40">
                      <span><span className="opacity-60">•</span>{g.league ?? sportLabel}</span>
                      {g.startAt && <span>{g.startAt}</span>}
                    </div>

                    {/* confronto */}
                    <div className="flex items-center gap-14 mb-3 ml-6 mt-3">
                      <p className="text-[20px] font-semibold text-[#ED4F00]">{g.home}</p>
                      <span className="opacity-70">vs</span>
                      <p className="text-[20px] font-semibold text-[#ED4F00]">{g.away}</p>
                    </div>

                    <div className='flex items-center'>
                      <span className="mr-2">💡 </span>
                      <p className="mr-2">Dica:</p>
                      <p>Vitória do {g.home}</p>
                    </div>

                    {/* odd principal (H) */}
                    <div className='flex items-center'>
                      <span className="mr-2">➕ </span>
                      <p className="mr-2">Odd:</p>
                      <p className='text-[#ED4F00] font-bold'>{typeof g.oddH === "number" ? g.oddH.toFixed(2) : "—"}</p>
                    </div>

                    <div className='flex items-center '>
                      <span className="mr-2">🧑‍💼 </span>
                      <p className="mr-2">Hoje! Tipster: Comunidade</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PUB */}
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
