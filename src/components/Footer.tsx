'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaDiscord,      // ✅ faltava este import
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export default function Footer() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const getLogo = () => {
    if (!mounted) return '/Logo_TipFans.png';
    return theme === 'dark' ? '/Logo_TipFans.png' : '/Logo_TipFans.png';
  };

  return (
    <footer className="relative z-10 overflow-hidden bg-[#151515] text-white py-10">
      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left border-b border-[#1E10C7] w-full pb-6">
        {/* Logo */}
        <div className="flex flex-col items-center md:items-start gap-4">
          {mounted && (
            <Image
              src={getLogo()}
              alt="Logo TipFans"
              width={160}
              height={100}
              style={{ height: 'auto', transition: 'opacity 0.5s ease-in-out' }}
            />
          )}
        </div>

        {/* Navegação */}
        <div className="flex flex-auto gap-8 text-sm font-medium">
          <Link href="#" className="hover:underline text-white">LATEST</Link>
          <Link href="#" className="hover:underline text-white">TIPS</Link>
          <Link href="#" className="hover:underline text-white">TIPSTERS</Link>
          <Link href="#" className="hover:underline text-white">CHALENGES</Link>
          <Link href="#" className="hover:underline text-white">COMMUNITY</Link>

          {/* Redes sociais */}
          <div className="items-center md:items-end gap-4 relative mt-10 right-80">
            <h3 className="text-justify uppercase tracking-wide text-[10px]">Follow us</h3>
            <div className="flex gap-4 text-xl mt-2">
              <a aria-label="Discord" href="https://discord.com" target="_blank" rel="noreferrer">
                <FaDiscord className="cursor-pointer hover:scale-110 transition  w-6 h-6 rounded-[3px]" />
              </a>
              <a aria-label="Facebook" href="https://facebook.com" target="_blank" rel="noreferrer">
                <FaFacebookF className="cursor-pointer hover:scale-110 transition  w-6 h-6 rounded-[3px]" />
              </a>
              <a aria-label="Instagram" href="https://instagram.com" target="_blank" rel="noreferrer">
                <FaInstagram className="cursor-pointer hover:scale-110 transition  w-6 h-6 rounded-[3px]" />
              </a>
              <a aria-label="X (Twitter)" href="https://twitter.com" target="_blank" rel="noreferrer">
                <FaXTwitter className="cursor-pointer hover:scale-110 transition  w-6 h-6 rounded-[3px]" />
              </a>
              <a aria-label="YouTube" href="https://youtube.com" target="_blank" rel="noreferrer">
                <FaYoutube className="cursor-pointer hover:scale-110 transition  w-6 h-6 rounded-[3px]" />
              </a>
            </div>
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
