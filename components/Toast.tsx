import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloseIcon, CheckCircleIcon, AlertTriangleIcon, LoadingSpinnerIcon } from './Icons';

type ToastType = 'success' | 'error' | 'loading';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircleIcon />,
  error: <AlertTriangleIcon />,
  loading: <LoadingSpinnerIcon />,
};

const mainColors: Record<ToastType, string> = {
  success: 'bg-green-100 dark:bg-[#162f21] text-green-800 dark:text-green-200 border-green-400 dark:border-green-700',
  error: 'bg-red-100 dark:bg-[#2f1616] text-red-800 dark:text-red-200 border-red-400 dark:border-red-700',
  loading: 'bg-blue-100 dark:bg-[#16222f] text-blue-800 dark:text-blue-200 border-blue-400 dark:border-blue-700',
};

const buttonColors: Record<Exclude<ToastType, 'loading'>, string> = {
  success: 'text-green-500 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900 focus:ring-green-400',
  error: 'text-red-500 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900 focus:ring-red-400',
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        if (type !== 'loading') {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);

            return () => {
                clearTimeout(timer);
            };
        }
    }, [type, onClose]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`fixed bottom-5 right-5 z-[100] flex items-center p-4 max-w-sm w-full rounded-2xl shadow-2xl border ${mainColors[type]}`}
            role="alert"
        >
            <div className="flex-shrink-0">{icons[type]}</div>
            <div className="ms-3 text-sm font-medium flex-grow">{message}</div>
            {type !== 'loading' && (
                 <button
                    type="button"
                    className={`ms-auto -mx-1.5 -my-1.5 p-1.5 inline-flex items-center justify-center h-8 w-8 rounded-lg focus:ring-2 ${buttonColors[type as Exclude<ToastType, 'loading'>]}`}
                    onClick={onClose}
                    aria-label="Close"
                >
                    <span className="sr-only">Close</span>
                    <CloseIcon />
                </button>
            )}
        </motion.div>
    );
};

export default Toast;
