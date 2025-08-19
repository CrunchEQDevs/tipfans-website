import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Footer from '@/components/Footer';

import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar'; // 👈 Adicione aqui

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TipFans',
  description: 'Página oficial do TipFans com dicas, desafios e comunidade.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-200 dark:bg-gray-700 text-black dark:text-white transition-colors duration-500`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            {children}
            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
