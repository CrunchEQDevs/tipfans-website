/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true, // OK manter esse se estiver usando rotas tipadas com TS
  },
  images: {
    unoptimized: true, // OK para projetos sem otimização automática de imagem
  },
}

module.exports = nextConfig;
