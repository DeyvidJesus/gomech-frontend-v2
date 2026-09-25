import { useRef, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Users,
  Car,
  Calendar,
  ClipboardCheck,
  FileText,
  Wrench,
  Package,
  Construction,
  DollarSign,
  BarChart3,
  CreditCard,
  UserCheck,
  Shield,
  Building,
  Menu,
  X,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Store,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { useLayoutStore } from '@/shared/stores/layoutStore';
import { iamApi, type Unit } from '@/features/iam/api/iam';
import { authApi } from '@/features/iam/api/auth';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout, switchActiveUnit, refreshToken } = useAuthStore();
  const { isSidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useLayoutStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unitDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch workshop units for active unit switcher
  const { data: unitsResponse, isLoading: isLoadingUnits } = useQuery({
    queryKey: ['iam', 'units'],
    queryFn: () => iamApi.units().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const units: Unit[] = unitsResponse || [];
  const activeUnit = units.find((u) => u.id === user?.activeUnitId) || units[0];

  // Unit Switch Mutation
  const switchUnitMutation = useMutation({
    mutationFn: (unitId: string) => authApi.switchUnit(unitId),
    onSuccess: (data, unitId) => {
      switchActiveUnit(unitId, data.accessToken, data.refreshToken);
      queryClient.invalidateQueries();
      setUnitDropdownOpen(false);
    },
    onError: (err) => {
      console.error('Failed to switch unit:', err);
    },
  });

  const handleUnitSelect = (unitId: string) => {
    if (unitId !== user?.activeUnitId) {
      switchUnitMutation.mutate(unitId);
    } else {
      setUnitDropdownOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } catch {
      // Ignore error and proceed to clear client auth
    } finally {
      logout();
      navigate({ to: '/login' });
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (unitDropdownRef.current && !unitDropdownRef.current.contains(event.target as Node)) {
        setUnitDropdownOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navSections = [
    {
      title: 'Principal',
      items: [
        { label: 'Painel Geral', to: '/dashboard', icon: LayoutDashboard },
        { label: 'Clientes', to: '/crm/customers', icon: Users },
        { label: 'Veículos', to: '/crm/vehicles', icon: Car },
      ],
    },
    {
      title: 'Operações',
      items: [
        { label: 'Agendamentos', to: '/operations/scheduling/calendar', icon: Calendar },
        { label: 'Vistorias', to: '/operations/inspections', icon: ClipboardCheck },
        { label: 'Orçamentos', to: '/operations/quotes', icon: FileText },
        { label: 'Ordens de Serviço', to: '/operations/work-orders', icon: Wrench },
      ],
    },
    {
      title: 'Recursos & Finanças',
      items: [
        { label: 'Estoque', to: '/inventory/products', icon: Package },
        { label: 'Ferramentas', to: '/tools', icon: Construction },
        { label: 'Financeiro', to: '/finance/dashboard', icon: DollarSign },
        { label: 'Relatórios & Analytics', to: '/analytics/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Administração',
      items: [
        { label: 'Assinatura & Planos', to: '/billing', icon: CreditCard },
        { label: 'Usuários & Equipe', to: '/admin/users', icon: UserCheck },
        { label: 'Papéis & Permissões', to: '/admin/roles', icon: Shield },
        { label: 'Empresa & Filiais', to: '/admin/company', icon: Building },
      ],
    },
  ];

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Side Navigation Bar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 bg-zinc-900 border-r border-zinc-800 z-50 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${mobileMenuOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-600/30 shrink-0">
              GM
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-sm tracking-tight text-white">GoMech</span>
                <span className="text-[11px] text-zinc-400 truncate">
                  {activeUnit?.name || 'Oficina Principal'}
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
            className="hidden lg:flex p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isSidebarCollapsed && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentPath === item.to ||
                  (item.to !== '/dashboard' && currentPath.startsWith(item.to));

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60'
                    } ${isSidebarCollapsed ? 'justify-center px-2' : ''}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}
                    />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-zinc-800 space-y-1 bg-zinc-950/40">
          <button
            onClick={() => navigate({ to: '/analytics/reports' }).catch(() => {})}
            title="Assistente de IA"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-indigo-400 hover:bg-indigo-500/10 transition ${
              isSidebarCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-400" />
            {!isSidebarCollapsed && <span>Copiloto de IA</span>}
          </button>

          <button
            onClick={handleLogout}
            title="Sair"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition ${
              isSidebarCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header Bar */}
        <header className="h-16 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search */}
            <div className="relative hidden sm:block w-64 md:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar clientes, veículos, OS..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Unit / Filial Switcher Dropdown */}
            <div className="relative" ref={unitDropdownRef}>
              <button
                type="button"
                onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                disabled={switchUnitMutation.isPending || isLoadingUnits}
                className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-200 transition shadow-xs disabled:opacity-50"
              >
                <Store className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="max-w-[130px] truncate">{activeUnit?.name || 'Filial Principal'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              </button>

              {unitDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-zinc-800 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Alternar Filial / Oficina
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {units.map((u) => {
                      const isSelected = u.id === user?.activeUnitId;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleUnitSelect(u.id)}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 hover:bg-zinc-800 transition ${
                            isSelected ? 'text-indigo-400 font-semibold bg-indigo-500/5' : 'text-zinc-300'
                          }`}
                        >
                          <div className="truncate">
                            <div className="truncate">{u.name}</div>
                            {u.address && <div className="text-[10px] text-zinc-500 truncate">{u.address}</div>}
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-zinc-800 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : 'GM'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-zinc-200 leading-tight">
                    {user?.name || 'Operador'}
                  </div>
                  <div className="text-[10px] text-zinc-400 leading-tight">
                    {user?.roles?.[0] || 'ADMIN'}
                  </div>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <div className="text-xs font-semibold text-zinc-200 truncate">{user?.name}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{user?.email}</div>
                  </div>
                  <Link
                    to="/admin/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="block px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 transition"
                  >
                    Meu Perfil
                  </Link>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Routed Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
