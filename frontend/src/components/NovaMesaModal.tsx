import React, { useState, useRef } from 'react';
import { X, Plus } from 'lucide-react';

interface NovaMesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (numero: number, capacidade: number) => Promise<{ success: boolean; error?: string } | void>;
}

export default function NovaMesaModal({ isOpen, onClose, onSubmit }: NovaMesaModalProps) {
  const [numero, setNumero] = useState<number | ''>('');
  const [capacidade, setCapacidade] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const capacidadeInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero || numero <= 0 || !capacidade || capacidade <= 0) return;
    
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const result = await onSubmit(Number(numero), Number(capacidade));
      
      if (result && !result.success) {
        setIsSubmitting(false);
        setErrorMsg(result.error || 'Erro ao salvar a mesa.');
        return;
      }
      
      setIsSubmitting(false);
      // Reseta form após sucesso
      setNumero('');
      setCapacidade('');
      onClose();
    } catch (error: any) {
      setIsSubmitting(false);
      setErrorMsg(error.message || 'Erro ao salvar a mesa. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-700">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus size={20} className="text-emerald-500" />
            Adicionar Mesa
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Número da Mesa</label>
            <input 
              type="number" 
              min="1"
              value={numero}
              onChange={(e) => setNumero(e.target.value ? Number(e.target.value) : '')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  capacidadeInputRef.current?.focus();
                }
              }}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Ex: 15"
              autoFocus
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Capacidade (Pessoas)</label>
            <input 
              ref={capacidadeInputRef}
              type="number" 
              min="1"
              value={capacidade}
              onChange={(e) => setCapacidade(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="Ex: 4"
              required
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !numero}
            >
              {isSubmitting ? 'Salvando...' : 'Adicionar Mesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
