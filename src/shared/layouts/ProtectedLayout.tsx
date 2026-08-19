import type { ReactNode } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Building2, ChevronRight, LogOut, ShieldCheck, Users } from 'lucide-react';
import { useAuthStore } from '@/features/iam/stores/authStore';

export function ProtectedLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const signOut = () => { logout(); void navigate({ to: '/login' }); };

  return <div className="min-h-screen bg-bg-app text-text-primary lg:flex">
    <aside className="flex w-full flex-col border-b border-border-divider bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 border-b border-border-divider px-6 py-5"><div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary-base font-manrope text-xl font-bold text-white">G</div><div><p className="font-manrope text-lg font-bold">GoMech</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-text-secondary">IAM workspace</p></div></div>
      <nav className="flex flex-1 gap-1 overflow-x-auto p-3 lg:block"><NavItem to="/dashboard" icon={ShieldCheck} label="Overview" /><NavItem to="/dashboard/users" icon={Users} label="Team users" /><NavItem to="/dashboard/units" icon={Building2} label="Units" /></nav>
      <div className="hidden border-t border-border-divider p-4 lg:block"><div className="mb-4 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F0FE] text-sm font-semibold text-primary-base">{user?.name?.slice(0, 1).toUpperCase() ?? 'U'}</div><div className="min-w-0"><p className="truncate text-sm font-medium">{user?.name ?? 'Authenticated user'}</p><p className="truncate text-xs text-text-secondary">{user?.email}</p></div></div><button onClick={signOut} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-text-secondary hover:bg-bg-app hover:text-text-primary"><LogOut className="h-4 w-4" /> Sign out</button></div>
    </aside>
    <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">{children}</main>
  </div>;
}

function NavItem({ to, icon: Icon, label }: { to: '/dashboard' | '/dashboard/users' | '/dashboard/units'; icon: typeof ShieldCheck; label: string }) {
  return <Link to={to} activeProps={{ className: 'bg-primary-base text-white' }} className="flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-app lg:w-full"><Icon className="h-4 w-4" /><span>{label}</span><ChevronRight className="ml-auto hidden h-4 w-4 lg:block" /></Link>;
}
