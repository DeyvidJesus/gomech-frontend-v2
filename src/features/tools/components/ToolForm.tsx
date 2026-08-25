import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from '@tanstack/react-router';
import { toolsApi } from '../api/toolsApi';
import type { CreateToolDto, UpdateToolDto, ToolStatus } from '../types';
import { useAuthStore } from '@/features/iam/stores/authStore';

interface ToolFormProps {
  toolId?: string;
}

export function ToolForm({ toolId }: ToolFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isEditing = Boolean(toolId);

  // Form State
  const [assetTag, setAssetTag] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [locationInUnit, setLocationInUnit] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseCost, setPurchaseCost] = useState<number | ''>('');
  const [maintenanceInterval, setMaintenanceInterval] = useState<number | ''>(180);
  const [status, setStatus] = useState<ToolStatus>('AVAILABLE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['tools', 'categories'],
    queryFn: () => toolsApi.getCategories().then((r) => r.data),
  });

  // Fetch tool for editing
  const { data: existingTool, isLoading: isLoadingTool } = useQuery({
    queryKey: ['tools', 'detail', toolId],
    queryFn: () => toolsApi.getTool(toolId!).then((r) => r.data),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingTool) {
      setAssetTag(existingTool.assetTag || '');
      setSerialNumber(existingTool.serialNumber || '');
      setName(existingTool.name || '');
      setCategoryId(existingTool.categoryId || '');
      setBrand(existingTool.brand || '');
      setModel(existingTool.model || '');
      setLocationInUnit(existingTool.locationInUnit || '');
      setPurchaseDate(existingTool.purchaseDate || '');
      setPurchaseCost(existingTool.purchaseCost ?? '');
      setStatus(existingTool.status);
    }
  }, [existingTool]);

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateToolDto) => toolsApi.createTool(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      navigate({ to: '/tools' });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || err.response?.data?.message || 'Erro ao cadastrar equipamento.');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateToolDto) => toolsApi.updateTool(toolId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      navigate({ to: '/tools' });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.detail || err.response?.data?.message || 'Erro ao atualizar equipamento.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!assetTag.trim()) {
      setErrorMsg('A etiqueta de patrimônio é obrigatória.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('O nome do equipamento é obrigatório.');
      return;
    }

    const numCost = typeof purchaseCost === 'number' ? purchaseCost : undefined;

    if (isEditing) {
      updateMutation.mutate({
        categoryId: categoryId || undefined,
        assetTag: assetTag.trim().toUpperCase(),
        serialNumber: serialNumber.trim() || undefined,
        name: name.trim(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        status,
        locationInUnit: locationInUnit.trim() || undefined,
        purchaseDate: purchaseDate || undefined,
        purchaseCost: numCost,
      });
    } else {
      createMutation.mutate({
        unitId: user?.activeUnitId || '',
        categoryId: categoryId || undefined,
        assetTag: assetTag.trim().toUpperCase(),
        serialNumber: serialNumber.trim() || undefined,
        name: name.trim(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        locationInUnit: locationInUnit.trim() || undefined,
        purchaseDate: purchaseDate || undefined,
        purchaseCost: numCost,
        initialMaintenanceIntervalDays: typeof maintenanceInterval === 'number' && maintenanceInterval > 0 ? maintenanceInterval : undefined,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingTool) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
        <p className="text-sm font-medium">Carregando dados da ferramenta...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/tools"
            className="p-2 rounded-xl border border-outline-variant/60 text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-headline-md text-on-surface">
              {isEditing ? 'Editar Ferramenta' : 'Cadastrar Equipamento / Ferramenta'}
            </h1>
            <p className="text-sm text-on-surface-variant">
              {isEditing ? `Atualize as especificações do ativo ${assetTag}` : 'Registre uma ferramenta reutilizável com etiqueta de patrimônio'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/tools"
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-outline-variant/60 text-on-surface hover:bg-surface-container transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            form="tool-form"
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
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Ferramenta'}
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

      <form id="tool-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Seção 1: Identificação do Ativo */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/40">
            <span className="material-symbols-outlined text-primary text-[20px]">qr_code_2</span>
            <h2 className="text-base font-bold text-on-surface">Identificação do Ativo</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Etiqueta / Patrimônio *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: TORQ-01, SCAN-03"
                value={assetTag}
                onChange={(e) => setAssetTag(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Nome do Equipamento *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Torquímetro de Estalo 1/2 40-200Nm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Geral / Sem Categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.requiresCalibration ? '(Exige Calibração)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Marca / Fabricante
              </label>
              <input
                type="text"
                placeholder="Ex: Gedore, Bosch, Raven"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Modelo / Versão
              </label>
              <input
                type="text"
                placeholder="Ex: Torcofix-K 4550-20"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Número de Série
              </label>
              <input
                type="text"
                placeholder="Ex: SN-12345678"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Localização Física na Oficina
              </label>
              <input
                type="text"
                placeholder="Ex: Armário 2 - Gaveta 03"
                value={locationInUnit}
                onChange={(e) => setLocationInUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {isEditing && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Status Operacional
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ToolStatus)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="AVAILABLE">Disponível</option>
                  <option value="IN_USE">Em Uso</option>
                  <option value="IN_MAINTENANCE">Em Manutenção</option>
                  <option value="IN_TRANSIT">Em Trânsito</option>
                  <option value="DECOMMISSIONED">Desativado</option>
                  <option value="LOST">Extraviado</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Seção 2: Aquisição & Manutenção */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/40">
            <span className="material-symbols-outlined text-primary text-[20px]">build_circle</span>
            <h2 className="text-base font-bold text-on-surface">Aquisição & Calibração</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Data de Aquisição
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Valor de Aquisição (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {!isEditing && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Intervalo de Calibração (Dias)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="180"
                  value={maintenanceInterval}
                  onChange={(e) =>
                    setMaintenanceInterval(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                  }
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-mono text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Define o vencimento inicial da próxima aferição.
                </p>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
