import { createFileRoute, redirect } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { iamApi } from '@/features/iam/api/iam';
import { useAuthStore } from '@/features/iam/stores/authStore';

export const Route = createFileRoute('/dashboard/units')({ beforeLoad: guard, component: UnitsPage });
function guard() { if (!useAuthStore.getState().isAuthenticated) throw redirect({ to: '/login' }); }
function UnitsPage() { const query = useQuery({ queryKey: ['iam', 'units'], queryFn: () => iamApi.units().then((r) => r.data) }); return <ProtectedLayout><header className="mb-8"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-warning-orange">IAM / Organization</p><h1 className="font-manrope text-3xl font-bold tracking-tight">Workshop units</h1><p className="mt-2 text-text-secondary">Manage the branches available to your organization.</p></header><div className="grid gap-4 md:grid-cols-2">{(query.data ?? []).map((unit) => <article key={unit.id} className="rounded-lg border border-border-divider bg-surface p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-manrope text-lg font-bold">{unit.name}</h2><p className="mt-1 text-sm text-text-secondary">{unit.address}</p></div>{unit.headquarters && <span className="rounded-full bg-[#E8F0FE] px-2.5 py-1 text-xs font-semibold text-primary-base">Headquarters</span>}</div><p className="mt-5 break-all font-mono text-[11px] text-text-secondary">{unit.id}</p></article>)}{!query.data?.length && <div className="rounded-lg border border-dashed border-border-divider p-8 text-center text-sm text-text-secondary">No units returned for this workspace.</div>}</div></ProtectedLayout>; }
