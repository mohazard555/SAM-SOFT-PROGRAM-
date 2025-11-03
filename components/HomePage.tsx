import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Config, Category, Program } from '../types';
import { SearchIcon, CategoryIcon, InfoIcon, MessageCircleIcon, ChevronDownIcon, PlusCircleIcon, MinusCircleIcon } from './Icons';
import InfoModal from './InfoModal';

interface HomePageProps {
  config: Config;
  slugify: (text: string) => string;
}

const ProgramItem: React.FC<{ program: Program; slug: string }> = ({ program, slug }) => {
    return (
        <Link to={`/program/${slug}`} className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors group">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-blue-600 dark:text-blue-400 group-hover:underline">{program.name}</span>
                {program.badge && (
                    <span className="text-xs font-bold text-white bg-red-600 px-2 py-0.5 rounded-full">
                        {program.badge}
                    </span>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-500">- {program.shortDescription}</span>
            </div>
        </Link>
    );
};

const CategoryCard: React.FC<{ category: Category; slugify: (text: string) => string }> = ({ category, slugify }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isProgramsExpanded, setIsProgramsExpanded] = useState(false);

    const INITIAL_VISIBLE_PROGRAMS = 3;
    const hasMorePrograms = category.programs.length > INITIAL_VISIBLE_PROGRAMS;

    const programsToShow = hasMorePrograms && !isProgramsExpanded
        ? category.programs.slice(0, INITIAL_VISIBLE_PROGRAMS)
        : category.programs;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-2xl shadow-lg hover:shadow-xl transition-shadow flex flex-col overflow-hidden"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-right p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-[#30363d] flex items-center justify-between gap-3 cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    <CategoryIcon />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{category.name}</h2>
                </div>
                <ChevronDownIcon className={`transform transition-transform duration-300 text-gray-500 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="content"
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                        open: { opacity: 1, height: 'auto' },
                        collapsed: { opacity: 0, height: 0 }
                    }}
                    transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    className="overflow-hidden flex-grow flex flex-col"
                >
                    <div className="p-6 space-y-4 flex-grow">
                        {programsToShow.map(program => (
                            <ProgramItem key={program.id} program={program} slug={slugify(program.name)} />
                        ))}
                    </div>
                     {hasMorePrograms && (
                        <div className="border-t border-gray-200 dark:border-[#30363d] px-6 py-2 bg-gray-50/50 dark:bg-gray-800/20">
                             <button
                                onClick={() => setIsProgramsExpanded(!isProgramsExpanded)}
                                className="w-full text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-center gap-1.5 p-1 rounded-md transition-colors"
                            >
                                {isProgramsExpanded ? <MinusCircleIcon /> : <PlusCircleIcon />}
                                <span>{isProgramsExpanded ? 'عرض أقل' : `عرض الكل (${category.programs.length})`}</span>
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
            </AnimatePresence>
        </motion.div>
    );
};

const HomePage: React.FC<HomePageProps> = ({ config, slugify }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalData, setModalData] = useState<{ title: string; content: string } | null>(null);

  const filteredCategories = useMemo(() => {
    const categories = config.categories || [];
    if (!searchQuery) {
      return categories;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    
    return categories
      .map(category => {
        const programs = category.programs || [];
        const filteredPrograms = programs.filter(program =>
          program.name.toLowerCase().includes(lowercasedQuery) ||
          program.shortDescription.toLowerCase().includes(lowercasedQuery)
        );
        
        if (filteredPrograms.length > 0) {
          return { ...category, programs: filteredPrograms };
        }
        
        if (category.name.toLowerCase().includes(lowercasedQuery)) {
          return { ...category, programs: programs };
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
          className="w-full p-4 pr-12 bg-white dark:bg-[#161b22] border border-gray-300 dark:border-[#30363d] rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <SearchIcon />
        </div>
      </div>
      
      <div className="flex justify-center items-center gap-6 text-gray-500 dark:text-gray-400">
        <button 
            onClick={() => setModalData({ title: 'حول الموقع', content: config.siteAbout || 'لا يوجد وصف متاح حالياً.' })}
            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            aria-label="عرض معلومات حول الموقع"
        >
            <InfoIcon />
            <span>حول الموقع</span>
        </button>
        <button 
            onClick={() => setModalData({ title: 'أعلن معنا', content: config.advertiseInfo || 'معلومات الإعلان غير متاحة حالياً.' })}
            className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
        <div className="text-center py-16 text-gray-500 dark:text-gray-500">
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