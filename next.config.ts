/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true, // Se estiver usando rotas tipadas com TypeScript
  },
  images: {
    unoptimized: true, // Mantém carregamento sem otimização automática
    remotePatterns: [
      { protocol: 'https', hostname: 'secure.gravatar.com' },
      { protocol: 'https', hostname: '0.gravatar.com' },
      { protocol: 'https', hostname: '1.gravatar.com' },
      { protocol: 'https', hostname: '2.gravatar.com' },
      { protocol: 'https', hostname: 's.w.org' },
      { protocol: 'https', hostname: 'tipfans.com' }, // WordPress uploads
      { protocol: 'https', hostname: 'www.tipfans.com' }, // caso use www
    ],
  },
};

module.exports = nextConfig;
