
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Config, Ad } from '../types';
import { AdminIcon, CloseIcon, SunIcon, MoonIcon } from './Icons';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  config: Config;
  onAdminClick: () => void;
}

const ThemeToggleButton: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
    );
};

const Header: React.FC<LayoutProps & { isAdminIconVisible: boolean, onLogoClick: (e: React.MouseEvent) => void }> = ({ config, onAdminClick, isAdminIconVisible, onLogoClick }) => (
  <header className="bg-white/80 dark:bg-[#161b22]/80 backdrop-blur-sm border-b border-gray-200 dark:border-[#30363d] sticky top-0 z-40">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-4" onClick={onLogoClick}>
          {config.siteLogo && <img src={config.siteLogo} alt="Logo" className="h-10 w-10 object-contain"/>}
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-wider">{config.siteName}</h1>
        </Link>
        <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <AnimatePresence>
            {isAdminIconVisible && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={onAdminClick}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Admin Panel"
              >
                <AdminIcon />
              </motion.button>
            )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  </header>
);

const Footer: React.FC<{ developer: string; siteName: string }> = ({ developer, siteName }) => (
  <footer className="bg-gray-100 dark:bg-[#161b22] border-t border-gray-200 dark:border-[#30363d] mt-12">
    <div className="container mx-auto py-6 px-4 text-center text-gray-500 dark:text-gray-400">
      <p>&copy; جميع الحقوق محفوظة لـ {siteName}</p>
      <p className="text-sm mt-1">
        تم التطوير بواسطة: <span className="font-semibold text-gray-600 dark:text-gray-300">{developer}</span>
      </p>
    </div>
  </footer>
);

interface AdBannerProps {
  ads: Ad[];
}

const AD_BANNER_SESSION_KEY = 'adBannerDismissed';

const AdBanner: React.FC<AdBannerProps> = ({ ads }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem(AD_BANNER_SESSION_KEY);
    if (!isDismissed && ads && ads.length > 0) {
      setIsVisible(true);
    }
  }, [ads]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    setIsVisible(false);
    sessionStorage.setItem(AD_BANNER_SESSION_KEY, 'true');
  };

  const ad = ads?.[0];

  if (!ad) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <a
            href={ad.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl shadow-2xl p-4 max-w-sm w-full text-gray-900 dark:text-white no-underline hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <img src={ad.image} alt={ad.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
            <div className="flex-grow">
              <h4 className="font-bold text-base">{ad.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ad.description}</p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full self-start flex-shrink-0 -mr-2"
              aria-label="إخفاء الإعلان"
            >
              <CloseIcon />
            </button>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


const Layout: React.FC<LayoutProps> = ({ config, onAdminClick }) => {
  const [isAdminIconVisible, setIsAdminIconVisible] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('adminUnlocked') === 'true') {
      setIsAdminIconVisible(true);
    }
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    clickCountRef.current += 1;

    if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
    }

    if (clickCountRef.current >= 5) {
        setIsAdminIconVisible(true);
        sessionStorage.setItem('adminUnlocked', 'true');
        clickCountRef.current = 0; // Reset
    } else {
        clickTimerRef.current = window.setTimeout(() => {
            // After the timeout, if it was just one click, navigate to home.
            if (clickCountRef.current === 1) {
                navigate('/');
            }
            // Reset count after timeout.
            clickCountRef.current = 0;
        }, 300); // 300ms window for multi-click vs single-click
    }
  };

  useEffect(() => {
    // Cleanup timer on component unmount
    return () => {
        if (clickTimerRef.current) {
            clearTimeout(clickTimerRef.current);
        }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d1117] text-gray-800 dark:text-gray-200 font-sans flex flex-col">
      <Header config={config} onAdminClick={onAdminClick} isAdminIconVisible={isAdminIconVisible} onLogoClick={handleLogoClick}/>
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer developer={config.developer} siteName={config.siteName} />
      <AdBanner ads={config.ads} />
    </div>
  );
};

export default Layout;
