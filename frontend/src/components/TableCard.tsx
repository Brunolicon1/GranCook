import React, { useState, useEffect } from 'react';
import { MesaMock } from '@/services/mockData';
import { Clock, Users, Link, ArrowRightLeft } from 'lucide-react';

interface TableCardProps {
  mesa: MesaMock;
  todasMesas?: MesaMock[];
  onClick?: () => void;
  isGroupingMode?: boolean;
  isSelectedForGrouping?: boolean;
  isTransferMode?: boolean;
  isTransferOrigin?: boolean;
  isEditMode?: boolean;
  onGroupClick?: (e: React.MouseEvent) => void;
  onTransferClick?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export default function TableCard({ mesa, todasMesas, onClick, isGroupingMode, isSelectedForGrouping, isTransferMode, isTransferOrigin, isEditMode, onGroupClick, onTransferClick, onDragStart, onDragOver, onDrop }: TableCardProps) {
  const [tempo, setTempo] = useState<string>('');

  useEffect(() => {
    if (mesa.status === 'Livre' || !mesa.hora_abertura) {
      setTempo('');
      return;
    }

    const calcularTempo = () => {
      const diffMs = Date.now() - mesa.hora_abertura!;
      const diffMinutos = Math.floor(diffMs / 60000);
      const horas = Math.floor(diffMinutos / 60);
      const minutos = diffMinutos % 60;
      setTempo(`${horas}h ${minutos.toString().padStart(2, '0')}m`);
    };

    calcularTempo();
    const interval = setInterval(calcularTempo, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, [mesa.status, mesa.hora_abertura]);

  const getStatusStyles = () => {
    // Se for a origem da transferência, destaca em roxo
    if (isTransferOrigin) {
      return 'border-purple-500 bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-[1.02] ring-2 ring-purple-500';
    }

    // Se estiver selecionada para agrupamento, o estilo azul sobrepõe o status normal
    if (isSelectedForGrouping) {
      return 'border-blue-500 bg-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-[1.02] ring-2 ring-blue-500';
    }

    // Se estivermos em modo de transferência, as mesas livres e ocupadas recebem um leve hover roxo para indicar que são selecionáveis
    const transferHover = isTransferMode ? 'hover:ring-2 hover:ring-purple-400 hover:scale-[1.02]' : '';

    // Modo de edição: borda tracejada e cursor grab
    if (isEditMode) {
      return 'border-dashed border-2 border-slate-500 bg-slate-800/80 hover:bg-slate-700 hover:border-slate-400 opacity-90 hover:opacity-100 shadow-xl cursor-grab active:cursor-grabbing';
    }

    switch (mesa.status) {
      case 'Livre':
        return `border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] ${transferHover}`;
      case 'Ocupada':
        return `border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] ${transferHover}`;
      case 'Aguardando Pagamento':
        return `border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)] ${transferHover}`;
      default:
        return 'border-slate-500/50 bg-slate-500/10';
    }
  };

  const getStatusBadgeStyles = () => {
    switch (mesa.status) {
      case 'Livre':
        return 'bg-emerald-500 text-white';
      case 'Ocupada':
        return 'bg-amber-500 text-white';
      case 'Aguardando Pagamento':
        return 'bg-indigo-500 text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  const mesasNoGrupoRaw = !!mesa.grupo_id && todasMesas
    ? todasMesas.filter(m => m.grupo_id === mesa.grupo_id).map(m => m.numero).filter(n => n !== mesa.numero)
    : [];

  const isAgrupada = mesasNoGrupoRaw.length > 0;
  const mesasNoGrupo = isAgrupada ? mesasNoGrupoRaw : [];

  return (
    <div
      onClick={onClick}
      draggable={isEditMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
      relative flex flex-col justify-between p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 ${!isEditMode && 'cursor-pointer'}
      ${getStatusStyles()}
    `}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-bold text-white tracking-tight">
              {mesa.numero}
            </h3>
            {isAgrupada && (
              <div title={`Unida com Mesa(s): ${mesasNoGrupo.join(', ')}`} className="text-blue-400 bg-blue-500/20 p-1.5 rounded-full border border-blue-500/30">
                <Link size={16} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-slate-300 text-sm mt-1">
            <Users size={14} />
            <span>Capacidade: {mesa.capacidade}</span>
            {mesasNoGrupo.length > 0 && (
              <span className="ml-1 text-blue-400 font-medium text-xs bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                + Mesa {mesasNoGrupo.join(', ')}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusBadgeStyles()}`}>
            {mesa.status}
          </span>
          {!isGroupingMode && !isTransferMode && !isEditMode && (
            <div className="flex gap-2">
              {onTransferClick && mesa.status !== 'Livre' && (
                <button
                  onClick={onTransferClick}
                  className="text-slate-400 hover:text-purple-400 bg-slate-800/50 hover:bg-purple-500/20 p-2 rounded-full border border-slate-700/50 hover:border-purple-500/30 transition-all z-10"
                  title="Transferir Mesa"
                >
                  <ArrowRightLeft size={16} />
                </button>
              )}
              {onGroupClick && (
                <button
                  onClick={onGroupClick}
                  className="text-slate-400 hover:text-blue-400 bg-slate-800/50 hover:bg-blue-500/20 p-2 rounded-full border border-slate-700/50 hover:border-blue-500/30 transition-all z-10"
                  title="Agrupar Mesas"
                >
                  <Link size={16} />
                </button>
              )}
            </div>
          )}
          {isEditMode && (
            <div className="bg-slate-700/50 text-slate-300 text-xs px-2 py-1 rounded-md mt-1 border border-slate-600">
              Arraste ou Clique
            </div>
          )}
          {isGroupingMode && isSelectedForGrouping && (
            <div className="bg-blue-500 text-white rounded-full p-1 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
          )}
          {isTransferMode && isTransferOrigin && (
            <div className="bg-purple-500 text-white rounded-full p-1 shadow-md">
              <ArrowRightLeft size={20} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 mt-2">
        <div className={`flex items-center gap-2 text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50 transition-opacity duration-300 ${mesa.status !== 'Livre' && tempo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <Clock size={16} className="text-amber-400" />
          <span className="text-sm font-medium">Ocupada há {tempo || '0h 00m'}</span>
        </div>
      </div>

      <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
}
