import React, { useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ToastProps {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ isOpen, message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 fade-in duration-300">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
        isSuccess 
          ? 'bg-emerald-900/95 border-emerald-500/30 text-emerald-100 shadow-[0_10px_40px_rgba(16,185,129,0.3)]' 
          : 'bg-red-900/95 border-red-500/30 text-red-100 shadow-[0_10px_40px_rgba(239,68,68,0.3)]'
      } backdrop-blur-md`}>
        {isSuccess ? <CheckCircle2 className="text-emerald-400" /> : <XCircle className="text-red-400" />}
        <span className="font-bold">{message}</span>
      </div>
    </div>
  );
}
