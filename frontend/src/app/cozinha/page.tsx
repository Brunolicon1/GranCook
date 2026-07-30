'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { ChefHat, LogOut, Clock, CheckCircle, Play } from 'lucide-react';
import { apiFetch, API_BASE } from '@/services/apiClient';
import { ItemComandaMock } from '@/services/mockData';

type KDSTicket = {
  comanda_id: number;
  mesa_id: number;
  hora_pedido: string; // timestamp formatado para agrupar
  tempo_decorrido_minutos: number;
  status: 'Pendente' | 'Em Preparo';
  itens: ItemComandaMock[];
  itensAgrupados: { produto_nome: string; quantidade: number; observacoes?: string }[];
};

export default function CozinhaPage() {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState<KDSTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // O setor logado (por hora forçamos pra Cozinha pra teste, ou pegamos do user.grupos se tivermos)
  // Como simplificação, se o user logar como Copa, passamos setor=Copa. 
  // No banco temos os grupos "Cozinha", "Copa".
  const setor = user?.grupos?.includes('Copa') ? 'Copa' : 'Cozinha';

  const previousTicketCount = React.useRef(0);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_BASE}/pdv/kds/tickets/?setor=${setor}`);
      if (res.ok) {
        const data = await res.json();
        
        // Agrupar os itens por comanda_id e hora_pedido
        const agrupados = data.reduce((acc: any, item: any) => {
          const key = `${item.comanda}-${item.hora_pedido}`;
          if (!acc[key]) {
            acc[key] = {
              comanda_id: item.comanda,
              mesa_id: item.mesa_id,
              hora_pedido: item.hora_pedido,
              status: item.status, // consideramos o status do primeiro item (normalmente todos mudam juntos)
              itens: [],
              _agrupamentoVisual: {}
            };
          }
          acc[key].itens.push(item);
          
          const agKey = `${item.produto}-${item.observacoes || ''}`;
          if (!acc[key]._agrupamentoVisual[agKey]) {
            acc[key]._agrupamentoVisual[agKey] = {
              produto_nome: item.produto_nome,
              quantidade: 0,
              observacoes: item.observacoes
            };
          }
          acc[key]._agrupamentoVisual[agKey].quantidade += Number(item.quantidade);

          return acc;
        }, {});

        // Calcular tempo decorrido
        const agora = new Date().getTime();
        const parseBrazilianDate = (dateStr: string) => {
          if (!dateStr) return 0;
          try {
            const [datePart, timePart] = dateStr.split(' ');
            const [day, month, year] = datePart.split('/');
            const [hour, minute] = timePart.split(':');
            return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
          } catch (e) {
            return 0;
          }
        };

        const ticketsFormatados = Object.values(agrupados).map((t: any) => {
          const pedidoMs = parseBrazilianDate(t.hora_pedido);
          const diffMinutos = Math.floor((agora - pedidoMs) / 60000);
          return {
            ...t,
            itensAgrupados: Object.values(t._agrupamentoVisual),
            tempo_decorrido_minutos: diffMinutos > 0 ? diffMinutos : 0
          };
        }) as KDSTicket[];

        // Ordenar por mais antigo
        ticketsFormatados.sort((a, b) => b.tempo_decorrido_minutos - a.tempo_decorrido_minutos);
        
        // Tocar som se tiver ticket novo
        const novosTicketsAtivos = ticketsFormatados.filter(t => t.status === 'Pendente' || t.status === 'Em Preparo').length;
        if (novosTicketsAtivos > previousTicketCount.current && previousTicketCount.current > 0) {
          try {
            const audio = new Audio('/notification.mp3');
            // Como não temos arquivo físico aqui, criamos um bip usando AudioContext
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
            osc.stop(ctx.currentTime + 0.5);
          } catch (e) {
            console.error("Erro ao tocar som", e);
          }
        }
        previousTicketCount.current = novosTicketsAtivos;

        setTickets(ticketsFormatados);
      }
    } catch (error) {
      console.error("Erro ao buscar tickets KDS", error);
    } finally {
      setIsLoading(false);
    }
  }, [setor]);

  // Polling a cada 5 segundos
  useEffect(() => {
    fetchTickets();
    const intervalId = setInterval(fetchTickets, 5000);
    return () => clearInterval(intervalId);
  }, [fetchTickets]);

  const atualizarTicket = async (ticket: KDSTicket, novoStatus: string) => {
    // Para atualizar o ticket inteiro, mandamos os ids de todos os itens daquele ticket
    const itemIds = ticket.itens.map(i => i.id);
    try {
      await apiFetch(`${API_BASE}/pdv/kds/atualizar_ticket/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: itemIds, status: novoStatus })
      });
      // Atualiza imediatamente local
      fetchTickets();
    } catch (error) {
      console.error("Erro ao atualizar ticket", error);
    }
  };

  const getCardStyles = (minutos: number) => {
    if (minutos >= 25) {
      return 'border-red-500/50 bg-red-500/10 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)] ring-1 ring-red-500/50';
    }
    if (minutos >= 15) {
      return 'border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]';
    }
    return 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]';
  };

  const ticketsAtivos = tickets.filter(t => t.status === 'Pendente' || t.status === 'Em Preparo');

  return (
    <AuthGuard allowedRoles={['Cozinha', 'Gerente']}>
      <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col h-screen overflow-hidden">
        {/* Header KDS */}
        <header className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <ChefHat size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">KDS - {setor}</h1>
              <p className="text-slate-400 text-sm font-medium">Logado como: <span className="text-white">{user?.username}</span></p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors font-semibold"
          >
            <LogOut size={18} />
            Sair
          </button>
        </header>

        {/* Kanban Board Unificado */}
        <div className="flex-1 bg-slate-900/50 rounded-2xl p-6 flex flex-col border border-slate-800 min-h-0">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
              Fila de Preparo
            </h2>
            <span className="bg-slate-800 px-3 py-1 rounded-full text-sm font-bold">{ticketsAtivos.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
            {isLoading && tickets.length === 0 && <p className="text-slate-500 text-center py-10">Carregando...</p>}
            {!isLoading && ticketsAtivos.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-600 font-medium border-2 border-dashed border-slate-800 rounded-xl">
                Nenhum pedido na fila
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ticketsAtivos.map(ticket => (
                <div key={`${ticket.comanda_id}-${ticket.hora_pedido}`} className={`relative flex flex-col justify-between p-5 rounded-2xl border backdrop-blur-md transition-all duration-300 ${getCardStyles(ticket.tempo_decorrido_minutos)}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-3xl font-bold text-white tracking-tight">Mesa {ticket.mesa_id}</h3>
                    <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/50 px-3 py-1.5 rounded-lg font-mono font-bold text-lg border border-slate-700/50">
                      <Clock size={18} className={ticket.tempo_decorrido_minutos >= 25 ? 'text-red-500' : 'text-slate-400'} />
                      {ticket.tempo_decorrido_minutos} min
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700 max-h-[350px]">
                    {ticket.itensAgrupados.map((item, idx) => (
                      <div key={idx} className="flex flex-col border-b border-slate-700/50 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <span className="font-black text-xl text-orange-400 min-w-[32px]">{item.quantidade}x</span>
                          <span className="font-bold text-xl leading-tight text-slate-100">{item.produto_nome}</span>
                        </div>
                        {item.observacoes && (
                          <div className="ml-10 mt-2 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-lg">
                            <span className="text-red-400 text-base font-black uppercase tracking-wider flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                              {item.observacoes}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => atualizarTicket(ticket, 'Pronto')}
                    className="w-full py-4 mt-auto bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-[0_0_15px_rgba(37,99,235,0.4)] z-10 relative"
                  >
                    <CheckCircle size={24} />
                    Pedido Pronto
                  </button>

                  <div className="absolute inset-0 bg-white/5 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
