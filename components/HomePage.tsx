import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Config, Category, Program } from '../types';
import { SearchIcon, CategoryIcon, InfoIcon, MessageCircleIcon } from './Icons';
import InfoModal from './InfoModal';

interface HomePageProps {
  config: Config;
  slugify: (text: string) => string;
}

const ProgramItem: React.FC<{ program: Program; slug: string }> = ({ program, slug }) => {
    return (
        <Link to={`/program/${slug}`} className="block text-gray-300 hover:text-white transition-colors group">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-blue-400 group-hover:underline">{program.name}</span>
                {program.badge && (
                    <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">
                        {program.badge}
                    </span>
                )}
                <span className="text-sm text-gray-500">- {program.shortDescription}</span>
            </div>
        </Link>
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
  const [modalData, setModalData] = useState<{ title: string; content: string } | null>(null);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) {
      return config.categories;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    
    return config.categories
      .map(category => {
        const filteredPrograms = category.programs.filter(program =>
          program.name.toLowerCase().includes(lowercasedQuery) ||
          program.shortDescription.toLowerCase().includes(lowercasedQuery)
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
      
      <div className="flex justify-center items-center gap-6 text-gray-400">
        <button 
            onClick={() => setModalData({ title: 'حول الموقع', content: config.siteAbout || 'لا يوجد وصف متاح حالياً.' })}
            className="flex items-center gap-2 hover:text-blue-400 transition-colors"
            aria-label="عرض معلومات حول الموقع"
        >
            <InfoIcon />
            <span>حول الموقع</span>
        </button>
        <button 
            onClick={() => setModalData({ title: 'أعلن معنا', content: config.advertiseInfo || 'معلومات الإعلان غير متاحة حالياً.' })}
            className="flex items-center gap-2 hover:text-blue-400 transition-colors"
            aria-label="عرض معلومات الإعلان"
        >
            <MessageCircleIcon />
            <span>أعلن معنا</span>
        </button>
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
      <InfoModal 
        isOpen={!!modalData}
        onClose={() => setModalData(null)}
        title={modalData?.title || ''}
        content={modalData?.content || ''}
      />
    </div>
  );
};

export default HomePage;