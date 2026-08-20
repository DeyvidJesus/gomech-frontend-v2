import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { iamApi } from '@/features/iam/api/iam';
import { useAuthStore } from '@/features/iam/stores/authStore';

export const Route = createFileRoute('/dashboard/units')({ beforeLoad: guard, component: UnitsPage });
function guard() { if (!useAuthStore.getState().isAuthenticated) throw redirect({ to: '/login' }); }
function UnitsPage() {
  const query = useQuery({ queryKey: ['iam', 'units'], queryFn: () => iamApi.units().then((r) => r.data) });
  return (
    <ProtectedLayout>
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">IAM / Organização</p>
        <h1 className="font-manrope text-3xl font-bold tracking-tight text-on-surface">Unidades da Oficina</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">Gerencie as filiais disponíveis para sua organização.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {(query.data ?? []).map((unit) => (
          <article key={unit.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-manrope text-lg font-bold text-on-surface">{unit.name}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{unit.address || 'Endereço não informado'}</p>
              </div>
              {unit.headquarters && (
                <span className="rounded-full bg-primary-fixed px-2.5 py-1 text-xs font-semibold text-on-primary-fixed">
                  Matriz
                </span>
              )}
            </div>
            <p className="mt-5 break-all font-mono text-[11px] text-on-surface-variant">ID: {unit.id}</p>
          </article>
        ))}
        {!query.data?.length && (
          <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center text-sm text-on-surface-variant col-span-full">
            Nenhuma unidade encontrada para este ambiente.
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
