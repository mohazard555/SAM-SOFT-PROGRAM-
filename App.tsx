
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import ProgramPage from './components/ProgramPage';
import { useConfig } from './hooks/useConfig';
import AdminModal from './components/AdminModal';
import Toast from './components/Toast';
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

type ToastState = { message: string; type: 'loading' | 'success' | 'error' };

const App: React.FC = () => {
  const { config, loading, error, setConfig, exportConfig, saveConfig } = useConfig();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0d1117] text-gray-900 dark:text-white">
        <div className="text-2xl">جاري تحميل الإعدادات...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0d1117] text-red-500">
        <div className="text-2xl">خطأ في تحميل ملف الإعدادات: {error}</div>
      </div>
    );
  }

  if (!config) {
    return null;
  }
  
  const allPrograms: (Program & { categoryName: string })[] = (config.categories || []).flatMap(category =>
    (category.programs || []).map(program => ({
      ...program,
      categoryName: category.name,
    }))
  );

  const findProgramBySlug = (slug: string): (Program & { categoryName: string }) | undefined => {
    return allPrograms.find(p => slugify(p.name) === slug);
  };
  
  const handleSaveConfig = async () => {
    setToast({ message: 'جاري المزامنة...', type: 'loading' });
    try {
        await saveConfig();
        setToast({ message: 'تمت المزامنة بنجاح!', type: 'success' });
    } catch (err) {
        if (err instanceof Error) {
            setToast({ message: `فشل المزامنة: ${err.message}`, type: 'error' });
        } else {
            setToast({ message: 'فشل المزامنة: خطأ غير معروف.', type: 'error' });
        }
    }
  };


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
        saveConfig={handleSaveConfig}
        exportConfig={exportConfig}
      />
      <AnimatePresence>
        {toast && (
            <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
            />
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
