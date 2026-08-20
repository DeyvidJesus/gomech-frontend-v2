import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { operationsApi } from '../api/operationsApi';
import type { AppointmentSummaryResponse, AppointmentStatus } from '../types';
import { useAuthStore } from '@/features/iam/stores/authStore';

export function AppointmentCalendar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeUnitId = user?.activeUnitId;

  // Selected date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Calculate calendar month boundaries
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { calendarDays, fromIso, toIso } = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDayIndex = firstDayOfMonth.getDay(); // 0 = Sun
    const totalDaysInMonth = lastDayOfMonth.getDate();

    // Start from previous month's overlapping days
    const startDate = new Date(year, month, 1 - startDayIndex);
    // End on next month's overlapping days (total 35 or 42 cells)
    const totalCells = startDayIndex + totalDaysInMonth > 35 ? 42 : 35;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + totalCells - 1);
    endDate.setHours(23, 59, 59, 999);

    const days: Date[] = [];
    const curr = new Date(startDate);
    for (let i = 0; i < totalCells; i++) {
      days.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    return {
      calendarDays: days,
      fromIso: startDate.toISOString(),
      toIso: endDate.toISOString(),
    };
  }, [year, month]);

  // Fetch appointments for this calendar interval
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['operations', 'appointments', 'calendar', { from: fromIso, to: toIso, unitId: activeUnitId }],
    queryFn: () =>
      operationsApi.getCalendarAppointments({
        from: fromIso,
        to: toIso,
        unitId: activeUnitId,
      }),
  });

  // Check-in status transition mutation
  const checkInMutation = useMutation({
    mutationFn: (id: string) =>
      operationsApi.changeAppointmentStatus(id, { status: 'IN_PROGRESS' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'appointments'] });
    },
  });

  // Group appointments by date string YYYY-MM-DD
  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, AppointmentSummaryResponse[]>();
    appointments.forEach((apt) => {
      const d = new Date(apt.scheduledAt);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const existing = map.get(dateKey) || [];
      existing.push(apt);
      map.set(dateKey, existing);
    });
    return map;
  }, [appointments]);

  // Selected day's appointments
  const selectedDateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedDayAppointments = appointmentsByDate.get(selectedDateKey) || [];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (d: Date) => {
    return (
      d.getDate() === selectedDate.getDate() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isCurrentMonth = (d: Date) => d.getMonth() === month;

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'border-primary bg-primary/10 text-primary';
      case 'CONFIRMED':
        return 'border-secondary bg-secondary/10 text-secondary';
      case 'COMPLETED':
        return 'border-tertiary bg-tertiary/10 text-tertiary';
      case 'CANCELED':
      case 'NO_SHOW':
        return 'border-error bg-error/10 text-error';
      default:
        return 'border-outline-variant bg-surface-container text-on-surface-variant';
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface">
            Agenda Geral
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Gerencie os agendamentos da oficina, boxes de atendimento e check-in de veículos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: '/operations/scheduling/checkin' })}
            className="px-4 py-2 bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors shadow-xs flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">fact_check</span>
            Check-in Diário
          </button>
          <button
            onClick={() => navigate({ to: '/operations/scheduling/new' })}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container transition-all shadow-sm flex items-center gap-2 font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Novo Agendamento
          </button>
        </div>
      </header>

      {/* Main Grid: Calendar on Left, Agenda on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid Container (Span 8 or 9) */}
        <div className="lg:col-span-8 xl:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs flex flex-col">
          {/* Calendar Toolbar */}
          <div className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
                title="Mês Anterior"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface min-w-[170px] text-center">
                {monthNames[month]} {year}
              </h2>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
                title="Próximo Mês"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="ml-2 font-label-sm text-label-sm text-on-surface font-semibold hover:text-primary transition-colors border border-outline-variant px-3 py-1 rounded-md bg-surface-container-lowest shadow-xs"
              >
                Hoje
              </button>
            </div>

            {/* Status Legend */}
            <div className="hidden sm:flex items-center gap-4 text-[12px] text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                <span>Em Andamento</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span>Agendado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                <span>Concluído</span>
              </div>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-outline-variant bg-surface-container-low text-center font-label-sm text-label-sm text-on-surface-variant font-semibold">
            <div className="py-2.5 border-r border-outline-variant">DOM</div>
            <div className="py-2.5 border-r border-outline-variant">SEG</div>
            <div className="py-2.5 border-r border-outline-variant">TER</div>
            <div className="py-2.5 border-r border-outline-variant">QUA</div>
            <div className="py-2.5 border-r border-outline-variant">QUI</div>
            <div className="py-2.5 border-r border-outline-variant">SEX</div>
            <div className="py-2.5">SÁB</div>
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-outline-variant bg-surface">
            {calendarDays.map((date, idx) => {
              const inMonth = isCurrentMonth(date);
              const today = isToday(date);
              const selected = isSelected(date);

              const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              const dayApts = appointmentsByDate.get(dateKey) || [];

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(date)}
                  className={`min-h-[90px] sm:min-h-[105px] p-1.5 flex flex-col justify-between transition-colors cursor-pointer group ${
                    !inMonth
                      ? 'bg-surface-container-lowest/40 opacity-40'
                      : selected
                      ? 'bg-primary-fixed/20'
                      : 'hover:bg-surface-bright'
                  }`}
                >
                  {/* Cell Top Header */}
                  <div className="flex justify-between items-center">
                    {dayApts.length > 0 ? (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-surface-container text-on-surface-variant">
                        {dayApts.length}
                      </span>
                    ) : (
                      <span></span>
                    )}

                    <span
                      className={`text-label-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        today
                          ? 'bg-primary text-on-primary font-bold'
                          : selected
                          ? 'text-primary font-bold'
                          : inMonth
                          ? 'text-on-surface'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Appointments Preview inside cell */}
                  <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                    {dayApts.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className={`px-1.5 py-0.5 rounded border-l-2 text-[10px] font-medium truncate ${getStatusColor(
                          apt.status
                        )}`}
                      >
                        <span className="font-bold mr-1">
                          {new Date(apt.scheduledAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {apt.vehicleBrand || apt.customerName}
                      </div>
                    ))}
                    {dayApts.length > 2 && (
                      <span className="text-[9px] text-on-surface-variant font-semibold pl-1">
                        +{dayApts.length - 2} mais
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Panel: Agenda for Selected Day (Span 4) */}
        <aside className="lg:col-span-4 xl:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-xs flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-outline-variant bg-surface">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface capitalize">
                {selectedDate.toLocaleDateString('pt-BR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </h3>
              {isToday(selectedDate) && (
                <span className="px-2 py-0.5 rounded-full bg-primary-container/15 text-primary font-label-sm text-[11px] font-bold">
                  Hoje
                </span>
              )}
            </div>

            {/* Daily Counters */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-surface-container-low rounded-lg p-2.5 border border-outline-variant/60">
                <span className="text-label-sm text-on-surface-variant block text-[11px]">
                  Agendados
                </span>
                <span className="font-headline-md text-headline-md font-bold text-on-surface leading-tight">
                  {selectedDayAppointments.length}
                </span>
              </div>
              <div className="bg-surface-container-low rounded-lg p-2.5 border border-outline-variant/60">
                <span className="text-label-sm text-on-surface-variant block text-[11px]">
                  Em Andamento
                </span>
                <span className="font-headline-md text-headline-md font-bold text-primary leading-tight">
                  {selectedDayAppointments.filter((a) => a.status === 'IN_PROGRESS').length}
                </span>
              </div>
            </div>
          </div>

          {/* Agenda Appointments List */}
          <div className="p-4 flex-1 flex flex-col gap-3 max-h-[500px] overflow-y-auto">
            <h4 className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider text-[11px]">
              Agendamentos do Dia
            </h4>

            {isLoading ? (
              <div className="py-8 text-center text-on-surface-variant text-body-sm">
                <span className="material-symbols-outlined animate-spin text-[24px] text-primary">
                  progress_activity
                </span>
                <p className="mt-1">Carregando...</p>
              </div>
            ) : selectedDayAppointments.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[36px] text-outline">
                  event_busy
                </span>
                <p className="font-semibold text-on-surface text-body-md mt-1">
                  Nenhum agendamento para este dia
                </p>
                <p className="text-[12px] text-on-surface-variant mt-0.5">
                  Clique abaixo para agendar um serviço nesta data.
                </p>
              </div>
            ) : (
              selectedDayAppointments.map((apt) => {
                const startTime = new Date(apt.scheduledAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={apt.id}
                    className="p-3 rounded-lg border border-outline-variant bg-surface hover:bg-surface-bright transition-colors relative overflow-hidden group shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-on-surface bg-surface-container px-1.5 py-0.5 rounded">
                            {startTime}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(
                              apt.status
                            )}`}
                          >
                            {apt.status}
                          </span>
                        </div>
                        <h5 className="font-semibold text-on-surface text-body-md mt-1.5">
                          {apt.serviceType || 'Atendimento Geral'}
                        </h5>
                        <p className="text-[12px] text-on-surface-variant">
                          {apt.customerName} • {apt.vehicleBrand} {apt.vehicleModel} (
                          <span className="font-mono">{apt.licensePlate}</span>)
                        </p>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="mt-2.5 pt-2 border-t border-outline-variant/50 flex items-center justify-between">
                      {apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED' ? (
                        <button
                          type="button"
                          onClick={() => checkInMutation.mutate(apt.id)}
                          disabled={checkInMutation.isPending}
                          className="px-2.5 py-1 bg-primary text-on-primary rounded text-[11px] font-semibold hover:bg-primary-container transition-colors shadow-xs"
                        >
                          Fazer Check-in
                        </button>
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
                          className="px-2.5 py-1 bg-secondary-container text-on-secondary-container rounded text-[11px] font-semibold hover:opacity-90 transition-opacity"
                        >
                          Iniciar Vistoria
                        </button>
                      ) : (
                        <span className="text-[11px] text-on-surface-variant">Finalizado</span>
                      )}

                      <button
                        type="button"
                        onClick={() => navigate({ to: '/operations/scheduling/checkin' })}
                        className="text-[11px] text-primary hover:underline font-medium"
                      >
                        Ver no Check-in
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Action */}
          <div className="p-3 border-t border-outline-variant bg-surface">
            <button
              type="button"
              onClick={() => navigate({ to: '/operations/scheduling/new' })}
              className="w-full py-2 bg-primary text-on-primary rounded-lg font-label-md text-label-md font-semibold hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-1.5 font-bold"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Agendar para este dia
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
