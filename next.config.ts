/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
    typedRoutes: true, // se quiser usar rota tipada em TS
  },
  images: {
    unoptimized: true, // Desative se for usar o Image Optimization da Vercel
  },
}

module.exports = nextConfig
