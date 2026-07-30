'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, CheckCircle, Clock, AlertTriangle, Download, Send, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { API_BASE } from '@/services/apiClient';

interface NotaFiscal {
  id: number;
  comanda: number;
  status: string;
  chave_acesso: string | null;
  caminho_xml: string | null;
  caminho_pdf: string | null;
  mensagem_sefaz: string | null;
  mesa_id: number;
  mesa_numero: number;
  valor_total: number;
  data: string;
}

export default function NotasFiscaisPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [loading, setLoading] = useState(true);
  const [emittingId, setEmittingId] = useState<number | null>(null);

  const fetchNotas = async () => {
    try {
      const res = await fetch(`${API_BASE}/notas-fiscais/`);
      if (res.ok) {
        const data = await res.json();
        setNotas(data);
      }
    } catch (error) {
      console.error('Erro ao buscar notas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotas();
  }, []);

  const emitirNota = async (comandaId: number) => {
    setEmittingId(comandaId);
    try {
      const res = await fetch(`${API_BASE}/notas-fiscais/emitir/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comanda_id: comandaId })
      });
      
      const result = await res.json();
      if (!res.ok) {
        alert(`Erro Sefaz: ${result.mensagem}`);
      } else {
        alert('Nota fiscal processada com sucesso!');
      }
      
      // Atualizar lista após tentar emitir
      await fetchNotas();
    } catch (error) {
      console.error('Erro ao emitir:', error);
      alert('Erro de comunicação com o servidor.');
    } finally {
      setEmittingId(null);
    }
  };

  const filteredNotas = notas.filter(n => {
    const term = searchTerm.toLowerCase();
    return (
      n.comanda.toString().includes(term) ||
      (n.mesa_numero && n.mesa_numero.toString().includes(term)) ||
      (n.chave_acesso && n.chave_acesso.toLowerCase().includes(term))
    );
  });

  const notasEmitidasHoje = notas.filter(n => n.status === 'emitida' && new Date(n.data).toDateString() === new Date().toDateString()).length;
  const notasPendentes = notas.filter(n => n.status === 'pendente' || n.status === 'processando').length;
  const notasComErro = notas.filter(n => n.status === 'erro' || n.status === 'rejeitada').length;

  return (
    <div className="p-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FileText size={24} className="text-white" />
            </div>
            Notas Fiscais (NFC-e)
          </h1>
          <p className="text-slate-400 mt-2">Gerencie e emita cupons fiscais para as comandas fechadas via Focus NFe.</p>
        </div>
        
        <button 
          onClick={fetchNotas}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-colors"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Atualizar
        </button>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-emerald-500/10 group-hover:scale-110 transition-transform">
            <CheckCircle size={100} />
          </div>
          <p className="text-slate-400 font-medium mb-1">Notas Emitidas (Hoje)</p>
          <p className="text-3xl font-black text-white">{notasEmitidasHoje}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-amber-500/10 group-hover:scale-110 transition-transform">
            <Clock size={100} />
          </div>
          <p className="text-slate-400 font-medium mb-1">Aguardando Emissão</p>
          <p className="text-3xl font-black text-white">{notasPendentes}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-red-500/10 group-hover:scale-110 transition-transform">
            <AlertTriangle size={100} />
          </div>
          <p className="text-slate-400 font-medium mb-1">Erros na Sefaz</p>
          <p className="text-3xl font-black text-white">{notasComErro}</p>
        </div>
      </div>

      {/* Controles da Tabela */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-t-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            placeholder="Buscar por Nº da Comanda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto bg-slate-900/50 border-x border-b border-slate-800 rounded-b-2xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/50 text-slate-400 uppercase font-bold text-xs">
            <tr>
              <th className="px-6 py-4">Comanda</th>
              <th className="px-6 py-4">Mesa</th>
              <th className="px-6 py-4">Data/Hora</th>
              <th className="px-6 py-4">Valor Total</th>
              <th className="px-6 py-4">Status Sefaz</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading && notas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                  Carregando notas fiscais...
                </td>
              </tr>
            ) : filteredNotas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Nenhuma nota fiscal encontrada.
                </td>
              </tr>
            ) : filteredNotas.map((nota) => (
              <tr key={nota.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-slate-200">#{nota.comanda}</td>
                <td className="px-6 py-4">
                  {nota.mesa_numero ? (
                    <span className="bg-slate-800 px-3 py-1 rounded-lg font-bold text-white">Mesa {nota.mesa_numero}</span>
                  ) : (
                    <span className="text-slate-500 font-bold">Avulso</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-400">{new Date(nota.data).toLocaleString('pt-BR')}</td>
                <td className="px-6 py-4 font-bold text-emerald-400">{formatCurrency(nota.valor_total)}</td>
                <td className="px-6 py-4">
                  {nota.status === 'emitida' && <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider" title={nota.mensagem_sefaz || ''}><CheckCircle size={14} /> Emitida</span>}
                  {nota.status === 'pendente' && <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider"><Clock size={14} /> Pendente</span>}
                  {(nota.status === 'erro' || nota.status === 'rejeitada') && <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider" title={nota.mensagem_sefaz || ''}><AlertTriangle size={14} /> Erro</span>}
                  {nota.status === 'processando' && <span className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider"><RefreshCw size={14} className="animate-spin" /> Processando</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  {nota.status === 'emitida' && nota.caminho_pdf ? (
                    <a href={nota.caminho_pdf} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 font-bold text-sm flex items-center justify-end gap-1.5 ml-auto transition-colors">
                      <Download size={16} /> Baixar PDF
                    </a>
                  ) : (nota.status === 'pendente' || nota.status === 'erro' || nota.status === 'rejeitada') ? (
                    <button 
                      onClick={() => emitirNota(nota.comanda)}
                      disabled={emittingId === nota.comanda}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-4 rounded-lg text-sm flex items-center justify-end gap-1.5 ml-auto transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                      {emittingId === nota.comanda ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                      {emittingId === nota.comanda ? 'Emitindo...' : 'Emitir Agora'}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
