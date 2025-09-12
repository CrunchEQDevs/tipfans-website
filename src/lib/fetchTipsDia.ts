import type { TipCard } from '@/components/tipsdodia/types'

const rawBase =
  process.env.WP_BASE_URL ||
  process.env.NEXT_PUBLIC_WP_BASE_URL ||
  'https://wp.tipfans.com'
const WP_BASE = rawBase.replace(/\/+$/, '')

/** limpa html básico */
const stripHtml = (html: string) =>
  (html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

/** Mapeia o slug da categoria do WP para a rota interna de tips */
function categoryToTipsPath(slugOrName: string): string {
  const s = (slugOrName || '').toLowerCase()

  // futebol
  if (['futebol', 'soccer', 'football'].some(k => s.includes(k))) return '/tips/futebol'
  // tênis
  if (['tenis', 'ténis', 'tennis'].some(k => s.includes(k))) return '/tips/tenis'
  // basquete
  if (['basquete', 'basquetebol', 'basket', 'basketball', 'nba'].some(k => s.includes(k))) return '/tips/basquete'
  // e-sports
  if (['e-sports', 'esports', 'e-sport'].some(k => s.replace('-', '').includes(k.replace('-', '')))) return '/tips/esports'

  // default
  return '/tips'
}

function mapToTipCard(p: any): TipCard {
  const media = p?._embedded?.['wp:featuredmedia']?.[0]
  const image: string =
    media?.source_url ||
    media?.media_details?.sizes?.medium_large?.source_url ||
    media?.media_details?.sizes?.large?.source_url ||
    '/tips/fallback.png'

  const flatTerms: Array<{ name?: string; slug?: string }> = Array.isArray(p?._embedded?.['wp:term'])
    ? (p._embedded['wp:term'].flat?.() || [])
    : []

  const firstTerm = flatTerms[0] || {}
  const categoria = (firstTerm.name as string) || 'Tips'
  const categorySlug = (firstTerm.slug as string) || ''

  const categoryLink = categoryToTipsPath(categorySlug || categoria)

  const author = p?._embedded?.author?.[0]?.name || 'Autor'
  const dt = p?.date ? new Date(p.date) : null
  const dataFmt = dt
    ? `${dt.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })} | ${dt.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
    : ''

  const titulo = stripHtml(p?.title?.rendered || '')
  const resumoOrigin = p?.excerpt?.rendered || p?.yoast_head_json?.og_description || p?.content?.rendered || ''
  const resumoStripped = stripHtml(resumoOrigin)
  const resumMax = 180
  const resumo =
    resumoStripped.length > resumMax
      ? resumoStripped.slice(0, resumMax).trimEnd() + '…'
      : resumoStripped

  // sua rota para a matéria interna
  const hrefPost = `/tips/dicas/${p.slug}`

  return {
    id: String(p.id),
    categoria,
    categorySlug,
    categoryLink,
    titulo,
    resumo,
    autorLinha: dataFmt ? `Por ${author} · ${dataFmt}` : `Por ${author}`,
    data: dataFmt,
    image,
    hrefPost,
  }
}

async function getPosts(url: string) {
  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return { items: [] as any[], total: 0, pages: 0 }
  const items = (await res.json()) as any[]
  const total = Number(res.headers.get('X-WP-Total') || '0')
  const pages = Number(res.headers.get('X-WP-TotalPages') || '0')
  return { items: Array.isArray(items) ? items : [], total, pages }
}

/** Busca os últimos posts (garantindo até "limit", contornando bug de per_page) */
export async function fetchTipsDia(limit = 6): Promise<TipCard[]> {
  const L = Math.max(1, Math.min(100, limit))
  const base = `${WP_BASE}/wp-json/wp/v2/posts`

  // 1) normal
  const url1 = `${base}?page=1&_embed=1&orderby=date&order=desc&status=publish&per_page=${L}`
  let { items } = await getPosts(url1)

  // 2) fallback (?&…)
  if (items.length < L) {
    const url2 = `${base}?&_embed=1&orderby=date&order=desc&status=publish&per_page=${L}&page=1`
    const r2 = await getPosts(url2)
    if (r2.items.length > items.length) items = r2.items
  }

  // 3) pagina extra se precisar
  let page = 2
  while (items.length < L) {
    const urlP = `${base}?page=${page}&_embed=1&orderby=date&order=desc&status=publish&per_page=${L}`
    const { items: more } = await getPosts(urlP)
    if (!more.length) break
    const seen = new Set(items.map((i: any) => String(i.id)))
    for (const m of more) {
      const id = String(m.id)
      if (!seen.has(id)) {
        items.push(m)
        seen.add(id)
        if (items.length >= L) break
      }
    }
    page += 1
  }

  // 4) ordena e mapeia
  items.sort((a, b) => +new Date(b?.date || 0) - +new Date(a?.date || 0))
  return items.slice(0, L).map(mapToTipCard)
}
