import { useState, useEffect } from 'react';
import { apiFetch } from '@/services/apiClient';
import { MesaMock, ItemComandaMock, PagamentoMock, ProdutoMock } from '@/services/mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL 
  ? `${process.env.NEXT_PUBLIC_API_URL}/pdv`
  : (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:8000/api/pdv`
    : 'http://localhost:8000/api/pdv');

export function usePDV() {
  const [searchTerm, setSearchTerm] = useState('');
  const [produtos, setProdutos] = useState<ProdutoMock[]>([]);
  const [mesas, setMesas] = useState<MesaMock[]>([]);
  const [itensComanda, setItensComanda] = useState<ItemComandaMock[]>([]);
  const [mesaSelecionadaId, setMesaSelecionadaId] = useState<number | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [pagamentosParciais, setPagamentosParciais] = useState<PagamentoMock[]>([]);

  // Estados para Agrupamento Multi-Seleção
  const [groupingOriginId, setGroupingOriginId] = useState<number | null>(null);
  const [groupingSelectedIds, setGroupingSelectedIds] = useState<number[]>([]);

  // Estados para Transferência Visual
  const [transferOriginId, setTransferOriginId] = useState<number | null>(null);
  const [transferDestinationId, setTransferDestinationId] = useState<number | null>(null);

  // Estados de Nova Mesa e Edição
  const [isNovaMesaModalOpen, setIsNovaMesaModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const carregarDados = async () => {
    try {
      // Fetch Produtos
      const resProdutos = await apiFetch(`${API_BASE}/produtos/?ativo=true`);
      const dataProdutos = await resProdutos.json();
      const produtosFormatados = dataProdutos.map((p: any) => ({
        ...p,
        preco: Number(p.preco_venda)
      }));
      setProdutos(produtosFormatados);

      // Fetch Mesas
      const resMesas = await apiFetch(`${API_BASE}/mesas/`);
      const dataMesas = await resMesas.json();
      const parseBrazilianDate = (dateStr: string) => {
        if (!dateStr) return null;
        try {
          const [datePart, timePart] = dateStr.split(' ');
          const [day, month, year] = datePart.split('/');
          const [hour, minute] = timePart.split(':');
          return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
        } catch (e) {
          return null;
        }
      };

      const mesasFormatadas = dataMesas.map((m: any) => ({
        ...m,
        status: m.status_display || m.status,
        hora_abertura: m.hora_abertura ? parseBrazilianDate(m.hora_abertura) : null
      }));
      setMesas(mesasFormatadas);

      const resComandas = await apiFetch(`${API_BASE}/comandas/ativas/`);
      const dataComandas = await resComandas.json();

      let todosItens: any[] = [];
      let todosPagamentos: any[] = [];

      dataComandas.forEach((comanda: any) => {
        const itensFormatados = comanda.itens
          .filter((item: any) => item.status !== 'Cancelada')
          .map((item: any) => ({
            ...item,
            produto_id: item.produto,
            observacao: item.observacoes,
            horario_pedido: item.hora_pedido ? item.hora_pedido.split(' ')[1] : ''
          }));
        todosItens = [...todosItens, ...itensFormatados];
        const pagamentosFormatados = comanda.pagamentos.map((pag: any) => ({
          ...pag,
          metodo: pag.forma_pagamento,
          valor_gorjeta: Number(pag.valor_gorjeta || 0)
        }));
        todosPagamentos = [...todosPagamentos, ...pagamentosFormatados];
      });

      setItensComanda(todosItens);
      setPagamentosParciais(todosPagamentos);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  useEffect(() => {
    carregarDados();
    // Poll a cada 5 segundos para tempo real simplificado (Phase 2)
    const interval = setInterval(carregarDados, 5000);
    return () => clearInterval(interval);
  }, []);

  const mesaSelecionada = mesas.find(m => m.id === mesaSelecionadaId) || null;

  const mesasFiltradas = mesas.filter(mesa =>
    mesa.numero.toString().includes(searchTerm)
  );

  const getComandaAtiva = async (mesaId: number) => {
    const res = await apiFetch(`${API_BASE}/comandas/ativas/`);
    const comandas = await res.json();
    return comandas.find((c: any) => Number(c.mesa) === Number(mesaId));
  };

  const handleAdicionarItens = async (novosItensData: Omit<ItemComandaMock, 'id' | 'horario_pedido'>[]) => {
    if (novosItensData.length === 0) return { success: false, error: 'Carrinho vazio' };
    const mesaId = novosItensData[0].mesa_id;

    try {
      let comanda = await getComandaAtiva(mesaId);

      if (!comanda) {
        // Criar comanda
        const resCreate = await apiFetch(`${API_BASE}/comandas/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mesa: mesaId, status: 'Aberta' })
        });
        comanda = await resCreate.json();
      }

      const payloadItens = novosItensData.map(item => ({
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        observacoes: item.observacoes || ''
      }));

      await apiFetch(`${API_BASE}/comandas/${comanda.id}/adicionar_itens/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens: payloadItens })
      });

      await carregarDados();
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao adicionar itens', error);
      return { success: false, error: 'Erro de conexão ao enviar pedido para a cozinha.' };
    }
  };

  const handleCancelarItem = async (itemId: number) => {
    try {
      const res = await apiFetch(`${API_BASE}/itens/${itemId}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelada' })
      });
      if (!res.ok) throw new Error('Erro na API');
      await carregarDados();
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao cancelar item', error);
      return { success: false, error: 'Erro de conexão ao cancelar item.' };
    }
  };

  const handleCancelarItensMassa = async (ids: number[]) => {
    if (ids.length === 0) return { success: false, error: 'Nenhum item selecionado.' };
    try {
      const res = await apiFetch(`${API_BASE}/itens/cancelar_massa/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (!res.ok) throw new Error('Erro na API');
      await carregarDados();
      return { success: true };
    } catch (error: any) {
      console.error('Erro ao cancelar itens em massa', error);
      return { success: false, error: 'Erro de conexão ao cancelar itens.' };
    }
  };

  const handleTransferirMesa = async (destinoId: number) => {
    if (!transferOriginId) return;

    try {
      await apiFetch(`${API_BASE}/mesas/transferir/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origem_id: transferOriginId, destino_id: destinoId })
      });
      setTransferOriginId(null);
      setTransferDestinationId(null);
      carregarDados();
    } catch (error) {
      console.error('Erro ao transferir mesa', error);
    }
  };

  const handleGroupClick = (mesaId: number) => {
    if (groupingOriginId === null) {
      const mesaAlvo = mesas.find(m => m.id === mesaId);
      setGroupingOriginId(mesaId);

      if (mesaAlvo?.grupo_id) {
        const parceiras = mesas.filter(m => m.grupo_id === mesaAlvo.grupo_id && m.id !== mesaId).map(m => m.id);
        setGroupingSelectedIds(parceiras);
      } else {
        setGroupingSelectedIds([]);
      }
    }
  };

  const handleCardClick = (mesaId: number) => {
    if (groupingOriginId !== null) {
      if (mesaId === groupingOriginId) return;

      if (groupingSelectedIds.includes(mesaId)) {
        setGroupingSelectedIds(prev => prev.filter(id => id !== mesaId));
      } else {
        setGroupingSelectedIds(prev => [...prev, mesaId]);
      }
    } else if (transferOriginId !== null) {
      if (mesaId === transferOriginId) return;
      setTransferDestinationId(mesaId);
    } else {
      setMesaSelecionadaId(mesaId);
    }
  };

  const handleConfirmarAgrupamento = async () => {
    if (groupingOriginId === null) return;

    const mesaOrigem = mesas.find(m => m.id === groupingOriginId);
    const grupoAntigoId = mesaOrigem?.grupo_id;

    if (groupingSelectedIds.length === 0 && !grupoAntigoId) {
      setGroupingOriginId(null);
      setGroupingSelectedIds([]);
      return;
    }

    const novoGrupoId = grupoAntigoId || `grupo-${Date.now()}`;
    // Se groupingSelectedIds está vazio, estamos desagrupando todas as mesas do grupo
    const allIdsToGroup = groupingSelectedIds.length > 0 ? [groupingOriginId, ...groupingSelectedIds] : [];

    try {
      await apiFetch(`${API_BASE}/mesas/agrupar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesas_ids: allIdsToGroup, grupo_id: novoGrupoId })
      });
      setGroupingOriginId(null);
      setGroupingSelectedIds([]);
      carregarDados();
    } catch (error) {
      console.error('Erro ao agrupar', error);
    }
  };

  const handleFinalizarPagamento = async (mesaId: number, pagamentos: PagamentoMock[], taxaServico: number = 0, desconto: number = 0) => {
    try {
      const mesaAlvo = mesas.find(m => m.id === mesaId);
      const grupoId = mesaAlvo?.grupo_id;

      const mesasParaLiberar = grupoId
        ? mesas.filter(m => m.grupo_id === grupoId)
        : [mesaAlvo];

      // Pegar todas as comandas ativas dessas mesas
      let comandasParaFechar = [];
      for (const m of mesasParaLiberar) {
        if (!m) continue;
        const com = await getComandaAtiva(m.id);
        if (com) comandasParaFechar.push(com);
      }

      if (comandasParaFechar.length === 0) return;

      // Para simplificar, o pagamento vai na primeira comanda do grupo
      const comandaPrincipal = comandasParaFechar[0];

      // Cadastrar pagamentos
      for (const pag of pagamentos) {
        await apiFetch(`${API_BASE}/pagamentos/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comanda: comandaPrincipal.id,
            valor: pag.valor,
            valor_gorjeta: pag.valor_gorjeta || 0,
            forma_pagamento: pag.metodo
          })
        });
      }

      // Fechar todas as comandas
      for (let i = 0; i < comandasParaFechar.length; i++) {
        const com = comandasParaFechar[i];
        // Colocamos a taxa e desconto apenas na primeira para não duplicar
        const isPrincipal = i === 0;

        await apiFetch(`${API_BASE}/comandas/${com.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'Fechada',
            taxa_servico: isPrincipal ? Number(taxaServico.toFixed(2)) : 0,
            desconto: isPrincipal ? Number(desconto.toFixed(2)) : 0
          })
        });
      }

      // Liberar mesas
      for (const m of mesasParaLiberar) {
        if (!m) continue;
        await apiFetch(`${API_BASE}/mesas/${m.id}/`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Livre', grupo_id: null, hora_abertura: null })
        });
      }

      setIsCheckoutModalOpen(false);
      setMesaSelecionadaId(null);
      carregarDados();
    } catch (error) {
      console.error('Erro ao finalizar pagamento', error);
    }
  };

  const handleSalvarPagamentoParcial = async (mesaId: number, novosPagamentos: PagamentoMock[]) => {
    try {
      const comanda = await getComandaAtiva(mesaId);
      if (!comanda) return;

      for (const pag of novosPagamentos) {
        await apiFetch(`${API_BASE}/pagamentos/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comanda: comanda.id,
            valor: pag.valor,
            valor_gorjeta: pag.valor_gorjeta || 0,
            forma_pagamento: pag.metodo
          })
        });
      }

      await carregarDados();
    } catch (error) {
      console.error('Erro ao salvar pagamento parcial', error);
    }
  };

  const handleEstornarPagamento = async (pagamentoId: string) => {
    try {
      await apiFetch(`${API_BASE}/pagamentos/${pagamentoId}/`, {
        method: 'DELETE'
      });
      carregarDados();
    } catch (error) {
      console.error('Erro ao estornar pagamento', error);
    }
  };

  const handleAddMesa = async (numero: number, capacidade: number) => {
    try {
      const response = await apiFetch(`${API_BASE}/mesas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero,
          capacidade,
          status: 'Livre'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.numero ? `A mesa ${numero} já está cadastrada no sistema.` : 'Erro desconhecido ao cadastrar mesa.';
        return { success: false, error: errorMsg };
      }

      setIsNovaMesaModalOpen(false);
      carregarDados();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: 'Erro de conexão ao adicionar mesa.' };
    }
  };

  const handleUpdateMesa = async (id: number, numero: number, capacidade: number) => {
    try {
      const response = await apiFetch(`${API_BASE}/mesas/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero, capacidade })
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.numero ? `A mesa ${numero} já está cadastrada no sistema.` : 'Erro ao atualizar mesa.';
        return { success: false, error: errorMsg };
      }
      carregarDados();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: 'Erro de conexão ao atualizar mesa.' };
    }
  };

  const handleDeleteMesa = async (id: number) => {
    try {
      await apiFetch(`${API_BASE}/mesas/${id}/`, { method: 'DELETE' });
      carregarDados();
    } catch (error: any) {
      console.error('Erro ao excluir mesa:', error);
    }
  };

  const handleReorderMesas = async (mesasIds: number[]) => {
    // Atualiza otimista no front-end primeiro
    const novasMesas = mesas.map(mesa => {
      const novaOrdem = mesasIds.indexOf(mesa.id);
      return { ...mesa, ordem: novaOrdem !== -1 ? novaOrdem : mesa.ordem };
    });
    // Ordena localmente pela nova ordem antes de setar
    novasMesas.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    setMesas(novasMesas);

    try {
      await apiFetch(`${API_BASE}/mesas/reordenar/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesas_ids: mesasIds })
      });
    } catch (error: any) {
      console.error('Erro ao reordenar mesas:', error);
      carregarDados(); // rollback em caso de falha
    }
  };

  return {
    searchTerm,
    setSearchTerm,
    produtos,
    mesas,
    itensComanda,
    mesaSelecionadaId,
    setMesaSelecionadaId,
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    pagamentosParciais,
    groupingOriginId,
    setGroupingOriginId,
    groupingSelectedIds,
    setGroupingSelectedIds,
    transferOriginId,
    setTransferOriginId,
    transferDestinationId,
    setTransferDestinationId,
    mesaSelecionada,
    mesasFiltradas,
    handleAdicionarItens,
    handleCancelarItem,
    handleCancelarItensMassa,
    handleTransferirMesa,
    handleGroupClick,
    handleCardClick,
    handleConfirmarAgrupamento,
    handleFinalizarPagamento,
    handleSalvarPagamentoParcial,
    handleEstornarPagamento,
    carregarDados,
    isNovaMesaModalOpen,
    setIsNovaMesaModalOpen,
    handleAddMesa,
    isEditMode,
    setIsEditMode,
    handleUpdateMesa,
    handleDeleteMesa,
    handleReorderMesas
  };
}
