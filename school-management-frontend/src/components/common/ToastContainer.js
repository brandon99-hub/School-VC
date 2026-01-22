import React from 'react';
import { useAppState } from '../../context/AppStateContext';

const ToastContainer = () => {
    const { toast, dispatch } = useAppState();

    if (!toast) return null;

    const isSuccess = toast.type === 'success';

    return (
        <div className="fixed bottom-6 right-6 z-[9999] animate-slide-in-up">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${isSuccess
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : 'bg-rose-50 border-rose-100 text-rose-800'
                }`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isSuccess ? 'bg-emerald-100' : 'bg-rose-100'
                    }`}>
                    <i className={`fas ${isSuccess ? 'fa-check' : 'fa-exclamation-triangle'} text-sm`}></i>
                </div>
                <div>
                    <p className="font-bold text-sm tracking-tight">{isSuccess ? 'Success!' : 'Error'}</p>
                    <p className="text-xs opacity-80">{toast.message}</p>
                </div>
                <button
                    onClick={() => dispatch({ type: 'CLEAR_TOAST' })}
                    className="ml-4 hover:opacity-100 opacity-50 transition-opacity"
                >
                    <i className="fas fa-times text-xs"></i>
                </button>
            </div>
        </div>
    );
};

export default ToastContainer;
