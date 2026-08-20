import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { operationsApi } from '../api/operationsApi';
import { crmApi } from '@/features/crm/api/crmApi';
import { useAuthStore } from '@/features/iam/stores/authStore';
import { handleApiValidationErrors, getApiErrorMessage } from '@/shared/utils/formErrors';
import { formatLicensePlate } from '@/features/crm/utils/validators';

const appointmentSchema = z.object({
  customerId: z.string().min(1, 'Selecione o cliente'),
  vehicleId: z.string().min(1, 'Selecione o veículo do cliente'),
  serviceType: z.string().min(1, 'Informe o tipo de serviço'),
  scheduledDate: z.string().min(1, 'Selecione a data do agendamento'),
  scheduledTime: z.string().min(1, 'Selecione o horário'),
  durationHours: z.number().min(0.5, 'Duração mínima de 30 min'),
  notes: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

const SERVICE_TYPES = [
  'Revisão Periódica / Manutenção Preventiva',
  'Diagnóstico & Vistoria Técnica',
  'Sistema de Freios (Pastilhas, Discos, Fluido)',
  'Troca de Óleo e Filtros',
  'Suspensão e Alinhamento 3D',
  'Injeção Eletrônica e Motor',
  'Ar Condicionado e Climatização',
  'Elétrica e Bateria',
  'Funilaria e Pintura',
  'Outro Serviço',
];

const TIME_SLOTS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
];

export function AppointmentForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeUnitId = user?.activeUnitId;

  const [serverError, setServerError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Today in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customerId: '',
      vehicleId: '',
      serviceType: 'Revisão Periódica / Manutenção Preventiva',
      scheduledDate: todayStr,
      scheduledTime: '09:00',
      durationHours: 1.5,
      notes: '',
    },
  });

  const selectedCustomerId = watch('customerId');
  const selectedVehicleId = watch('vehicleId');
  const selectedTime = watch('scheduledTime');

  // Search customers
  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['crm', 'customers', 'search', customerSearch],
    queryFn: () => crmApi.getCustomers({ q: customerSearch || undefined, size: 10 }),
    enabled: customerDropdownOpen,
  });

  // Fetch selected customer's full details (to get their vehicles)
  const { data: selectedCustomer, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ['crm', 'customer', selectedCustomerId],
    queryFn: () => crmApi.getCustomerById(selectedCustomerId),
    enabled: Boolean(selectedCustomerId),
  });

  // Auto-select first vehicle when customer's vehicles load
  useEffect(() => {
    if (selectedCustomer?.vehicles && selectedCustomer.vehicles.length > 0) {
      if (!selectedVehicleId) {
        setValue('vehicleId', selectedCustomer.vehicles[0].id, { shouldValidate: true });
      }
    }
  }, [selectedCustomer, selectedVehicleId, setValue]);

  // Click outside for customer dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCustomerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Create Appointment Mutation
  const createMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      if (!activeUnitId) {
        throw new Error('Nenhuma unidade/filial ativa selecionada.');
      }

      // Combine date and time to ISO string
      const scheduledAt = new Date(`${data.scheduledDate}T${data.scheduledTime}:00`).toISOString();
      const estimatedEnd = new Date(
        new Date(scheduledAt).getTime() + data.durationHours * 60 * 60 * 1000
      ).toISOString();

      return operationsApi.createAppointment({
        unitId: activeUnitId,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        scheduledAt,
        estimatedEndAt: estimatedEnd,
        serviceType: data.serviceType,
        notes: data.notes?.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'appointments'] });
      navigate({ to: '/operations/scheduling/calendar' });
    },
    onError: (err) => {
      const handled = handleApiValidationErrors(err, setError);
      if (!handled) {
        setServerError(getApiErrorMessage(err, 'Erro ao agendar serviço. Verifique os dados.'));
      }
    },
  });

  const onSubmit = (data: AppointmentFormData) => {
    setServerError(null);
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-6xl mx-auto py-4 animate-in fade-in duration-200">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <button
              type="button"
              onClick={() => navigate({ to: '/operations/scheduling/calendar' })}
              className="hover:text-primary transition-colors flex items-center gap-1 font-label-sm text-label-sm uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Agendamentos
            </button>
            <span className="text-outline">/</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface">
              Novo Agendamento
            </span>
          </div>
          <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
            Novo Agendamento
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant mt-0.5">
            Reserve um box de atendimento, vincule cliente e veículo e defina o tempo estimado.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: '/operations/scheduling/calendar' })}
            className="px-4 py-2 bg-transparent border border-outline-variant text-on-surface font-label-md text-label-md rounded-lg hover:bg-surface-container transition-colors shadow-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || createMutation.isPending}
            className="px-6 py-2 bg-primary text-on-primary font-label-md text-label-md font-bold rounded-lg hover:bg-primary-container transition-all shadow-sm active:translate-y-px disabled:opacity-50 flex items-center gap-2"
          >
            {(isSubmitting || createMutation.isPending) && (
              <span className="material-symbols-outlined animate-spin text-[18px]">
                progress_activity
              </span>
            )}
            Confirmar Agendamento
          </button>
        </div>
      </header>

      {/* Global Server Error */}
      {serverError && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl border border-error/30 flex items-start gap-3">
          <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">
            error
          </span>
          <div className="text-body-sm font-medium">{serverError}</div>
        </div>
      )}

      {/* Form Grid */}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-20">
        {/* Left Column: Customer, Vehicle & Service (Span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Customer & Vehicle Card */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs">
            <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">person_search</span>
              Dados do Cliente & Veículo
            </h2>

            <div className="space-y-4">
              {/* Customer Autocomplete */}
              <div className="relative" ref={dropdownRef}>
                <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1.5">
                  Selecionar Cliente <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por nome do cliente, CPF ou telefone..."
                    value={selectedCustomerName || customerSearch}
                    onFocus={() => {
                      setCustomerDropdownOpen(true);
                      if (selectedCustomerName) setCustomerSearch('');
                    }}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setSelectedCustomerName('');
                      setValue('customerId', '');
                      setValue('vehicleId', '');
                      setCustomerDropdownOpen(true);
                    }}
                    className={`w-full h-11 pl-9 pr-8 bg-surface border rounded-lg text-body-md font-body-md text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
                      errors.customerId ? 'border-error ring-1 ring-error' : 'border-outline-variant'
                    } ${selectedCustomerId ? 'bg-primary-fixed/20 border-primary/40 font-medium' : ''}`}
                  />
                  {selectedCustomerId && (
                    <button
                      type="button"
                      onClick={() => {
                        setValue('customerId', '', { shouldValidate: true });
                        setValue('vehicleId', '', { shouldValidate: true });
                        setSelectedCustomerName('');
                        setCustomerSearch('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                {errors.customerId && (
                  <span className="text-[12px] text-error font-medium mt-1 block">
                    {errors.customerId.message}
                  </span>
                )}

                {/* Dropdown Options */}
                {customerDropdownOpen && (
                  <div className="absolute z-30 w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <ul className="max-h-52 overflow-y-auto py-1 divide-y divide-outline-variant/30">
                      {isLoadingCustomers ? (
                        <li className="px-4 py-3 text-center text-body-sm text-on-surface-variant">
                          Buscando clientes...
                        </li>
                      ) : !customersData?.content || customersData.content.length === 0 ? (
                        <li className="px-4 py-3 text-center text-body-sm text-on-surface-variant">
                          Nenhum cliente encontrado.
                        </li>
                      ) : (
                        customersData.content.map((c) => (
                          <li
                            key={c.id}
                            onClick={() => {
                              setValue('customerId', c.id, { shouldValidate: true });
                              setSelectedCustomerName(c.name);
                              setCustomerDropdownOpen(false);
                            }}
                            className="px-4 py-2.5 hover:bg-surface-container cursor-pointer flex items-center justify-between group transition-colors"
                          >
                            <div>
                              <div className="font-label-md text-label-md font-semibold text-on-surface">
                                {c.name}
                              </div>
                              <div className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                                {c.formattedDocument || c.phone || 'Sem documento'} • {c.vehicleCount}{' '}
                                {c.vehicleCount === 1 ? 'veículo' : 'veículos'}
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity text-[18px]">
                              check
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Vehicle Selection */}
              {selectedCustomerId && (
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1.5">
                    Selecionar Veículo <span className="text-error">*</span>
                  </label>

                  {isLoadingVehicles ? (
                    <div className="p-4 bg-surface border border-outline-variant rounded-lg text-center text-body-sm text-on-surface-variant">
                      Carregando veículos do cliente...
                    </div>
                  ) : !selectedCustomer?.vehicles || selectedCustomer.vehicles.length === 0 ? (
                    <div className="p-4 bg-surface border border-dashed border-outline-variant rounded-lg flex items-center justify-between">
                      <span className="text-body-sm text-on-surface-variant">
                        Este cliente não possui veículos cadastrados.
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          navigate({
                            to: '/crm/vehicles/new',
                            search: { customerId: selectedCustomerId } as never,
                          })
                        }
                        className="text-label-sm font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Cadastrar Veículo
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedCustomer.vehicles.map((v) => {
                        const isSelected = selectedVehicleId === v.id;
                        return (
                          <div
                            key={v.id}
                            onClick={() => setValue('vehicleId', v.id, { shouldValidate: true })}
                            className={`p-3.5 rounded-lg border cursor-pointer transition-all relative ${
                              isSelected
                                ? 'border-primary bg-primary-fixed/20 shadow-xs'
                                : 'border-outline-variant bg-surface hover:bg-surface-bright'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-on-primary text-[12px]">
                                  check
                                </span>
                              </div>
                            )}
                            <p className="font-semibold text-on-surface text-body-md">
                              {v.brand} {v.model}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded bg-surface-container font-mono font-bold text-[11px] text-primary">
                                {formatLicensePlate(v.licensePlate)}
                              </span>
                              <span className="text-[11px] text-on-surface-variant">
                                {v.year ? `Ano ${v.year}` : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {errors.vehicleId && (
                    <span className="text-[12px] text-error font-medium mt-1 block">
                      {errors.vehicleId.message}
                    </span>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Service Requirements Card */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs">
            <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">build_circle</span>
              Detalhes do Serviço
            </h2>

            <div className="space-y-4">
              {/* Primary Service Type */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  Tipo Principal de Serviço <span className="text-error">*</span>
                </label>
                <select
                  {...register('serviceType')}
                  className="h-11 px-3.5 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none cursor-pointer"
                >
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.serviceType && (
                  <span className="text-[12px] text-error font-medium">{errors.serviceType.message}</span>
                )}
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  Relato do Cliente & Observações
                </label>
                <textarea
                  rows={4}
                  placeholder="Relato do cliente, barulhos, histórico ou solicitações adicionais..."
                  {...register('notes')}
                  className="p-3.5 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                ></textarea>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Date, Time & Scheduling (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs">
            <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">event_available</span>
              Data & Horário
            </h2>

            <div className="space-y-5">
              {/* Date Input */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  Data do Agendamento <span className="text-error">*</span>
                </label>
                <input
                  type="date"
                  min={todayStr}
                  {...register('scheduledDate')}
                  className="h-11 px-3.5 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                {errors.scheduledDate && (
                  <span className="text-[12px] text-error font-medium">{errors.scheduledDate.message}</span>
                )}
              </div>

              {/* Time Slots Grid */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  Horários Disponíveis <span className="text-error">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setValue('scheduledTime', slot, { shouldValidate: true })}
                        className={`py-2 text-center rounded-lg font-mono text-label-sm font-semibold transition-all ${
                          isSelected
                            ? 'bg-primary text-on-primary shadow-xs'
                            : 'bg-surface border border-outline-variant text-on-surface hover:border-primary'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
                {errors.scheduledTime && (
                  <span className="text-[12px] text-error font-medium">{errors.scheduledTime.message}</span>
                )}
              </div>

              {/* Duration Estimate */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                  Duração Estimada
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="8"
                    {...register('durationHours', { valueAsNumber: true })}
                    className="w-24 h-11 px-3.5 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface font-mono text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-body-md font-medium text-on-surface-variant">Horas</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </form>
    </div>
  );
}
