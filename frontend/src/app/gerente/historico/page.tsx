'use client';

import { useState, useEffect } from 'react';
import { apiFetch, API_BASE } from '@/services/apiClient';
import { Search, ReceiptText, ChevronLeft, ChevronRight, Calendar, DollarSign, X } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Comanda[];
}

interface ItemComanda {
  id: number;
  produto_nome: string;
  produto_setor: string;
  quantidade: number;
  preco_unitario: string;
  status: string;
  hora_pedido: string;
  entregar_junto_com_prato: boolean;
}

interface Pagamento {
  id: number;
  forma_pagamento: string;
  valor: string;
  data_hora: string;
}

interface Comanda {
  id: number;
  mesa: number | null;
  status: string;
  data_abertura: string;
  data_fechamento: string | null;
  taxa_servico: string;
  desconto: string;
  itens: ItemComanda[];
  pagamentos: Pagamento[];
}

export default function HistoricoVendasPage() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageUrl, setPageUrl] = useState(`${API_BASE}/pdv/comandas/historico/`);
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);

  const fetchHistorico = async (url: string) => {
    setIsLoading(true);
    try {
      const res = await apiFetch(url);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorico(pageUrl);
  }, [pageUrl]);

  const calcularTotal = (comanda: Comanda) => {
    return comanda.pagamentos.reduce((acc, p) => acc + Number(p.valor), 0);
  };

  const handleNextPage = () => {
    if (data?.next) setPageUrl(data.next);
  };

  const handlePrevPage = () => {
    if (data?.previous) setPageUrl(data.previous);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ReceiptText className="text-indigo-400" />
            Histórico de Vendas
          </h2>
          <p className="text-slate-400 mt-1">Auditoria de comandas fechadas e canceladas</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800/50 sticky top-0 z-10 backdrop-blur-sm">
              <tr className="text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-4 pl-6 font-bold">Comanda ID</th>
                <th className="py-4 px-4 font-bold">Origem</th>
                <th className="py-4 px-4 font-bold">Abertura / Fechamento</th>
                <th className="py-4 px-4 font-bold text-center">Status</th>
                <th className="py-4 pr-6 font-bold text-right">Valor Total Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                    Carregando histórico...
                  </td>
                </tr>
              ) : data?.results.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Nenhuma comanda encontrada no histórico.
                  </td>
                </tr>
              ) : (
                data?.results.map((comanda) => (
                  <tr 
                    key={comanda.id} 
                    onClick={() => setSelectedComanda(comanda)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 pl-6 text-white font-black">
                      #{comanda.id}
                    </td>
                    <td className="py-4 px-4">
                      {comanda.mesa ? (
                        <span className="bg-slate-800 text-white text-xs font-bold px-2.5 py-1 rounded-md border border-slate-700">
                          Mesa {comanda.mesa}
                        </span>
                      ) : (
                        <span className="bg-slate-800/50 text-slate-400 text-xs font-bold px-2.5 py-1 rounded-md border border-slate-700/50">
                          Avulsa
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-slate-300">
                        {comanda.data_abertura}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Até: {comanda.data_fechamento || '--/--/---- --:--'}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        comanda.status === 'Fechada' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        comanda.status === 'Cancelada' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {comanda.status}
                      </span>
                    </td>
                    <td className="py-4 pr-6 text-right font-black text-indigo-400 group-hover:text-indigo-300 transition-colors">
                      {formatCurrency(calcularTotal(comanda))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="bg-slate-800/30 border-t border-slate-800 p-4 flex items-center justify-between text-sm">
          <span className="text-slate-400 font-medium">
            Total de Registros: <strong className="text-white">{data?.count || 0}</strong>
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handlePrevPage}
              disabled={!data?.previous}
              className="flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors border border-slate-700"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <button 
              onClick={handleNextPage}
              disabled={!data?.next}
              className="flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors border border-slate-700"
            >
              Próxima <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Recibo Modal */}
      {selectedComanda && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Detalhes da Comanda #{selectedComanda.id}
                </h3>
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-4">
                  <span>Mesa: {selectedComanda.mesa || 'Avulsa'}</span>
                  <span>Fechamento: {selectedComanda.data_fechamento}</span>
                </p>
              </div>
              <button onClick={() => setSelectedComanda(null)} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-xl">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              
              {/* Itens Consumidos */}
              <div>
                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Itens Consumidos</h4>
                <div className="space-y-3">
                  {selectedComanda.itens.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-500">{item.quantidade}x</span>
                        <span className={`font-medium ${item.status === 'Cancelada' ? 'text-red-400 line-through' : 'text-white'}`}>
                          {item.produto_nome}
                        </span>
                        {item.status === 'Cancelada' && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase">Cancelado</span>
                        )}
                      </div>
                      <span className="text-slate-300 font-medium">{formatCurrency(item.preco_unitario)}</span>
                    </div>
                  ))}
                  {selectedComanda.itens.length === 0 && (
                    <p className="text-slate-500 text-sm">Nenhum item registrado.</p>
                  )}
                </div>
              </div>

              {/* Pagamentos */}
              <div>
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Extrato de Pagamentos</h4>
                <div className="space-y-3">
                  {selectedComanda.pagamentos.map((pag, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm bg-slate-800/30 p-3 rounded-xl border border-slate-800/50">
                      <div className="flex items-center gap-3">
                        <DollarSign size={16} className="text-emerald-500" />
                        <div>
                          <p className="font-bold text-white">{pag.forma_pagamento}</p>
                          <p className="text-xs text-slate-500">{pag.data_hora}</p>
                        </div>
                      </div>
                      <span className="text-emerald-400 font-black text-lg">{formatCurrency(pag.valor)}</span>
                    </div>
                  ))}
                  {selectedComanda.pagamentos.length === 0 && (
                    <p className="text-slate-500 text-sm">Nenhum pagamento registrado.</p>
                  )}
                </div>
              </div>

              {/* Resumo */}
              <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-2xl">
                <div className="flex justify-between text-sm mb-2 text-slate-400">
                  <span>Gorjeta / Serviço</span>
                  <span>{formatCurrency(selectedComanda.taxa_servico)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2 text-slate-400">
                  <span>Descontos</span>
                  <span className="text-red-400">-{formatCurrency(selectedComanda.desconto)}</span>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-indigo-500/20">
                  <span className="font-bold text-white">Total Pago</span>
                  <span className="text-2xl font-black text-indigo-400">{formatCurrency(calcularTotal(selectedComanda))}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
