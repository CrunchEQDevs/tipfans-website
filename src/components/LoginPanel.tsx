'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

type LoginPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LoginPanel({ isOpen, onClose }: LoginPanelProps) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Painel lateral */}
          <motion.div
            className="fixed top-0 right-0 w-full sm:max-w-sm md:max-w-md h-full z-50 p-4 sm:p-6 overflow-y-auto 
              bg-gradient-to-r from-[#ed4f00] via-[#ebebeb] to-[#1e10c7] 
              dark:bg-gradient-to-r dark:from-[#1e10c7] dark:via-[#ebebeb] dark:to-[#ed4f00]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween' }}
          >
            {/* Logo */}
            <div className="mt-10 mb-12 flex justify-center">
              <Image
                src="/Logotipo_Branco.png"
                alt="Logo"
                width={180}
                height={60}
                className="h-auto w-auto"
              />
            </div>

            {/* Cabeçalho */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold dark:text-white text-gray-800">
                Entrar na Conta
              </h2>
              <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-xl">
           
              </button>
            </div>

            {/* Formulário */}
            <form className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-800 dark:text-white rounded-full"
                  placeholder="seuemail@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300">Senha</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-800 dark:text-white rounded-full"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-brandOrange hover:bg-orange-600 text-white py-2 rounded-full transition"
              >
                Entrar
              </button>
            </form>

            {/* Registro */}
            <p className="text-center text-sm mt-4 dark:text-gray-300 text-gray-600">
              Ainda não tem conta?{' '}
              <span className="text-brandOrange font-medium cursor-pointer hover:underline">
                Registre-se
              </span>
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
