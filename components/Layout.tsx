
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import type { Config } from '../types';
import { AdminIcon } from './Icons';

interface LayoutProps {
  config: Config;
  onAdminClick: () => void;
}

const Header: React.FC<LayoutProps> = ({ config, onAdminClick }) => (
  <header className="bg-[#161b22]/80 backdrop-blur-sm border-b border-[#30363d] sticky top-0 z-40">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-4">
          {config.siteLogo && <img src={config.siteLogo} alt="Logo" className="h-10 w-10 object-contain"/>}
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-wider">{config.siteName}</h1>
        </Link>
        <button
          onClick={onAdminClick}
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          aria-label="Admin Panel"
        >
          <AdminIcon />
        </button>
      </div>
    </div>
  </header>
);

const Footer: React.FC<{ developer: string; siteName: string }> = ({ developer, siteName }) => (
  <footer className="bg-[#161b22] border-t border-[#30363d] mt-12">
    <div className="container mx-auto py-6 px-4 text-center text-gray-400">
      <p>&copy; جميع الحقوق محفوظة لـ {siteName}</p>
      <p className="text-sm mt-1">
        تم التطوير بواسطة: <span className="font-semibold text-gray-300">{developer}</span>
      </p>
    </div>
  </footer>
);

const Layout: React.FC<LayoutProps> = ({ config, onAdminClick }) => {
  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 font-sans flex flex-col">
      <Header config={config} onAdminClick={onAdminClick} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer developer={config.developer} siteName={config.siteName} />
    </div>
  );
};

export default Layout;
