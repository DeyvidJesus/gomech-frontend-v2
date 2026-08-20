import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { iamApi } from '../api/iam';
import { getApiErrorMessage } from '@/shared/utils/formErrors';

export function CompanySettings() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'UNITS' | 'PROFILE' | 'REGIONAL'>('UNITS');
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // Fetch Units
  const { data: units = [], isLoading: isLoadingUnits, isError, error } = useQuery({
    queryKey: ['iam', 'units'],
    queryFn: () => iamApi.units().then((r) => r.data),
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            Configurações da Empresa & Filiais
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Gerencie as filiais físicas, matriz, dados cadastrais e preferências operacionais da oficina.
          </p>
        </div>

        {activeTab === 'UNITS' && (
          <button
            onClick={() => setIsUnitModalOpen(true)}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:bg-primary-container transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_business</span>
            Nova Filial
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-outline-variant pb-1">
        <button
          onClick={() => setActiveTab('UNITS')}
          className={`pb-2.5 font-label-md text-label-md font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'UNITS'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">domain</span>
          Filiais & Unidades ({units.length})
        </button>

        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`pb-2.5 font-label-md text-label-md font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'PROFILE'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">business</span>
          Dados da Empresa
        </button>

        <button
          onClick={() => setActiveTab('REGIONAL')}
          className={`pb-2.5 font-label-md text-label-md font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'REGIONAL'
              ? 'border-primary text-primary'
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">public</span>
          Configurações Regionais
        </button>
      </div>

      {/* Tab: Units & Branches */}
      {activeTab === 'UNITS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingUnits ? (
              <div className="col-span-full py-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
                  progress_activity
                </span>
                <p className="mt-2 font-medium">Carregando unidades...</p>
              </div>
            ) : isError ? (
              <div className="col-span-full py-12 text-center text-error">
                Erro ao carregar unidades: {(error as Error)?.message || 'Erro desconhecido'}
              </div>
            ) : units.length === 0 ? (
              <div className="col-span-full py-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px] text-outline">
                  storefront
                </span>
                <p className="font-semibold text-on-surface text-body-lg mt-1">
                  Nenhuma filial cadastrada
                </p>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  Cadastre sua primeira unidade para gerenciar atendimentos e estoque.
                </p>
              </div>
            ) : (
              units.map((unit) => (
                <div
                  key={unit.id}
                  className="p-5 rounded-xl border border-outline-variant bg-surface-container-lowest hover:bg-surface-bright transition-all shadow-xs flex flex-col justify-between group relative overflow-hidden"
                >
                  {unit.isHeadquarters && (
                    <div className="absolute top-0 right-0 bg-primary text-on-primary font-label-sm text-[10px] font-bold px-3 py-0.5 rounded-bl-lg">
                      Matriz Principal
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-center text-primary font-headline-sm">
                        <span className="material-symbols-outlined text-[22px]">storefront</span>
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                          {unit.name}
                        </h3>
                        <span className="text-[11px] font-mono text-on-surface-variant">
                          ID: {unit.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>

                    <p className="text-body-sm text-on-surface-variant mt-2 flex items-start gap-1.5">
                      <span className="material-symbols-outlined text-[16px] shrink-0 text-outline mt-0.5">
                        location_on
                      </span>
                      <span>{unit.address || 'Endereço não informado'}</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11px] text-tertiary font-bold">
                      <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                      Operacional
                    </span>

                    <button
                      type="button"
                      className="text-label-sm font-semibold text-primary hover:underline"
                    >
                      Editar Detalhes
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Company Profile */}
      {activeTab === 'PROFILE' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs max-w-4xl space-y-6">
          <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface pb-3 border-b border-outline-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">business</span>
            Perfil Cadastral da Empresa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
                Razão Social
              </label>
              <input
                type="text"
                readOnly
                value="GoMech Automotive Solutions Ltda."
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface font-medium"
              />
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
                Nome Fantasia
              </label>
              <input
                type="text"
                readOnly
                value="Oficina GoMech Precision"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface font-medium"
              />
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
                CNPJ
              </label>
              <input
                type="text"
                readOnly
                value="12.345.678/0001-90"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg font-mono text-body-md text-on-surface font-medium"
              />
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
                E-mail de Contato Geral
              </label>
              <input
                type="email"
                readOnly
                value="contato@gomech.com.br"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface"
              />
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
                Telefone Principal
              </label>
              <input
                type="tel"
                readOnly
                value="(11) 3456-7890"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Regional Settings */}
      {activeTab === 'REGIONAL' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs max-w-4xl space-y-6">
          <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface pb-3 border-b border-outline-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">public</span>
            Localização & Moeda
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
                Moeda Padrão
              </label>
              <select
                disabled
                value="BRL"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface"
              >
                <option value="BRL">Real Brasileiro (R$)</option>
                <option value="USD">Dólar Americano ($)</option>
              </select>
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
                Fuso Horário
              </label>
              <select
                disabled
                value="BRT"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface"
              >
                <option value="BRT">América/São Paulo (UTC-3)</option>
              </select>
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
                Idioma do Sistema
              </label>
              <select
                disabled
                value="PT_BR"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface"
              >
                <option value="PT_BR">Português (Brasil)</option>
                <option value="EN_US">English (US)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Unit */}
      {isUnitModalOpen && (
        <CreateUnitModal
          onClose={() => setIsUnitModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['iam', 'units'] });
            setIsUnitModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// Sub-component: CreateUnitModal
interface CreateUnitModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateUnitModal({ onClose, onSuccess }: CreateUnitModalProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isHeadquarters, setIsHeadquarters] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      iamApi.createUnit({
        name: name.trim(),
        address: address.trim() || undefined,
        isHeadquarters,
      }),
    onSuccess,
    onError: (err) => {
      setErrorMsg(getApiErrorMessage(err, 'Erro ao cadastrar filial/unidade.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('Informe o nome da filial.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">add_business</span>
            Cadastrar Nova Filial
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-error-container text-on-error-container rounded-lg text-body-sm font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
              Nome da Filial / Unidade <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Filial Zona Sul"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
              Endereço Completo
            </label>
            <input
              type="text"
              placeholder="Ex: Av. das Nações Unidas, 1200 - Santo Amaro"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <label className="p-3 rounded-lg border border-outline-variant bg-surface flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isHeadquarters}
              onChange={(e) => setIsHeadquarters(e.target.checked)}
              className="rounded border-outline-variant text-primary focus:ring-primary"
            />
            <div>
              <span className="font-label-md text-label-md font-semibold text-on-surface block">
                Definir como Matriz Principal
              </span>
              <span className="text-[11px] text-on-surface-variant block">
                Esta unidade será a sede fiscal e centro de controle padrão.
              </span>
            </div>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:bg-primary-container transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {createMutation.isPending && (
                <span className="material-symbols-outlined animate-spin text-[16px]">
                  progress_activity
                </span>
              )}
              Salvar Filial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
