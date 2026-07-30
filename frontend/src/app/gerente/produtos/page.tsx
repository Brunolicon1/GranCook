'use client';

import { useState, useEffect } from 'react';
import { apiFetch, API_BASE } from '@/services/apiClient';
import { Plus, Search, Edit2, Check, X, Box, Tag, Utensils } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  preco_venda: string | number;
  ativo: boolean;
  setor: string;
}

export default function GestaoProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Controle do modal de edição/criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  
  // Form states
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [setor, setSetor] = useState('Cozinha');
  const [ativo, setAtivo] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchProdutos = async () => {
    setIsLoading(true);
    try {
      // O Gerente busca TODOS os produtos (sem ?ativo=true)
      const res = await apiFetch(`${API_BASE}/pdv/produtos/`);
      if (!res.ok) throw new Error('Falha ao buscar produtos');
      const data = await res.json();
      setProdutos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const openModalNovo = () => {
    setEditingProduto(null);
    setNome('');
    setDescricao('');
    setPrecoVenda('');
    setSetor('Cozinha');
    setAtivo(true);
    setError('');
    setIsModalOpen(true);
  };

  const openModalEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setNome(produto.nome);
    setDescricao(produto.descricao || '');
    setPrecoVenda(produto.preco_venda.toString());
    setSetor(produto.setor);
    setAtivo(produto.ativo);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const payload = {
      nome,
      descricao: descricao || null,
      preco_venda: parseFloat(precoVenda.replace(',', '.')),
      setor,
      ativo
    };

    if (isNaN(payload.preco_venda)) {
      setError('Preço inválido');
      setIsSaving(false);
      return;
    }

    try {
      const url = editingProduto 
        ? `${API_BASE}/pdv/produtos/${editingProduto.id}/` 
        : `${API_BASE}/pdv/produtos/`;
        
      const res = await apiFetch(url, {
        method: editingProduto ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(JSON.stringify(errData));
      }

      await fetchProdutos();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(`Erro ao salvar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (produto: Produto) => {
    try {
      const res = await apiFetch(`${API_BASE}/pdv/produtos/${produto.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !produto.ativo })
      });
      if (res.ok) {
        setProdutos(produtos.map(p => p.id === produto.id ? { ...p, ativo: !p.ativo } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.setor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto w-full h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Gestão de Cardápio</h2>
          <p className="text-slate-400 mt-1">Gerencie os produtos, preços e setores</p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl py-2 pl-10 pr-4 outline-none focus:border-indigo-500 focus:bg-slate-800 transition-all placeholder-slate-500"
            />
          </div>
          <button 
            onClick={openModalNovo}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] whitespace-nowrap"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Novo Produto</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800/50 sticky top-0 z-10 backdrop-blur-sm">
              <tr className="text-slate-400 text-xs uppercase tracking-wider">
                <th className="py-4 pl-6 font-bold">Produto</th>
                <th className="py-4 px-4 font-bold">Setor</th>
                <th className="py-4 px-4 font-bold text-right">Preço Venda</th>
                <th className="py-4 px-4 font-bold text-center">Status</th>
                <th className="py-4 pr-6 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                    Carregando cardápio...
                  </td>
                </tr>
              ) : produtosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              ) : (
                produtosFiltrados.map((produto) => (
                  <tr key={produto.id} className={`hover:bg-slate-800/30 transition-colors ${!produto.ativo ? 'opacity-60' : ''}`}>
                    <td className="py-4 pl-6 text-white font-medium flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${produto.setor === 'Cozinha' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>
                        {produto.setor === 'Cozinha' ? <Utensils size={16} /> : <Box size={16} />}
                      </div>
                      <div>
                        {produto.nome}
                        {produto.descricao && <p className="text-xs text-slate-500 font-normal line-clamp-1">{produto.descricao}</p>}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                        produto.setor === 'Cozinha' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {produto.setor}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-black text-white">
                      {formatCurrency(Number(produto.preco_venda))}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button 
                        onClick={() => handleToggleStatus(produto)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          produto.ativo 
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' 
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'
                        }`}
                      >
                        {produto.ativo ? <Check size={12} /> : <X size={12} />}
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="py-4 pr-6 text-right">
                      <button 
                        onClick={() => openModalEdit(produto)}
                        className="p-2 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-400 rounded-lg transition-colors"
                        title="Editar produto"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-700 flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Tag className="text-indigo-400" size={20} />
                {editingProduto ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">Nome do Produto *</label>
                <input 
                  type="text" 
                  required
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-slate-800/80 transition-colors"
                  placeholder="Ex: X-Salada Especial"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">Preço de Venda (R$) *</label>
                <input 
                  type="text" 
                  required
                  value={precoVenda}
                  onChange={e => setPrecoVenda(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-slate-800/80 transition-colors font-mono"
                  placeholder="Ex: 35,00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-400 mb-1">Setor de Produção *</label>
                  <select 
                    value={setor}
                    onChange={e => setSetor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 transition-colors appearance-none"
                  >
                    <option value="Cozinha">Cozinha (Lanches, Pratos)</option>
                    <option value="Copa">Copa (Bebidas, Sobremesas)</option>
                    <option value="Bar">Bar (Drinks)</option>
                  </select>
                </div>
                
                <div className="flex flex-col justify-center">
                  <label className="block text-sm font-bold text-slate-400 mb-2">Status Inicial</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={ativo} onChange={() => setAtivo(!ativo)} />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    <span className="ml-3 text-sm font-medium text-slate-300">{ativo ? 'Ativo' : 'Inativo'}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-400 mb-1">Descrição (Opcional)</label>
                <textarea 
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-slate-800/80 transition-colors resize-none h-24"
                  placeholder="Descrição que pode aparecer em cardápios ou para o garçom..."
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
