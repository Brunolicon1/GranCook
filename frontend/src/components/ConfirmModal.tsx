import React from 'react';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
  showCancel?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  type = 'warning',
  showCancel = true
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <XCircle className="text-red-500 w-12 h-12 mb-4 mx-auto" />;
      case 'info': return <Info className="text-blue-500 w-12 h-12 mb-4 mx-auto" />;
      default: return <AlertTriangle className="text-amber-500 w-12 h-12 mb-4 mx-auto" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger': return 'bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
      case 'info': return 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]';
      default: return 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-700 p-6 text-center animate-in zoom-in-95 duration-200">
        {getIcon()}
        
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <div className="text-slate-300 mb-6">{message}</div>
        
        <div className="flex gap-3">
          {showCancel && (
            <button 
              onClick={onCancel} 
              className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={onConfirm} 
            className={`flex-1 py-3 rounded-xl font-bold text-white transition-colors ${getButtonClass()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
