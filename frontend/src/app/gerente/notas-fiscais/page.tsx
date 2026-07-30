'use client';

import React, { useState } from 'react';
import { FileText, Search, Filter, CheckCircle, Clock, AlertTriangle, Download, Send } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

// Mocks para demonstração visual
const notasMock = [
  { id: '1001', mesa: 5, data: '2026-07-30T13:45:00', valor: 250.50, status: 'emitida', chave: '3523...1234' },
  { id: '1002', mesa: 2, data: '2026-07-30T14:10:00', valor: 89.90, status: 'pendente', chave: '' },
  { id: '1003', mesa: 12, data: '2026-07-30T14:30:00', valor: 312.00, status: 'erro', chave: '' },
  { id: '1004', mesa: 8, data: '2026-07-30T15:05:00', valor: 45.00, status: 'emitida', chave: '3523...5678' },
  { id: '1005', mesa: 1, data: '2026-07-30T15:20:00', valor: 120.00, status: 'pendente', chave: '' },
];

export default function NotasFiscaisPage() {
  const [searchTerm, setSearchTerm] = useState('');

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
          <p className="text-slate-400 mt-2">Gerencie e emita cupons fiscais para as comandas fechadas.</p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-emerald-500/10 group-hover:scale-110 transition-transform">
            <CheckCircle size={100} />
          </div>
          <p className="text-slate-400 font-medium mb-1">Notas Emitidas (Hoje)</p>
          <p className="text-3xl font-black text-white">24</p>
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-bold">
            <span className="bg-emerald-500/20 px-2 py-0.5 rounded-md">+12%</span> desde ontem
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-amber-500/10 group-hover:scale-110 transition-transform">
            <Clock size={100} />
          </div>
          <p className="text-slate-400 font-medium mb-1">Aguardando Emissão</p>
          <p className="text-3xl font-black text-white">8</p>
          <div className="mt-4 flex items-center gap-2 text-amber-400 text-sm font-bold">
            Comandas recém fechadas
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-red-500/10 group-hover:scale-110 transition-transform">
            <AlertTriangle size={100} />
          </div>
          <p className="text-slate-400 font-medium mb-1">Erros na Sefaz</p>
          <p className="text-3xl font-black text-white">1</p>
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm font-bold">
            Requer atenção imediata
          </div>
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
            placeholder="Buscar por Nº da Comanda ou Mesa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-700 transition-colors flex-1 md:flex-none justify-center">
            <Filter size={18} /> Filtrar
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto bg-slate-900/50 border-x border-b border-slate-800 rounded-b-2xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/50 text-slate-400 uppercase font-bold text-xs">
            <tr>
              <th className="px-6 py-4">ID Conta</th>
              <th className="px-6 py-4">Mesa</th>
              <th className="px-6 py-4">Data/Hora Fechamento</th>
              <th className="px-6 py-4">Valor Total</th>
              <th className="px-6 py-4">Status Sefaz</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {notasMock.map((nota) => (
              <tr key={nota.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-slate-200">#{nota.id}</td>
                <td className="px-6 py-4">
                  <span className="bg-slate-800 px-3 py-1 rounded-lg font-bold text-white">Mesa {nota.mesa}</span>
                </td>
                <td className="px-6 py-4 text-slate-400">{new Date(nota.data).toLocaleString('pt-BR')}</td>
                <td className="px-6 py-4 font-bold text-emerald-400">{formatCurrency(nota.valor)}</td>
                <td className="px-6 py-4">
                  {nota.status === 'emitida' && <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider"><CheckCircle size={14} /> Emitida</span>}
                  {nota.status === 'pendente' && <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider"><Clock size={14} /> Pendente</span>}
                  {nota.status === 'erro' && <span className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider"><AlertTriangle size={14} /> Erro</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  {nota.status === 'emitida' ? (
                    <button className="text-indigo-400 hover:text-indigo-300 font-bold text-sm flex items-center justify-end gap-1.5 ml-auto transition-colors">
                      <Download size={16} /> Baixar PDF
                    </button>
                  ) : (
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-4 rounded-lg text-sm flex items-center justify-end gap-1.5 ml-auto transition-colors shadow-lg shadow-indigo-500/20">
                      <Send size={16} /> Emitir Agora
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
