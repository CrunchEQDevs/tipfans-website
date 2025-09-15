export type NewsCard = {
  id: string | number
  /** Nome exibido da primeira categoria (ex.: "Futebol", "Ténis", "E-sports") */
  categoria: string
  /** Slug do esporte/categoria (ex.: "futebol", "tenis", "esports") */
  categorySlug?: string
  /** Rota da listagem por categoria */
  categoryLink?: string

  titulo: string
  resumo: string
  /** "Por Fulano · 12 setembro 2025" */
  autorLinha?: string
  data?: string
  image: string | null

  /** Rota interna da matéria (ex.: "/latest/futebol/17-slug-do-post") */
  hrefPost: string
}
