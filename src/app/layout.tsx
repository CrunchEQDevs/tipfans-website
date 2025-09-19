// app/layout.tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/navbar/Navbar';
import WelcomeBar from '@/components/WelcomeBar';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TipFans',
  description: 'Página oficial do TipFans com dicas, desafios e comunidade.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased  dark:bg-gray-700 text-black transition-colors duration-500`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>

            {/* Faixa azul de boas-vindas (mostra só se user estiver logado) */}
            <WelcomeBar />

            {/* Conteúdo principal com padding-top compensando navbar fixa */}
            <main className="pt-[80px] md:pt-[100px] lg:pt-[120px]">
              <Suspense fallback={<div className="min-h-[20vh]" />}>
                {children}
              </Suspense>
            </main>

            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
