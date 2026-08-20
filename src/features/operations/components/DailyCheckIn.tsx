import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { operationsApi } from '../api/operationsApi';
import type { AppointmentStatus } from '../types';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { formatLicensePlate } from '@/features/crm/utils/validators';

export function DailyCheckIn() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeUnitId = user?.activeUnitId;

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'EXPECTED' | 'ARRIVED' | 'COMPLETED' | 'DELAYED'>('ALL');
  const [search, setSearch] = useState('');

  // Start and end of today in ISO
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).toISOString();
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

  // Fetch today's appointments via calendar endpoint
  const { data: appointments = [], isLoading, isError, error } = useQuery({
    queryKey: ['operations', 'appointments', 'daily-checkin', { startOfDay, endOfDay, unitId: activeUnitId }],
    queryFn: () =>
      operationsApi.getCalendarAppointments({
        from: startOfDay,
        to: endOfDay,
        unitId: activeUnitId,
      }),
  });

  // Status Change Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: AppointmentStatus; reason?: string }) =>
      operationsApi.changeAppointmentStatus(id, { status, cancellationReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'appointments'] });
    },
  });

  const handleCheckIn = (id: string) => {
    statusMutation.mutate({ id, status: 'IN_PROGRESS' });
  };

  const handleNoShow = (id: string) => {
    if (window.confirm('Marcar este agendamento como Não Compareceu (No Show)?')) {
      statusMutation.mutate({ id, status: 'NO_SHOW', reason: 'Cliente não compareceu' });
    }
  };

  const handleCancel = (id: string) => {
    const reason = window.prompt('Motivo do cancelamento:') || 'Cancelado pelo operador';
    statusMutation.mutate({ id, status: 'CANCELED', reason });
  };

  // Filter appointments
  const nowTime = today.getTime();
  const filteredAppointments = appointments.filter((apt) => {
    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = apt.customerName.toLowerCase().includes(q);
      const matchPlate = apt.licensePlate.toLowerCase().includes(q);
      const matchModel = (apt.vehicleModel || '').toLowerCase().includes(q);
      if (!matchName && !matchPlate && !matchModel) return false;
    }

    // Tab filter
    if (activeFilter === 'EXPECTED') {
      return apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED';
    }
    if (activeFilter === 'ARRIVED') {
      return apt.status === 'IN_PROGRESS';
    }
    if (activeFilter === 'COMPLETED') {
      return apt.status === 'COMPLETED';
    }
    if (activeFilter === 'DELAYED') {
      const isPast = new Date(apt.scheduledAt).getTime() < nowTime;
      return isPast && (apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED');
    }
    return true;
  });

  // Calculate capacity gauge
  const totalBays = 6; // Configurable default workshop bays
  const inProgressCount = appointments.filter((a) => a.status === 'IN_PROGRESS').length;
  const occupancyPercentage = Math.min(Math.round((inProgressCount / totalBays) * 100), 100);

  const formattedDate = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getStatusDisplay = (status: AppointmentStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return 'Agendado';
      case 'CONFIRMED':
        return 'Confirmado';
      case 'IN_PROGRESS':
        return 'Em Atendimento';
      case 'COMPLETED':
        return 'Concluído';
      case 'CANCELED':
        return 'Cancelado';
      case 'NO_SHOW':
        return 'Não Compareceu';
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Header & Stats Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">Check-in Diário</h1>
          <p className="font-body-md text-body-md text-on-surface-variant capitalize mt-0.5">
            {formattedDate} • {appointments.length} Atendimentos Hoje
          </p>
        </div>

        {/* Capacity Gauge */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-3.5 flex items-center gap-4 shadow-xs w-full md:w-auto">
          <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center relative shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface-variant"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="text-primary transition-all duration-500"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${occupancyPercentage}, 100`}
                strokeWidth="3.5"
              />
            </svg>
            <span className="absolute text-label-sm font-bold text-primary">{occupancyPercentage}%</span>
          </div>
          <div>
            <h3 className="font-label-md text-label-md font-bold text-on-surface">Capacidade dos Boxes</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {inProgressCount}/{totalBays} Boxes Ocupados
            </p>
          </div>
        </div>
      </div>

      {/* Controls & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant pb-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-label-md font-label-md transition-colors ${
              activeFilter === 'ALL'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Todos ({appointments.length})
          </button>
          <button
            onClick={() => setActiveFilter('EXPECTED')}
            className={`px-3.5 py-1.5 rounded-lg text-label-md font-label-md transition-colors ${
              activeFilter === 'EXPECTED'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Aguardando Chegada
          </button>
          <button
            onClick={() => setActiveFilter('ARRIVED')}
            className={`px-3.5 py-1.5 rounded-lg text-label-md font-label-md transition-colors ${
              activeFilter === 'ARRIVED'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Em Atendimento ({inProgressCount})
          </button>
          <button
            onClick={() => setActiveFilter('COMPLETED')}
            className={`px-3.5 py-1.5 rounded-lg text-label-md font-label-md transition-colors ${
              activeFilter === 'COMPLETED'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Concluídos
          </button>
          <button
            onClick={() => setActiveFilter('DELAYED')}
            className={`px-3.5 py-1.5 rounded-lg text-label-md font-label-md transition-colors ${
              activeFilter === 'DELAYED'
                ? 'bg-error text-on-error font-bold shadow-xs'
                : 'bg-surface-container-lowest border border-outline-variant text-error hover:bg-error-container/20'
            }`}
          >
            Atrasados
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-sm font-body-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline"
            placeholder="Buscar por placa, cliente..."
            type="text"
          />
        </div>
      </div>

      {/* Appointment List Table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-surface border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
          <div className="col-span-2 sm:col-span-1">Horário</div>
          <div className="col-span-4 sm:col-span-3">Cliente & Serviço</div>
          <div className="col-span-3 sm:col-span-3">Veículo & Placa</div>
          <div className="col-span-3 sm:col-span-2">Status</div>
          <div className="col-span-12 sm:col-span-3 text-right">Ações</div>
        </div>

        {/* List Body */}
        {isLoading ? (
          <div className="py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
              progress_activity
            </span>
            <p className="mt-2 font-medium">Carregando agendamentos do dia...</p>
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-error">
            Erro ao carregar agendamentos: {(error as Error)?.message || 'Erro desconhecido'}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[40px] text-outline">fact_check</span>
            <p className="font-semibold text-on-surface text-body-lg mt-1">Nenhum agendamento para este filtro</p>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              Alterne os filtros acima ou cadastre um novo agendamento.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {filteredAppointments.map((apt) => {
              const timeStr = new Date(apt.scheduledAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={apt.id}
                  className={`grid grid-cols-12 gap-2 px-4 py-3.5 items-center hover:bg-surface-bright transition-colors relative group ${
                    apt.status === 'IN_PROGRESS' ? 'bg-primary-fixed/10' : ''
                  }`}
                >
                  {/* Left status accent border */}
                  {apt.status === 'IN_PROGRESS' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                  )}

                  {/* Time */}
                  <div className="col-span-2 sm:col-span-1 font-mono font-bold text-on-surface text-body-md">
                    {timeStr}
                  </div>

                  {/* Customer & Service */}
                  <div className="col-span-4 sm:col-span-3">
                    <p className="font-semibold text-on-surface text-body-md truncate">{apt.customerName}</p>
                    <p className="text-[12px] text-on-surface-variant truncate">{apt.serviceType || 'Revisão Geral'}</p>
                  </div>

                  {/* Vehicle & Plate */}
                  <div className="col-span-3 sm:col-span-3">
                    <p className="font-medium text-on-surface text-body-md truncate">
                      {apt.vehicleBrand} {apt.vehicleModel}
                    </p>
                    <span className="inline-block px-2 py-0.5 mt-0.5 bg-surface-container rounded border border-outline-variant font-mono font-bold text-[11px] text-primary">
                      {formatLicensePlate(apt.licensePlate)}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-3 sm:col-span-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        apt.status === 'IN_PROGRESS'
                          ? 'bg-primary text-on-primary'
                          : apt.status === 'COMPLETED'
                          ? 'bg-tertiary-container/20 text-tertiary'
                          : apt.status === 'CONFIRMED'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : apt.status === 'CANCELED' || apt.status === 'NO_SHOW'
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {apt.status === 'IN_PROGRESS' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                      {getStatusDisplay(apt.status)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-2 mt-2 sm:mt-0">
                    {apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleNoShow(apt.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:text-error hover:bg-error-container/20 text-label-sm font-label-sm transition-colors"
                        >
                          Não Compareceu
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCheckIn(apt.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-label-sm font-label-sm font-bold hover:bg-primary-container transition-all shadow-xs active:translate-y-px"
                        >
                          Fazer Check-in
                        </button>
                      </>
                    ) : apt.status === 'IN_PROGRESS' ? (
                      <button
                        type="button"
                        onClick={() =>
                          navigate({
                            to: '/operations/inspections/new',
                            search: {
                              appointmentId: apt.id,
                              customerId: apt.customerId,
                              vehicleId: apt.vehicleId,
                            } as never,
                          })
                        }
                        className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-label-sm font-label-sm font-bold hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">fact_check</span>
                        Iniciar Vistoria
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCancel(apt.id)}
                        className="text-on-surface-variant hover:text-error text-label-sm font-medium"
                      >
                        Detalhes
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
