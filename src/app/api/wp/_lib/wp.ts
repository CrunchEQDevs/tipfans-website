// src/app/api/wp/_lib/wp.ts

type AuthMode = 'jwt' | 'basic';

export function wpBaseUrl(): string {
  // Aceita WP_BASE_URL (preferido) ou WP_URL (legado)
  const base = (process.env.WP_BASE_URL || process.env.WP_URL || '').trim();
  return base ? base.replace(/\/+$/, '') : '';
}

export function tipsEndpoint(): string {
  const base = wpBaseUrl();
  if (!base) return '';
  // Se tiveres CPT (ex.: "tips"), usa-o; caso contrário, usa "posts"
  const slug = (process.env.WP_TIPS_CPT_SLUG || '').trim();
  const path = slug ? slug : 'posts';
  return `${base}/wp-json/wp/v2/${encodeURIComponent(path)}`;
}

export function mediaEndpoint(): string {
  const base = wpBaseUrl();
  return base ? `${base}/wp-json/wp/v2/media` : '';
}

/**
 * Cabeçalho de autenticação para WordPress REST.
 * - Prioriza JWT quando WP_AUTH_MODE=jwt (ou quando houver token).
 * - Faz fallback para Basic (Application Password) se configurado.
 * - Se nada estiver configurado, devolve {} (sem Authorization).
 */
export function wpAuthHeader(): Record<string, string> {
  const mode = ((process.env.WP_AUTH_MODE || 'jwt').trim().toLowerCase() as AuthMode) || 'jwt';

  // JWT (Bearer)
  const jwt =
    (process.env.WP_JWT_TOKEN || process.env.WP_ADMIN_TOKEN || '').trim();
  if ((mode === 'jwt' && jwt) || (!!jwt && mode !== 'basic')) {
    return { Authorization: `Bearer ${jwt}` };
  }

  // Basic (Application Password)
  const user = (process.env.WP_BASIC_USER || '').trim();
  const pass = (process.env.WP_BASIC_PASS || '').trim();
  if (mode === 'basic' || (user && pass)) {
    // Buffer existe no runtime node (as tuas routes estão com runtime = 'nodejs')
    const token =
      typeof Buffer !== 'undefined'
        ? Buffer.from(`${user}:${pass}`, 'utf8').toString('base64')
        : (typeof btoa === 'function' ? btoa(`${user}:${pass}`) : '');
    return token ? { Authorization: `Basic ${token}` } : {};
  }

  // Sem auth configurada
  return {};
}

/** ID opcional da categoria (quando a publicar como 'posts' em vez de CPT). */
export function tipsCategoryId(): number | undefined {
  const id = Number(process.env.WP_TIPS_CATEGORY_ID);
  return Number.isFinite(id) && id > 0 ? id : undefined;
}
