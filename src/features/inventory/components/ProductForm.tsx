import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { inventoryApi } from '../api/inventoryApi';
import type { CreateProductDto, UpdateProductDto, UnitOfMeasure } from '../types';
import { useAuthStore } from '@/features/iam/stores/authStore';

interface ProductFormProps {
  productId?: string;
}

export function ProductForm({ productId }: ProductFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isEditing = Boolean(productId);

  // Form State
  const [skuCode, setSkuCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [barcode, setBarcode] = useState('');
  const [brand, setBrand] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure>('UN');
  const [costPrice, setCostPrice] = useState<number | ''>(0);
  const [sellingPrice, setSellingPrice] = useState<number | ''>(0);
  const [minStock, setMinStock] = useState<number | ''>(2);
  const [locationInWarehouse, setLocationInWarehouse] = useState('');
  const [initialStockQuantity, setInitialStockQuantity] = useState<number | ''>('');
  const [active, setActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch product for editing
  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['inventory', 'product', productId],
    queryFn: () => inventoryApi.getProduct(productId!).then((r) => r.data),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingProduct) {
      setSkuCode(existingProduct.skuCode || '');
      setName(existingProduct.name || '');
      setCategory(existingProduct.category || '');
      setBarcode(existingProduct.barcode || '');
      setBrand(existingProduct.brand || '');
      setUnitOfMeasure(existingProduct.unitOfMeasure || 'UN');
      setCostPrice(existingProduct.costPrice ?? 0);
      setSellingPrice(existingProduct.sellingPrice ?? 0);
      setMinStock(existingProduct.minStock ?? 0);
      setLocationInWarehouse(existingProduct.locationInWarehouse || '');
      setActive(existingProduct.active ?? true);
    }
  }, [existingProduct]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateProductDto) => inventoryApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      navigate({ to: '/inventory/products' });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Erro ao cadastrar produto.';
      setErrorMsg(msg);
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateProductDto) => inventoryApi.updateProduct(productId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      navigate({ to: '/inventory/products' });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Erro ao atualizar produto.';
      setErrorMsg(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!skuCode.trim()) {
      setErrorMsg('O código SKU é obrigatório.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('O nome do produto é obrigatório.');
      return;
    }

    const numCost = typeof costPrice === 'number' ? costPrice : 0;
    const numSell = typeof sellingPrice === 'number' ? sellingPrice : 0;
    const numMin = typeof minStock === 'number' ? minStock : 0;

    if (isEditing) {
      updateMutation.mutate({
        unitId: user?.activeUnitId,
        skuCode: skuCode.trim().toUpperCase(),
        name: name.trim(),
        category: category.trim() || undefined,
        barcode: barcode.trim() || undefined,
        brand: brand.trim() || undefined,
        unitOfMeasure,
        costPrice: numCost,
        sellingPrice: numSell,
        minStock: numMin,
        locationInWarehouse: locationInWarehouse.trim() || undefined,
        active,
      });
    } else {
      createMutation.mutate({
        unitId: user?.activeUnitId,
        skuCode: skuCode.trim().toUpperCase(),
        name: name.trim(),
        category: category.trim() || undefined,
        barcode: barcode.trim() || undefined,
        brand: brand.trim() || undefined,
        unitOfMeasure,
        costPrice: numCost,
        sellingPrice: numSell,
        minStock: numMin,
        locationInWarehouse: locationInWarehouse.trim() || undefined,
        initialStockQuantity: typeof initialStockQuantity === 'number' && initialStockQuantity > 0 ? initialStockQuantity : undefined,
        initialStockUnitId: user?.activeUnitId,
      });
    }
  };

  const numCost = typeof costPrice === 'number' ? costPrice : 0;
  const numSell = typeof sellingPrice === 'number' ? sellingPrice : 0;
  const profit = numSell - numCost;
  const marginPercent = numCost > 0 ? ((profit / numCost) * 100).toFixed(1) : '100';
  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingProduct) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
        <p className="text-sm font-medium">Carregando dados do produto...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/inventory/products"
            className="p-2 rounded-xl border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-headline-md text-on-surface">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </h1>
            <p className="text-sm text-on-surface-variant">
              {isEditing ? `Atualize as informações do item ${skuCode}` : 'Cadastre uma nova peça ou insumo para o estoque'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/inventory/products"
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-outline-variant/60 text-on-surface hover:bg-surface-container transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            form="product-form"
            disabled={isPending}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
          >
            {isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                Salvando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">save</span>
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Produto'}
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-error-container/40 border border-error/20 text-error text-sm font-medium flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">warning</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Seção 1: Identificação do Produto */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/40">
            <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
            <h2 className="text-base font-bold text-on-surface">Identificação do Produto</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Código SKU *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: OLEO-5W30, PAST-01"
                value={skuCode}
                onChange={(e) => setSkuCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface uppercase font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Nome / Descrição do Item *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Óleo Sintético 5W30 Mobil 1L"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Categoria
              </label>
              <input
                type="text"
                placeholder="Ex: Lubrificantes, Suspensão"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Marca / Fabricante
              </label>
              <input
                type="text"
                placeholder="Ex: Mobil, Bosch, Cofap"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Unidade de Medida *
              </label>
              <select
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value as UnitOfMeasure)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="UN">UN (Unidade)</option>
                <option value="L">L (Litro)</option>
                <option value="ML">ML (Mililitro)</option>
                <option value="KG">KG (Quilo)</option>
                <option value="G">G (Grama)</option>
                <option value="M">M (Metro)</option>
                <option value="CX">CX (Caixa)</option>
                <option value="PAR">PAR (Par)</option>
                <option value="JOGO">JOGO (Jogo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Código de Barras (EAN / GTIN)
              </label>
              <input
                type="text"
                placeholder="Ex: 7891234567890"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Seção 2: Precificação e Margem */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/40">
            <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
            <h2 className="text-base font-bold text-on-surface">Precificação & Lucratividade</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Preço de Custo (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Preço de Venda (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-mono font-bold text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Margem Calculada */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40 flex flex-col justify-center">
              <span className="text-xs font-semibold uppercase text-on-surface-variant">Margem de Lucro</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-tertiary">+{marginPercent}%</span>
                <span className="text-xs text-on-surface-variant font-mono">
                  (Lucro: R$ {profit.toFixed(2)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Seção 3: Parâmetros de Estoque */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/40">
            <span className="material-symbols-outlined text-primary text-[20px]">warehouse</span>
            <h2 className="text-base font-bold text-on-surface">Controle de Estoque</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Estoque Mínimo (Alerta)
              </label>
              <input
                type="number"
                min="0"
                placeholder="2"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-[11px] text-on-surface-variant mt-1">
                Dispara alerta quando o saldo for menor ou igual.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Localização no Armazém
              </label>
              <input
                type="text"
                placeholder="Ex: Prateleira A-12, Gaveta 3"
                value={locationInWarehouse}
                onChange={(e) => setLocationInWarehouse(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {!isEditing && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Saldo Inicial Físico (Opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={initialStockQuantity}
                  onChange={(e) =>
                    setInitialStockQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Adiciona saldo imediato na filial atual.
                </p>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
