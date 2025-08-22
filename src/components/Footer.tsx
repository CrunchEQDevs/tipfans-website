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

  const getLogo = () => {
    if (!mounted) return '/Logo_TipFans.png';
    return theme === 'dark' ? '/Logo_TipFans.png' : '/Logo_TipFans.png';
  };

  return (
    <footer className={`relative z-10 overflow-hidden bg-[#151515] text-white py-10`}>
     
      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left border-b border-[#1E10C7] w-full pb-6">
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
         
        </div>

        {/* Navegação */}
        <div className="flex flex-auto gap-2 text-sm font-medium ">
          <Link href="#" className="hover:underline text-white">LATEST</Link>
          <Link href="#" className="hover:underline text-white">TIPS</Link>
          <Link href="#" className="hover:underline text-white">TIPSTERS</Link>
          <Link href="#" className="hover:underline text-white">CHALENGES</Link>
          <Link href="#" className="hover:underline text-white">COMMUNITY</Link>

            
            {/* Redes sociais */}
            <div className=" items-center md:items-end gap-4 relative mt-10 right-80 ">
            <h3 className="text-justify uppercase tracking-wide text-[10px]">Follow us</h3>
            <div className="flex gap-4 text-xl mt-2">
                <Link href="#"><FaEnvelope /></Link>
                <Link href="#"><FaFacebookF /></Link>
                <Link href="#"><FaInstagram /></Link>
                <Link href="#"><FaYoutube /></Link>                
            </div>
            </div>

        </div >

      </div>
      <div className="flex justify-center items-center py-4 ">
       <p className={`text-sm ${getTextColor()}`}>
            &copy; {new Date().getFullYear()} 
            Copyright © 2025 - Direitos reservados - TipFans.
          </p>

      </div>
    </footer>
  );
}
