import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Cookie definido em /api/login
const COOKIE_NAME = 'tf_token';

// Rotas que exigem sessão
const PROTECTED = [
  '/perfil',
  '/perfil/',               // e qualquer subrota de perfil
  '/tips/enviar',
  '/tips/create',
  // padrões de edição (ex.: /tips/123/editar)
  // o matcher (lá em baixo) já cobre /tips/:path*/editar
];

function requiresAuth(pathname: string) {
  if (pathname.startsWith('/_next')) return false;     // assets
  if (pathname.startsWith('/api')) return false;       // APIs gerem auth próprio
  if (pathname.startsWith('/login')) return false;     // não proteger a página de login
  if (pathname.startsWith('/register')) return false;
  if (pathname.startsWith('/favicon')) return false;

  // Paths explícitos
  if (PROTECTED.some(p => pathname === p || pathname.startsWith(p))) return true;

  // Padrão: /tips/.../editar
  if (/^\/tips\/.+\/editar\/?$/.test(pathname)) return true;

  return false;
}

export function middleware(req: NextRequest) {
  // Pré-flight/CORS
  if (req.method === 'OPTIONS') return NextResponse.next();

  const { nextUrl } = req;
  const { pathname, search } = nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value ?? null;

  // 1) Redireciona não autenticados para /login?next=<rota>
  if (requiresAuth(pathname) && !token) {
    const url = nextUrl.clone();
    url.pathname = '/login';
    // preserva a rota pretendida
    url.searchParams.set('next', pathname + (search || ''));
    return NextResponse.redirect(url);
  }

  // 2) Evita entrar em /login se já estiver autenticado
  if (pathname.startsWith('/login') && token) {
    const url = nextUrl.clone();
    const next = nextUrl.searchParams.get('next') || '/perfil';
    url.pathname = next;    // se vier absoluto, podes fazer parse, mas mantemos simples
    url.search = '';        // já redirecionamos limpo
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// 👉 Define exatamente onde o middleware corre
export const config = {
  matcher: [
    // Perfil
    '/perfil',
    '/perfil/:path*',
    // Criar tip
    '/tips/enviar',
    '/tips/create',
    // Editar tip (qualquer id)
    '/tips/:path*/editar',
    // Página de login (para saltar se já autenticado)
    '/login',
  ],
};
