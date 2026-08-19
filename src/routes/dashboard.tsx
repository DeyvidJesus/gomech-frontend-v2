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

  return <ProtectedLayout><header className="mb-8"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-warning-orange">IAM / Overview</p><h1 className="font-manrope text-3xl font-bold tracking-tight sm:text-4xl">Good morning, {user?.name?.split(' ')[0] ?? 'there'}.</h1><p className="mt-2 text-text-secondary">Manage access, people, and workshop units from one secure workspace.</p></header><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Team users" value={users.data?.length} icon={Users} /><Metric label="Active units" value={units.data?.length} icon={Building2} /><Metric label="Roles" value={roles.data?.length} icon={KeyRound} /><Metric label="Session" value="Active" icon={Activity} /></div><section className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_1fr]"><div className="rounded-lg border border-border-divider bg-surface p-6"><h2 className="font-manrope text-xl font-bold">Access context</h2><p className="mt-1 text-sm text-text-secondary">Your current permissions and active unit.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><Info label="Tenant" value={user?.tenantId ?? 'Not returned'} /><Info label="Active unit" value={user?.activeUnitId ?? 'Not selected'} /></div><div className="mt-6 flex flex-wrap gap-2">{(user?.roles ?? []).map((role) => <span key={role} className="rounded-full bg-[#E8F0FE] px-3 py-1 text-xs font-semibold text-primary-base">{role}</span>)}</div></div><div className="rounded-lg border border-border-divider bg-surface p-6"><h2 className="font-manrope text-xl font-bold">Security status</h2><p className="mt-1 text-sm text-text-secondary">Token rotation is enabled for this workspace.</p><div className="mt-6 flex items-center gap-3 rounded-md bg-[#E8F5E9] p-4 text-sm text-green-dark"><Activity className="h-5 w-5" /> Your session is protected.</div></div></section></ProtectedLayout>;
}

function Metric({ label, value, icon: Icon }: { label: string; value?: number | string; icon: typeof Users }) { return <div className="rounded-lg border border-border-divider bg-surface p-5"><div className="flex items-start justify-between"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">{label}</span><Icon className="h-5 w-5 text-primary-base" /></div><p className="mt-4 font-manrope text-3xl font-bold">{value ?? '—'}</p></div>; }
function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-md bg-bg-app p-4"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-text-secondary">{label}</p><p className="mt-2 break-all font-mono text-xs text-text-primary">{value}</p></div>; }
