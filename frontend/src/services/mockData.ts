export type MesaStatus = 'Livre' | 'Ocupada' | 'Aguardando Pagamento';

export interface MesaMock {
  id: number;
  numero: number;
  status: MesaStatus;
  capacidade: number;
  tempo_ocupacao?: string; // Mantido para compatibilidade, mas vamos usar hora_abertura
  valor_parcial?: number;
  hora_abertura?: number; // Timestamp de quando a mesa foi aberta
  grupo_id?: string; // Identificador para mesas unidas/agrupadas
  ordem?: number;
  tem_pedido_pronto?: boolean;
}

export interface ProdutoMock {
  id: number;
  nome: string;
  preco: number;
  categoria: string;
  setor?: string;
}

export interface ItemComandaMock {
  id: string; // usar string para gerar IDs unicos no front (ex: Date.now().toString())
  mesa_id: number;
  produto_id?: number;
  produto_nome: string;
  produto_setor?: string;
  quantidade: number;
  preco_unitario: number;
  observacoes?: string;
  entregar_junto_com_prato?: boolean;
  horario_pedido: string;
}

export type MetodoPagamento = 'PIX' | 'DINHEIRO' | 'CREDITO' | 'DEBITO';

export interface PagamentoMock {
  id: string;
  mesa_id: number;
  metodo: MetodoPagamento;
  valor: number;
  valor_gorjeta?: number;
}

// O arquivo agora serve apenas para exportar as definições de Tipos/Interfaces

