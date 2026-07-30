'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/services/apiClient';
import { TrendingUp, DollarSign, Ban, CreditCard, RefreshCw, ChefHat, ShoppingBag, Calendar as CalendarIcon } from 'lucide-react';
import { API_BASE } from '@/services/apiClient';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { formatCurrency } from '@/utils/formatters';

interface DashboardMetrics {
  faturamento_total: number;
  total_gorjetas: number;
  pagamentos_por_metodo: { forma_pagamento: string; total: number }[];
  top_produtos: { produto__nome: string; quantidade_total: number }[];
  itens_cancelados: { produto__nome: string; quantidade: number; hora_pedido: string; comanda__mesa__numero: number }[];
}

export default function GerentePage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError('');
    try {
      let query = '';
      if (startDate && endDate) {
        const formatD = (d: Date) => {
          const tzOffset = d.getTimezoneOffset() * 60000;
          return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
        };
        query = `?data_inicio=${formatD(startDate)}&data_fim=${formatD(endDate)}`;
      }
      
      const res = await apiFetch(`${API_BASE}/pdv/dashboard/resumo/${query}`);
      if (!res.ok) throw new Error('Erro ao carregar dados');
      const data = await res.json();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Falha na conexão');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 300000);
    return () => clearInterval(interval);
  }, [startDate, endDate]);

  const formatCurrency = (val: number | string) => {
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getPeriodoTitle = () => {
    if (startDate && endDate) {
      const formataBR = (d: Date) => d.toLocaleDateString('pt-BR');
      return `(${formataBR(startDate)} até ${formataBR(endDate)})`;
    }
    return 'de Hoje';
  };

  const limparFiltro = () => {
    setDateRange([null, null]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Resumo {getPeriodoTitle()}</h2>
          <p className="text-slate-400 mt-1">Acompanhamento financeiro em tempo real</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap pb-2 sm:pb-0">
          
          <div className="relative z-50">
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              placeholderText="Filtrar por período..."
              dateFormat="dd/MM/yyyy"
              className="bg-slate-800 text-slate-300 text-sm rounded-xl px-4 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 shadow-md pl-10"
            />
            <CalendarIcon size={16} className="text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {(startDate || endDate) && (
            <button 
              onClick={limparFiltro}
              className="text-xs text-slate-400 hover:text-red-400 font-medium transition-colors ml-1 px-2"
            >
              Limpar
            </button>
          )}
          <button 
            onClick={fetchMetrics} 
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition-colors shadow-md border border-slate-700"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-indigo-400' : ''} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 text-red-400 rounded-xl text-center font-medium animate-in fade-in">
          {error}
        </div>
      )}

      {isLoading && !metrics ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium animate-pulse">Calculando métricas...</p>
        </div>
      ) : metrics ? (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 p-6 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <p className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-1">Faturamento Bruto</p>
                  <h2 className="text-4xl font-black text-white">{formatCurrency(metrics.faturamento_total)}</h2>
                </div>
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center">
                  <TrendingUp size={24} className="text-indigo-400" />
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium relative z-10">Total de vendas pagas no período</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/20 p-6 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-1">Gorjetas Arrecadadas</p>
                  <h2 className="text-4xl font-black text-white">{formatCurrency(metrics.total_gorjetas)}</h2>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <DollarSign size={24} className="text-emerald-400" />
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium relative z-10">10% das mesas</p>
            </div>

            <div className="bg-gradient-to-br from-red-900/40 to-slate-900 border border-red-500/20 p-6 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all"></div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <p className="text-sm font-bold text-red-400 uppercase tracking-wider mb-1">Itens Cancelados</p>
                  <h2 className="text-4xl font-black text-white">{metrics.itens_cancelados.length} <span className="text-lg text-slate-500 font-medium">itens</span></h2>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                  <Ban size={24} className="text-red-400" />
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium relative z-10">Produtos excluídos após envio</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl lg:col-span-1 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard size={18} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Métodos de Pagamento</h3>
              </div>
              
              {metrics.pagamentos_por_metodo.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">Sem pagamentos hoje</div>
              ) : (
                <div className="space-y-5 flex-1">
                  {metrics.pagamentos_por_metodo.map((met, idx) => {
                    const grandTotal = metrics.faturamento_total + metrics.total_gorjetas;
                    const pct = grandTotal > 0 ? (met.total / grandTotal) * 100 : 0;
                    
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-sm font-bold mb-2">
                          <span className="text-slate-300">{met.forma_pagamento}</span>
                          <span className="text-white">{formatCurrency(met.total)}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full relative"
                            style={{ width: `${pct}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl lg:col-span-2 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <ChefHat size={18} className="text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Campeões de Venda</h3>
              </div>

              {metrics.top_produtos.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                  <ShoppingBag size={32} className="opacity-20" />
                  Nenhum produto fechado hoje
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="pb-3 pl-2 font-bold">Produto</th>
                        <th className="pb-3 text-right pr-2 font-bold">Quantidade Vendida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.top_produtos.map((prod, idx) => (
                        <tr key={idx} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                          <td className="py-4 pl-2 text-white font-medium flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-500 text-amber-950' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                              {idx + 1}
                            </span>
                            {prod.produto__nome}
                          </td>
                          <td className="py-4 text-right pr-2 font-black text-amber-400">
                            {prod.quantidade_total} <span className="text-xs text-slate-500 font-medium">un</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Ban size={18} className="text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Auditoria de Cancelamentos</h3>
              </div>
              {metrics.itens_cancelados.length > 0 && (
                <span className="bg-red-500/10 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/20">
                  Últimos 10 registros
                </span>
              )}
            </div>

            {metrics.itens_cancelados.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
                Excelente! Nenhum item foi cancelado hoje.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="pb-3 pl-2 font-bold">Horário (Pedido)</th>
                      <th className="pb-3 font-bold">Mesa</th>
                      <th className="pb-3 font-bold">Produto</th>
                      <th className="pb-3 text-right pr-2 font-bold">Qtd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.itens_cancelados.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-800/50 last:border-0 hover:bg-red-900/10 transition-colors group">
                        <td className="py-4 pl-2 text-slate-400 text-sm">
                          {new Date(item.hora_pedido).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-4">
                          <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-md">
                            Mesa {item.comanda__mesa__numero}
                          </span>
                        </td>
                        <td className="py-4 text-white font-medium group-hover:text-red-300 transition-colors">
                          {item.produto__nome}
                        </td>
                        <td className="py-4 text-right pr-2 font-black text-red-400">
                          {item.quantidade}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
