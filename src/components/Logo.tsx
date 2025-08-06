'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LogoPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getBackgroundColor = () => {
    if (!mounted) return 'bg-brandBlue';
    return theme === 'dark' ? 'bg-brandBlue' : 'bg-brandBlue';
  };

  const getLogo = () => {
    if (!mounted) return '/Logotipo_Branco.png';
    return theme === 'dark' ? '/Logotipo_Laranja.png' : '/Logotipo_Branco.png';
  };

  return (
    <section className={`${getBackgroundColor()} py-8`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <Image
          src={getLogo()}
          alt="Logo"
          width={140}
          height={100}
          priority
          className="h-auto transition-opacity duration-500 mx-auto"
        />
      </motion.div>
    </section>
  );
}
