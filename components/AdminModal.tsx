
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Config, AdminCredentials, Category, Program } from '../types';
import { CloseIcon, SaveIcon, PlusIcon, TrashIcon, UploadIcon } from './Icons';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  saveConfig: () => void;
}

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    />
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea
        {...props}
        className="w-full p-2 bg-[#0d1117] border border-[#30363d] rounded-md text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        rows={3}
    />
);

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

const AdminPanel: React.FC<{
    currentConfig: Config;
    setConfig: React.Dispatch<React.SetStateAction<Config>>;
    saveConfig: () => void;
    logout: () => void;
}> = ({ currentConfig, setConfig, saveConfig, logout }) => {

    const handleSiteInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleCategoryChange = (catIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const newCategories = [...currentConfig.categories];
        newCategories[catIndex] = { ...newCategories[catIndex], [e.target.name]: e.target.value };
        setConfig(prev => ({...prev, categories: newCategories}));
    };

    const handleProgramChange = (catIndex: number, progIndex: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newCategories = [...currentConfig.categories];
        newCategories[catIndex].programs[progIndex] = { ...newCategories[catIndex].programs[progIndex], [e.target.name]: e.target.value };
        setConfig(prev => ({ ...prev, categories: newCategories }));
    };
    
    const addCategory = () => {
        const newCategory: Category = {
            id: `cat${Date.now()}`,
            name: "فئة جديدة",
            programs: []
        };
        setConfig(prev => ({ ...prev, categories: [...prev.categories, newCategory] }));
    };

    const deleteCategory = (catIndex: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الفئة بكل برامجها؟')) {
            const newCategories = currentConfig.categories.filter((_, i) => i !== catIndex);
            setConfig(prev => ({ ...prev, categories: newCategories }));
        }
    };
    
    const addProgram = (catIndex: number) => {
        const newProgram: Program = {
            id: `prog${Date.now()}`,
            name: "برنامج جديد",
            shortDescription: "وصف مختصر",
            longDescription: "وصف طويل",
            image: "https://via.placeholder.com/128",
            downloadUrl: "#",
            adUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        };
        const newCategories = [...currentConfig.categories];
        newCategories[catIndex].programs.push(newProgram);
        setConfig(prev => ({...prev, categories: newCategories}));
    };

    const deleteProgram = (catIndex: number, progIndex: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذا البرنامج؟')) {
            const newCategories = [...currentConfig.categories];
            newCategories[catIndex].programs = newCategories[catIndex].programs.filter((_, i) => i !== progIndex);
            setConfig(prev => ({...prev, categories: newCategories}));
        }
    };


    return (
        <div className="text-white p-2 sm:p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">لوحة التحكم</h2>
                <div>
                     <button onClick={logout} className="ml-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors">تسجيل الخروج</button>
                    <button onClick={saveConfig} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors inline-flex items-center gap-2">
                        <SaveIcon />
                        <span>حفظ وتنزيل config.json</span>
                    </button>
                </div>
            </div>
            
            {/* Site Info */}
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold mb-3">معلومات الموقع</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400">اسم الموقع</label>
                        <Input name="siteName" value={currentConfig.siteName} onChange={handleSiteInfoChange} />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400">شعار الموقع</label>
                        <div className="flex items-center gap-4 mt-1">
                            <img src={currentConfig.siteLogo} alt="Site Logo" className="w-12 h-12 object-contain rounded-md bg-gray-700 p-1" />
                            <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors inline-flex items-center gap-2">
                                <UploadIcon />
                                <span>تغيير الشعار</span>
                                <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        const base64 = await fileToBase64(e.target.files[0]);
                                        setConfig(prev => ({ ...prev, siteLogo: base64 }));
                                    }
                                }} />
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400">اسم المطور</label>
                        <Input name="developer" value={currentConfig.developer} onChange={handleSiteInfoChange} />
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="space-y-4">
                 <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">الفئات والبرامج</h3>
                    <button onClick={addCategory} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-md transition-colors inline-flex items-center gap-2">
                        <PlusIcon />
                        <span>إضافة فئة</span>
                    </button>
                 </div>
                {currentConfig.categories.map((cat, catIndex) => (
                    <div key={cat.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-3">
                            <input name="name" value={cat.name} onChange={(e) => handleCategoryChange(catIndex, e)} className="text-lg font-semibold bg-transparent border-b border-gray-600 focus:border-blue-500 outline-none"/>
                            <button onClick={() => deleteCategory(catIndex)} className="text-red-500 hover:text-red-400 p-1 rounded-full"><TrashIcon /></button>
                        </div>
                        {/* Programs */}
                        <div className="space-y-3 pl-4 border-r-2 border-gray-600">
                            {cat.programs.map((prog, progIndex) => (
                                <div key={prog.id} className="bg-gray-900/50 p-3 rounded-md">
                                    <div className="flex justify-between items-center mb-2">
                                        <input name="name" value={prog.name} onChange={(e) => handleProgramChange(catIndex, progIndex, e)} className="font-semibold bg-transparent w-full"/>
                                        <button onClick={() => deleteProgram(catIndex, progIndex)} className="text-red-500 hover:text-red-400 p-1 rounded-full"><TrashIcon /></button>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                        <Input name="shortDescription" placeholder="وصف قصير" value={prog.shortDescription} onChange={(e) => handleProgramChange(catIndex, progIndex, e)} />
                                        <Input name="downloadUrl" placeholder="رابط التحميل المباشر" value={prog.downloadUrl} onChange={(e) => handleProgramChange(catIndex, progIndex, e)} />
                                        <Input name="adUrl" placeholder="رابط فيديو الإعلان (YouTube)" value={prog.adUrl} onChange={(e) => handleProgramChange(catIndex, progIndex, e)} />
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">صورة البرنامج</label>
                                            <div className="flex items-center gap-2">
                                                <img src={prog.image} alt={prog.name} className="w-10 h-10 object-contain rounded bg-gray-700 p-1" />
                                                <label className="cursor-pointer text-xs bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 rounded-md transition-colors inline-flex items-center gap-1">
                                                    <UploadIcon />
                                                    <span>تغيير</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            const base64 = await fileToBase64(e.target.files[0]);
                                                            const newCategories = [...currentConfig.categories];
                                                            newCategories[catIndex].programs[progIndex].image = base64;
                                                            setConfig(prev => ({ ...prev, categories: newCategories }));
                                                        }
                                                    }} />
                                                </label>
                                            </div>
                                        </div>
                                        <Textarea name="longDescription" placeholder="وصف طويل" value={prog.longDescription} onChange={(e) => handleProgramChange(catIndex, progIndex, e)} />
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => addProgram(catIndex)} className="mt-2 text-sm bg-blue-600/50 hover:bg-blue-600 text-white py-1 px-3 rounded-md transition-colors inline-flex items-center gap-1">
                                <PlusIcon />
                                <span>إضافة برنامج</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


const AdminLogin: React.FC<{ onLogin: (credentials: AdminCredentials) => void; error: string | null }> = ({ onLogin, error }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin({ username, password });
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold text-center text-white mb-6">تسجيل دخول المدير</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    type="text"
                    placeholder="اسم المستخدم"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <Input
                    type="password"
                    placeholder="كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <button
                    type="submit"
                    className="w-full p-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                    دخول
                </button>
            </form>
        </div>
    );
};


const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose, config, setConfig, saveConfig }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Reset auth state when modal is closed
  useEffect(() => {
      if(!isOpen) {
          setIsAuthenticated(false);
          setLoginError(null);
      }
  }, [isOpen])

  const handleLogin = (credentials: AdminCredentials) => {
    if (
      credentials.username === config.admin.username &&
      credentials.password === config.admin.password
    ) {
      setIsAuthenticated(true);
      setLoginError(null);
    } else {
      setLoginError('بيانات الدخول غير صحيحة.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-2 border-b border-[#30363d]">
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full">
                <CloseIcon />
              </button>
            </div>
             <div className="flex-grow overflow-y-auto scrollbar-thin">
                {isAuthenticated ? (
                    <AdminPanel currentConfig={config} setConfig={setConfig} saveConfig={saveConfig} logout={handleLogout} />
                ) : (
                    <AdminLogin onLogin={handleLogin} error={loginError} />
                )}
             </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdminModal;