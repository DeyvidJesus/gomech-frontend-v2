import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { iamApi } from '@/features/iam/api/iam';
import { useAuthStore } from '@/features/iam/stores/authStore';

export const Route = createFileRoute('/dashboard/users')({ beforeLoad: guard, component: UsersPage });
function guard() { if (!useAuthStore.getState().isAuthenticated) throw redirect({ to: '/login' }); }
function UsersPage() {
  const query = useQuery({ queryKey: ['iam', 'users'], queryFn: () => iamApi.users().then((r) => r.data) });
  return (
    <ProtectedLayout>
      <PageHeader title="Membros da Equipe" description="Visualize e gerencie os usuários que têm acesso à oficina." />
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-xs">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-surface text-xs uppercase tracking-[0.1em] text-on-surface-variant font-semibold border-b border-outline-variant">
            <tr>
              <th className="px-5 py-3.5">Nome</th>
              <th className="px-5 py-3.5">E-mail</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {(query.data ?? []).map((user) => (
              <tr key={user.id} className="hover:bg-surface-bright transition-colors">
                <td className="px-5 py-3.5 text-sm font-medium text-on-surface">{user.name}</td>
                <td className="px-5 py-3.5 text-sm text-on-surface-variant">{user.email}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      user.status === 'ACTIVE'
                        ? 'bg-tertiary/15 text-tertiary'
                        : user.status === 'INVITED'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-error-container text-on-error-container'
                    }`}
                  >
                    {user.status === 'ACTIVE' ? 'Ativo' : user.status === 'INVITED' ? 'Convidado' : 'Suspenso'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!query.data?.length && (
          <p className="p-8 text-center text-sm text-on-surface-variant">Nenhum usuário encontrado para este ambiente.</p>
        )}
      </div>
    </ProtectedLayout>
  );
}
function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">IAM / Diretório</p>
      <h1 className="font-manrope text-3xl font-bold tracking-tight text-on-surface">{title}</h1>
      <p className="mt-2 text-body-md text-on-surface-variant">{description}</p>
    </header>
  );
}
