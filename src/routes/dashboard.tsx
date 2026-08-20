import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Activity, Building2, KeyRound, Users } from 'lucide-react';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { iamApi } from '@/features/iam/api/iam';
import { useAuthStore } from '@/features/iam/stores/authStore';

export const Route = createFileRoute('/dashboard')({ beforeLoad: requireAuth, component: Dashboard });

function requireAuth() { if (!useAuthStore.getState().isAuthenticated) throw redirect({ to: '/login' }); }

function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const units = useQuery({ queryKey: ['iam', 'units'], queryFn: () => iamApi.units().then((r) => r.data) });
  const users = useQuery({ queryKey: ['iam', 'users'], queryFn: () => iamApi.users().then((r) => r.data) });
  const roles = useQuery({ queryKey: ['iam', 'roles'], queryFn: () => iamApi.roles().then((r) => r.data) });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <ProtectedLayout>
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Painel / Visão Geral
        </p>
        <h1 className="font-manrope text-3xl font-bold tracking-tight sm:text-4xl text-on-surface">
          {getGreeting()}, {user?.name?.split(' ')[0] ?? 'usuário'}.
        </h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Gerencie acessos, equipe e unidades da oficina em um único ambiente seguro.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Membros da Equipe" value={users.data?.length} icon={Users} />
        <Metric label="Unidades Ativas" value={units.data?.length} icon={Building2} />
        <Metric label="Papéis & Funções" value={roles.data?.length} icon={KeyRound} />
        <Metric label="Sessão" value="Ativa" icon={Activity} />
      </div>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xs">
          <h2 className="font-manrope text-xl font-bold text-on-surface">Contexto de Acesso</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Suas permissões atuais e unidade ativa.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Info label="Empresa / Tenant" value={user?.tenantId ?? 'Não informado'} />
            <Info label="Unidade Ativa" value={user?.activeUnitId ?? 'Não selecionada'} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {(user?.roles ?? []).map((role) => (
              <span
                key={role}
                className="rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container border border-outline-variant/40"
              >
                {role}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-xs">
          <h2 className="font-manrope text-xl font-bold text-on-surface">Status de Segurança</h2>
          <p className="mt-1 text-sm text-on-surface-variant">A rotação de token e segurança estão ativas.</p>
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-tertiary/10 p-4 text-sm text-tertiary border border-tertiary/20 font-medium">
            <Activity className="h-5 w-5 shrink-0" />
            Sua sessão está protegida e criptografada.
          </div>
        </div>
      </section>
    </ProtectedLayout>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value?: number | string; icon: typeof Users }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-xs">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-on-surface-variant">{label}</span>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-4 font-manrope text-3xl font-bold text-on-surface">{value ?? '—'}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface border border-outline-variant p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant">{label}</p>
      <p className="mt-2 break-all font-mono text-xs text-on-surface font-medium">{value}</p>
    </div>
  );
}
