import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { operationsApi } from '../api/operationsApi';
import { crmApi } from '@/features/crm/api/crmApi';
import { useAuthStore } from '@/features/iam/stores/authStore';
import type { FuelLevel, SaveInspectionItemRequest } from '../types';
import { handleApiValidationErrors, getApiErrorMessage } from '@/shared/utils/formErrors';
import { formatLicensePlate } from '@/features/crm/utils/validators';

const inspectionFormSchema = z.object({
  customerId: z.string().min(1, 'Selecione o cliente'),
  vehicleId: z.string().min(1, 'Selecione o veículo'),
  appointmentId: z.string().optional(),
  currentMileage: z.number().min(0, 'Km deve ser maior ou igual a zero').optional(),
  fuelLevel: z.enum(['EMPTY', 'RESERVE', 'ONE_QUARTER', 'HALF', 'THREE_QUARTERS', 'FULL']),
  generalNotes: z.string().optional(),
});

type InspectionFormData = z.infer<typeof inspectionFormSchema>;

const DEFAULT_INSPECTION_ITEMS: SaveInspectionItemRequest[] = [
  // TIRES
  { category: 'TIRES', name: 'Pressão e Calibração dos Pneus', status: 'OK' },
  { category: 'TIRES', name: 'Profundidade dos Sulcos (Tread)', status: 'OK' },
  { category: 'TIRES', name: 'Alinhamento e Balanceamento Visual', status: 'OK' },
  { category: 'TIRES', name: 'Estepe e Ferramentas (Macaco/Chave)', status: 'OK' },
  // BRAKES
  { category: 'BRAKES', name: 'Pastilhas de Freio Dianteiras', status: 'OK' },
  { category: 'BRAKES', name: 'Discos de Freio e Tambores', status: 'OK' },
  { category: 'BRAKES', name: 'Nível e Umidade do Fluido de Freio', status: 'OK' },
  // SUSPENSION
  { category: 'SUSPENSION', name: 'Amortecedores e Molas', status: 'OK' },
  { category: 'SUSPENSION', name: 'Buchas, Pivôs e Bieletas', status: 'OK' },
  // ENGINE
  { category: 'ENGINE', name: 'Nível e Viscosidade do Óleo do Motor', status: 'OK' },
  { category: 'ENGINE', name: 'Correias Dentada e de Acessórios', status: 'OK' },
  { category: 'ENGINE', name: 'Velas de Ignição e Cabos', status: 'OK' },
  // FLUIDS
  { category: 'FLUIDS', name: 'Líquido de Arrefecimento (Radiador)', status: 'OK' },
  { category: 'FLUIDS', name: 'Fluido da Direção Hidráulica', status: 'OK' },
  { category: 'FLUIDS', name: 'Fluido de Transmissão / Câmbio', status: 'OK' },
  // ELECTRICAL
  { category: 'ELECTRICAL', name: 'Tensão e Saúde da Bateria (CCA)', status: 'OK' },
  { category: 'ELECTRICAL', name: 'Faróis, Lanternas e Setas', status: 'OK' },
  { category: 'ELECTRICAL', name: 'Luzes de Alerta no Painel (Check Engine)', status: 'OK' },
  // SAFETY & BODYWORK
  { category: 'SAFETY', name: 'Cintos de Segurança e Travas', status: 'OK' },
  { category: 'SAFETY', name: 'Palhetas do Limpador de Para-brisa', status: 'OK' },
  { category: 'BODYWORK', name: 'Avarias / Riscos na Lataria e Para-choques', status: 'OK' },
];

interface InspectionFormProps {
  initialCustomerId?: string;
  initialVehicleId?: string;
  initialAppointmentId?: string;
}

export function InspectionForm({
  initialCustomerId,
  initialVehicleId,
  initialAppointmentId,
}: InspectionFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const activeUnitId = user?.activeUnitId;

  const [serverError, setServerError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [selectedCustomerName, setSelectedCustomerName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InspectionFormData>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: {
      customerId: initialCustomerId || '',
      vehicleId: initialVehicleId || '',
      appointmentId: initialAppointmentId || undefined,
      currentMileage: undefined,
      fuelLevel: 'HALF',
      generalNotes: '',
    },
  });

  const selectedCustomerId = watch('customerId');
  const selectedVehicleId = watch('vehicleId');
  const selectedFuelLevel = watch('fuelLevel');

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

  // Auto-set preselected customer name and vehicles
  useEffect(() => {
    if (initialCustomerId && !selectedCustomerName && selectedCustomer) {
      setSelectedCustomerName(selectedCustomer.name);
    }
  }, [initialCustomerId, selectedCustomerName, selectedCustomer]);

  useEffect(() => {
    if (selectedCustomer?.vehicles && selectedCustomer.vehicles.length > 0) {
      if (!selectedVehicleId) {
        setValue('vehicleId', selectedCustomer.vehicles[0].id, { shouldValidate: true });
      }
    }
  }, [selectedCustomer, selectedVehicleId, setValue]);

  // Click outside for dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCustomerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Create Inspection Mutation
  const createMutation = useMutation({
    mutationFn: async (data: InspectionFormData) => {
      if (!activeUnitId) {
        throw new Error('Nenhuma unidade/filial ativa selecionada.');
      }

      return operationsApi.createInspection({
        unitId: activeUnitId,
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        appointmentId: data.appointmentId || undefined,
        currentMileage: data.currentMileage || undefined,
        fuelLevel: data.fuelLevel,
        generalNotes: data.generalNotes?.trim() || undefined,
        items: DEFAULT_INSPECTION_ITEMS,
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['operations', 'inspections'] });
      navigate({
        to: '/operations/inspections/$id',
        params: { id: response.id },
      });
    },
    onError: (err) => {
      const handled = handleApiValidationErrors(err, setError);
      if (!handled) {
        setServerError(getApiErrorMessage(err, 'Erro ao criar vistoria veicular.'));
      }
    },
  });

  const onSubmit = (data: InspectionFormData) => {
    setServerError(null);
    createMutation.mutate(data);
  };

  const fuelOptions: { value: FuelLevel; label: string }[] = [
    { value: 'EMPTY', label: 'Vazio (E)' },
    { value: 'RESERVE', label: 'Reserva' },
    { value: 'ONE_QUARTER', label: '1/4' },
    { value: 'HALF', label: '1/2 (Meio)' },
    { value: 'THREE_QUARTERS', label: '3/4' },
    { value: 'FULL', label: 'Cheio (F)' },
  ];

  return (
    <div className="max-w-[960px] mx-auto py-4 animate-in fade-in duration-200">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-outline-variant">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant mb-2">
            <button
              type="button"
              onClick={() => navigate({ to: '/operations/inspections' })}
              className="hover:text-primary transition-colors flex items-center gap-1 font-label-sm text-label-sm uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Vistorias
            </button>
            <span className="text-outline">/</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface">
              Nova Vistoria
            </span>
          </div>
          <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
            Nova Vistoria Técnica
          </h1>
          <p className="text-body-md font-body-md text-on-surface-variant mt-0.5">
            Inicie a checagem de entrada com checklist completo de componentes mecânicos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: '/operations/inspections' })}
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
            Iniciar Checklist
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

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
        {/* Customer & Vehicle Selection */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs">
          <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">directions_car</span>
            Identificação do Veículo e Cliente
          </h2>

          <div className="space-y-4">
            {/* Customer Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <label className="block font-label-sm text-label-sm text-on-surface-variant font-medium mb-1.5">
                Cliente Proprietário <span className="text-error">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Buscar cliente por nome ou CPF..."
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
                              {c.formattedDocument || c.phone || 'Sem documento'} • {c.vehicleCount} veículos
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
                  Veículo para Vistoria <span className="text-error">*</span>
                </label>

                {isLoadingVehicles ? (
                  <div className="p-4 bg-surface border border-outline-variant rounded-lg text-center text-body-sm text-on-surface-variant">
                    Carregando veículos...
                  </div>
                ) : !selectedCustomer?.vehicles || selectedCustomer.vehicles.length === 0 ? (
                  <div className="p-4 bg-surface border border-dashed border-outline-variant rounded-lg text-body-sm text-on-surface-variant">
                    Este cliente não possui veículos cadastrados.
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

        {/* State of Entry (Km & Fuel) */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-xs">
          <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface mb-4 pb-2 border-b border-outline-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">speed</span>
            Estado de Entrada do Veículo
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Mileage */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Quilometragem Atual (Km)
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="Ex: 85200"
                  {...register('currentMileage', { valueAsNumber: true })}
                  className="w-full h-11 px-3.5 bg-surface border border-outline-variant rounded-lg font-mono text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-label-sm font-bold">
                  KM
                </span>
              </div>
            </div>

            {/* Fuel Level */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Nível de Combustível
              </label>
              <div className="grid grid-cols-3 gap-2">
                {fuelOptions.map((f) => {
                  const isSelected = selectedFuelLevel === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setValue('fuelLevel', f.value)}
                      className={`py-2 text-center rounded-lg text-[12px] font-semibold transition-all ${
                        isSelected
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'bg-surface border border-outline-variant text-on-surface hover:border-primary'
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* General Notes */}
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                Observações de Entrada
              </label>
              <textarea
                rows={3}
                placeholder="Observações visuais de entrada, pertences no interior do veículo, etc..."
                {...register('generalNotes')}
                className="p-3.5 bg-surface border border-outline-variant rounded-lg text-body-md font-body-md text-on-surface placeholder:text-outline/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
              ></textarea>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
