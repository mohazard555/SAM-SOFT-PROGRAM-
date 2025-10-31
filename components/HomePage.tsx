
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Config, Category, Program } from '../types';
import { SearchIcon, CategoryIcon, DownloadIcon } from './Icons';

interface HomePageProps {
  config: Config;
  slugify: (text: string) => string;
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-sm bg-gray-900 text-white rounded-md shadow-lg z-50 border border-gray-700"
    >
        {text}
    </motion.div>
);

const ProgramItem: React.FC<{ program: Program; slug: string }> = ({ program, slug }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Link to={`/program/${slug}`} className="block text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                {program.name}
            </Link>
            <AnimatePresence>
                {isHovered && <Tooltip text={program.shortDescription} />}
            </AnimatePresence>
        </div>
    );
};

const CategoryCard: React.FC<{ category: Category; slugify: (text: string) => string }> = ({ category, slugify }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-lg overflow-hidden flex flex-col"
    >
        <div className="p-4 bg-gray-800/50 border-b border-[#30363d] flex items-center gap-3">
            <CategoryIcon />
            <h2 className="text-xl font-bold text-white">{category.name}</h2>
        </div>
        <div className="p-6 space-y-4 flex-grow">
            {category.programs.map(program => (
                <ProgramItem key={program.id} program={program} slug={slugify(program.name)} />
            ))}
        </div>
    </motion.div>
);

const HomePage: React.FC<HomePageProps> = ({ config, slugify }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!searchQuery) {
      return config.categories;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    
    return config.categories
      .map(category => {
        const filteredPrograms = category.programs.filter(program =>
          program.name.toLowerCase().includes(lowercasedQuery)
        );
        
        if (filteredPrograms.length > 0) {
          return { ...category, programs: filteredPrograms };
        }
        
        if (category.name.toLowerCase().includes(lowercasedQuery)) {
          return category;
        }
        
        return null;
      })
      .filter((category): category is Category => category !== null);
  }, [searchQuery, config.categories]);

  return (
    <div className="space-y-8">
      <div className="relative max-w-2xl mx-auto">
        <input
          type="text"
          placeholder="ابحث عن برنامج أو فئة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-4 pr-12 bg-[#161b22] border border-[#30363d] rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <SearchIcon />
        </div>
      </div>
      
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCategories.map(category => (
          <CategoryCard key={category.id} category={category} slugify={slugify} />
        ))}
      </motion.div>
      {filteredCategories.length === 0 && (
        <div className="text-center py-16 text-gray-500">
            <p className="text-2xl">لا توجد نتائج</p>
            <p>حاول البحث بكلمات أخرى.</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
