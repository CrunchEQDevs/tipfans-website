// next.config.ts
import type { NextConfig } from 'next';

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Desliga typedRoutes para evitar type-check chato em links dinâmicos
    typedRoutes: false,
  },
  images: {
    // Mantive desativado (como estava). Se quiser otimização da Vercel, mude para false.
    unoptimized: true,
    remotePatterns: [
      // Gravatar / WP core
      { protocol: 'https', hostname: 'secure.gravatar.com' },
      { protocol: 'https', hostname: '0.gravatar.com' },
      { protocol: 'https', hostname: '1.gravatar.com' },
      { protocol: 'https', hostname: '2.gravatar.com' },
      { protocol: 'https', hostname: 's.w.org' },

      // Domínios do teu site
      { protocol: 'https', hostname: 'tipfans.com' },
      { protocol: 'https', hostname: 'www.tipfans.com' },

      // NOVO WordPress (headless)
      { protocol: 'https', hostname: 'wp.tipfans.com' },
      { protocol: 'https', hostname: 'www.wp.tipfans.com' },

      // Jetpack/Photon CDN (caso o WP reescreva URLs de imagens)
      { protocol: 'https', hostname: 'i0.wp.com' },
      { protocol: 'https', hostname: 'i1.wp.com' },
      { protocol: 'https', hostname: 'i2.wp.com' },
    ],
  },

  async rewrites() {
    return [
      // Proxy para REST API do WP (evita CORS no cliente)
      {
        source: '/wp-api/:path*',
        destination: 'https://www.wp.tipfans.com/wp-json/:path*',
      },
      // Proxy para media (uploads)
      {
        source: '/wp-media/:path*',
        destination: 'https://www.wp.tipfans.com/wp-content/uploads/:path*',
      },
    ];
  },
} satisfies NextConfig;


export default nextConfig;
