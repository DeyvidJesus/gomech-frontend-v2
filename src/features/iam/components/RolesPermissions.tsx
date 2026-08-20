import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { iamApi, type Permission } from '../api/iam';
import { getApiErrorMessage } from '@/shared/utils/formErrors';

export function RolesPermissions() {
  const queryClient = useQueryClient();

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch Roles
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['iam', 'roles'],
    queryFn: () => iamApi.roles().then((r) => r.data),
  });

  // Fetch All Available System Permissions
  const { data: allPermissions = [], isLoading: isLoadingPerms } = useQuery({
    queryKey: ['iam', 'permissions'],
    queryFn: () => iamApi.permissions().then((r) => r.data),
  });

  // Active Role
  const activeRole = useMemo(() => {
    if (selectedRoleId) {
      return roles.find((r) => r.id === selectedRoleId) || roles[0];
    }
    return roles[0];
  }, [roles, selectedRoleId]);

  // Group all permissions by module
  const permissionsByModule = useMemo(() => {
    const map = new Map<string, Permission[]>();
    allPermissions.forEach((p) => {
      const existing = map.get(p.module) || [];
      existing.push(p);
      map.set(p.module, existing);
    });
    return map;
  }, [allPermissions]);

  const moduleTitles: Record<string, { label: string; icon: string }> = {
    CRM: { label: 'CRM & Clientes', icon: 'group' },
    OPERATIONS: { label: 'Operações & Oficina', icon: 'build' },
    INVENTORY: { label: 'Estoque & Peças', icon: 'inventory_2' },
    FINANCE: { label: 'Financeiro', icon: 'payments' },
    IAM: { label: 'Acessos & Segurança', icon: 'admin_panel_settings' },
    BILLING: { label: 'Faturamento & Assinatura', icon: 'credit_card' },
    AI: { label: 'Inteligência Artificial', icon: 'smart_toy' },
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            Papéis & Permissões (RBAC)
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Configure níveis de acesso granulares para cada função na oficina.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:bg-primary-container transition-all shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Novo Papel Customizado
        </button>
      </div>

      {/* Main Grid: Left Roles List, Right Permissions Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Roles Sidebar (Span 4) */}
        <aside className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs flex flex-col">
          <div className="p-4 border-b border-outline-variant bg-surface flex items-center justify-between">
            <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              Papéis Configurados
            </h2>
            <span className="text-label-sm text-on-surface-variant font-semibold">
              {roles.length} papéis
            </span>
          </div>

          <div className="p-2 flex flex-col gap-1.5 max-h-[600px] overflow-y-auto">
            {isLoadingRoles ? (
              <div className="py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-[24px] text-primary">
                  progress_activity
                </span>
                <p className="mt-1 text-body-sm">Carregando papéis...</p>
              </div>
            ) : roles.length === 0 ? (
              <div className="py-8 text-center text-on-surface-variant text-body-sm">
                Nenhum papel configurado.
              </div>
            ) : (
              roles.map((r) => {
                const isSelected = activeRole?.id === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`w-full text-left p-3.5 rounded-lg transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-primary text-on-primary font-bold shadow-xs'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <div>
                      <span className="font-label-md text-label-md font-bold block">{r.name}</span>
                      <span
                        className={`text-[11px] block mt-0.5 line-clamp-1 ${
                          isSelected ? 'text-on-primary/80 font-normal' : 'text-on-surface-variant'
                        }`}
                      >
                        {r.description || `${r.permissions.length} permissões concedidas`}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isSelected
                          ? 'bg-on-primary/20 text-on-primary'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {r.permissions.length} perms
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Permissions Detail Matrix (Span 8) */}
        <section className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs flex flex-col">
          {/* Detail Header */}
          <header className="p-5 border-b border-outline-variant bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  shield_person
                </span>
                <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {activeRole?.name || 'Selecione um Papel'}
                </h2>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                {activeRole?.description ||
                  'Visualização das permissões concedidas a este papel no sistema.'}
              </p>
            </div>

            {activeRole && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-label-sm font-bold shrink-0">
                <span className="material-symbols-outlined text-[14px]">lock_open</span>
                {activeRole.permissions.length} Permissões Ativas
              </span>
            )}
          </header>

          {/* Permissions Matrix */}
          <div className="p-5 flex-1 overflow-y-auto space-y-6 max-h-[700px]">
            {isLoadingPerms ? (
              <div className="py-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
                  progress_activity
                </span>
                <p className="mt-2">Carregando catálogo de permissões...</p>
              </div>
            ) : (
              Array.from(permissionsByModule.entries()).map(([moduleKey, perms]) => {
                const modInfo = moduleTitles[moduleKey] || {
                  label: moduleKey,
                  icon: 'folder',
                };

                return (
                  <div
                    key={moduleKey}
                    className="border border-outline-variant rounded-xl overflow-hidden shadow-xs"
                  >
                    {/* Module Header */}
                    <div className="bg-surface px-4 py-2.5 border-b border-outline-variant flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                          {modInfo.icon}
                        </span>
                        <h3 className="font-label-md text-label-md font-bold text-on-surface">
                          {modInfo.label}
                        </h3>
                      </div>
                      <span className="text-[11px] text-on-surface-variant font-semibold">
                        {perms.filter((p) => activeRole?.permissions.includes(p.code)).length} de{' '}
                        {perms.length} ativas
                      </span>
                    </div>

                    {/* Permissions List */}
                    <div className="divide-y divide-outline-variant bg-surface-container-lowest">
                      {perms.map((p) => {
                        const hasPermission = activeRole?.permissions.includes(p.code);

                        return (
                          <div
                            key={p.id}
                            className="px-4 py-3 flex items-center justify-between hover:bg-surface-bright transition-colors"
                          >
                            <div>
                              <p className="font-mono text-body-sm font-semibold text-on-surface">
                                {p.code}
                              </p>
                              <p className="text-[11px] text-on-surface-variant">
                                Acesso ao recurso {p.code.toLowerCase().replace(/_/g, ' ')}
                              </p>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                hasPermission
                                  ? 'bg-tertiary/15 text-tertiary'
                                  : 'bg-surface-container text-outline'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {hasPermission ? 'check_circle' : 'remove_circle_outline'}
                              </span>
                              {hasPermission ? 'Permitido' : 'Bloqueado'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Modal: Create Custom Role */}
      {isCreateModalOpen && (
        <CreateRoleModal
          allPermissions={allPermissions}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['iam', 'roles'] });
            setIsCreateModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

// Modal Component for Custom Role Creation
interface CreateRoleModalProps {
  allPermissions: Permission[];
  onClose: () => void;
  onSuccess: () => void;
}

function CreateRoleModal({ allPermissions, onClose, onSuccess }: CreateRoleModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      iamApi.createRole({
        name: name.trim(),
        description: description.trim() || undefined,
        permissionCodes: selectedCodes,
      }),
    onSuccess,
    onError: (err) => {
      setErrorMsg(getApiErrorMessage(err, 'Erro ao criar papel customizado.'));
    },
  });

  const togglePermission = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectAll = () => {
    setSelectedCodes(allPermissions.map((p) => p.code));
  };

  const clearAll = () => {
    setSelectedCodes([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome do papel.');
      return;
    }
    if (selectedCodes.length === 0) {
      setErrorMsg('Selecione pelo menos uma permissão para este papel.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3 shrink-0">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">add_moderator</span>
            Novo Papel Customizado
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-error-container text-on-error-container rounded-lg text-body-sm font-medium shrink-0">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
              Nome do Papel <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Auditor de Qualidade"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
              Descrição das Responsabilidades
            </label>
            <input
              type="text"
              placeholder="Ex: Responsável por conferir vistorias e aprovação prévia de serviços"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Permissões Concedidas ({selectedCodes.length} selecionadas) <span className="text-error">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  Marcar Todas
                </button>
                <span className="text-outline">|</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-[11px] font-semibold text-on-surface-variant hover:underline"
                >
                  Desmarcar Todas
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2 border border-outline-variant rounded-xl bg-surface">
              {allPermissions.map((p) => {
                const checked = selectedCodes.includes(p.code);
                return (
                  <label
                    key={p.id}
                    onClick={() => togglePermission(p.code)}
                    className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-colors ${
                      checked
                        ? 'bg-primary-fixed/20 border-primary/40'
                        : 'border-outline-variant/60 hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <div className="overflow-hidden">
                      <span className="font-mono text-xs font-bold text-on-surface block truncate">
                        {p.code}
                      </span>
                      <span className="text-[10px] text-on-surface-variant block uppercase font-medium">
                        Módulo: {p.module}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant shrink-0">
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
              Criar Papel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
