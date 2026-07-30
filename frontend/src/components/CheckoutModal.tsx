import React, { useState, useEffect } from 'react';
import { PagamentoMock, MesaMock, ItemComandaMock, MetodoPagamento } from '@/services/mockData';
import ConfirmModal from './ConfirmModal';
import { X, DollarSign, CreditCard, Wallet, Smartphone, Receipt, CheckCircle2, Trash2, Users, Calculator, ListChecks, ChevronLeft } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface CheckoutModalProps {
  isOpen: boolean;
  mesa: MesaMock | null;
  mesas: MesaMock[];
  itens: ItemComandaMock[];
  pagamentosPrevios?: PagamentoMock[];
  onClose: () => void;
  onFinalizar: (mesaId: number, pagamentos: PagamentoMock[], taxaServico: number, desconto: number) => void;
  onSalvarParcial?: (mesaId: number, pagamentos: PagamentoMock[]) => void;
  onEstornar?: (pagamentoId: string) => void;
}

type ViewState = 'summary' | 'split_menu' | 'split_equal' | 'split_custom' | 'split_items' | 'payment_method';

export default function CheckoutModal({ isOpen, mesa, mesas, itens, pagamentosPrevios = [], onClose, onFinalizar, onSalvarParcial, onEstornar }: CheckoutModalProps) {
  const [currentView, setCurrentView] = useState<ViewState>('summary');
  const [returnView, setReturnView] = useState<ViewState>('summary');
  
  const [incluir10Local, setIncluir10Local] = useState(true);
  const [desconto, setDesconto] = useState<number>(0);
  const [estornoConfig, setEstornoConfig] = useState<{isOpen: boolean, pagamentoId: string | null}>({isOpen: false, pagamentoId: null});
  
  // Local session payments (unsaved)
  const [pagamentosSession, setPagamentosSession] = useState<PagamentoMock[]>([]);
  
  // Split states
  const [splitValueSemGorjeta, setSplitValueSemGorjeta] = useState<number>(0);
  const [splitValueComGorjeta, setSplitValueComGorjeta] = useState<number>(0);
  const [numPeople, setNumPeople] = useState<number>(2);
  const [selectedItemCounts, setSelectedItemCounts] = useState<Record<string, number>>({});
  const [customValueInput, setCustomValueInput] = useState<string>('');
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentView('summary');
      setIncluir10Local(true);
      setDesconto(0);
      setPagamentosSession([]);
      setSplitValueSemGorjeta(0);
      setSplitValueComGorjeta(0);
      setNumPeople(2);
      setSelectedItemCounts({});
      setCustomValueInput('');
      setReturnView('summary');
    }
  }, [isOpen]);

  // Cálculos Básicos
  const isAgrupada = !!mesa?.grupo_id;
  const mesasDoGrupo = isAgrupada ? mesas.filter(m => m.grupo_id === mesa?.grupo_id) : (mesa ? [mesa] : []);
  const idsDoGrupo = mesasDoGrupo.map(m => m.id);
  const itensDaContaRaw = itens.filter(item => idsDoGrupo.includes(item.mesa_id));

  // Agrupamento financeiro de itens (ignora observações na hora de pagar)
  const itensDaConta = Object.values(itensDaContaRaw.reduce((acc, item) => {
    const key = `${item.produto_id}`;
    if (!acc[key]) {
      acc[key] = { ...item, quantidade: Number(item.quantidade) };
    } else {
      acc[key].quantidade += Number(item.quantidade);
    }
    return acc;
  }, {} as Record<string, typeof itens[0]>));

  const totalBruto = itensDaConta.reduce((acc, curr) => acc + (Number(curr.quantidade) * Number(curr.preco_unitario)), 0);

  const pagamentosValidos = pagamentosPrevios.filter(p => idsDoGrupo.includes(Number(p.mesa_id)));
  
  const totalPagoPrevioProdutos = pagamentosValidos.reduce((acc, curr) => acc + (Number(curr.valor) - Number(curr.valor_gorjeta || 0)), 0);
  const totalPagoSessaoProdutos = pagamentosSession.reduce((acc, curr) => acc + (Number(curr.valor) - Number(curr.valor_gorjeta || 0)), 0);
  const totalProdutosPago = totalPagoPrevioProdutos + totalPagoSessaoProdutos;
  
  const totalGorjetaPagaPrevio = pagamentosValidos.reduce((acc, curr) => acc + Number(curr.valor_gorjeta || 0), 0);
  const totalGorjetaPagaSessao = pagamentosSession.reduce((acc, curr) => acc + Number(curr.valor_gorjeta || 0), 0);
  const totalGorjetaPaga = totalGorjetaPagaPrevio + totalGorjetaPagaSessao;

  const totalGeralPago = totalProdutosPago + totalGorjetaPaga;
  const taxaSugeridaTotal = totalBruto * 0.10;
  
  const saldoSemGorjeta = Math.max(0, totalBruto - desconto - totalProdutosPago);
  const saldoGorjetaRestante = Math.max(0, taxaSugeridaTotal - totalGorjetaPaga);
  const saldoComGorjeta = saldoSemGorjeta + saldoGorjetaRestante;
  
  const isPago = saldoSemGorjeta <= 0;
  
  // Actions
  const handleVoltar = () => setCurrentView('summary');

  const iniciarPagamentoIntegral = () => {
    if (saldoComGorjeta <= 0) return;
    setSplitValueSemGorjeta(saldoSemGorjeta);
    setSplitValueComGorjeta(saldoComGorjeta);
    setIncluir10Local(true);
    setReturnView('summary');
    setCurrentView('payment_method');
  };

  const confirmarPagamento = (metodo: MetodoPagamento) => {
    const valorCobrado = incluir10Local ? splitValueComGorjeta : splitValueSemGorjeta;
    const valorFinal = Number(valorCobrado.toFixed(2));
    if (valorFinal <= 0) return;

    const gorjetaCalculada = incluir10Local ? Math.max(0, valorFinal - splitValueSemGorjeta) : 0;
    const gorjetaFinal = Number(gorjetaCalculada.toFixed(2));

    setPagamentosSession(prev => [...prev, {
      id: Date.now().toString(),
      mesa_id: mesa!.id,
      metodo,
      valor: valorFinal,
      valor_gorjeta: gorjetaFinal
    }]);

    if (returnView === 'split_equal' && numPeople > 1) {
      setNumPeople(prev => prev - 1);
      setCurrentView('split_equal');
    } else {
      setCurrentView('summary');
    }
  };

  const handleEstornarSessao = (id: string) => {
    setPagamentosSession(prev => prev.filter(p => p.id !== id));
  };

  const handleEstornarPrevio = (id: string) => {
    setEstornoConfig({ isOpen: true, pagamentoId: id });
  };

  const handleConfirmarEstorno = () => {
    if (estornoConfig.pagamentoId && onEstornar) {
      onEstornar(estornoConfig.pagamentoId);
    }
    setEstornoConfig({ isOpen: false, pagamentoId: null });
  };

  const handleFinalizar = () => {
    if (!isPago || !mesa) return;
    
    const taxaEfetiva = Math.max(0, totalGeralPago - (totalBruto - desconto));
    
    onFinalizar(mesa.id, pagamentosSession, taxaEfetiva, desconto);
  };

  const handleSalvarParcialmente = async () => {
    if (!mesa || !onSalvarParcial) return;
    await onSalvarParcial(mesa.id, pagamentosSession);
    setPagamentosSession([]); 
    setCurrentView('summary');
  };

  const metodos: { id: MetodoPagamento, label: string, icon: React.ReactNode }[] = [
    { id: 'PIX', label: 'PIX', icon: <Smartphone size={20} /> },
    { id: 'CREDITO', label: 'Crédito', icon: <CreditCard size={20} /> },
    { id: 'DEBITO', label: 'Débito', icon: <CreditCard size={20} /> },
    { id: 'DINHEIRO', label: 'Dinheiro', icon: <Wallet size={20} /> },
  ];

  if (!isOpen || !mesa) return null;

  // Renders
  const renderSummary = () => (
    <div className="flex flex-col md:flex-row h-full">
      <div className="w-full md:w-5/12 bg-slate-800/50 p-6 flex flex-col border-b md:border-b-0 md:border-r border-slate-700/50 overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Receipt className="text-emerald-400" /> Fechar Conta
            </h2>
            <p className="text-slate-400 mt-1">
              {isAgrupada ? `Grupo: Mesas ${mesasDoGrupo.map(m => m.numero).join(', ')}` : `Mesa ${mesa.numero}`}
            </p>
          </div>
          <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Subtotal (Itens)</span>
            <span className="font-medium text-slate-200">{formatCurrency(totalBruto)}</span>
          </div>
        </div>

        <div className="mt-auto bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-inner">
          <div className="flex justify-between items-center mb-2">
            <span className="text-emerald-500 text-sm font-bold uppercase tracking-wider">Total Pago</span>
            <span className="text-lg font-bold text-emerald-400">- {formatCurrency(totalGeralPago)}</span>
          </div>
          
          <div className="flex justify-between items-center pt-3 border-t border-slate-700">
            <span className="text-amber-500 text-sm font-bold uppercase tracking-wider">Falta Pagar (Sem 10%)</span>
            <span className={`text-2xl font-bold ${saldoSemGorjeta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {formatCurrency(saldoSemGorjeta)}
            </span>
          </div>
          
          {saldoComGorjeta > 0 && (
             <div className="flex justify-between items-center mt-3 p-2 bg-slate-800 rounded-lg">
                <span className="text-amber-500 text-sm font-bold uppercase tracking-wider">Falta Pagar (Com 10%)</span>
                <span className="text-2xl font-bold text-amber-400">{formatCurrency(saldoComGorjeta)}</span>
             </div>
          )}
          
          {(totalGeralPago > totalBruto - desconto) && (
             <div className="flex justify-between items-center mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <span className="text-blue-400 text-sm font-bold uppercase tracking-wider">Excedente Pago (Gorjeta/Troco)</span>
                <span className="text-xl font-bold text-blue-400">{formatCurrency((totalGeralPago - (totalBruto - desconto)))}</span>
             </div>
          )}
        </div>
      </div>

      <div className="w-full md:w-7/12 bg-slate-900 p-6 flex flex-col overflow-y-auto">
        <div className="hidden md:flex justify-end mb-4">
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {saldoComGorjeta > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button
              onClick={iniciarPagamentoIntegral}
              className="flex flex-col items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white p-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <DollarSign size={32} />
              <span className="font-bold text-lg">Pagar Integral</span>
              <span className="text-emerald-100 text-sm">{formatCurrency(saldoComGorjeta)}</span>
            </button>
            <button
              onClick={() => setCurrentView('split_menu')}
              className="flex flex-col items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white p-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              <Calculator size={32} />
              <span className="font-bold text-lg">Dividir Conta</span>
              <span className="text-blue-100 text-sm">Parcial ou Rachar</span>
            </button>
          </div>
        )}

        <div className="flex-1">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Histórico de Pagamentos</h4>
          {pagamentosValidos.length === 0 && pagamentosSession.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8 border border-dashed border-slate-700 rounded-xl">
              Nenhum pagamento registrado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {pagamentosValidos.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                      {metodos.find(m => m.id === p.metodo)?.icon || <Wallet size={20} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-300">{p.metodo}</p>
                      <span className="text-xs text-slate-500">Salvo anteriormente</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-400">{formatCurrency(Number(p.valor))}</span>
                    <button onClick={() => handleEstornarPrevio(p.id)} className="text-slate-500 hover:text-red-400 transition-colors" title="Estornar Pagamento Antigo">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {pagamentosSession.map((p) => (
                <div key={p.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      {metodos.find(m => m.id === p.metodo)?.icon}
                    </div>
                    <div>
                      <p className="font-bold text-white">{p.metodo}</p>
                      <span className="text-xs text-blue-400">Nova entrada (Pendente)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-emerald-400">{formatCurrency(Number(p.valor))}</span>
                    <button onClick={() => handleEstornarSessao(p.id)} className="text-slate-500 hover:text-red-400 transition-colors" title="Remover Pagamento">
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-slate-700 pt-6 flex gap-3">
          {pagamentosSession.length > 0 && !isPago && (
            <button 
              onClick={handleSalvarParcialmente}
              className="w-1/3 py-4 rounded-xl font-bold transition-all bg-amber-600 hover:bg-amber-500 text-white"
            >
              Salvar Parcial
            </button>
          )}

          <button 
            onClick={handleFinalizar}
            disabled={!isPago}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all shadow-md flex justify-center items-center gap-2 ${
              isPago 
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] cursor-pointer' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isPago ? <><CheckCircle2 size={24} /> Concluir e Fechar Mesa</> : 'Aguardando Saldo Zerar'}
          </button>
        </div>
        
        <ConfirmModal
          isOpen={estornoConfig.isOpen}
          title="Estornar Pagamento"
          message="Tem certeza que deseja estornar este pagamento? O valor retornará para a conta."
          type="danger"
          confirmText="Sim, Estornar"
          onConfirm={handleConfirmarEstorno}
          onCancel={() => setEstornoConfig({ isOpen: false, pagamentoId: null })}
        />
      </div>
    </div>
  );

  const renderSplitMenu = () => (
    <div className="p-8 h-full flex flex-col relative">
      <button onClick={handleVoltar} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2">
        <ChevronLeft size={20} /> Voltar
      </button>
      
      <div className="text-center mt-8 mb-10">
        <h2 className="text-2xl font-bold text-white">Como deseja dividir?</h2>
        <p className="text-slate-400 mt-2">Saldo restante: <span className="font-bold text-amber-400">{formatCurrency(saldoSemGorjeta)}</span></p>
      </div>

      <div className="flex flex-col gap-4 max-w-md mx-auto w-full">
        <button 
          onClick={() => setCurrentView('split_equal')}
          className="flex items-center gap-4 p-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl transition-colors text-left"
        >
          <div className="bg-blue-500/20 text-blue-400 p-4 rounded-full"><Users size={28} /></div>
          <div>
            <h3 className="font-bold text-white text-lg">Dividir por Pessoas</h3>
            <p className="text-slate-400 text-sm">Racha igualitário (ex: conta por 3)</p>
          </div>
        </button>

        <button 
          onClick={() => setCurrentView('split_custom')}
          className="flex items-center gap-4 p-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl transition-colors text-left"
        >
          <div className="bg-emerald-500/20 text-emerald-400 p-4 rounded-full"><DollarSign size={28} /></div>
          <div>
            <h3 className="font-bold text-white text-lg">Valor Específico</h3>
            <p className="text-slate-400 text-sm">Digitar um valor exato a ser pago</p>
          </div>
        </button>

        <button 
          onClick={() => setCurrentView('split_items')}
          className="flex items-center gap-4 p-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl transition-colors text-left"
        >
          <div className="bg-purple-500/20 text-purple-400 p-4 rounded-full"><ListChecks size={28} /></div>
          <div>
            <h3 className="font-bold text-white text-lg">Dividir por Itens</h3>
            <p className="text-slate-400 text-sm">Pagar apenas o que consumiu</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderSplitEqual = () => {
    const fractionSem = saldoSemGorjeta / numPeople;
    const fractionCom = saldoComGorjeta / numPeople;
    return (
      <div className="p-8 h-full flex flex-col relative items-center justify-center">
        <button onClick={() => setCurrentView('split_menu')} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2">
          <ChevronLeft size={20} /> Voltar
        </button>

        <h2 className="text-2xl font-bold text-white mb-8">Dividir por quantas pessoas?</h2>
        
        <div className="flex items-center gap-6 mb-8">
          <button onClick={() => setNumPeople(Math.max(2, numPeople - 1))} className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 text-white text-3xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center">-</button>
          <span className="text-6xl font-black text-white w-24 text-center">{numPeople}</span>
          <button onClick={() => setNumPeople(numPeople + 1)} className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 text-white text-3xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center">+</button>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl text-center w-full max-w-xs mb-8">
          <span className="text-slate-400 block mb-2 uppercase text-sm font-bold tracking-wider">Cota Atual (Sem 10%)</span>
          <span className="text-4xl font-bold text-emerald-400">{formatCurrency(fractionSem)}</span>
        </div>

        <button 
          onClick={() => {
            const fixedFractionSem = Number(fractionSem.toFixed(2));
            const fixedFractionCom = Number(fractionCom.toFixed(2));
            setSplitValueSemGorjeta(Math.min(fixedFractionSem, saldoSemGorjeta));
            setSplitValueComGorjeta(Math.min(fixedFractionCom, saldoComGorjeta));
            setIncluir10Local(true);
            setReturnView('split_equal');
            setCurrentView('payment_method');
          }}
          className="w-full max-w-xs py-4 rounded-xl font-bold text-lg bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md"
        >
          Pagar Cota
        </button>

        {pagamentosSession.length > 0 && (
          <button 
            onClick={handleSalvarParcialmente}
            className="w-full max-w-xs py-4 mt-4 rounded-xl font-bold text-lg bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-md"
          >
            Pausar e Salvar Parcial
          </button>
        )}
      </div>
    );
  };

  const renderSplitCustom = () => {
    return (
      <div className="p-8 h-full flex flex-col relative items-center">
        <button onClick={() => setCurrentView('split_menu')} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2">
          <ChevronLeft size={20} /> Voltar
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Valor Específico</h2>
        
        <div className="w-full max-w-sm">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 mb-6 text-center shadow-inner flex items-center">
            <span className="text-slate-500 text-lg mr-2">R$ </span>
            <input 
              type="number" 
              value={customValueInput}
              onChange={(e) => setCustomValueInput(e.target.value)}
              className="bg-transparent border-none outline-none text-4xl font-black text-white w-full text-center"
              placeholder="0.00"
              step="0.01"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {[10, 20, 50, 100].map(val => (
              <button 
                key={val} 
                onClick={() => setCustomValueInput(val.toFixed(2))}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl border border-slate-700 transition-colors"
              >
                R$ {val}
              </button>
            ))}
            <button 
              onClick={() => setCustomValueInput(saldoSemGorjeta.toFixed(2))}
              className="col-span-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 font-bold py-3 rounded-xl border border-amber-500/30 transition-colors"
            >
              Restante ({formatCurrency(saldoSemGorjeta)})
            </button>
          </div>

          <button 
            onClick={() => {
              const val = Number(customValueInput.replace(',', '.'));
              if (val > 0 && val <= saldoSemGorjeta) {
                setSplitValueSemGorjeta(val);
                setSplitValueComGorjeta(Math.min(val * 1.10, saldoComGorjeta));
                setIncluir10Local(true);
                setReturnView('summary');
                setCurrentView('payment_method');
              }
            }}
            disabled={!customValueInput || Number(customValueInput.replace(',', '.')) <= 0 || Number(customValueInput.replace(',', '.')) > saldoSemGorjeta}
            className="w-full py-4 rounded-xl font-bold text-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Avançar Pagamento
          </button>
        </div>
      </div>
    );
  };

  const renderSplitItems = () => {
    const incrementItem = (id: number, max: number) => {
      setSelectedItemCounts(prev => ({
        ...prev,
        [id]: Math.min((prev[id] || 0) + 1, max)
      }));
    };

    const decrementItem = (id: number) => {
      setSelectedItemCounts(prev => {
        const current = prev[id] || 0;
        if (current <= 1) {
          const newState = { ...prev };
          delete newState[id];
          return newState;
        }
        return { ...prev, [id]: current - 1 };
      });
    };

    const subtotalSelecionado = itensDaConta.reduce((acc, item) => {
      const count = selectedItemCounts[item.id] || 0;
      return acc + (count * Number(item.preco_unitario));
    }, 0);
    
    // Proporção de desconto global baseada no subtotal selecionado / total bruto global
    const proportion = totalBruto > 0 ? (subtotalSelecionado / totalBruto) : 0;
    const descontoProporcional = desconto * proportion;
    
    const totalSelecionado = subtotalSelecionado - descontoProporcional;

    return (
      <div className="p-8 h-full flex flex-col relative">
        <button onClick={() => setCurrentView('split_menu')} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2 z-10">
          <ChevronLeft size={20} /> Voltar
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 text-center">Selecione os Itens</h2>

        <div className="flex-1 overflow-y-auto mb-6 bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
          {itensDaConta.map(item => {
            const count = selectedItemCounts[item.id] || 0;
            const maxQtd = Number(item.quantidade);
            const isSelected = count > 0;
            
            return (
              <div 
                key={item.id} 
                className={`flex justify-between items-center p-3 mb-2 rounded-xl transition-all border ${isSelected ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-800 border-slate-700'}`}
              >
                <div>
                  <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                    <span className={isSelected ? 'text-blue-400' : 'text-slate-500'}>{item.quantidade}x </span>
                    {item.produto_nome}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatCurrency(Number(item.preco_unitario))} / un
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
                    <button 
                      onClick={() => decrementItem(item.id)}
                      disabled={count === 0}
                      className="px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold"
                    >
                      -
                    </button>
                    <div className={`w-8 text-center font-bold text-sm ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}>
                      {count}
                    </div>
                    <button 
                      onClick={() => incrementItem(item.id, maxQtd)}
                      disabled={count >= maxQtd}
                      className="px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 mb-6 shadow-inner">
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Subtotal Selecionado:</span>
            <span>{formatCurrency(subtotalSelecionado)}</span>
          </div>
          {desconto > 0 && (
             <div className="flex justify-between text-slate-400 mb-2">
               <span>Desconto Proporcional:</span>
               <span>- {formatCurrency(descontoProporcional)}</span>
             </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-slate-700 text-white font-bold text-xl">
            <span>Total a Pagar:</span>
            <span className="text-emerald-400">{formatCurrency(totalSelecionado)}</span>
          </div>
        </div>

        <button 
          onClick={() => {
            if (totalSelecionado > 0) {
              setSplitValueSemGorjeta(Math.min(totalSelecionado, saldoSemGorjeta));
              setSplitValueComGorjeta(Math.min(totalSelecionado * 1.10, saldoComGorjeta));
              setIncluir10Local(true);
              setReturnView('summary');
              setCurrentView('payment_method');
            }
          }}
          disabled={totalSelecionado <= 0}
          className="w-full py-4 rounded-xl font-bold text-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirmar e Pagar
        </button>
      </div>
    );
  };

  const renderPaymentMethod = () => {
    const valorExibido = incluir10Local ? splitValueComGorjeta : splitValueSemGorjeta;

    return (
      <div className="p-8 h-full flex flex-col relative items-center justify-center">
        <button onClick={() => setCurrentView('summary')} className="absolute top-6 left-6 text-slate-400 hover:text-white flex items-center gap-2">
          <ChevronLeft size={20} /> Cancelar Parcial
        </button>

        <h2 className="text-slate-400 uppercase tracking-wider font-bold mb-2">Valor da Cobrança</h2>
        
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-5xl font-black text-emerald-400 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 mb-4">
            {formatCurrency(valorExibido)}
          </h1>
          
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-800 rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">
            <input 
              type="checkbox" 
              checked={incluir10Local}
              onChange={(e) => setIncluir10Local(e.target.checked)}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
            <span className="text-slate-300 font-medium">Incluir 10% (Gorjeta) nesta cobrança</span>
          </label>
        </div>

        <h3 className="text-xl font-bold text-white mb-6">Como o cliente deseja pagar?</h3>

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {metodos.map(m => (
            <button
              key={m.id}
              onClick={() => confirmarPagamento(m.id)}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl transition-all shadow-sm hover:shadow-md"
            >
              <div className="text-slate-300 bg-slate-700/50 p-4 rounded-full">{m.icon}</div>
              <span className="text-white font-bold text-lg">{m.label}</span>
            </button>
          ))}
        </div>
        
        <p className="text-slate-500 text-sm mt-8 text-center max-w-xs">
          Ao escolher "Dinheiro", você poderá gerar troco no resumo final caso passe do valor devedor.
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative bg-slate-900 border border-slate-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl w-full max-w-5xl overflow-hidden transform transition-all h-[95vh] md:h-[650px]">
        {currentView === 'summary' && renderSummary()}
        {currentView === 'split_menu' && renderSplitMenu()}
        {currentView === 'split_equal' && renderSplitEqual()}
        {currentView === 'split_custom' && renderSplitCustom()}
        {currentView === 'split_items' && renderSplitItems()}
        {currentView === 'payment_method' && renderPaymentMethod()}
      </div>
    </div>
  );
}
