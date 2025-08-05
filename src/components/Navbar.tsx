'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaEnvelope,
  FaBars,
  FaTimes,
} from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';

const menuItems = [
  {
    title: 'Latest',
    submenu: ['Articles', 'Guides', 'Tips'],
  },
  {
    title: 'Tips',
    submenu: ['Football', 'Tennis', 'Basketball', 'Esports', 'Other'],
  },
  {
    title: 'Tipsters',
    submenu: ['Tipster profiles and statistics', 'Tipster Ranking'],
  },
  {
    title: 'Challenges',
    submenu: ['Challenges Page', 'Rankings Page'],
  },
  {
    title: 'Community',
    submenu: ['Page linking to social media'],
  },
];

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const getTextColor = () => {
    if (!mounted) return 'text-brandBlue';
    return theme === 'dark' ? 'text-brandOrange' : 'text-brandBlue';
  };

  const getBackgroundColor = () => {
    if (!mounted) return 'bg-white';
    return theme === 'dark' ? 'bg-black/60' : 'bg-white/60';
  };

  const getLogo = () => {
    if (!mounted) return '/Logotipo_azul.png';
    return theme === 'dark' ? '/Logotipo_laranja.png' : '/Logotipo_azul.png';
  };

  return (
    <header className={`fixed top-0 w-full z-50 shadow-md border-b border-white/10 backdrop-blur-md ${getBackgroundColor()} transition-all duration-300`}>
      {/* Top Bar */}
      <div className="w-full px-4 py-2 text-sm uppercase font-semibold tracking-wide">
        <div className={`max-w-7xl mx-auto flex justify-end items-center gap-4 ${getTextColor()}`}>
          <FaEnvelope className="hover:scale-110 transition-transform cursor-pointer" />
          <FaFacebookF className="hover:scale-110 transition-transform cursor-pointer" />
          <FaInstagram className="hover:scale-110 transition-transform cursor-pointer" />
          <FaYoutube className="hover:scale-110 transition-transform cursor-pointer" />
        </div>
      </div>

      {/* Main nav */}
      <nav className="px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          {mounted && (
            <Image
              src={getLogo()}
              alt="Logo"
              width={140}
              height={100}
              priority
              className="h-auto transition-opacity duration-500"
            />
          )}

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map(item => (
              <div
                key={item.title}
                className="relative group"
                onMouseEnter={() => setOpenMenu(item.title)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button className={`font-bold uppercase text-sm tracking-wider ${getTextColor()} hover:text-brandBlue transition`}>
                  {item.title}
                </button>

                {/* Submenu */}
                {openMenu === item.title && (
                  <div className="absolute bg-white dark:bg-gray-800 border border-brandBlue mt-2 py-2 w-56 z-50 shadow-lg rounded-xl animate-slideIn">
                    {item.submenu.map((subItem, index) => (
                      <span
                        key={index}
                        className="block px-4 py-2 text-brandBlue dark:text-white opacity-80 hover:opacity-100 transition-all cursor-pointer"
                      >
                        {subItem}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Dark mode toggle */}
            {mounted && (
              <button
                onClick={toggleDarkMode}
                className="ml-4"
                aria-label="Toggle Dark Mode"
              >
                <FontAwesomeIcon
                  icon={theme === 'dark' ? faSun : faMoon}
                  className={`text-lg ${getTextColor()} hover:scale-110 transition-transform`}
                />
              </button>
            )}
          </div>

          {/* Search + Login */}
          <div className="hidden md:flex items-center gap-4">
            <input
              type="text"
              placeholder="Search..."
              className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm border border-gray-400 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-brandOrange placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            <button className="bg-gradient-to-r from-brandOrange to-orange-600 text-white px-4 py-1 rounded-full shadow hover:opacity-90 transition flex items-center gap-2">
              <FontAwesomeIcon icon={faUserPlus} />
              Login
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`${getTextColor()}`}
            >
              {mobileMenuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 px-4 pb-6 space-y-4 bg-white/80 dark:bg-black/80 rounded-b-lg animate-slideIn">
            {menuItems.map(item => (
              <div key={item.title}>
                <p className="font-bold uppercase text-sm tracking-wide text-brandBlue dark:text-brandOrange">{item.title}</p>
                <div className="pl-4 space-y-1">
                  {item.submenu.map((subItem, index) => (
                    <span key={index} className="block text-sm opacity-80 text-gray-700 dark:text-gray-300">
                      {subItem}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* Dark mode mobile toggle */}
            {mounted && (
              <button
                onClick={toggleDarkMode}
                className="mt-4 flex items-center gap-2 text-brandOrange"
              >
                <FontAwesomeIcon
                  icon={theme === 'dark' ? faSun : faMoon}
                  className="text-lg"
                />
                <span>Dark Mode</span>
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
