import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({ isOpen, onClose, title, children, footer, type = 'info' }) => {
    // Close on ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const typeStyles = {
        danger: 'bg-rose-50 text-rose-600',
        warning: 'bg-amber-50 text-amber-600',
        success: 'bg-emerald-50 text-emerald-600',
        info: 'bg-[#18216D]/5 text-[#18216D]'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 italic">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Body */}
            <div className="relative bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_70px_-10px_rgba(24,33,109,0.3)] w-full max-w-lg overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
                {/* Header Decoration */}
                <div className={`h-2 w-full ${type === 'danger' ? 'bg-rose-500' : 'bg-[#18216D]'}`}></div>

                <div className="p-8 sm:p-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${typeStyles[type]}`}>
                                {type === 'danger' ? (
                                    <i className="fas fa-trash-alt text-xl"></i>
                                ) : (
                                    <i className="fas fa-info-circle text-xl"></i>
                                )}
                            </div>
                            <h3 className="text-2xl font-black text-[#18216D] tracking-tighter uppercase">{title}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-300 hover:text-slate-600"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="text-slate-500 font-medium leading-relaxed mb-10 text-lg italic">
                        {children}
                    </div>

                    <div className="flex flex-col sm:flex-row-reverse gap-3">
                        {footer}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
