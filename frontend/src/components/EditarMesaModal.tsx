import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { MesaMock } from '@/services/mockData';

interface EditarMesaModalProps {
  mesa: MesaMock | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, numero: number, capacidade: number) => Promise<{ success: boolean; error?: string } | void>;
  onDelete: (id: number) => Promise<void>;
}

export default function EditarMesaModal({ mesa, isOpen, onClose, onUpdate, onDelete }: EditarMesaModalProps) {
  const [numero, setNumero] = useState<number | ''>('');
  const [capacidade, setCapacidade] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const capacidadeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mesa) {
      setNumero(mesa.numero);
      setCapacidade(mesa.capacidade);
      setConfirmDelete(false);
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [mesa, isOpen]);

  if (!isOpen || !mesa) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero || numero <= 0 || !capacidade || capacidade <= 0) return;
    
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const result = await onUpdate(mesa.id, Number(numero), Number(capacidade));
      
      if (result && !result.success) {
        setIsSubmitting(false);
        setErrorMsg(result.error || 'Erro ao atualizar a mesa.');
        return;
      }
      
      setIsSubmitting(false);
      onClose();
    } catch (error: any) {
      setIsSubmitting(false);
      setErrorMsg(error.message || 'Erro ao salvar a mesa. Tente novamente.');
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    await onDelete(mesa.id);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-700">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Editar Mesa {mesa.numero}
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
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
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
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <div className="flex gap-3">
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
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !numero}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
            
            {confirmDelete ? (
              <div className="w-full py-3 px-4 rounded-xl border border-red-500/30 bg-red-500/10 flex flex-col items-center gap-3">
                <span className="text-red-400 font-medium text-sm">Tem certeza que deseja excluir a mesa?</span>
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-3 rounded-lg font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    Não, cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-3 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors"
                  >
                    Sim, excluir
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={isSubmitting || mesa.status !== 'Livre'}
                className="w-full py-3 px-4 rounded-xl font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title={mesa.status !== 'Livre' ? 'Apenas mesas livres podem ser excluídas' : ''}
              >
                <Trash2 size={18} />
                Excluir Mesa
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
