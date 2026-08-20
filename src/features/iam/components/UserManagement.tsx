import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { iamApi, type UserResponse, type Role, type Unit } from '../api/iam';
import { getApiErrorMessage } from '@/shared/utils/formErrors';

export function UserManagement() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [assignRoleUser, setAssignRoleUser] = useState<UserResponse | null>(null);

  // Fetch Users
  const { data: users = [], isLoading, isError, error } = useQuery({
    queryKey: ['iam', 'users'],
    queryFn: () => iamApi.users().then((r) => r.data),
  });

  // Fetch Roles
  const { data: roles = [] } = useQuery({
    queryKey: ['iam', 'roles'],
    queryFn: () => iamApi.roles().then((r) => r.data),
  });

  // Fetch Units
  const { data: units = [] } = useQuery({
    queryKey: ['iam', 'units'],
    queryFn: () => iamApi.units().then((r) => r.data),
  });

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    if (roleFilter && (!u.roles || !u.roles.some((r) => r.roleName === roleFilter))) {
      return false;
    }
    if (statusFilter && u.status !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            Gestão de Usuários & Equipe
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Gerencie os mecânicos, consultores, gerentes e permissões de acesso da oficina.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:bg-primary-container transition-all shadow-sm flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Novo Usuário
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-lg text-body-sm font-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline"
              placeholder="Buscar por nome ou e-mail..."
              type="text"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 bg-surface border border-outline-variant rounded-lg text-body-sm font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="">Todos os Papéis</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 bg-surface border border-outline-variant rounded-lg text-body-sm font-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="">Todos os Status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="INVITED">Convidado</option>
            <option value="SUSPENDED">Suspenso</option>
          </select>
        </div>

        <span className="text-body-sm text-on-surface-variant font-medium">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'membro' : 'membros'}
        </span>
      </div>

      {/* Users Data Grid */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-x-auto shadow-xs">
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="bg-surface border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
              <th className="py-3 px-4">Usuário</th>
              <th className="py-3 px-4">Papéis & Unidades</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
                    progress_activity
                  </span>
                  <p className="mt-2 font-medium">Carregando usuários...</p>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-error">
                  Erro ao carregar usuários: {(error as Error)?.message || 'Erro desconhecido'}
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[40px] text-outline">group_off</span>
                  <p className="font-semibold text-on-surface text-body-lg mt-1">
                    Nenhum usuário encontrado
                  </p>
                  <p className="text-body-sm text-on-surface-variant mt-0.5">
                    Tente ajustar seus filtros ou cadastre um novo membro.
                  </p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const initials = u.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <tr key={u.id} className="hover:bg-surface-bright transition-colors">
                    {/* User */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container font-headline-sm text-xs font-bold flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-on-surface text-body-md">{u.name}</div>
                          <div className="text-[12px] text-on-surface-variant">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Roles & Units */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-md">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary-container text-on-secondary-container text-[11px] font-semibold border border-outline-variant/40"
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                shield_person
                              </span>
                              {r.roleName}
                              {r.unitName && (
                                <span className="opacity-75 font-normal">({r.unitName})</span>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-[12px] text-on-surface-variant italic">
                            Sem papéis atribuídos
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-tertiary/15 text-tertiary'
                            : u.status === 'INVITED'
                            ? 'bg-secondary-container text-on-secondary-container'
                            : 'bg-error-container text-on-error-container'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'ACTIVE'
                              ? 'bg-tertiary'
                              : u.status === 'INVITED'
                              ? 'bg-secondary'
                              : 'bg-error'
                          }`}
                        ></span>
                        {u.status === 'ACTIVE'
                          ? 'Ativo'
                          : u.status === 'INVITED'
                          ? 'Convidado'
                          : 'Suspenso'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setAssignRoleUser(u)}
                        className="px-2.5 py-1 text-primary hover:bg-surface-container rounded-lg font-label-sm text-label-sm font-semibold transition-colors border border-outline-variant"
                      >
                        Atribuir Papel
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Invite / Create User */}
      {isCreateModalOpen && (
        <CreateUserModal
          roles={roles}
          units={units}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['iam', 'users'] });
            setIsCreateModalOpen(false);
          }}
        />
      )}

      {/* Modal: Assign Role */}
      {assignRoleUser && (
        <AssignRoleModal
          user={assignRoleUser}
          roles={roles}
          units={units}
          onClose={() => setAssignRoleUser(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['iam', 'users'] });
            setAssignRoleUser(null);
          }}
        />
      )}
    </div>
  );
}

// Sub-components: CreateUserModal & AssignRoleModal
interface CreateUserModalProps {
  roles: Role[];
  units: Unit[];
  onClose: () => void;
  onSuccess: () => void;
}

function CreateUserModal({ roles, units, onClose, onSuccess }: CreateUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || '');
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      iamApi.createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        roles: selectedRoleId ? [{ roleId: selectedRoleId, unitId: selectedUnitId || undefined }] : [],
      }),
    onSuccess,
    onError: (err) => {
      setErrorMsg(getApiErrorMessage(err, 'Erro ao criar usuário.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!name.trim() || !email.trim() || !password) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">person_add</span>
            Cadastrar Novo Usuário
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
              Nome Completo <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Marcus Reed"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
              E-mail de Acesso <span className="text-error">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="Ex: m.reed@oficina.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
              Senha Inicial <span className="text-error">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
                Papel Inicial <span className="text-error">*</span>
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full h-10 px-2.5 bg-surface border border-outline-variant rounded-lg text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
                Unidade / Filial
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full h-10 px-2.5 bg-surface border border-outline-variant rounded-lg text-body-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="">Todas as Unidades</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
              Criar Usuário
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AssignRoleModalProps {
  user: UserResponse;
  roles: Role[];
  units: Unit[];
  onClose: () => void;
  onSuccess: () => void;
}

function AssignRoleModal({ user, roles, units, onClose, onSuccess }: AssignRoleModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || '');
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const assignMutation = useMutation({
    mutationFn: () =>
      iamApi.assignRole(user.id, {
        roleId: selectedRoleId,
        unitId: selectedUnitId || undefined,
      }),
    onSuccess,
    onError: (err) => {
      setErrorMsg(getApiErrorMessage(err, 'Erro ao atribuir papel.'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleId) {
      setErrorMsg('Selecione um papel.');
      return;
    }
    assignMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">shield_person</span>
            Atribuir Papel a {user.name}
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
              Papel a Vincular <span className="text-error">*</span>
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1">
              Unidade / Filial Específica
            </label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="">Todas as Unidades (Geral)</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

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
              disabled={assignMutation.isPending}
              className="px-5 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-bold hover:bg-primary-container transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {assignMutation.isPending && (
                <span className="material-symbols-outlined animate-spin text-[16px]">
                  progress_activity
                </span>
              )}
              Confirmar Vínculo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
