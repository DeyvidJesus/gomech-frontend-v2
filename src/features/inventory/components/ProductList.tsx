import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { inventoryApi } from '../api/inventoryApi';
import type { Product } from '../types';
import { toast } from '@/shared/utils/toast';

export function ProductList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(0);

  // Fetch products
  const { data: response, isLoading } = useQuery({
    queryKey: ['inventory', 'products', search, selectedCategory, selectedStatus, page],
    queryFn: () =>
      inventoryApi
        .getProducts({
          search: search || undefined,
          category: selectedCategory || undefined,
          active: selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined,
          page,
          size: 15,
        })
        .then((r) => r.data)
        .catch(() => ({ content: [], totalElements: 0, totalPages: 1 })),
  });

  // Soft delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
      toast.success('Produto desativado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao desativar produto.');
    },
  });

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const products: Product[] = response?.content || [];
  const totalPages = response?.totalPages || 1;
  const totalElements = response?.totalElements || 0;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[24px]">inventory_2</span>
            </span>
            <h1 className="text-2xl font-bold font-headline-md text-on-surface">Catálogo de Estoque</h1>
          </div>
          <p className="text-sm text-on-surface-variant mt-1">
            Gestão de peças, lubrificantes, consumíveis e controle de estoque
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/inventory/stocks"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-outline-variant/80 text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">warehouse</span>
            Saldos & Alertas
          </Link>
          <Link
            to="/inventory/transfers"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-outline-variant/80 text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            Transferências
          </Link>
          <Link
            to="/inventory/movements"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border border-outline-variant/80 text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">history</span>
            Livro-Razão
          </Link>
          <Link
            to="/inventory/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Novo Produto
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant material-symbols-outlined text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar por nome, SKU, código de barras ou marca..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(0);
            }}
            aria-label="Filtrar por Categoria"
            className="px-3 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Todas Categorias</option>
            <option value="Suspensão">Suspensão</option>
            <option value="Freios">Freios</option>
            <option value="Motor">Motor</option>
            <option value="Lubrificantes">Lubrificantes</option>
            <option value="Filtros">Filtros</option>
            <option value="Elétrica">Elétrica</option>
            <option value="Ignição">Ignição</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(0);
            }}
            aria-label="Filtrar por Status"
            className="px-3 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Todos Status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
            <p className="text-sm font-medium">Carregando catálogo de produtos...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant flex flex-col items-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">inventory_2</span>
            <h3 className="text-lg font-semibold text-on-surface">Nenhum produto encontrado</h3>
            <p className="text-sm text-on-surface-variant mt-1 max-w-[380px]">
              Cadastre suas primeiras peças e consumíveis para gerenciar estoque e precificação.
            </p>
            <Link
              to="/inventory/products/new"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary-container transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Cadastrar Produto
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low text-on-surface-variant text-[12px] uppercase font-semibold tracking-wider">
                  <th className="py-3.5 px-5">Produto / SKU</th>
                  <th className="py-3.5 px-4">Categoria & Marca</th>
                  <th className="py-3.5 px-4">Unidade</th>
                  <th className="py-3.5 px-4 text-right">Preço de Custo</th>
                  <th className="py-3.5 px-4 text-right">Preço de Venda</th>
                  <th className="py-3.5 px-4 text-center">Margem</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-sm">
                {products.map((p) => {
                  const marginPercent =
                    p.costPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.costPrice) * 100).toFixed(1) : '100';

                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-surface-container-low/50 transition-colors group"
                    >
                      {/* Product & SKU */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary font-bold text-xs border border-outline-variant/40 flex-shrink-0">
                            {p.category ? p.category.substring(0, 2).toUpperCase() : 'PC'}
                          </div>
                          <div>
                            <div className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                              {p.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                                {p.skuCode}
                              </span>
                              {p.barcode && (
                                <span className="text-[11px] text-on-surface-variant/70 font-mono">
                                  #{p.barcode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3.5 px-4">
                        <div className="text-on-surface font-medium">{p.category || 'Geral'}</div>
                        <div className="text-xs text-on-surface-variant">{p.brand || 'Genérico'}</div>
                      </td>

                      {/* Unit */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-on-surface-variant border border-outline-variant/40">
                          {p.unitOfMeasure}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-4 text-right font-mono text-on-surface-variant">
                        R$ {Number(p.costPrice).toFixed(2)}
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-on-surface">
                        R$ {Number(p.sellingPrice).toFixed(2)}
                      </td>

                      {/* Margin % */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-tertiary-container/30 text-tertiary font-mono">
                          +{marginPercent}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        {p.active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-tertiary-container/30 text-tertiary">
                            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container text-on-surface-variant">
                            <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to="/inventory/products/$id"
                            params={{ id: p.id }}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                            title="Editar Produto"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors"
                            title="Desativar Produto"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant/40 bg-surface-container-low/40">
            <span className="text-xs text-on-surface-variant">
              Total de <strong className="text-on-surface">{totalElements}</strong> itens
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 text-xs font-semibold rounded-lg border border-outline-variant/60 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container"
              >
                Anterior
              </button>
              <span className="text-xs text-on-surface-variant px-2">
                Página {page + 1} de {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="px-3 py-1 text-xs font-semibold rounded-lg border border-outline-variant/60 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-container"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
