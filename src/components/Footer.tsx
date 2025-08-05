'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaEnvelope,
} from 'react-icons/fa';

export default function Footer() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getTextColor = () => {
    if (!mounted) return 'text-white';
    return theme === 'dark' ? 'text-brandOrange' : 'text-white';
  };

  const getBackgroundColor = () => {
    if (!mounted) return 'bg-[#1900ff]';
    return theme === 'dark' ? 'bg-gray-900' : 'bg-[#1900ff]';
  };

  const getLogo = () => {
    if (!mounted) return '/logotipo_azul.png';
    return theme === 'dark' ? '/logotipo_laranja.png' : '/logotipo_branco.png';
  };

  return (
    <footer className={`relative z-10 overflow-hidden ${getBackgroundColor()} text-white py-10`}>
      {/* Background image */}
      <Image
        src="/estadio.jpg"
        alt="Background"
        layout="fill"
        objectFit="cover"
        className="absolute inset-0 opacity-80 -z-10"
      />

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        {/* Logo */}
        <div className="flex flex-col items-center md:items-start gap-4">
          {mounted && (
            <Image
              src={getLogo()}
              alt="Logo"
              width={160}
              height={100}
              style={{
                height: 'auto',
                transition: 'opacity 0.5s ease-in-out',
              }}
            />
          )}
          <p className={`text-sm ${getTextColor()}`}>
            &copy; {new Date().getFullYear()} TipFans. Todos os direitos reservados.
          </p>
        </div>

        {/* Navegação */}
        <div className="flex flex-col gap-2 text-sm font-medium">
          <Link href="#" className="hover:underline text-white">Latest</Link>
          <Link href="#" className="hover:underline text-white">Contact</Link>
          <Link href="#" className="hover:underline text-white">Privacy Policy</Link>
          <Link href="#" className="hover:underline text-white">Terms of Use</Link>
        </div>

        {/* Redes sociais */}
        <div className="flex flex-col items-center md:items-end gap-4">
          <h3 className="text-sm uppercase font-bold tracking-wide">Follow us</h3>
          <div className="flex gap-4 text-xl">
            <Link href="#"><FaEnvelope /></Link>
            <Link href="#"><FaFacebookF /></Link>
            <Link href="#"><FaInstagram /></Link>
            <Link href="#"><FaYoutube /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
