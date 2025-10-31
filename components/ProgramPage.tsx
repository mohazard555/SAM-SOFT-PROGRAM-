import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Program } from '../types';
import { DownloadIcon, BackIcon, VideoIcon, CloseIcon, ExternalLinkIcon } from './Icons';

const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;

    // Regex to extract video ID from various YouTube URL formats
    const videoIdRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(videoIdRegex);
    const videoId = match ? match[1] : null;

    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
    }

    console.error("Could not extract YouTube video ID from URL:", url);
    return null;
}

const AdGateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  downloadUrl: string;
  adUrl: string;
  postAdUrl?: string;
}> = ({ isOpen, onClose, downloadUrl, adUrl, postAdUrl }) => {
    const [countdown, setCountdown] = useState(20);
    const [step, setStep] = useState<'counting' | 'postAd' | 'download'>('counting');
    const embedUrl = getYouTubeEmbedUrl(adUrl);

    const isTimerRunning = countdown > 0 && step === 'counting';
    const canClose = step !== 'counting';

    useEffect(() => {
        if (isOpen) {
            setCountdown(20);
            setStep('counting');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !isTimerRunning) return;

        const timer = setInterval(() => {
            setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        
        return () => clearInterval(timer);
    }, [isOpen, isTimerRunning]);

    useEffect(() => {
        if (countdown <= 0 && step === 'counting') {
            if (postAdUrl) {
                setStep('postAd');
            } else {
                setStep('download');
            }
        }
    }, [countdown, step, postAdUrl]);

    const handlePostAdClick = () => {
        if(postAdUrl) {
            window.open(postAdUrl, '_blank', 'noopener,noreferrer');
        }
        setStep('download');
    };

    const handleDownloadClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (step !== 'download') {
            e.preventDefault();
        } else {
            onClose();
        }
    };


    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={canClose ? onClose : undefined}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                        className="bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl w-full max-w-lg relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {canClose && (
                           <motion.button
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                onClick={onClose} 
                                className="absolute top-2 left-2 p-2 text-gray-400 hover:text-white rounded-full z-10"
                                aria-label="إغلاق"
                            >
                                <CloseIcon />
                            </motion.button>
                        )}
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-center text-white mb-4">يتم تجهيز الرابط الخاص بك</h2>
                            <div className="bg-black rounded-lg aspect-video flex flex-col items-center justify-center mb-4 border border-gray-700 overflow-hidden">
                                {embedUrl ? (
                                    <iframe
                                        className="w-full h-full"
                                        src={embedUrl}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    ></iframe>
                                ) : (
                                    <>
                                        <VideoIcon />
                                        <p className="mt-2 text-gray-400">فيديو إعلاني غير متاح</p>
                                    </>
                                )}
                            </div>
                            
                            <div className="h-16 flex items-center justify-center">
                                {step === 'counting' && (
                                    <p className="text-center text-yellow-400 text-lg">
                                        نرجو الانتظار <span className="font-bold text-xl tabular-nums">{countdown}</span> ثانية لتوجيهكم لرابط التحميل...
                                    </p>
                                )}
                                {step === 'postAd' && (
                                    <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-center text-blue-400 font-semibold text-lg">الخطوة التالية: يرجى زيارة رابط الإعلان.</motion.p>
                                )}
                                {step === 'download' && (
                                    <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-center text-green-400 font-semibold text-lg">الرابط جاهز للتحميل!</motion.p>
                                )}
                            </div>
                            
                            <div className="w-full">
                                {step === 'counting' && (
                                    <button
                                        disabled
                                        className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 font-bold rounded-lg transition-all bg-gray-600 text-gray-400 cursor-not-allowed"
                                    >
                                        <DownloadIcon />
                                        <span>الرجاء الانتظار...</span>
                                    </button>
                                )}
                                {step === 'postAd' && (
                                    <button
                                        onClick={handlePostAdClick}
                                        className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 font-bold rounded-lg transition-all transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-lg"
                                    >
                                        <ExternalLinkIcon />
                                        <span>الانتقال إلى رابط الإعلان</span>
                                    </button>
                                )}
                                {step === 'download' && (
                                    <a
                                        href={downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full inline-flex items-center justify-center gap-3 px-8 py-4 font-bold rounded-lg transition-all transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 bg-green-600 text-white hover:bg-green-700 hover:scale-105 shadow-lg"
                                        onClick={handleDownloadClick}
                                    >
                                        <DownloadIcon />
                                        <span>اضغط هنا للتحميل</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

interface ProgramPageProps {
  findProgramBySlug: (slug: string) => (Program & { categoryName: string }) | undefined;
}

const ProgramPage: React.FC<ProgramPageProps> = ({ findProgramBySlug }) => {
  const { slug } = useParams<{ slug: string }>();
  const program = slug ? findProgramBySlug(slug) : undefined;
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  if (!program) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-bold text-red-500 mb-4">البرنامج غير موجود</h2>
        <Link to="/" className="text-blue-400 hover:underline">العودة إلى الصفحة الرئيسية</Link>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors">
              <BackIcon />
              <span>العودة إلى القائمة</span>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 flex flex-col items-center">
              <img 
                src={program.image} 
                alt={program.name} 
                className="w-40 h-40 object-contain rounded-lg mb-4 bg-white/10 p-2"
              />
            </div>
            <div className="md:col-span-2">
              <span className="text-sm text-blue-400 bg-blue-900/50 px-3 py-1 rounded-full">{program.categoryName}</span>
              <h1 className="text-4xl font-bold text-white my-3">{program.name}</h1>
              <p className="text-gray-300 leading-relaxed text-lg">
                {program.longDescription}
              </p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#30363d] flex justify-center">
            <button
              onClick={() => setIsAdModalOpen(true)}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
            >
              <DownloadIcon />
              <span>تحميل مباشر</span>
            </button>
          </div>
        </div>
      </motion.div>
      <AdGateModal 
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        downloadUrl={program.downloadUrl}
        adUrl={program.adUrl}
        postAdUrl={program.postAdUrl}
      />
    </>
  );
};

export default ProgramPage;