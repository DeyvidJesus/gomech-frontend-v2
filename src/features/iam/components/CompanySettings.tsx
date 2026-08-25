import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { iamApi, type Unit, type UpdateCompanyProfileRequest, type UpdateUnitRequest } from '../api/iam';
import { getApiErrorMessage } from '@/shared/utils/formErrors';
import { cnpjService } from '@/shared/services/cnpjService';
import { toast } from '@/shared/utils/toast';

export function CompanySettings() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'UNITS' | 'PROFILE' | 'REGIONAL'>('UNITS');
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

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
            Gerencie filiais físicas, matriz, dados cadastrais na Receita Federal, logomarca e preferências da oficina.
          </p>
        </div>

        {activeTab === 'UNITS' && (
          <button
            onClick={() => setIsUnitModalOpen(true)}
            className="px-4 py-2.5 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-bold hover:bg-primary-container transition-all shadow-sm flex items-center gap-2"
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
          Dados da Empresa & Logomarca
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
                  className="p-5 rounded-2xl border border-outline-variant/70 bg-surface-container-lowest hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between group relative overflow-hidden"
                >
                  {unit.isHeadquarters && (
                    <div className="absolute top-0 right-0 bg-primary text-on-primary font-label-sm text-[11px] font-bold px-3 py-1 rounded-bl-xl shadow-xs">
                      Matriz Principal
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-surface-container border border-outline-variant/60 flex items-center justify-center text-primary overflow-hidden shrink-0">
                        {unit.logoUrl ? (
                          <img src={unit.logoUrl} alt={unit.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[24px]">storefront</span>
                        )}
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

                    <div className="space-y-1.5 mt-3 text-body-sm text-on-surface-variant">
                      <p className="flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-[16px] shrink-0 text-outline mt-0.5">
                          location_on
                        </span>
                        <span>{unit.address || 'Endereço não informado'}</span>
                      </p>
                      {/* Optional phone or technical manager */}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-outline-variant/50 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs text-tertiary font-bold">
                      <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                      Operacional
                    </span>

                    <button
                      type="button"
                      onClick={() => setEditingUnit(unit)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary-container/20 transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
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
      {activeTab === 'PROFILE' && <CompanyProfileTab />}

      {/* Tab: Regional Settings */}
      {activeTab === 'REGIONAL' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm max-w-[960px] space-y-6">
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
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-xl text-body-md text-on-surface"
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
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-xl text-body-md text-on-surface"
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
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-xl text-body-md text-on-surface"
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
            toast.success('Nova filial cadastrada com sucesso!');
          }}
        />
      )}

      {/* Modal: Edit Unit */}
      {editingUnit && (
        <EditUnitModal
          unit={editingUnit}
          onClose={() => setEditingUnit(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['iam', 'units'] });
            setEditingUnit(null);
            toast.success('Detalhes da filial atualizados com sucesso!');
          }}
        />
      )}
    </div>
  );
}

// Sub-component: CompanyProfileTab
function CompanyProfileTab() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['iam', 'company-profile'],
    queryFn: () => iamApi.getCompanyProfile().then((r) => r.data),
  });

  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setTradeName(profile.tradeName || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setLogoUrl(profile.logoUrl || '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCompanyProfileRequest) => iamApi.updateCompanyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iam', 'company-profile'] });
      toast.success('Perfil da empresa e logomarca atualizados com sucesso!');
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Erro ao atualizar dados da empresa.'));
    },
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem da logomarca deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoUrl(reader.result as string);
      toast.success('Logomarca carregada para pré-visualização.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('A Razão Social é obrigatória.');
      return;
    }

    updateMutation.mutate({
      name: name.trim(),
      tradeName: tradeName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      logoUrl: logoUrl || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-on-surface-variant">
        <span className="material-symbols-outlined animate-spin text-[28px] text-primary">progress_activity</span>
        <p className="mt-2 text-sm font-medium">Carregando dados da empresa...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm max-w-[960px] space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
        <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[22px]">business</span>
          Perfil Cadastral & Logomarca da Oficina
        </h2>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <span className="material-symbols-outlined text-[14px]">verified</span>
          CNPJ Registrado na Receita
        </span>
      </div>

      {/* Logo Upload Section */}
      <div className="p-4 rounded-xl border border-outline-variant/70 bg-surface-container-low/40 flex flex-col sm:flex-row items-center gap-5">
        <div className="w-24 h-24 rounded-2xl bg-surface-container border border-outline-variant flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo da Empresa" className="w-full h-full object-contain p-1" />
          ) : (
            <span className="material-symbols-outlined text-[40px] text-outline">image</span>
          )}
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1">
          <h4 className="text-sm font-bold text-on-surface">Logomarca da Oficina</h4>
          <p className="text-xs text-on-surface-variant max-w-[480px]">
            Esta logo será exibida no cabeçalho do ERP, nos portais públicos de orçamentos para os clientes e nas impressões de Ordens de Serviço.
          </p>
          <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
            <label className="cursor-pointer px-3 py-1.5 bg-surface border border-outline-variant rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors inline-flex items-center gap-1.5 shadow-xs">
              <span className="material-symbols-outlined text-[16px] text-primary">upload</span>
              Alterar Logomarca
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-error hover:bg-error-container/20 transition-colors"
              >
                Remover
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CNPJ (Immutable) */}
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1 flex items-center justify-between">
            <span>CNPJ da Matriz</span>
            <span className="text-[11px] text-primary font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[13px]">lock</span>
              Imutável
            </span>
          </label>
          <input
            type="text"
            readOnly
            disabled
            value={profile?.cnpj || 'Não informado'}
            className="w-full h-10 px-3 bg-surface-container-low/60 border border-outline-variant/60 rounded-xl font-mono text-body-md text-on-surface-variant font-medium cursor-not-allowed opacity-90"
            title="O CNPJ é a chave primária da empresa e não pode ser alterado."
          />
        </div>

        {/* Razão Social */}
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface font-medium mb-1">
            Razão Social <span className="text-error">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-xl text-body-md text-on-surface font-medium focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Nome Fantasia */}
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface font-medium mb-1">
            Nome Fantasia da Oficina
          </label>
          <input
            type="text"
            value={tradeName}
            onChange={(e) => setTradeName(e.target.value)}
            className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-xl text-body-md text-on-surface font-medium focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* E-mail */}
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface font-medium mb-1">
            E-mail de Contato Geral
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-xl text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Telefone */}
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface font-medium mb-1">
            Telefone / WhatsApp Principal
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 98765-4321"
            className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-xl text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Endereço */}
        <div>
          <label className="block font-label-sm text-label-sm text-on-surface font-medium mb-1">
            Endereço Principal
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-xl text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-outline-variant">
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-label-md font-bold hover:bg-primary-container transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          {updateMutation.isPending ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">save</span>
          )}
          Salvar Alterações
        </button>
      </div>
    </form>
  );
}

// Sub-component: EditUnitModal
interface EditUnitModalProps {
  unit: Unit;
  onClose: () => void;
  onSuccess: () => void;
}

function EditUnitModal({ unit, onClose, onSuccess }: EditUnitModalProps) {
  const [name, setName] = useState(unit.name || '');
  const [address, setAddress] = useState(unit.address || '');
  const [phone, setPhone] = useState('');
  const [technicalManager, setTechnicalManager] = useState('');
  const [logoUrl, setLogoUrl] = useState(unit.logoUrl || '');
  const [isHeadquarters, setIsHeadquarters] = useState(Boolean(unit.isHeadquarters || unit.headquarters));
  const [cepSearch, setCepSearch] = useState('');
  const [searchingCep, setSearchingCep] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUnitRequest) => iamApi.updateUnit(unit.id, data),
    onSuccess,
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Erro ao atualizar filial.'));
    },
  });

  const handleLookupCep = async () => {
    if (cepSearch.replace(/\D/g, '').length !== 8) return;
    setSearchingCep(true);
    const res = await cnpjService.fetchByCep(cepSearch);
    setSearchingCep(false);
    if (res) {
      const fullAddr = `${res.logradouro}, ${res.bairro} - ${res.municipio}/${res.uf} - CEP: ${res.cep}`;
      setAddress(fullAddr);
      toast.success('Endereço preenchido automaticamente via CEP.');
    } else {
      toast.error('CEP não localizado.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('O nome da filial é obrigatório.');
      return;
    }

    updateMutation.mutate({
      name: name.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      technicalManager: technicalManager.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      isHeadquarters,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-[520px] w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">edit_note</span>
            Editar Detalhes da Filial
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Nome da Unidade / Filial <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface font-medium focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Buscar Endereço por CEP
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="00000-000"
                value={cepSearch}
                onChange={(e) => setCepSearch(e.target.value)}
                className="w-36 h-10 px-3 bg-surface border border-outline-variant rounded-xl text-sm font-mono text-on-surface"
              />
              <button
                type="button"
                onClick={handleLookupCep}
                disabled={searchingCep}
                className="px-3.5 h-10 rounded-xl bg-surface-container border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
              >
                {searchingCep ? (
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">search</span>
                )}
                Buscar CEP
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Endereço Completo
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Paulista, 1000 - Bela Vista - São Paulo/SP"
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Telefone da Filial
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 3456-7890"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Responsável Técnico
              </label>
              <input
                type="text"
                value={technicalManager}
                onChange={(e) => setTechnicalManager(e.target.value)}
                placeholder="Ex: Carlos Mecânico Chefe"
                className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              URL da Logomarca da Filial
            </label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://exemplo.com/logo.png"
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-on-surface">
              <input
                type="checkbox"
                checked={isHeadquarters}
                onChange={(e) => setIsHeadquarters(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              Definir como Matriz Principal da Oficina
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline-variant rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-5 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5"
            >
              {updateMutation.isPending && (
                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              )}
              Salvar Detalhes
            </button>
          </div>
        </form>
      </div>
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
  const [cepSearch, setCepSearch] = useState('');
  const [isHeadquarters, setIsHeadquarters] = useState(false);
  const [searchingCep, setSearchingCep] = useState(false);

  const createMutation = useMutation({
    mutationFn: () =>
      iamApi.createUnit({
        name: name.trim(),
        address: address.trim() || undefined,
        isHeadquarters,
      }),
    onSuccess,
    onError: (err) => {
      toast.error(getApiErrorMessage(err, 'Erro ao cadastrar filial/unidade.'));
    },
  });

  const handleLookupCep = async () => {
    if (cepSearch.replace(/\D/g, '').length !== 8) return;
    setSearchingCep(true);
    const res = await cnpjService.fetchByCep(cepSearch);
    setSearchingCep(false);
    if (res) {
      const fullAddr = `${res.logradouro}, ${res.bairro} - ${res.municipio}/${res.uf} - CEP: ${res.cep}`;
      setAddress(fullAddr);
      toast.success('Endereço preenchido automaticamente via CEP.');
    } else {
      toast.error('CEP não localizado.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe o nome da filial.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-[480px] w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">add_business</span>
            Cadastrar Nova Filial
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Nome da Filial / Unidade <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Filial Zona Norte"
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface font-medium focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Preenchimento Automático por CEP
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="00000-000"
                value={cepSearch}
                onChange={(e) => setCepSearch(e.target.value)}
                className="w-36 h-10 px-3 bg-surface border border-outline-variant rounded-xl text-sm font-mono text-on-surface"
              />
              <button
                type="button"
                onClick={handleLookupCep}
                disabled={searchingCep}
                className="px-3.5 h-10 rounded-xl bg-surface-container border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
              >
                {searchingCep ? (
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">search</span>
                )}
                Buscar CEP
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Endereço da Unidade
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, Número, Bairro, Cidade/UF"
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-on-surface">
              <input
                type="checkbox"
                checked={isHeadquarters}
                onChange={(e) => setIsHeadquarters(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              Marcar como Matriz Principal
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline-variant rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-1.5"
            >
              {createMutation.isPending && (
                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              )}
              Criar Filial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
