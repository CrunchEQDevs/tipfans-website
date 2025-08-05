'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LogoPage() {
  return (
    <section className='bg-gray-300 '>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <Image
          src="/Logotipo_laranja.png" 
          alt="Logotipo TipFans"
          width={320}
          height={120}
          className="mx-auto mb-0"
        />

       
      </motion.div>
    </section>
  );
}
