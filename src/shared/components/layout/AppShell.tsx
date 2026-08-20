import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { iamApi, type Unit } from '@/features/iam/api/iam';
import { authApi } from '@/features/iam/api/auth';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout, switchActiveUnit, refreshToken } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      await authApi.logout(refreshToken);
    } catch {
      // Ignore error and proceed to clear client auth
    } finally {
      logout();
      navigate({ to: '/login' });
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUnitDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: 'Painel Geral', to: '/dashboard', icon: 'dashboard' },
    { label: 'Clientes', to: '/crm/customers', icon: 'group' },
    { label: 'Veículos', to: '/crm/vehicles', icon: 'directions_car' },
    { label: 'Agendamentos', to: '/operations/scheduling/calendar', icon: 'calendar_today' },
    { label: 'Vistorias', to: '/operations/inspections', icon: 'fact_check' },
    { label: 'Orçamentos', to: '/operations/quotes', icon: 'request_quote' },
    { label: 'Ordens de Serviço', to: '/operations/work-orders', icon: 'receipt_long' },
    { label: 'Estoque', to: '/inventory/products', icon: 'inventory_2' },
    { label: 'Ferramentas', to: '/tools', icon: 'construction' },
    { label: 'Financeiro', to: '/finance/dashboard', icon: 'payments' },
    { label: 'Usuários & Equipe', to: '/admin/users', icon: 'badge' },
    { label: 'Papéis & Permissões', to: '/admin/roles', icon: 'admin_panel_settings' },
    { label: 'Empresa & Filiais', to: '/admin/company', icon: 'domain' },
  ];

  const currentPath = location.pathname;

  return (
    <div className="font-body-md text-body-md text-on-background bg-background antialiased flex h-screen overflow-hidden">
      {/* Backdrop for Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SideNavBar (Desktop & Mobile Drawer) */}
      <nav
        className={`bg-surface-container-lowest text-primary fixed h-full w-sidebar-width left-0 top-0 border-r border-outline-variant flex flex-col py-lg px-md z-40 transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-4 mb-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shadow-sm">
              <span className="material-symbols-outlined icon-fill text-[20px] text-white">precision_manufacturing</span>
            </div>
            <div>
              <h1 className="text-headline-md font-headline-md font-bold text-primary leading-tight">GoMech</h1>
              <p className="font-label-sm text-label-sm text-on-surface-variant truncate max-w-[140px]">
                {activeUnit?.name || 'Oficina Principal'}
              </p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container lg:hidden"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Primary Action CTA */}
        <button
          onClick={() => navigate({ to: '/operations/scheduling/new' as string }).catch(() => {})}
          className="mb-lg w-full bg-primary text-on-primary rounded-xl py-2.5 px-4 font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors flex items-center justify-center gap-2 shadow-sm active:translate-y-[1px]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Novo Agendamento
        </button>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.to || (item.to !== '/dashboard' && currentPath.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-label-md font-label-md transition-all duration-150 active:opacity-80 ${
                  isActive
                    ? 'text-primary bg-primary-fixed font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'icon-fill' : ''}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="mt-auto pt-md border-t border-outline-variant flex flex-col gap-1">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors rounded-xl text-left"
          >
            <span className="material-symbols-outlined text-[20px]">help_outline</span>
            <span className="font-label-md text-label-md">Suporte</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors rounded-xl text-left"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="font-label-md text-label-md">Sair</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area Wrapper */}
      <div className="flex-1 lg:ml-sidebar-width flex flex-col min-h-screen w-full">
        {/* TopNavBar */}
        <header className="bg-surface text-primary fixed top-0 right-0 w-full lg:w-[calc(100%-260px)] h-topbar-height border-b border-outline-variant flex justify-between items-center px-4 sm:px-lg z-20 transition-all duration-200 ease-in-out">
          <div className="flex items-center gap-3 sm:gap-md">
            {/* Hamburger button on mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container lg:hidden"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>

            {/* Global Search */}
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                className="pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm font-body-sm w-48 md:w-64 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-fixed transition-shadow placeholder:text-outline"
                placeholder="Buscar OS, clientes, placa..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-md">
            {/* ACTIVE UNIT SELECTOR (Dropdown) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
                disabled={switchUnitMutation.isPending || isLoadingUnits}
                className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant px-3 py-1.5 rounded-lg text-on-surface hover:bg-surface-container transition-colors text-label-sm font-label-sm shadow-xs"
              >
                <span className="material-symbols-outlined text-primary text-[18px]">store</span>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-semibold text-on-surface-variant tracking-wider leading-none">
                    Filial Ativa
                  </span>
                  <span className="font-semibold text-on-surface truncate max-w-[120px] sm:max-w-[160px]">
                    {switchUnitMutation.isPending ? 'Alternando...' : activeUnit?.name || 'Selecione a Filial'}
                  </span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                  arrow_drop_down
                </span>
              </button>

              {/* Dropdown Menu */}
              {unitDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-outline-variant/60">
                    <p className="text-label-sm font-semibold text-on-surface">Trocar Unidade de Atendimento</p>
                    <p className="text-body-sm text-on-surface-variant text-[11px]">Selecione a filial para sincronizar o contexto</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {units.length === 0 ? (
                      <div className="px-4 py-3 text-center text-on-surface-variant text-body-sm">
                        Nenhuma filial encontrada
                      </div>
                    ) : (
                      units.map((unit) => {
                        const isCurrent = unit.id === user?.activeUnitId;
                        return (
                          <button
                            key={unit.id}
                            type="button"
                            onClick={() => handleUnitSelect(unit.id)}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-body-md transition-colors ${
                              isCurrent
                                ? 'bg-primary-fixed/40 text-primary font-semibold'
                                : 'hover:bg-surface-container text-on-surface'
                            }`}
                          >
                            <div className="flex flex-col truncate pr-2">
                              <span className="truncate">{unit.name}</span>
                              <span className="text-[11px] text-on-surface-variant truncate">{unit.address}</span>
                            </div>
                            {isCurrent && (
                              <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            <button
              onClick={() => navigate({ to: '/operations/scheduling/checkin' as string }).catch(() => {})}
              className="hidden md:inline-flex bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container px-3.5 py-1.5 rounded-lg font-label-sm text-label-sm transition-colors shadow-xs"
            >
              Check-in Rápido
            </button>
            <button
              onClick={() => navigate({ to: '/operations/work-orders' as string }).catch(() => {})}
              className="hidden sm:inline-flex bg-primary text-on-primary px-3.5 py-1.5 rounded-lg font-label-sm text-label-sm hover:bg-primary-container transition-colors shadow-sm"
            >
              Ver Ordens
            </button>

            <div className="w-px h-6 bg-outline-variant mx-1 hidden sm:block"></div>

            {/* Notifications */}
            <button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </button>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-primary-fixed border border-primary text-primary font-bold text-xs flex items-center justify-center">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'GM'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Canvas */}
        <main className="flex-1 mt-topbar-height p-4 sm:p-lg overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
