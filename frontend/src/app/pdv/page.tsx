"use client";

import TableCard from '@/components/TableCard';
import TableDrawer from '@/components/TableDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import NovaMesaModal from '@/components/NovaMesaModal';
import EditarMesaModal from '@/components/EditarMesaModal';
import { Search, ArrowRightLeft, Plus, Settings2 } from 'lucide-react';
import { usePDV } from '@/hooks/usePDV';
import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';

export default function PDVPage() {
  const pdv = usePDV();
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [mesaParaEditarId, setMesaParaEditarId] = useState<number | null>(null);

  const handleDrop = (e: React.DragEvent, dropMesaId: number | 'end') => {
    e.preventDefault();
    if (!draggedId || draggedId === dropMesaId) return;

    const newOrder = [...pdv.mesas];
    const draggedIndex = newOrder.findIndex(m => m.id === draggedId);
    if (draggedIndex === -1) return;

    const [draggedItem] = newOrder.splice(draggedIndex, 1);

    if (dropMesaId === 'end') {
      newOrder.push(draggedItem);
    } else {
      const dropIndex = newOrder.findIndex(m => m.id === dropMesaId);
      if (dropIndex !== -1) {
        newOrder.splice(dropIndex, 0, draggedItem);
      } else {
        return;
      }
    }

    pdv.handleReorderMesas(newOrder.map(m => m.id));
    setDraggedId(null);
  };

  return (
    <AuthGuard allowedRoles={['Garçom', 'Gerente']}>
      <div className="h-full flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Mapa de Mesas</h1>
          <p className="text-slate-400 mt-1">Salão Principal</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar mesa..."
              value={pdv.searchTerm}
              onChange={(e) => pdv.setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/50 backdrop-blur-md border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:bg-slate-800 transition-all shadow-inner placeholder-slate-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => pdv.setIsEditMode(!pdv.isEditMode)}
              className={`px-4 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 border ${pdv.isEditMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            >
              <Settings2 size={20} />
              <span className="hidden sm:inline">{pdv.isEditMode ? 'Concluir Edição' : 'Editar Salão'}</span>
            </button>


            {!pdv.isEditMode && (
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                + Nova Comanda
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 content-start pb-24">
        {pdv.mesasFiltradas.length > 0 ? (
          pdv.mesasFiltradas.map(mesa => (
            <TableCard
              key={mesa.id}
              mesa={mesa}
              todasMesas={pdv.mesas}
              onClick={() => {
                if (pdv.isEditMode) {
                  setMesaParaEditarId(mesa.id);
                } else {
                  pdv.handleCardClick(mesa.id);
                }
              }}
              isGroupingMode={pdv.groupingOriginId !== null}
              isSelectedForGrouping={mesa.id === pdv.groupingOriginId || pdv.groupingSelectedIds.includes(mesa.id)}
              isTransferMode={pdv.transferOriginId !== null}
              isTransferOrigin={mesa.id === pdv.transferOriginId}
              isEditMode={pdv.isEditMode}
              onDragStart={(e) => {
                setDraggedId(mesa.id);
                // e.dataTransfer.setData is required for HTML5 drag and drop to work in Firefox
                e.dataTransfer.setData('text/plain', mesa.id.toString());
              }}
              onDragOver={(e) => {
                if (pdv.isEditMode) {
                  e.preventDefault();
                }
              }}
              onDrop={(e) => {
                if (pdv.isEditMode) {
                  handleDrop(e, mesa.id);
                }
              }}
              onGroupClick={(e) => {
                e.stopPropagation();
                pdv.handleGroupClick(mesa.id);
              }}
              onTransferClick={(e) => {
                e.stopPropagation();
                pdv.setTransferOriginId(mesa.id);
              }}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-700 rounded-2xl">
            <p className="text-slate-400 text-lg">Nenhuma mesa encontrada com esse número.</p>
          </div>
        )}

        {pdv.isEditMode && !pdv.searchTerm && (
          <div
            onClick={() => pdv.setIsNovaMesaModalOpen(true)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, 'end')}
            className="border-2 border-dashed border-slate-600/50 rounded-2xl flex flex-col items-center justify-center min-h-[160px] bg-slate-800/20 text-slate-500 hover:border-slate-400 hover:text-slate-300 transition-colors cursor-pointer group"
          >
            <Plus size={32} className="mb-2 opacity-50 group-hover:text-emerald-500 group-hover:opacity-100 transition-colors" />
            <span className="font-semibold text-sm group-hover:text-emerald-500 transition-colors">Nova Mesa</span>
            {pdv.mesas.length > 0 && (
              <span className="text-xs text-slate-500 mt-1 opacity-60">ou arraste para o fim</span>
            )}
          </div>
        )}
      </div>

      <TableDrawer
        mesa={pdv.mesaSelecionada}
        mesas={pdv.mesas}
        produtos={pdv.produtos}
        itens={pdv.itensComanda}
        pagamentosParciais={pdv.pagamentosParciais}
        onClose={() => pdv.setMesaSelecionadaId(null)}
        onAdicionarItens={pdv.handleAdicionarItens}
        onCancelarItem={pdv.handleCancelarItem}
        onCancelarItensMassa={pdv.handleCancelarItensMassa}
        onCheckoutClick={() => pdv.setIsCheckoutModalOpen(true)}
      />

      <CheckoutModal
        isOpen={pdv.isCheckoutModalOpen}
        mesa={pdv.mesaSelecionada}
        mesas={pdv.mesas}
        itens={pdv.itensComanda}
        pagamentosPrevios={pdv.pagamentosParciais}
        onClose={() => pdv.setIsCheckoutModalOpen(false)}
        onFinalizar={pdv.handleFinalizarPagamento}
        onSalvarParcial={pdv.handleSalvarPagamentoParcial}
        onEstornar={pdv.handleEstornarPagamento}
      />

      <NovaMesaModal
        isOpen={pdv.isNovaMesaModalOpen}
        onClose={() => pdv.setIsNovaMesaModalOpen(false)}
        onSubmit={pdv.handleAddMesa}
      />

      <EditarMesaModal
        isOpen={mesaParaEditarId !== null}
        mesa={pdv.mesas.find(m => m.id === mesaParaEditarId) || null}
        onClose={() => setMesaParaEditarId(null)}
        onUpdate={pdv.handleUpdateMesa}
        onDelete={pdv.handleDeleteMesa}
      />

      {/* Floating Bottom Bar for Transfer */}
      {pdv.transferOriginId !== null && (
        <div className="fixed bottom-0 left-0 right-0 bg-purple-600 shadow-[0_-10px_30px_rgba(168,85,247,0.3)] z-40 transform transition-transform duration-300">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-white">
              <h3 className="font-bold text-lg">Modo Transferência</h3>
              <p className="text-purple-100 text-sm">
                Selecione no mapa a mesa de <span className="font-bold text-white">DESTINO</span> para a <span className="font-bold text-white">Mesa {pdv.mesas.find(m => m.id === pdv.transferOriginId)?.numero}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => pdv.setTransferOriginId(null)}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-purple-100 bg-purple-700 hover:bg-purple-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Transfer Modal */}
      {pdv.transferDestinationId !== null && pdv.transferOriginId !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-700 p-6">
            {pdv.mesas.find(m => m.id === pdv.transferDestinationId)?.status !== 'Livre' ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                  <ArrowRightLeft size={32} />
                </div>
                <h3 className="text-2xl font-bold text-red-500 mb-2">UNIR COMANDAS</h3>
                <p className="text-slate-300 mb-6">
                  A <strong>Mesa {pdv.mesas.find(m => m.id === pdv.transferDestinationId)?.numero}</strong> já está ocupada. Deseja transferir todos os itens da <strong>Mesa {pdv.mesas.find(m => m.id === pdv.transferOriginId)?.numero}</strong> para ela, somando as contas?
                </p>
                <div className="flex gap-3">
                  <button onClick={() => pdv.setTransferDestinationId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors">Cancelar</button>
                  <button onClick={() => pdv.handleTransferirMesa(pdv.transferDestinationId!)} className="flex-1 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]">Sim, Unir Contas</button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                  <ArrowRightLeft size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Transferir Mesa</h3>
                <p className="text-slate-300 mb-6">
                  Deseja transferir a <strong>Mesa {pdv.mesas.find(m => m.id === pdv.transferOriginId)?.numero}</strong> para a <strong>Mesa {pdv.mesas.find(m => m.id === pdv.transferDestinationId)?.numero}</strong>?
                </p>
                <div className="flex gap-3">
                  <button onClick={() => pdv.setTransferDestinationId(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors">Cancelar</button>
                  <button onClick={() => pdv.handleTransferirMesa(pdv.transferDestinationId!)} className="flex-1 py-3 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)]">Confirmar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {pdv.groupingOriginId !== null && (
        <div className="fixed bottom-0 left-0 right-0 bg-blue-600 shadow-[0_-10px_30px_rgba(37,99,235,0.3)] z-40 transform transition-transform duration-300">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-white">
              <h3 className="font-bold text-lg">
                {pdv.mesas.find(m => m.id === pdv.groupingOriginId)?.grupo_id ? 'Editar Agrupamento' : 'Novo Agrupamento'}
              </h3>
              <p className="text-blue-100 text-sm">
                Selecione as mesas para adicionar ou remover do grupo da <span className="font-bold text-white">Mesa {pdv.mesas.find(m => m.id === pdv.groupingOriginId)?.numero}</span>
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  pdv.setGroupingOriginId(null);
                  pdv.setGroupingSelectedIds([]);
                }}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-blue-100 bg-blue-700 hover:bg-blue-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={pdv.handleConfirmarAgrupamento}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold bg-white text-blue-600 hover:bg-blue-50 transition-all shadow-md"
              >
                {pdv.groupingSelectedIds.length === 0 && pdv.mesas.find(m => m.id === pdv.groupingOriginId)?.grupo_id ? 'Desagrupar Tudo' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
