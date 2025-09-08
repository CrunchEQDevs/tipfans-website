import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'tf_token';

// Rotas protegidas (prefixos)
const PROTECTED = [
  '/perfil',
  '/perfil/',
  '/tips/enviar',
  '/tips/create',
];

function requiresAuth(pathname: string) {
  if (pathname.startsWith('/_next')) return false; // assets
  if (pathname.startsWith('/api')) return false;   // APIs
  if (pathname.startsWith('/login')) return false;
  if (pathname.startsWith('/register')) return false;
  if (pathname.startsWith('/favicon')) return false;

  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p))) return true;

  // /tips/.../editar
  if (/^\/tips\/.+\/editar\/?$/.test(pathname)) return true;

  return false;
}

// Sanitiza o ?next= (aceita só paths do próprio site)
// DEFAULT: '/' (muda aqui para '/perfil' se quiseres)
function parseSafeNext(nextRaw?: string | null): { pathname: string; search: string } {
  if (!nextRaw) return { pathname: '/', search: '' };
  if (/^https?:\/\//i.test(nextRaw) || nextRaw.startsWith('//')) {
    return { pathname: '/', search: '' };
  }
  const candidate = nextRaw.startsWith('/') ? nextRaw : `/${nextRaw}`;
  const u = new URL('http://x' + candidate); // truque só para separar pathname/search
  return { pathname: u.pathname, search: u.search };
}

export function middleware(req: NextRequest) {
  if (req.method === 'OPTIONS') return NextResponse.next();

  const { nextUrl } = req;
  const { pathname } = nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value ?? null;

  // 1) Bloqueia rotas protegidas para não autenticados
  if (requiresAuth(pathname) && !token) {
    const url = nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', nextUrl.pathname + (nextUrl.search || ''));
    return NextResponse.redirect(url);
  }

  // 2) Se já está autenticado e tenta /login → vai para 'next' (sanitizado) ou '/'
  if (pathname.startsWith('/login') && token) {
    const { pathname: safePath, search } = parseSafeNext(nextUrl.searchParams.get('next'));
    const url = nextUrl.clone();
    url.pathname = safePath;
    url.search = search;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/perfil',
    '/perfil/:path*',
    '/tips/enviar',
    '/tips/create',
    '/tips/:path*/editar',
    '/login',
  ],
};
