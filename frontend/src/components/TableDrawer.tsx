import React, { useState, useRef, useEffect } from 'react';
import { MesaMock, ProdutoMock, ItemComandaMock, PagamentoMock } from '@/services/mockData';
import { X, Search, Plus, Send, Wallet, ShoppingBag, Receipt, CheckCircle2, Trash2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import { formatCurrency } from '@/utils/formatters';

interface TableDrawerProps {
  mesa: MesaMock | null;
  mesas?: MesaMock[];
  produtos: ProdutoMock[];
  itens: ItemComandaMock[];
  onClose: () => void;
  onAdicionarItens: (itens: Omit<ItemComandaMock, 'id' | 'horario_pedido'>[]) => Promise<{ success: boolean, error?: string }> | void;
  onCancelarItem?: (id: number) => Promise<{ success: boolean, error?: string }>;
  onCancelarItensMassa?: (ids: number[]) => Promise<{ success: boolean, error?: string }>;
  onCheckoutClick?: () => void;
  pagamentosParciais?: PagamentoMock[];
}

export default function TableDrawer({ mesa, mesas = [], produtos = [], itens, pagamentosParciais = [], onClose, onAdicionarItens, onCancelarItem, onCancelarItensMassa, onCheckoutClick }: TableDrawerProps) {
  const [activeTab, setActiveTab] = useState<'lancamento' | 'conta'>('lancamento');

  // Lançamento states
  const [buscaProduto, setBuscaProduto] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoMock | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [itensParaEnviar, setItensParaEnviar] = useState<Omit<ItemComandaMock, 'id' | 'horario_pedido'>[]>([]);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [itemParaCancelar, setItemParaCancelar] = useState<number | null>(null);
  const [alertConfig, setAlertConfig] = useState({ isOpen: false, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastConfig, setToastConfig] = useState<{ isOpen: boolean, type: 'success' | 'error', message: string }>({ isOpen: false, type: 'success', message: '' });

  // Bulk Delete States
  const [isCancelMode, setIsCancelMode] = useState(false);
  const [idsParaCancelar, setIdsParaCancelar] = useState<number[]>([]);
  const [isConfirmMassaOpen, setIsConfirmMassaOpen] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantidadeInputRef = useRef<HTMLInputElement>(null);
  const observacaoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mesa && activeTab === 'lancamento') {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [mesa?.id, activeTab]);

  // Limpar os estados toda vez que a mesa mudar
  useEffect(() => {
    if (mesa?.id) {
      setBuscaProduto('');
      setQuantidade(1);
      setObservacao('');
      setProdutoSelecionado(null);
      setFocusedIndex(-1);
      setItensParaEnviar([]);
      setActiveTab('lancamento');
      setToastConfig(prev => ({ ...prev, isOpen: false }));
    } else {
      setToastConfig(prev => ({ ...prev, isOpen: false }));
    }
  }, [mesa?.id]);

  const handleClose = () => {
    if (itensParaEnviar.length > 0) {
      setIsConfirmCloseOpen(true);
      return;
    }
    onClose();
  };

  if (!mesa) return null;

  // Calculos Comuns
  const isAgrupada = !!mesa.grupo_id;
  const mesasDoGrupo = isAgrupada ? mesas.filter(m => m.grupo_id === mesa.grupo_id) : [mesa];
  const idsDoGrupo = mesasDoGrupo.map(m => m.id);

  // Produtos que já estão na conta (enviados pro backend)
  const itensDaMesa = itens.filter(item => idsDoGrupo.includes(item.mesa_id));

  // Agrupamento visual de itens idênticos
  const groupedItensDaMesa = Object.values(itensDaMesa.reduce((acc, item) => {
    const key = `${item.produto_id}-${item.observacoes || ''}`;
    if (!acc[key]) {
      acc[key] = { ...item, quantidade: Number(item.quantidade), ids: [item.id] };
    } else {
      acc[key].quantidade += Number(item.quantidade);
      acc[key].ids.push(item.id);
    }
    return acc;
  }, {} as Record<string, typeof itens[0] & { ids: number[] }>));

  // Produtos filtrados na barra de pesquisa (priorizando os que começam com o termo)
  const produtosFiltrados = !produtoSelecionado && buscaProduto.length > 0
    ? [...produtos]
      .filter(p => p.nome.toLowerCase().includes(buscaProduto.toLowerCase()))
      .sort((a, b) => {
        const search = buscaProduto.toLowerCase();
        const aStarts = a.nome.toLowerCase().startsWith(search);
        const bStarts = b.nome.toLowerCase().startsWith(search);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.nome.localeCompare(b.nome);
      })
    : [];

  // Lógica de Lançamento
  const handleAdicionarAoCarrinho = () => {
    if (!produtoSelecionado) {
      setAlertConfig({ isOpen: true, message: 'Selecione um produto primeiro!' });
      return;
    }
    if (quantidade <= 0 || isNaN(quantidade)) {
      setAlertConfig({ isOpen: true, message: 'A quantidade deve ser maior que zero!' });
      setQuantidade(1);
      return;
    }
    setItensParaEnviar(prev => [...prev, {
      mesa_id: mesa.id,
      produto_id: produtoSelecionado.id,
      produto_nome: produtoSelecionado.nome,
      produto_setor: produtoSelecionado.setor,
      quantidade: quantidade,
      preco_unitario: produtoSelecionado.preco,
      observacoes: observacao,
      entregar_junto_com_prato: false,
    }]);

    setBuscaProduto('');
    setProdutoSelecionado(null);
    setObservacao('');
    setQuantidade(1);
    setFocusedIndex(-1);
  };

  const handleEnviarParaCozinha = async () => {
    if (itensParaEnviar.length === 0) return;
    setIsSubmitting(true);

    // Assumindo que onAdicionarItens agora retorna uma Promise
    const result = await onAdicionarItens(itensParaEnviar);

    setIsSubmitting(false);

    if (result && (result as any).success) {
      setItensParaEnviar([]);
      setToastConfig({ isOpen: true, type: 'success', message: 'Pedido enviado para a cozinha!' });
      // Redireciona para a aba da conta para o garçom ver os itens já lançados
      setActiveTab('conta');
    } else if (result) {
      setToastConfig({ isOpen: true, type: 'error', message: (result as any).error || 'Erro ao enviar pedido.' });
    } else {
      // Fallback for when it doesn't return promise correctly (shouldn't happen with updated hook)
      setItensParaEnviar([]);
      setActiveTab('conta');
    }
  };


  const handleConfirmarCancelamentoMassa = async () => {
    if (idsParaCancelar.length === 0 || !onCancelarItensMassa) return;
    setIsSubmitting(true);

    const result = await onCancelarItensMassa(idsParaCancelar);

    setIsSubmitting(false);
    setIsConfirmMassaOpen(false);

    if (result && result.success) {
      setIdsParaCancelar([]);
      setIsCancelMode(false);
      setToastConfig({ isOpen: true, type: 'success', message: `${idsParaCancelar.length} itens cancelados com sucesso!` });
    } else {
      setToastConfig({ isOpen: true, type: 'error', message: result?.error || 'Erro ao cancelar itens.' });
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < produtosFiltrados.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!produtoSelecionado && produtosFiltrados.length > 0) {
        const itemParaSelecionar = focusedIndex >= 0 ? produtosFiltrados[focusedIndex] : produtosFiltrados[0];
        selecionarProduto(itemParaSelecionar);
      }
      setTimeout(() => quantidadeInputRef.current?.select(), 50);
    }
  };

  const handleQuantidadeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      observacaoInputRef.current?.focus();
    }
  };

  const handleObservacaoKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdicionarAoCarrinho();
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const selecionarProduto = (p: ProdutoMock) => {
    setProdutoSelecionado(p);
    setBuscaProduto(p.nome);
  };

  // Lógica de Conta
  const totalBruto = itensDaMesa.reduce((acc, curr) => acc + (Number(curr.preco_unitario) * Number(curr.quantidade)), 0);
  const totalGeral = totalBruto;

  const pagamentosValidos = pagamentosParciais.filter(p => idsDoGrupo.includes(p.mesa_id));
  const totalJaPago = pagamentosValidos.reduce((acc, p) => acc + Number(p.valor), 0);
  const faltaPagar = Math.max(0, totalGeral - totalJaPago);

  // Renders de Componentes
  const renderTabLancamento = () => (
    <div className="flex-1 overflow-y-auto bg-slate-900 p-6 flex flex-col">
      {/* Busca e Teclado */}
      <div className="relative z-20 mb-6 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
        <label className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2 block">Lançar Produto</label>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            ref={searchInputRef}
            type="text"
            value={buscaProduto}
            onChange={(e) => {
              setBuscaProduto(e.target.value);
              setProdutoSelecionado(null);
              setFocusedIndex(-1);
            }}
            onKeyDown={handleSearchKeyDown}
            className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl py-3 pl-10 pr-4 outline-none focus:border-blue-500 transition-colors placeholder-slate-500"
            placeholder="Buscar (ex: Burguer)"
          />

          {/* Autocomplete Dropdown */}
          {!produtoSelecionado && produtosFiltrados.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden max-h-60 z-50">
              {produtosFiltrados.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => selecionarProduto(p)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-700 last:border-0 hover:bg-slate-700 transition-colors flex justify-between items-center ${focusedIndex === idx ? 'bg-blue-600/20 border-l-4 border-l-blue-500' : ''}`}
                >
                  <span className="text-white font-medium">{p.nome}</span>
                  <span className="text-blue-400 font-bold">{formatCurrency(p.preco)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {produtoSelecionado && (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex gap-3">
              <div className="w-1/3">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 block">Qtd</label>
                <input
                  ref={quantidadeInputRef}
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                  onKeyDown={handleQuantidadeKeyDown}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl py-2 px-3 outline-none focus:border-blue-500 text-center font-bold"
                />
              </div>
              <div className="w-2/3">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 block">Observação</label>
                <input
                  ref={observacaoInputRef}
                  type="text"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  onKeyDown={handleObservacaoKeyDown}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl py-2 px-3 outline-none focus:border-blue-500"
                  placeholder="Ex: Sem cebola"
                />
              </div>
            </div>
            <button
              onClick={handleAdicionarAoCarrinho}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            >
              <Plus size={18} /> Adicionar ao Carrinho
            </button>
          </div>
        )}
      </div>

      {/* Carrinho de Envio */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-slate-400 font-bold uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
          Carrinho Temporário
          {itensParaEnviar.length > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{itensParaEnviar.length}</span>
          )}
        </h3>

        {itensParaEnviar.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
            <ShoppingBag size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Nenhum item para enviar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(() => {
              const hasCozinha = itensParaEnviar.some(i => i.produto_setor === 'Cozinha');
              return itensParaEnviar.map((item, index) => (
                <div key={index} className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 flex justify-between items-center group flex-wrap">
                  <div className="w-full sm:w-auto flex-1 mb-2 sm:mb-0">
                    <p className="font-bold text-white text-sm">
                      <span className="text-blue-400 mr-2">{item.quantidade}x</span>
                      {item.produto_nome}
                    </p>
                    {item.observacoes && (
                      <p className="text-xs text-amber-400/80 mt-1 italic">Obs: {item.observacoes}</p>
                    )}
                    {hasCozinha && item.produto_setor === 'Copa' && (
                      <label className="flex items-center gap-2 mt-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={item.entregar_junto_com_prato || false}
                          onChange={(e) => {
                            const newItens = [...itensParaEnviar];
                            newItens[index].entregar_junto_com_prato = e.target.checked;
                            setItensParaEnviar(newItens);
                          }}
                          className="w-3.5 h-3.5 accent-blue-500 rounded cursor-pointer"
                        />
                        <span className="text-xs text-blue-200/80 font-medium select-none">Entregar com prato (Cozinha)</span>
                      </label>
                    )}
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-center">
                    <span className="font-bold text-blue-400 text-sm whitespace-nowrap">
                      {formatCurrency((item.preco_unitario * item.quantidade))}
                    </span>
                    <button
                      onClick={() => setItensParaEnviar(prev => prev.filter((_, i) => i !== index))}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );

  const renderTabConta = () => (
    <div className="flex-1 overflow-y-auto bg-slate-800/30 p-6 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-slate-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
          <CheckCircle2 size={16} /> Itens da Mesa
        </h3>
        {groupedItensDaMesa.length > 0 && (
          <button
            onClick={() => {
              setIsCancelMode(!isCancelMode);
              setIdsParaCancelar([]);
            }}
            className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors font-bold ${isCancelMode ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-transparent'}`}
          >
            <Trash2 size={14} />
            {isCancelMode ? 'Sair da Exclusão' : 'Editar / Excluir'}
          </button>
        )}
      </div>

      {groupedItensDaMesa.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-slate-500">
          <p className="text-sm">A mesa não tem itens consumidos.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {groupedItensDaMesa.map((item, idx) => {
            const numCancelados = item.ids.filter(id => idsParaCancelar.includes(id)).length;
            const quantidadeRestante = item.quantidade - numCancelados;

            return (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0 group">
                <div>
                  <p className="text-white text-sm font-medium">
                    <span className="text-slate-400 mr-2">{quantidadeRestante}x</span>
                    <span className={numCancelados > 0 ? "opacity-50 line-through" : ""}>{item.produto_nome}</span>
                    {numCancelados > 0 && (
                      <span className="ml-2 text-red-400 text-xs font-bold bg-red-900/30 px-2 py-0.5 rounded-full">(-{numCancelados} excluir)</span>
                    )}
                  </p>
                  {item.observacoes && <p className="text-xs text-slate-500 italic mt-0.5">Obs: {item.observacoes}</p>}
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-slate-300 text-sm">
                    {formatCurrency((Number(item.preco_unitario) * quantidadeRestante))}
                  </p>
                  {isCancelMode && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (numCancelados > 0) {
                            const idToRestore = item.ids.find(id => idsParaCancelar.includes(id));
                            if (idToRestore) {
                              setIdsParaCancelar(idsParaCancelar.filter(id => id !== idToRestore));
                            }
                          }
                        }}
                        disabled={numCancelados === 0}
                        className={`font-black p-1 px-3 rounded-md transition-colors ${numCancelados > 0 ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40' : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}`}
                        title="Desfazer marcação"
                      >
                        +
                      </button>
                      <button
                        onClick={() => {
                          if (quantidadeRestante > 0) {
                            const idToCancel = item.ids.find(id => !idsParaCancelar.includes(id));
                            if (idToCancel) setIdsParaCancelar([...idsParaCancelar, idToCancel]);
                          }
                        }}
                        disabled={quantidadeRestante === 0}
                        className={`font-black p-1 px-3 rounded-md transition-colors ${quantidadeRestante > 0 ? 'bg-red-500/20 text-red-400 hover:bg-red-500/40' : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'}`}
                        title="Marcar 1 item para exclusão"
                      >
                        -
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Histórico de Pagamentos */}
      {pagamentosValidos.length > 0 && (
        <div className="mb-6">
          <h3 className="text-emerald-500/80 font-bold uppercase tracking-wider text-xs mb-3">Extrato de Pagamentos Realizados</h3>
          <div className="space-y-2">
            {pagamentosValidos.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-emerald-900/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
                <span className="text-emerald-400/80 text-sm">{p.metodo}</span>
                <span className="text-emerald-400 font-bold text-sm">{formatCurrency(Number(p.valor))}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={handleClose} />

      <div className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col transform transition-transform duration-300">

        {/* Header Global */}
        <div className="px-6 pt-6 bg-slate-900 z-30 shadow-sm border-b border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Mesa {mesa.numero}</h2>
              {isAgrupada && (
                <span className="text-xs font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                  Grupo {mesasDoGrupo.map(m => m.numero).join(', ')}
                </span>
              )}
            </div>
            <button onClick={handleClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Abas */}
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('lancamento')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'lancamento' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              <ShoppingBag size={18} /> Lançar Pedido
            </button>
            <button
              onClick={() => setActiveTab('conta')}
              className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'conta' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
            >
              <Receipt size={18} /> Fechar Conta
            </button>
          </div>
        </div>

        {/* Corpo do Drawer baseado na Aba */}
        {activeTab === 'lancamento' ? renderTabLancamento() : renderTabConta()}

        {/* Footer Dinâmico */}
        {activeTab === 'lancamento' ? (
          <div className="p-6 bg-slate-900 border-t border-slate-800 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-20">
            <button
              onClick={handleEnviarParaCozinha}
              disabled={itensParaEnviar.length === 0 || isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex justify-center items-center gap-2 ${isSubmitting
                ? 'bg-emerald-600/50 text-white cursor-wait shadow-none'
                : itensParaEnviar.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Send size={20} /> Enviar para Cozinha</>
              )}
            </button>
          </div>
        ) : isCancelMode ? (
          <div className="p-4 bg-slate-900 border-t border-slate-800 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-20 flex gap-3 animate-in slide-in-from-bottom-2">
            <button
              onClick={() => { setIsCancelMode(false); setIdsParaCancelar([]); }}
              className="flex-1 py-3 rounded-xl font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => setIsConfirmMassaOpen(true)}
              disabled={idsParaCancelar.length === 0}
              className={`flex-[2] py-3 rounded-xl font-bold transition-colors ${idsParaCancelar.length > 0 ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
            >
              Excluir {idsParaCancelar.length > 0 ? `(${idsParaCancelar.length}) Itens` : ''}
            </button>
          </div>
        ) : (
          <div className="p-6 bg-slate-900 border-t border-slate-800 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-20 animate-in fade-in">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 text-sm">Subtotal Itens</span>
              <span className="text-slate-200 font-medium">{formatCurrency(totalBruto)}</span>
            </div>

            {totalJaPago > 0 && (
              <div className="flex justify-between items-center mb-4 pt-4 border-t border-slate-800">
                <span className="text-emerald-500 font-bold uppercase text-sm">Total Já Pago</span>
                <span className="text-emerald-400 font-bold text-lg">- {formatCurrency(totalJaPago)}</span>
              </div>
            )}

            <div className="flex justify-between items-center mb-6 pt-4 border-t border-slate-800">
              <span className="text-amber-500 font-bold uppercase tracking-wider">Saldo Devedor</span>
              <span className="text-4xl font-black text-amber-400">{formatCurrency(faltaPagar)}</span>
            </div>

            <button
              onClick={() => {
                if (onCheckoutClick) onCheckoutClick();
              }}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex justify-center items-center gap-2 ${itensDaMesa.length > 0
                ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
            >
              <Wallet size={20} /> Ir para Pagamento
            </button>
          </div>
        )}

      </div>

      {/* Modal Customizado de Confirmação de Saída */}
      <ConfirmModal
        isOpen={isConfirmCloseOpen}
        title="Descartar Itens?"
        message="Você tem itens no carrinho que não foram enviados para a cozinha. Se fechar a mesa agora, eles serão perdidos."
        confirmText="Sim, fechar mesa"
        cancelText="Voltar"
        type="danger"
        onConfirm={() => {
          setIsConfirmCloseOpen(false);
          onClose(); // Agora sim chamamos o onClose verdadeiro
        }}
        onCancel={() => setIsConfirmCloseOpen(false)}
      />

      {/* Modal de Cancelamento em Massa */}
      <ConfirmModal
        isOpen={isConfirmMassaOpen}
        title="Confirmar Exclusão"
        message={
          <div className="text-left">
            <p className="mb-3 text-center text-slate-300">Você marcou <strong>{idsParaCancelar.length}</strong> itens para serem cancelados:</p>
            <div className="bg-slate-900/50 rounded-xl p-3 mb-4 max-h-40 overflow-y-auto">
              {Object.values(itensDaMesa
                .filter(item => idsParaCancelar.includes(item.id))
                .reduce((acc, item) => {
                  const key = `${item.produto_id}-${item.observacoes || ''}`;
                  if (!acc[key]) acc[key] = { ...item, quantidade: 1 };
                  else acc[key].quantidade = Number(acc[key].quantidade) + 1;
                  return acc;
                }, {} as Record<string, typeof itensDaMesa[0]>)
              ).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-700/50 last:border-0 text-sm">
                  <span className="text-slate-300"><span className="text-slate-400 font-bold mr-2">{item.quantidade}x</span>{item.produto_nome}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-slate-400">Eles serão retirados da conta do cliente e a cozinha será notificada. Deseja continuar?</p>
          </div>
        }
        confirmText={isSubmitting ? "Cancelando..." : "Sim, Confirmar"}
        cancelText="Voltar"
        type="danger"
        onConfirm={handleConfirmarCancelamentoMassa}
        onCancel={() => setIsConfirmMassaOpen(false)}
      />

      {/* Modal de Alerta Simples */}
      <ConfirmModal
        isOpen={alertConfig.isOpen}
        title="Atenção"
        message={alertConfig.message}
        confirmText="Entendi"
        showCancel={false}
        type="warning"
        onConfirm={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        onCancel={() => setAlertConfig({ ...alertConfig, isOpen: false })}
      />

      <Toast
        isOpen={toastConfig.isOpen}
        message={toastConfig.message}
        type={toastConfig.type}
        onClose={() => setToastConfig({ ...toastConfig, isOpen: false })}
      />
    </>
  );
}
