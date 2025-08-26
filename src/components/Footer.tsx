'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { FaFacebookF, FaInstagram, FaYoutube, FaDiscord } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export default function Footer() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const getLogo = () => (!mounted ? '/Logo_TipFans.png' : '/Logo_TipFans.png');

  return (
    <footer className="relative z-10 overflow-hidden bg-[#151515] text-white py-10">
      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-[#1E10C7] pb-6">
        {/* Logo (fica no lugar: esquerda no desktop, centro no mobile) */}
        <div className="flex flex-col items-center md:items-start">
          {mounted && (
            <Image
              src={getLogo()}
              alt="Logo TipFans"
              width={160}
              height={100}
              className="h-auto"
              priority
            />
          )}
        </div>

        {/* Navegação (centralizada) */}
        <nav className="flex flex-col items-center justify-center gap-3 text-sm font-medium">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="#" className="hover:underline">LATEST</Link>
            <Link href="#" className="hover:underline">TIPS</Link>
            <Link href="#" className="hover:underline">TIPSTERS</Link>
            <Link href="#" className="hover:underline">CHALLENGES</Link>
            <Link href="#" className="hover:underline">COMMUNITY</Link>
          </div>
        </nav>

        {/* Redes sociais (título + ícones centralizados) */}
        <div className="flex flex-col items-center justify-center">
          <h3 className="uppercase tracking-widest text-[10px] text-white/80">Follow us</h3>
          <div className="mt-3 flex items-center justify-center gap-4 text-xl">
            <a aria-label="Discord" href="https://discord.com" target="_blank" rel="noreferrer">
              <FaDiscord className="hover:scale-110 transition" />
            </a>
            <a aria-label="Facebook" href="https://facebook.com" target="_blank" rel="noreferrer">
              <FaFacebookF className="hover:scale-110 transition" />
            </a>
            <a aria-label="Instagram" href="https://instagram.com" target="_blank" rel="noreferrer">
              <FaInstagram className="hover:scale-110 transition" />
            </a>
            <a aria-label="X (Twitter)" href="https://twitter.com" target="_blank" rel="noreferrer">
              <FaXTwitter className="hover:scale-110 transition" />
            </a>
            <a aria-label="YouTube" href="https://youtube.com" target="_blank" rel="noreferrer">
              <FaYoutube className="hover:scale-110 transition" />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="flex justify-center items-center mt-2">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} TipFans — Direitos reservados
        </p>
      </div>
    </footer>
  );
}
