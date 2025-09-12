export type TipCard = {
  id: string
  /** Nome exibido da primeira categoria (ex.: "Futebol", "Tennis", "E-sports") */
  categoria: string
  /** Slug bruto da primeira categoria do WP (ex.: "futebol", "tennis", "e-sports") */
  categorySlug?: string
  /** Rota interna para a página de tips da categoria (ex.: "/tips/futebol") */
  categoryLink?: string

  titulo: string
  resumo: string
  /** "Por Fulano · 12 setembro 2025 | 14:22" */
  autorLinha?: string
  data?: string
  image: string

  /** Rota interna da matéria (ex.: "/tips/dicas/[slug]") */
  hrefPost: string
}
