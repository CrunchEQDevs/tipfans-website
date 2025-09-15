import { NextResponse } from 'next/server'

const WP_BASE = process.env.WP_BASE_URL ?? ''
const WP_POST_TYPE = (process.env.WP_POST_TYPE ?? 'posts').toLowerCase()

/* ---------- helpers ---------- */
function normalize(raw = '') {
  return raw.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}
function toSport(raw = ''): 'futebol' | 'basquete' | 'tenis' | 'esports' {
  const s = normalize(raw)
  if (s.includes('esport')) return 'esports'
  if (s.startsWith('basq') || s.includes('basket')) return 'basquete'
  if (s.startsWith('ten')) return 'tenis'
  return 'futebol'
}
function sportLabel(s: 'futebol' | 'basquete' | 'tenis' | 'esports') {
  return { futebol: 'Futebol', basquete: 'Basquete', tenis: 'Ténis', esports: 'E-sports' }[s]
}
function formatDatePt(dateIso = '') {
  try {
    const d = new Date(dateIso)
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(d)
  } catch {
    return dateIso || ''
  }
}
function stripHtml(s = '') {
  return s.replace(/<[^>]+>/g, '').trim()
}
function toSlug(s = '') {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/* Aliases de categorias no WP */
const WP_CATEGORY_ALIASES: Record<'futebol'|'basquete'|'tenis'|'esports', string[]> = {
  futebol:  ['futebol', 'soccer'],
  basquete: ['basquetebol', 'basquete', 'basket'],
  tenis:    ['tenis', 'tennis'],
  esports:  ['e-sports', 'esports', 'eports'],
}

async function fetchCategoryIdsByAliases(aliases: string[]): Promise<number[]> {
  const ids: number[] = []
  for (const slug of aliases) {
    const url = `${WP_BASE}/wp-json/wp/v2/categories?slug=${encodeURIComponent(slug)}`
    const r = await fetch(url, { cache: 'no-store' })
    if (!r.ok) continue
    const arr = await r.json()
    const cat = Array.isArray(arr) ? arr[0] : null
    if (cat?.id && !ids.includes(cat.id)) ids.push(cat.id)
  }
  return ids
}

/* mapping de cada post */
function mapPost(p: any) {
  const id = p?.id
  const title = stripHtml(p?.title?.rendered ?? '')     // por segurança
  const dateIso = p?.date ?? ''
  const date = formatDatePt(dateIso)

  const author =
    p?._embedded?.author?.[0]?.name ??
    p?._embedded?.author?.[0]?.slug ?? ''

  const cover =
    p?._embedded?.['wp:featuredmedia']?.[0]?.source_url ??
    p?.jetpack_featured_media_url ?? null

  const excerptHtml = p?.excerpt?.rendered ?? ''
  const excerpt = stripHtml(excerptHtml)

  // inferir esporte a partir dos termos
  const termsFlat = Array.isArray(p?._embedded?.['wp:term'])
    ? p._embedded['wp:term'].flat()
    : []
  const catSlugs: string[] = termsFlat.map((t: any) => t?.slug).filter(Boolean)
  const inferred = catSlugs.find((slug) =>
    ['futebol','basquete','tenis','esports'].includes(toSport(slug))
  ) ?? ''
  const sport = toSport(inferred)

  const hrefPost = `/latest/${sport}/${id}-${toSlug(title)}`
  const autorLinha = author ? `Por ${author} · ${date}` : date

  /* —— devolvemos os DOIS formatos —— */
  return {
    // PT/legado – usado pelo Hero
    id,
    categoria: sportLabel(sport),
    categorySlug: sport,
    categoryLink: `/latest/${sport}`,
    titulo: title,
    resumo: excerpt,
    autorLinha,
    data: date,
    image: cover,
    hrefPost,

    // Canónico – usado noutras páginas
    title,
    excerpt,
    date,
    author,
    cover,
    sport,
    href: hrefPost,
  }
}

export async function GET(req: Request) {
  try {
    if (!WP_BASE) {
      return NextResponse.json({ error: 'WP_BASE_URL não definido' }, { status: 500 })
    }

    const url = new URL(req.url)
    const sportParam = (url.searchParams.get('sport') || '').trim().toLowerCase()
    const perPage = url.searchParams.get('per_page') || '12'
    const page    = url.searchParams.get('page') || '1'
    const search  = url.searchParams.get('search') || ''

    // "todos" (ou vazio) => sem filtro de categoria
    const sportNormalized =
      sportParam === 'todos' || sportParam === 'all' || sportParam === ''
        ? null
        : toSport(sportParam)

    const qs = new URLSearchParams({
      per_page: perPage,
      page,
      _embed: '1',
    })
    if (search) qs.set('search', search)

    let endpoint = `${WP_BASE}/wp-json/wp/v2/${WP_POST_TYPE}?${qs.toString()}`

    if (sportNormalized) {
      const aliases = WP_CATEGORY_ALIASES[sportNormalized] ?? [sportNormalized]
      const ids = await fetchCategoryIdsByAliases(aliases)
      if (ids.length) {
        endpoint += `&categories=${ids.join(',')}`
      } else {
        // fallback por nome de categoria
        endpoint += `&category_name=${encodeURIComponent(aliases[0])}`
      }
    }

    const r = await fetch(endpoint, { cache: 'no-store' })
    if (!r.ok) {
      const txt = await r.text().catch(() => '')
      return NextResponse.json({ error: 'Falha ao consultar WP', detail: txt }, { status: 502 })
    }

    const posts = await r.json()
    const items = Array.isArray(posts) ? posts.map(mapPost) : []
    return NextResponse.json({ items })
  } catch (err: any) {
    return NextResponse.json({ error: 'unexpected', detail: String(err?.message ?? err) }, { status: 500 })
  }
}
