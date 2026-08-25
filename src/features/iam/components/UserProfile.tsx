import React, { useState } from 'react';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/api/apiClient';

export function UserProfile() {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const email = user?.email || '';
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      const response = await api.put('/users/me', data);
      return response.data;
    },
    onSuccess: (updated) => {
      setSuccessMsg('Perfil atualizado com sucesso!');
      setErrorMsg(null);
      if (user && accessToken && refreshToken) {
        setAuth(accessToken, refreshToken, {
          ...user,
          name: updated?.name || name,
          phone: updated?.phone || phone,
        });
      }
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.detail || 'Erro ao atualizar perfil.');
      setSuccessMsg(null);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.put('/users/me/password', data);
      return response.data;
    },
    onSuccess: () => {
      setPasswordSuccessMsg('Senha alterada com sucesso!');
      setPasswordErrorMsg(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err: any) => {
      setPasswordErrorMsg(err?.response?.data?.detail || 'Senha atual incorreta ou inválida.');
      setPasswordSuccessMsg(null);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    updateProfileMutation.mutate({ name, phone });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (newPassword.length < 6) {
      setPasswordErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('A confirmação de senha não confere.');
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="space-y-6 max-w-[960px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-headline-md text-on-surface">Meu Perfil</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Gerencie suas informações pessoais, credenciais de acesso e segurança da conta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-primary-fixed text-primary font-bold text-2xl flex items-center justify-center border-2 border-primary shadow-inner">
            {name ? name.slice(0, 2).toUpperCase() : 'GM'}
          </div>
          <div>
            <h3 className="font-bold text-lg text-on-surface">{name || 'Usuário GoMech'}</h3>
            <p className="text-xs text-on-surface-variant">{email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-container/20 text-primary">
              {user?.roles?.[0] || 'Administrador'}
            </span>
          </div>
          <div className="w-full pt-4 border-t border-outline-variant text-left space-y-2 text-xs text-on-surface-variant">
            <div className="flex justify-between">
              <span>ID Usuário:</span>
              <span className="font-mono text-[11px] text-on-surface truncate max-w-[120px]">
                {user?.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-emerald-600 font-semibold">Ativo</span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
              Dados Cadastrais
            </h3>

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">E-mail (Login)</label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full h-10 px-3 bg-surface-container border border-outline-variant rounded-lg text-sm text-on-surface-variant cursor-not-allowed outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg font-semibold text-xs hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {updateProfileMutation.isPending && (
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  )}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>

          {/* Password Form */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">lock</span>
              Segurança & Troca de Senha
            </h3>

            {passwordSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs">
                {passwordSuccessMsg}
              </div>
            )}
            {passwordErrorMsg && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs">
                {passwordErrorMsg}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Senha Atual</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Nova Senha</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg font-semibold text-xs hover:bg-primary-container transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {changePasswordMutation.isPending && (
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  )}
                  Atualizar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
