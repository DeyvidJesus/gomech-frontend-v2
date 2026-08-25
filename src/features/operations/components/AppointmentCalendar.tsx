import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { operationsApi } from '../api/operationsApi';
import type { AppointmentSummaryResponse, AppointmentStatus } from '../types';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { toast } from '@/shared/utils/toast';

export function AppointmentCalendar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeUnitId = user?.activeUnitId;

  // Selected date state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'DAY'>('MONTH');

  // Modals state
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentSummaryResponse | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  // Edit form state
  const [editDateTime, setEditDateTime] = useState('');
  const [editServiceType, setEditServiceType] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Calculate calendar month boundaries
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { calendarDays, fromIso, toIso } = useMemo(() => {
    if (viewMode === 'MONTH') {
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);

      const startDayIndex = firstDayOfMonth.getDay(); // 0 = Sun
      const totalDaysInMonth = lastDayOfMonth.getDate();

      const startDate = new Date(year, month, 1 - startDayIndex);
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
    } else if (viewMode === 'WEEK') {
      const curr = new Date(selectedDate);
      const dayOfWeek = curr.getDay();
      const startOfWeek = new Date(curr);
      startOfWeek.setDate(curr.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const days: Date[] = [];
      const d = new Date(startOfWeek);
      for (let i = 0; i < 7; i++) {
        days.push(new Date(d));
        d.setDate(d.getDate() + 1);
      }

      return {
        calendarDays: days,
        fromIso: startOfWeek.toISOString(),
        toIso: endOfWeek.toISOString(),
      };
    } else {
      // DAY view
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      return {
        calendarDays: [new Date(selectedDate)],
        fromIso: startOfDay.toISOString(),
        toIso: endOfDay.toISOString(),
      };
    }
  }, [year, month, selectedDate, viewMode]);

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
      toast.success('Check-in realizado! Atendimento em andamento.');
    },
    onError: () => {
      toast.error('Erro ao realizar check-in.');
    },
  });

  // Update / Reschedule Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, scheduledAt, serviceType, notes }: { id: string; scheduledAt: string; serviceType?: string; notes?: string }) =>
      operationsApi.updateAppointment(id, {
        scheduledAt,
        serviceType: serviceType || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'appointments'] });
      setEditModalOpen(false);
      toast.success('Agendamento atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar agendamento.');
    },
  });

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      operationsApi.cancelAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'appointments'] });
      setCancelModalOpen(false);
      toast.success('Agendamento cancelado.');
    },
    onError: () => {
      toast.error('Erro ao cancelar agendamento.');
    },
  });

  // Drag & drop reschedule
  const handleDropOnDay = (e: React.DragEvent, targetDay: Date) => {
    e.preventDefault();
    const aptId = e.dataTransfer.getData('text/plain');
    if (!aptId) return;

    const apt = appointments.find((a) => a.id === aptId);
    if (!apt) return;

    const oldDate = new Date(apt.scheduledAt);
    const newDate = new Date(targetDay);
    newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);

    updateMutation.mutate(
      {
        id: aptId,
        scheduledAt: newDate.toISOString(),
        serviceType: apt.serviceType,
      },
      {
        onSuccess: () => {
          toast.success(`Agendamento movido para ${newDate.toLocaleDateString('pt-BR')} com sucesso!`);
        },
      }
    );
  };

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

  const selectedDateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedDayAppointments = appointmentsByDate.get(selectedDateKey) || [];

  const handlePrev = () => {
    if (viewMode === 'MONTH') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'WEEK') {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() - 7);
      setSelectedDate(next);
      setCurrentDate(next);
    } else {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() - 1);
      setSelectedDate(next);
      setCurrentDate(next);
    }
  };

  const handleNext = () => {
    if (viewMode === 'MONTH') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'WEEK') {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + 7);
      setSelectedDate(next);
      setCurrentDate(next);
    } else {
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + 1);
      setSelectedDate(next);
      setCurrentDate(next);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const isToday = (d: Date) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  const isSelected = (d: Date) => {
    return (
      d.getDate() === selectedDate.getDate() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
      case 'CONFIRMED':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'IN_PROGRESS':
        return 'bg-primary-container/20 text-primary border-primary/30';
      case 'COMPLETED':
        return 'bg-surface-container text-on-surface-variant border-outline-variant';
      case 'CANCELED':
        return 'bg-error-container/30 text-error border-error/30';
      default:
        return 'bg-surface-container text-on-surface-variant border-outline-variant';
    }
  };

  const openEditModal = (apt: AppointmentSummaryResponse) => {
    setSelectedAppointment(apt);
    const d = new Date(apt.scheduledAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setEditDateTime(localIso);
    setEditServiceType(apt.serviceType || '');
    setEditNotes('');
    setEditModalOpen(true);
  };

  const openCancelModal = (apt: AppointmentSummaryResponse) => {
    setSelectedAppointment(apt);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto py-2 animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
            Agenda & Agendamentos
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            Gestão de fluxo de recepção, capacidade da oficina e agendamentos de serviços.
          </p>
        </div>

        {/* View Switcher & Action CTA */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month / Week / Day Switcher */}
          <div className="flex items-center bg-surface-container-lowest border border-outline-variant p-1 rounded-xl shadow-xs">
            <button
              onClick={() => setViewMode('MONTH')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'MONTH' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode('WEEK')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'WEEK' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('DAY')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'DAY' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Dia
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate({ to: '/operations/scheduling/checkin' })}
            className="px-3.5 py-2 bg-surface-container border border-outline-variant text-on-surface font-label-md text-label-md font-semibold rounded-xl hover:bg-surface-bright transition-colors shadow-xs"
          >
            Fila de Check-in
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: '/operations/scheduling/new' })}
            className="px-4 py-2 bg-primary text-on-primary font-label-md text-label-md font-bold rounded-xl hover:bg-primary-container transition-all shadow-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Novo Agendamento
          </button>
        </div>
      </header>

      {/* Calendar Navigation & Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Calendar View Canvas (Span 8) */}
        <div className="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm space-y-4">
          {/* Navigation Month/Week Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface capitalize">
                {currentDate.toLocaleDateString('pt-BR', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <button
                type="button"
                onClick={handleToday}
                className="ml-2 px-2.5 py-1 text-[11px] font-bold rounded-lg border border-outline-variant hover:bg-surface-container text-on-surface"
              >
                Hoje
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-lg border border-outline-variant hover:bg-surface-container text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-lg border border-outline-variant hover:bg-surface-container text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center font-label-sm text-[12px] font-bold text-on-surface-variant uppercase tracking-wider py-1 border-b border-outline-variant">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5 min-h-[420px]">
            {calendarDays.map((day, idx) => {
              const isCurrMonth = day.getMonth() === month;
              const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
              const dayApts = appointmentsByDate.get(dateStr) || [];
              const active = isSelected(day);
              const today = isToday(day);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnDay(e, day)}
                  className={`p-2 rounded-xl border flex flex-col justify-between min-h-[90px] cursor-pointer transition-all ${
                    active
                      ? 'border-primary bg-primary-fixed/20 shadow-xs'
                      : 'border-outline-variant/60 bg-surface hover:bg-surface-bright'
                  } ${!isCurrMonth && viewMode === 'MONTH' ? 'opacity-40' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        today
                          ? 'bg-primary text-on-primary'
                          : active
                          ? 'text-primary font-black'
                          : 'text-on-surface'
                      }`}
                    >
                      {day.getDate()}
                    </span>
                    {dayApts.length > 0 && (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                        {dayApts.length}
                      </span>
                    )}
                  </div>

                  {/* Badges preview */}
                  <div className="flex flex-col gap-1 mt-1">
                    {dayApts.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', apt.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day);
                          openEditModal(apt);
                        }}
                        className={`text-[10px] font-semibold truncate px-1.5 py-0.5 rounded border cursor-grab active:cursor-grabbing ${getStatusColor(
                          apt.status
                        )}`}
                        title={`${apt.serviceType || 'Atendimento'} - ${apt.customerName} (Arraste para reagendar)`}
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
        <aside className="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm flex flex-col">
          {/* Header & Quick Day Navigation */}
          <div className="p-4 border-b border-outline-variant bg-surface space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/60">
              <button
                type="button"
                onClick={() => {
                  const prev = new Date(selectedDate);
                  prev.setDate(prev.getDate() - 1);
                  setSelectedDate(prev);
                }}
                className="px-2 py-1 rounded-lg hover:bg-surface-container text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors border border-outline-variant/60"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                Ontem
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(new Date())}
                className="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Hoje
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = new Date(selectedDate);
                  next.setDate(next.getDate() + 1);
                  setSelectedDate(next);
                }}
                className="px-2 py-1 rounded-lg hover:bg-surface-container text-on-surface text-xs font-semibold flex items-center gap-1 transition-colors border border-outline-variant/60"
              >
                Amanhã
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>

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
          <div className="p-4 flex-1 flex flex-col gap-3 max-h-[480px] overflow-y-auto">
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
                    className="p-3.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-bright transition-colors relative overflow-hidden group shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-on-surface bg-surface-container px-1.5 py-0.5 rounded">
                            {startTime}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(
                              apt.status
                            )}`}
                          >
                            {apt.status}
                          </span>
                        </div>
                        <h5 className="font-semibold text-on-surface text-sm mt-1.5">
                          {apt.serviceType || 'Atendimento Geral'}
                        </h5>
                        <p className="text-[12px] text-on-surface-variant">
                          {apt.customerName} • {apt.vehicleBrand} {apt.vehicleModel} (
                          <span className="font-mono font-bold text-primary">{apt.licensePlate}</span>)
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(apt)}
                          className="p-1 text-on-surface-variant hover:text-primary rounded"
                          title="Editar / Reagendar"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openCancelModal(apt)}
                          className="p-1 text-on-surface-variant hover:text-error rounded"
                          title="Cancelar Agendamento"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick action buttons */}
                    <div className="pt-2 border-t border-outline-variant/50 flex items-center justify-between">
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
              className="w-full py-2.5 bg-primary text-on-primary rounded-xl font-label-md text-label-md font-bold hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Agendar para este dia
            </button>
          </div>
        </aside>
      </div>

      {/* Edit / Reschedule Modal */}
      {editModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-[480px] w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="font-bold text-base text-on-surface">Editar / Reagendar Atendimento</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({
                  id: selectedAppointment.id,
                  scheduledAt: new Date(editDateTime).toISOString(),
                  serviceType: editServiceType,
                  notes: editNotes,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Cliente & Veículo</label>
                <div className="p-2.5 bg-surface border border-outline-variant rounded-lg text-xs font-semibold text-on-surface">
                  {selectedAppointment.customerName} • {selectedAppointment.vehicleBrand} {selectedAppointment.vehicleModel} ({selectedAppointment.licensePlate})
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Data e Horário</label>
                <input
                  type="datetime-local"
                  required
                  value={editDateTime}
                  onChange={(e) => setEditDateTime(e.target.value)}
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Tipo de Serviço</label>
                <input
                  type="text"
                  value={editServiceType}
                  onChange={(e) => setEditServiceType(e.target.value)}
                  placeholder="Ex: Revisão 40.000km, Troca de pastilhas..."
                  className="w-full h-10 px-3 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Observações do agendamento..."
                  className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface resize-none focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-5 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary-container transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {cancelModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-[480px] w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h3 className="font-bold text-base text-on-surface">Cancelar Agendamento</h3>
              <button onClick={() => setCancelModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Deseja realmente cancelar o agendamento de <strong>{selectedAppointment.customerName}</strong> ({selectedAppointment.vehicleBrand} {selectedAppointment.vehicleModel})?
            </p>

            <textarea
              rows={2}
              placeholder="Motivo do cancelamento (opcional)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-2.5 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface resize-none focus:border-error focus:ring-1 focus:ring-error outline-none"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 border border-outline-variant rounded-lg text-xs font-semibold text-on-surface hover:bg-surface-container"
              >
                Voltar
              </button>
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate({ id: selectedAppointment.id, reason: cancelReason })}
                className="px-4 py-2 bg-error text-on-error rounded-lg text-xs font-bold hover:bg-error/90 transition-colors"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
