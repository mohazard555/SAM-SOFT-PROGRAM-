
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import ProgramPage from './components/ProgramPage';
import { useConfig } from './hooks/useConfig';
import AdminModal from './components/AdminModal';
import { Config, Program } from './types';

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

const App: React.FC = () => {
  const { config, loading, error, setConfig, saveConfig } = useConfig();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const allPrograms: (Program & { categoryName: string })[] = config
    ? config.categories.flatMap(category =>
        category.programs.map(program => ({
          ...program,
          categoryName: category.name,
        }))
      )
    : [];

  const findProgramBySlug = (slug: string): (Program & { categoryName: string }) | undefined => {
    return allPrograms.find(p => slugify(p.name) === slug);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d1117] text-white">
        <div className="text-2xl">جاري تحميل الإعدادات...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0d1117] text-red-500">
        <div className="text-2xl">خطأ في تحميل ملف الإعدادات: {error}</div>
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout config={config} onAdminClick={() => setIsAdminModalOpen(true)} />}>
          <Route index element={<HomePage config={config} slugify={slugify} />} />
          <Route path="program/:slug" element={<ProgramPage findProgramBySlug={findProgramBySlug} />} />
        </Route>
      </Routes>
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        config={config}
        setConfig={setConfig as React.Dispatch<React.SetStateAction<Config>>}
        saveConfig={saveConfig}
      />
    </>
  );
};

export default App;
